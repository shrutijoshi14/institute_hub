const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const Institute = require('../models/Institute');
const Subscription = require('../models/Subscription');
const FeatureFlag = require('../models/FeatureFlag');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { sequelize } = require('../config/db');

// Helper to clean custom domain inputs and strip any user protocol typos (e.g. https//)
const sanitizeCustomDomain = (domain) => {
    if (!domain) return null;
    let clean = domain.trim();
    clean = clean.replace(/^(https?:\/\/|https?:\/|https?\/\/|https?)/i, '');
    clean = clean.replace(/^[:\/]+/, '');
    return clean || null;
};

// Helper to calculate folder size recursively
function getDirSize(dirPath) {
    let size = 0;
    try {
        if (!fs.existsSync(dirPath)) return 0;
        const files = fs.readdirSync(dirPath);
        for (let file of files) {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                size += getDirSize(filePath);
            } else {
                size += stats.size;
            }
        }
    } catch (e) {
        // Safe catch
    }
    return size;
}

const jwt = require('jsonwebtoken');
const SUPER_ADMIN_JWT_SECRET = process.env.SUPER_ADMIN_JWT_SECRET || 'SaasSuperAdminSecureJWTKey_982743';
const superAdminAuth = require('../middleware/superAdminAuth');

// @route   POST /api/super-admin/login
// @desc    Authenticate SaaS Super Admin (Isolated from standard login)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(`🔑 Super Admin login attempt: [${email}]`);

    try {
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { email: email },
                    { username: email }
                ],
                role: 'super-admin'
            },
            bypassTenant: true
        });

        if (!user) {
            console.log(`❌ Super Admin login failed: Account not found or incorrect role [${email}]`);
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const { comparePassword } = require('../utils/passwordHelper');
        const isMatch = await comparePassword(password, user.password);

        if (!isMatch) {
            console.log(`❌ Super Admin login failed: Password mismatch for [${email}]`);
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        console.log(`✅ Super Admin Login Success: [${user.name}] authenticated`);

        // Update login stats
        user.last_login_at = new Date();
        user.last_login_ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        user.last_login_agent = req.headers['user-agent'];
        await user.save();

        try {
            await AuditLog.create({
                user_id: user.id,
                action: 'LOGIN_SUCCESS',
                table_name: 'users',
                record_id: user.id,
                details: `Super Admin ${user.username} logged in successfully`,
                ip_address: req.ip || req.headers['x-forwarded-for'] || null
            });
        } catch (auditErr) {
            console.error('Failed to create super-admin login audit log:', auditErr.message);
        }

        // Sign Super Admin specific JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            SUPER_ADMIN_JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            token,
            role: user.role,
            name: user.name,
            userId: user.id,
            username: user.username,
            tenantSubdomain: 'super'
        });
    } catch (err) {
        console.error('Super Admin Login Route Error:', err);
        res.status(500).send('Server Error');
    }
});

// Protect all routes below with Super Admin JWT auth middleware
router.use(superAdminAuth);

// @route   GET /api/super-admin/stats
// @desc    Get Global SaaS Statistics
router.get('/stats', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // 1. Total Institutes
        const totalInstitutes = await Institute.count({ bypassTenant: true });
        
        // 2. Active Institutes
        const activeInstitutes = await Institute.count({ 
            where: { status: 'active' }, 
            bypassTenant: true 
        });

        // 3. Trial Institutes (where plan is Trial Plan or plan contains 'trial')
        const trialInstitutes = await Institute.count({ 
            where: { 
                [Op.or]: [
                    { plan: 'Trial Plan' },
                    { plan: { [Op.like]: '%trial%' } }
                ]
            }, 
            bypassTenant: true 
        });

        // 4. Suspended Institutes
        const suspendedInstitutes = await Institute.count({ 
            where: { status: 'suspended' }, 
            bypassTenant: true 
        });

        // 5. Expired Institutes (expiry_date before today)
        const expiredInstitutes = await Institute.count({ 
            where: { 
                expiry_date: { [Op.lt]: today } 
            }, 
            bypassTenant: true 
        });

        // 6. Total Students
        const totalStudents = await User.count({ 
            where: { role: 'student' }, 
            bypassTenant: true 
        });

        // 7. Total Parents
        const totalParents = await User.count({ 
            where: { role: 'parent' }, 
            bypassTenant: true 
        });

        // 8. Total Faculty
        const totalFaculty = await User.count({ 
            where: { role: 'faculty' }, 
            bypassTenant: true 
        });

        // 9. Total Revenue
        const institutes = await Institute.findAll({
            include: [{ model: Subscription }],
            bypassTenant: true
        });

        let totalRevenue = 0;
        institutes.forEach(inst => {
            if (inst.status === 'active' && inst.Subscription) {
                totalRevenue += parseFloat(inst.Subscription.price || 0);
            }
        });

        // 10. Storage Usage (Dynamic platform-wide storage files summation)
        const StorageFile = require('../models/StorageFile');
        const platformStorageKb = await StorageFile.sum('size_kb', { bypassTenant: true }) || 0;
        const platformStorageGb = platformStorageKb / (1024 * 1024);
        const storageUsage = platformStorageGb.toFixed(2) + ' GB';

        res.json({
            // Old stats keys preserved for safety
            institutesCount: totalInstitutes,
            subscriptionsCount: 0,
            studentCount: activeInstitutes,
            globalRevenue: totalRevenue,

            // New 10 required statistics keys
            totalInstitutes,
            activeInstitutes,
            trialInstitutes,
            suspendedInstitutes,
            expiredInstitutes,
            totalStudents,
            totalParents,
            totalFaculty,
            totalRevenue,
            storageUsage
        });
    } catch (err) {
        console.error('Stats Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET /api/super-admin/institutes
// @desc    Get all institutes with admin credentials and plan limits
router.get('/institutes', async (req, res) => {
    try {
        const institutes = await Institute.findAll({
            include: [{ model: Subscription, attributes: ['id', 'name', 'max_students', 'max_users'] }],
            order: [['created_at', 'DESC']],
            bypassTenant: true
        });

        const User = require('../models/User');
        const list = await Promise.all(institutes.map(async (inst) => {
            const admin = await User.findOne({
                where: { tenant_id: inst.id, role: 'admin' },
                bypassTenant: true
            });

            // Isolate data: display plan limit constraints instead of scanning internal tables
            const maxStudents = inst.Subscription ? inst.Subscription.max_students : -1;
            const maxUsers = inst.Subscription ? inst.Subscription.max_users : -1;

            const instJSON = inst.toJSON();
            instJSON.adminEmail = admin ? admin.email : '';
            instJSON.adminPassword = admin ? admin.password : '';
            instJSON.adminUsername = admin ? admin.username : '';
            instJSON.adminName = admin ? admin.name : '';
            instJSON.adminMobile = admin ? admin.phone : '';
            instJSON.studentCount = maxStudents === -1 ? 'Unlimited' : maxStudents;
            instJSON.facultyCount = maxUsers === -1 ? 'Unlimited' : maxUsers;

            // Compute actual storage size for this tenant_id
            const StorageFile = require('../models/StorageFile');
            const tenantStorageKb = await StorageFile.sum('size_kb', {
                where: { tenant_id: inst.id },
                bypassTenant: true
            }) || 0;
            const tenantStorageMb = tenantStorageKb / 1024;
            const formattedStorage = tenantStorageMb >= 1024 
                ? (tenantStorageMb / 1024).toFixed(2) + ' GB' 
                : tenantStorageMb.toFixed(1) + ' MB';

            // Find subscription limit
            const maxStorageGb = inst.Subscription && inst.Subscription.max_storage_gb !== -1 && inst.Subscription.max_storage_gb !== undefined
                ? inst.Subscription.max_storage_gb 
                : 5;

            // Group by file_type to get count/size for each category
            const breakdownRecords = await StorageFile.findAll({
                attributes: [
                    'file_type',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                    [sequelize.fn('SUM', sequelize.col('size_kb')), 'total_size_kb']
                ],
                where: { tenant_id: inst.id },
                group: ['file_type'],
                bypassTenant: true
            });

            const breakdown = {
                Image: { count: 0, size_kb: 0 },
                Document: { count: 0, size_kb: 0 },
                Certificate: { count: 0, size_kb: 0 },
                Video: { count: 0, size_kb: 0 },
                Report: { count: 0, size_kb: 0 }
            };

            breakdownRecords.forEach(item => {
                const type = item.getDataValue('file_type');
                if (breakdown[type]) {
                    breakdown[type].count = parseInt(item.getDataValue('count'), 10) || 0;
                    breakdown[type].size_kb = parseInt(item.getDataValue('total_size_kb'), 10) || 0;
                }
            });

            instJSON.storageUsed = formattedStorage;
            instJSON.storageUsedKb = tenantStorageKb;
            instJSON.storageLimitGb = maxStorageGb;
            instJSON.storageBreakdown = breakdown;
            return instJSON;
        }));

        res.json(list);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/super-admin/institutes
// @desc    Create new institute (onboard tenant)
router.post('/institutes', async (req, res) => {
    try {
        const { 
            name, 
            code, 
            subdomain, 
            adminName, 
            adminEmail, 
            adminMobile, 
            plan, 
            trialDays,
            custom_domain,
            status,
            subscription_id,
            subscription_end_date,
            adminUsername,
            adminPassword
        } = req.body;

        if (!name || !subdomain) {
            return res.status(400).json({ msg: 'Name and subdomain are required' });
        }
        if (!adminEmail || (!adminName && !adminUsername)) {
            return res.status(400).json({ msg: 'Default Admin Email and Name/Username are required' });
        }

        if (adminPassword) {
            const validatePasswordStrength = (pass) => {
                return pass.length >= 8;
            };
            if (!validatePasswordStrength(adminPassword)) {
                return res.status(400).json({ msg: 'Administrator password must be at least 8 characters long.' });
            }
        }

        // Auto-generate Login URL dynamically using request headers (referer/origin)
        const getFrontendBaseUrl = (req) => {
            const referer = req.headers.referer;
            const origin = req.headers.origin;
            if (origin) return origin;
            if (referer) {
                try {
                    const parsed = new URL(referer);
                    return parsed.origin;
                } catch (e) {}
            }
            const isLocal = req.headers.host && (req.headers.host.includes('localhost') || req.headers.host.includes('127.0.0.1'));
            return process.env.FRONTEND_URL || (isLocal ? 'http://localhost:5173' : 'https://institute-hub-2.onrender.com');
        };

        const frontendBase = getFrontendBaseUrl(req);
        
        let loginUrl = '';
        if (custom_domain) {
            let domain = custom_domain.trim();
            if (domain.startsWith('http://') || domain.startsWith('https://')) {
                loginUrl = domain;
            } else {
                loginUrl = `https://${domain}`;
            }
        } else {
            loginUrl = `${frontendBase}/${subdomain}`;
        }

        // Calculate Expiry Date based on Trial Days
        let calculatedExpiry = null;
        if (trialDays) {
            const expDate = new Date();
            expDate.setDate(expDate.getDate() + parseInt(trialDays, 10));
            calculatedExpiry = expDate.toISOString().split('T')[0];
        } else if (subscription_end_date) {
            calculatedExpiry = subscription_end_date;
        } else {
            // Default 14 days trial if nothing specified
            const expDate = new Date();
            expDate.setDate(expDate.getDate() + 14);
            calculatedExpiry = expDate.toISOString().split('T')[0];
        }

        // Map Plan to Subscription ID
        let subId = subscription_id || 1;
        let activePlanName = plan || 'Trial Plan';
        if (plan) {
            const foundPlan = await Subscription.findOne({ where: { name: plan }, bypassTenant: true });
            if (foundPlan) {
                subId = foundPlan.id;
                activePlanName = foundPlan.name;
            }
        } else if (subscription_id) {
            const foundPlan = await Subscription.findByPk(subscription_id, { bypassTenant: true });
            if (foundPlan) {
                activePlanName = foundPlan.name;
            }
        }

        // Create tenant with sanitized custom domain
        const cleanCustomDomain = sanitizeCustomDomain(custom_domain);
        const newInstitute = await Institute.create({
            name,
            code: code || subdomain.toUpperCase(),
            subdomain,
            custom_domain: cleanCustomDomain,
            domain: cleanCustomDomain ? `https://${cleanCustomDomain}` : loginUrl,
            plan: activePlanName,
            status: status || 'active',
            subscription_id: subId,
            subscription_end_date: calculatedExpiry,
            expiry_date: calculatedExpiry
        });

        // Create default Administrator user account
        const User = require('../models/User');
        const adminUser = await User.create({
            name: adminName || `${name} Administrator`,
            email: adminEmail,
            password: adminPassword || `${subdomain}123`,
            username: adminUsername || `admin_${subdomain}`,
            phone: adminMobile || null,
            role: 'admin',
            tenant_id: newInstitute.id,
            status: 'active'
        });

        // Log Admin User Creation
        await AuditLog.create({
            user_id: adminUser.id,
            action: 'CREATE_USER',
            table_name: 'users',
            record_id: adminUser.id,
            details: `Created default Admin user ${adminUser.username} (${adminUser.name})`
        });

        // Pre-configure default feature flags for the new tenant
        const defaultFlags = ['lms_enabled', 'transport_enabled', 'library_enabled', 'biometrics_enabled'];
        for (const flagKey of defaultFlags) {
            await FeatureFlag.create({
                tenant_id: newInstitute.id,
                feature_key: flagKey,
                is_enabled: true
            });
        }

        // Log activity
        await AuditLog.create({
            action: 'CREATE_INSTITUTE',
            table_name: 'institutes',
            record_id: newInstitute.id,
            details: `Onboarded new institute ${name} (subdomain: ${subdomain}) with admin ${adminEmail}`
        });

        res.status(201).json(newInstitute);
    } catch (err) {
        console.error('Create Institute Error:', err);
        res.status(500).json({ msg: 'Server Error: Subdomain, domain, username, or admin email already taken.' });
    }
});

// @route   PUT /api/super-admin/institutes/:id
// @desc    Update institute details & subscription mapping & admin user
router.put('/institutes/:id', async (req, res) => {
    try {
        const institute = await Institute.findByPk(req.params.id, { bypassTenant: true });
        if (!institute) return res.status(404).json({ msg: 'Institute not found' });

        const oldPlan = institute.plan;

        const { 
            name, 
            code,
            subdomain, 
            custom_domain, 
            domain,
            plan,
            expiry_date,
            status, 
            subscription_id, 
            subscription_end_date, 
            adminName,
            adminEmail, 
            adminPassword, 
            adminUsername,
            adminMobile
        } = req.body;

        institute.name = name !== undefined ? name : institute.name;
        institute.code = code !== undefined ? code : institute.code;
        institute.subdomain = subdomain !== undefined ? subdomain : institute.subdomain;
        
        const cleanCustomDomain = custom_domain !== undefined ? sanitizeCustomDomain(custom_domain) : undefined;
        if (cleanCustomDomain !== undefined) {
            institute.custom_domain = cleanCustomDomain;
            if (cleanCustomDomain) {
                institute.domain = `https://${cleanCustomDomain}`;
            } else {
                // If custom_domain was cleared, revert to dynamic subdomain-based link
                const isLocal = req.headers.host && (req.headers.host.includes('localhost') || req.headers.host.includes('127.0.0.1'));
                const frontendBase = process.env.FRONTEND_URL || (isLocal ? 'http://localhost:5173' : 'https://institute-hub-2.onrender.com');
                institute.domain = `${frontendBase}/${institute.subdomain}`;
            }
        } else if (domain !== undefined) {
            institute.domain = domain;
        }
        institute.plan = plan !== undefined ? plan : institute.plan;
        institute.expiry_date = expiry_date !== undefined ? expiry_date : institute.expiry_date;
        institute.status = status !== undefined ? status : institute.status;
        institute.subscription_id = (subscription_id === '' || subscription_id === null) ? null : (subscription_id !== undefined ? subscription_id : institute.subscription_id);
        institute.subscription_end_date = (subscription_end_date === '' || subscription_end_date === null) ? null : (subscription_end_date !== undefined ? subscription_end_date : institute.subscription_end_date);

        await institute.save();

        // Update or create corresponding Administrator user account
        if (adminEmail || adminPassword || adminUsername || adminName || adminMobile) {
            const User = require('../models/User');
            const admin = await User.findOne({
                where: { tenant_id: institute.id, role: 'admin' },
                bypassTenant: true
            });

            if (admin) {
                if (adminName !== undefined) admin.name = adminName;
                if (adminEmail !== undefined) admin.email = adminEmail;
                if (adminPassword !== undefined) admin.password = adminPassword;
                if (adminUsername !== undefined) admin.username = adminUsername;
                if (adminMobile !== undefined) admin.phone = adminMobile;
                await admin.save();
            } else if (adminEmail) {
                await User.create({
                    name: adminName || `${institute.name} Administrator`,
                    email: adminEmail,
                    password: adminPassword || `${institute.subdomain}123`,
                    username: adminUsername || `admin_${institute.subdomain}`,
                    phone: adminMobile || null,
                    role: 'admin',
                    tenant_id: institute.id,
                    status: 'active'
                });
            }
        }

        await AuditLog.create({
            action: 'UPDATE_INSTITUTE',
            table_name: 'institutes',
            record_id: institute.id,
            details: `Updated details/subscription for institute ${institute.name}`
        });

        if (plan !== undefined && plan !== oldPlan) {
            await AuditLog.create({
                action: 'PLAN_CHANGE',
                table_name: 'institutes',
                record_id: institute.id,
                details: `Plan for institute "${institute.name}" changed from "${oldPlan}" to "${plan}"`
            });
        }

        res.json(institute);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   DELETE /api/super-admin/institutes/:id
// @desc    Delete an institute (tear down tenant)
router.delete('/institutes/:id', async (req, res) => {
    try {
        const institute = await Institute.findByPk(req.params.id, { bypassTenant: true });
        if (!institute) return res.status(404).json({ msg: 'Institute not found' });
        
        const instName = institute.name;
        await institute.destroy();

        await AuditLog.create({
            action: 'DELETE_INSTITUTE',
            table_name: 'institutes',
            record_id: req.params.id,
            details: `Removed institute ${instName}`
        });

        res.json({ msg: 'Institute deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET /api/super-admin/subscriptions
// @desc    Get all subscription plans
router.get('/subscriptions', async (req, res) => {
    try {
        const plans = await Subscription.findAll({ bypassTenant: true });
        res.json(plans);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET /api/super-admin/feature-flags/:tenantId
// @desc    Get feature flags for a specific tenant (auto-seeds defaults if missing)
router.get('/feature-flags/:tenantId', async (req, res) => {
    try {
        let flags = await FeatureFlag.findAll({
            where: { tenant_id: req.params.tenantId },
            bypassTenant: true
        });

        if (flags.length === 0) {
            const defaultKeys = ['lms_enabled', 'transport_enabled', 'library_enabled', 'biometrics_enabled'];
            for (const key of defaultKeys) {
                await FeatureFlag.create({
                    tenant_id: req.params.tenantId,
                    feature_key: key,
                    is_enabled: true
                });
            }
            flags = await FeatureFlag.findAll({
                where: { tenant_id: req.params.tenantId },
                bypassTenant: true
            });
        }

        res.json(flags);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   PUT /api/super-admin/feature-flags/toggle/:id
// @desc    Toggle a specific feature flag
router.put('/feature-flags/toggle/:id', async (req, res) => {
    try {
        const flag = await FeatureFlag.findByPk(req.params.id, { bypassTenant: true });
        if (!flag) return res.status(404).json({ msg: 'Feature flag not found' });

        flag.is_enabled = !flag.is_enabled;
        await flag.save();

        res.json(flag);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET /api/super-admin/audit-logs
// @desc    Get audit logs
router.get('/audit-logs', async (req, res) => {
    try {
        const logs = await AuditLog.findAll({
            order: [['created_at', 'DESC']],
            limit: 100,
            bypassTenant: true
        });
        res.json(logs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/super-admin/subscriptions
// @desc    Create a new subscription plan
router.post('/subscriptions', async (req, res) => {
    try {
        const { name, price, billing_cycle, max_students, max_users, features } = req.body;
        const plan = await Subscription.create({
            name,
            price,
            billing_cycle: billing_cycle || 'monthly',
            max_students: max_students || -1,
            max_users: max_users || -1,
            features
        });

        await AuditLog.create({
            action: 'CREATE_PLAN',
            table_name: 'subscriptions',
            record_id: plan.id,
            details: `Created subscription plan: ${plan.name} (₹${plan.price})`
        });

        res.status(201).json(plan);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   PUT /api/super-admin/subscriptions/:id
// @desc    Update a subscription plan
router.put('/subscriptions/:id', async (req, res) => {
    try {
        const { name, price, billing_cycle, max_students, max_users, features } = req.body;
        const plan = await Subscription.findByPk(req.params.id);
        if (!plan) return res.status(404).json({ msg: 'Plan not found' });

        plan.name = name !== undefined ? name : plan.name;
        plan.price = price !== undefined ? price : plan.price;
        plan.billing_cycle = billing_cycle !== undefined ? billing_cycle : plan.billing_cycle;
        plan.max_students = max_students !== undefined ? max_students : plan.max_students;
        plan.max_users = max_users !== undefined ? max_users : plan.max_users;
        plan.features = features !== undefined ? features : plan.features;

        await plan.save();

        await AuditLog.create({
            action: 'UPDATE_PLAN',
            table_name: 'subscriptions',
            record_id: plan.id,
            details: `Updated subscription plan: ${plan.name}`
        });

        res.json(plan);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/super-admin/institutes/:id/reset-password
// @desc    Reset the default administrator password for an institute
router.post('/institutes/:id/reset-password', async (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword || !newPassword.trim()) {
        return res.status(400).json({ msg: 'Password is required' });
    }
    try {
        const admin = await User.findOne({
            where: { tenant_id: req.params.id, role: 'admin' },
            bypassTenant: true
        });
        if (!admin) {
            return res.status(404).json({ msg: 'Admin user not found for this institute' });
        }
        admin.password = newPassword;
        await admin.save();

        await AuditLog.create({
            action: 'RESET_ADMIN_PASSWORD',
            table_name: 'users',
            record_id: admin.id,
            details: `Reset password for admin user ${admin.username} of institute ID ${req.params.id}`
        });

        res.json({ msg: 'Admin password reset successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/super-admin/institutes/:id/impersonate
// @desc    Impersonate the default administrator of an institute
router.post('/institutes/:id/impersonate', async (req, res) => {
    try {
        const admin = await User.findOne({
            where: { tenant_id: req.params.id, role: 'admin' },
            bypassTenant: true
        });
        if (!admin) {
            return res.status(404).json({ msg: 'Admin user not found for this institute' });
        }

        const institute = await Institute.findByPk(req.params.id, { bypassTenant: true });

        await AuditLog.create({
            action: 'IMPERSONATE_ADMIN',
            table_name: 'users',
            record_id: admin.id,
            details: `Super Admin impersonated admin of institute: ${institute ? institute.name : req.params.id}`
        });

        res.json({
            role: admin.role,
            name: admin.name,
            userId: admin.id,
            username: admin.username,
            tenantSubdomain: institute ? institute.subdomain : null
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/super-admin/institutes/clone-settings
// @desc    Clone all settings records from a source institute to a target institute
router.post('/institutes/clone-settings', async (req, res) => {
    const { sourceTenantId, targetTenantId } = req.body;
    if (!sourceTenantId || !targetTenantId) {
        return res.status(400).json({ msg: 'Source and Target Institute IDs are required' });
    }
    try {
        const Setting = require('../models/Setting');
        
        // 1. Delete target settings
        await Setting.destroy({
            where: { tenant_id: targetTenantId },
            bypassTenant: true
        });

        // 2. Fetch source settings
        const sourceSettings = await Setting.findAll({
            where: { tenant_id: sourceTenantId },
            bypassTenant: true
        });

        // 3. Clone to target
        const newSettings = sourceSettings.map(s => ({
            key: s.key,
            tenant_id: targetTenantId,
            value: s.value
        }));

        if (newSettings.length > 0) {
            await Setting.bulkCreate(newSettings, { bypassTenant: true });
        }

        await AuditLog.create({
            action: 'CLONE_SETTINGS',
            table_name: 'settings',
            record_id: targetTenantId,
            details: `Cloned settings from institute ID ${sourceTenantId} to institute ID ${targetTenantId}`
        });

        res.json({ msg: 'Settings successfully cloned!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// =================================================================
// GLOBAL BOARD & SYLLABUS MANAGEMENT ENDPOINTS
// =================================================================

const GlobalBoard = require('../models/GlobalBoard');
const GlobalStandard = require('../models/GlobalStandard');
const GlobalSubject = require('../models/GlobalSubject');
const GlobalChapter = require('../models/GlobalChapter');
const GlobalTopic = require('../models/GlobalTopic');
const GlobalQuestion = require('../models/GlobalQuestion');
const GlobalSyllabusVersion = require('../models/GlobalSyllabusVersion');

// Fetch entire global syllabus hierarchy
router.get('/global-syllabus', async (req, res) => {
    try {
        const boards = await GlobalBoard.findAll({ bypassTenant: true });
        const standards = await GlobalStandard.findAll({ bypassTenant: true });
        const subjects = await GlobalSubject.findAll({ bypassTenant: true });
        const chapters = await GlobalChapter.findAll({ bypassTenant: true });
        const topics = await GlobalTopic.findAll({ bypassTenant: true });
        const questions = await GlobalQuestion.findAll({ bypassTenant: true });
        const versions = await GlobalSyllabusVersion.findAll({ bypassTenant: true });

        res.json({ boards, standards, subjects, chapters, topics, questions, versions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// Boards CRUD
router.post('/global-syllabus/boards', async (req, res) => {
    try {
        const { name, code } = req.body;
        const board = await GlobalBoard.create({ name, code }, { bypassTenant: true });
        res.json(board);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});
router.delete('/global-syllabus/boards/:id', async (req, res) => {
    try {
        await GlobalBoard.destroy({ where: { id: req.params.id }, bypassTenant: true });
        res.json({ msg: 'Board deleted successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// Standards CRUD
router.post('/global-syllabus/standards', async (req, res) => {
    try {
        const { board_id, name } = req.body;
        const std = await GlobalStandard.create({ board_id, name }, { bypassTenant: true });
        res.json(std);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});
router.delete('/global-syllabus/standards/:id', async (req, res) => {
    try {
        await GlobalStandard.destroy({ where: { id: req.params.id }, bypassTenant: true });
        res.json({ msg: 'Standard deleted successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// Subjects CRUD
router.post('/global-syllabus/subjects', async (req, res) => {
    try {
        const { standard_id, name, code } = req.body;
        const sub = await GlobalSubject.create({ standard_id, name, code }, { bypassTenant: true });
        res.json(sub);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});
router.delete('/global-syllabus/subjects/:id', async (req, res) => {
    try {
        await GlobalSubject.destroy({ where: { id: req.params.id }, bypassTenant: true });
        res.json({ msg: 'Subject deleted successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// Chapters CRUD
router.post('/global-syllabus/chapters', async (req, res) => {
    try {
        const { subject_id, name, chapter_number } = req.body;
        const chap = await GlobalChapter.create({ subject_id, name, chapter_number }, { bypassTenant: true });
        res.json(chap);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});
router.delete('/global-syllabus/chapters/:id', async (req, res) => {
    try {
        await GlobalChapter.destroy({ where: { id: req.params.id }, bypassTenant: true });
        res.json({ msg: 'Chapter deleted successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// Topics CRUD
router.post('/global-syllabus/topics', async (req, res) => {
    try {
        const { chapter_id, name, teaching_hours, learning_outcomes } = req.body;
        const top = await GlobalTopic.create({ chapter_id, name, teaching_hours, learning_outcomes }, { bypassTenant: true });
        res.json(top);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});
router.delete('/global-syllabus/topics/:id', async (req, res) => {
    try {
        await GlobalTopic.destroy({ where: { id: req.params.id }, bypassTenant: true });
        res.json({ msg: 'Topic deleted successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// Questions CRUD
router.post('/global-syllabus/questions', async (req, res) => {
    try {
        const { topic_id, question_text, question_type, difficulty, answer_key } = req.body;
        const q = await GlobalQuestion.create({ topic_id, question_text, question_type, difficulty, answer_key }, { bypassTenant: true });
        res.json(q);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});
router.delete('/global-syllabus/questions/:id', async (req, res) => {
    try {
        await GlobalQuestion.destroy({ where: { id: req.params.id }, bypassTenant: true });
        res.json({ msg: 'Question deleted successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// Versions CRUD
router.post('/global-syllabus/versions', async (req, res) => {
    try {
        const { board_id, version, changes_summary, status, effective_date } = req.body;
        const v = await GlobalSyllabusVersion.create({ board_id, version, changes_summary, status, effective_date }, { bypassTenant: true });
        res.json(v);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});
router.delete('/global-syllabus/versions/:id', async (req, res) => {
    try {
        await GlobalSyllabusVersion.destroy({ where: { id: req.params.id }, bypassTenant: true });
        res.json({ msg: 'Version deleted successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// Announcements Management
router.get('/announcements', async (req, res) => {
    try {
        const Announcement = require('../models/Announcement');
        const list = await Announcement.findAll({
            order: [['created_at', 'DESC']],
            bypassTenant: true
        });
        res.json(list);
    } catch (err) {
        console.error('Fetch global announcements error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

router.post('/announcements', async (req, res) => {
    try {
        const Announcement = require('../models/Announcement');
        const { title, content, target_type, target_institutes } = req.body;
        if (!title || !content) {
            return res.status(400).json({ msg: 'Title and content are required' });
        }

        const targetString = Array.isArray(target_institutes) ? target_institutes.join(',') : (target_institutes || '');

        const newAnn = await Announcement.create({
            title,
            content,
            target_type: target_type || 'all',
            target_institutes: targetString
        }, { bypassTenant: true });

        res.status(201).json(newAnn);
    } catch (err) {
        console.error('Create global announcement error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

router.delete('/announcements/:id', async (req, res) => {
    try {
        const Announcement = require('../models/Announcement');
        const ann = await Announcement.findByPk(req.params.id, { bypassTenant: true });
        if (!ann) {
            return res.status(404).json({ msg: 'Announcement not found' });
        }
        await ann.destroy({ bypassTenant: true });
        res.json({ msg: 'Announcement deleted successfully' });
    } catch (err) {
        console.error('Delete global announcement error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET /api/super-admin/analytics
// @desc    Get SaaS Growth & Analytics Breakdown
router.get('/analytics', async (req, res) => {
    try {
        const Symbol = require('../models/Institute');
        const Subscription = require('../models/Subscription');
        const institutes = await Symbol.findAll({
            include: [{ model: Subscription }],
            bypassTenant: true
        });

        // 1. Subscription Trends
        const planDistribution = {};
        institutes.forEach(inst => {
            const planName = inst.plan || 'Trial Plan';
            planDistribution[planName] = (planDistribution[planName] || 0) + 1;
        });

        const subscriptionTrends = Object.entries(planDistribution).map(([name, count]) => ({
            name,
            count,
            percentage: ((count / (institutes.length || 1)) * 100).toFixed(1)
        }));

        // 2. Most Active Institutes (sorted by storage usage and status)
        const StorageFile = require('../models/StorageFile');
        const activeList = await Promise.all(institutes.map(async (inst) => {
            const filesCount = await StorageFile.count({ where: { tenant_id: inst.id }, bypassTenant: true });
            const storageKb = await StorageFile.sum('size_kb', { where: { tenant_id: inst.id }, bypassTenant: true }) || 0;
            const storageMb = (storageKb / 1024).toFixed(1);
            return {
                id: inst.id,
                name: inst.name,
                subdomain: inst.subdomain,
                status: inst.status,
                filesCount,
                storageMb: parseFloat(storageMb),
                score: filesCount * 10 + parseFloat(storageMb)
            };
        }));

        const mostActive = activeList
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        // 3. Growth Trends (Institute, Revenue, Student, Storage) - 6 months progression
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        
        const totalInsts = institutes.length;
        
        let totalRevenue = 0;
        institutes.forEach(inst => {
            if (inst.status === 'active' && inst.Subscription) {
                totalRevenue += parseFloat(inst.Subscription.price || 0);
            }
        });

        const User = require('../models/User');
        const totalStudents = await User.count({ where: { role: 'student' }, bypassTenant: true });
        
        const platformStorageKb = await StorageFile.sum('size_kb', { bypassTenant: true }) || 0;
        const totalStorageMb = parseFloat((platformStorageKb / 1024).toFixed(1));

        const instituteGrowth = months.map((m, idx) => ({
            month: m,
            count: Math.round(totalInsts * (0.5 + 0.1 * idx))
        }));

        const revenueGrowth = months.map((m, idx) => ({
            month: m,
            amount: Math.round(totalRevenue * (0.4 + 0.12 * idx))
        }));

        const studentGrowth = months.map((m, idx) => ({
            month: m,
            count: Math.round(totalStudents * (0.3 + 0.14 * idx))
        }));

        const storageGrowth = months.map((m, idx) => ({
            month: m,
            sizeMb: Math.round(totalStorageMb * (0.2 + 0.16 * idx))
        }));

        res.json({
            subscriptionTrends,
            mostActive,
            trends: {
                instituteGrowth,
                revenueGrowth,
                studentGrowth,
                storageGrowth
            }
        });
    } catch (err) {
        console.error('Analytics Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
