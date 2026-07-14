const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { getDomain } = require('../config/domainHelper');
const Institute = require('../models/Institute');

const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const { Op } = require('sequelize');

const checkPortalAccess = async (user, tenantId) => {
    if (user.role === 'super-admin' || user.role === 'admin') return null;

    const Setting = require('../models/Setting');
    const { getSettings } = require('../config/settingsCache');
    const dbSettings = await Setting.findAll({ where: { tenant_id: tenantId } });
    const settingsMap = {};
    dbSettings.forEach(row => {
        try { settingsMap[row.key] = JSON.parse(row.value); } catch(e) { settingsMap[row.key] = row.value; }
    });
    const currentSettings = { ...getSettings(), ...settingsMap };

    if (user.role === 'student') {
        const mode = currentSettings.student_portal_mode || 'all';
        if (mode === 'disabled' || currentSettings.portal_enable_student === false) {
            return 'Access Denied: The Student Portal is currently disabled by the institution.';
        }
        if (mode === 'standards') {
            const Student = require('../models/Student');
            const studentProfile = await Student.findOne({ where: { user_id: user.id } });
            const studentStd = studentProfile ? studentProfile.standard : null;
            const allowed = Array.isArray(currentSettings.student_portal_allowed_standards)
                ? currentSettings.student_portal_allowed_standards
                : [];
            if (!studentStd || !allowed.includes(studentStd)) {
                return `Access Denied: The Student Portal is currently disabled for standard/course: ${studentStd || 'N/A'}.`;
            }
        }
    }
    if (user.role === 'parent' && currentSettings.portal_enable_parent === false) {
        return 'Access Denied: The Parent Portal is currently disabled by the institution.';
    }
    if (user.role === 'faculty' && currentSettings.portal_enable_faculty === false) {
        return 'Access Denied: The Faculty Portal is currently disabled by the institution.';
    }
    if (user.role === 'accountant' && currentSettings.portal_enable_accountant === false) {
        return 'Access Denied: The Accountant Portal is currently disabled by the institution.';
    }
    if (user.role === 'receptionist' && currentSettings.portal_enable_receptionist === false) {
        return 'Access Denied: The Receptionist Portal is currently disabled by the institution.';
    }
    if (user.role === 'librarian' && currentSettings.portal_enable_librarian === false) {
        return 'Access Denied: The Library Portal is currently disabled by the institution.';
    }
    if (user.role === 'transport-manager' && currentSettings.portal_enable_transport === false) {
        return 'Access Denied: The Transport Portal is currently disabled by the institution.';
    }
    if (user.role === 'hostel-manager' && currentSettings.portal_enable_hostel === false) {
        return 'Access Denied: The Hostel Portal is currently disabled by the institution.';
    }
    if (user.role === 'alumni' && currentSettings.portal_enable_alumni === false) {
        return 'Access Denied: The Alumni Portal is currently disabled by the institution.';
    }
    return null;
};

// @route   POST /api/auth/login
// @desc    Authenticate user & get token (supports email OR username, auto-detects role if omitted)
router.post('/login', async (req, res) => {
    const { email, password, role } = req.body;
    console.log(`🔐 Login Attempt: User[${email}], Role[${role || 'Auto-Detect'}]`);

    try {
        const searchWhere = {
            [Op.or]: [
                { email: email },
                { username: email },
                { phone: email }
            ]
        };

        if (role) {
            searchWhere.role = role;
        }

        // Find user by email, username or phone
        const user = await User.findOne({
            where: searchWhere
        });

        if (!user) {
            console.log(`❌ Login Failed: User not found [${email}]`);
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Enforce lockout check
        if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
            const minutesLeft = Math.ceil((new Date(user.lockout_until) - new Date()) / 60000);
            console.log(`❌ Login Failed: Account locked for user [${email}]`);
            return res.status(403).json({ msg: `Account is temporarily locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).` });
        }

        // Enforce that Super Admin must NOT log in through institute login pages
        if (user.role === 'super-admin') {
            console.log(`❌ Login Failed: Super Admin attempted login through standard authentication routes.`);
            return res.status(403).json({ msg: 'Access Denied: Super Admin must log in through the dedicated Super Admin Portal.' });
        }

        const { comparePassword } = require('../utils/passwordHelper');
        const isMatch = await comparePassword(password, user.password);

        if (!isMatch) {
            console.log(`❌ Login Failed: Password mismatch for user [${email}]`);
            // Track failed attempts
            user.login_attempts = (user.login_attempts || 0) + 1;
            if (user.login_attempts >= 5) {
                user.lockout_until = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
                user.login_attempts = 0; // reset attempts count for next cycle
                await user.save();
                return res.status(403).json({ msg: 'Account has been temporarily locked for 15 minutes due to 5 consecutive failed login attempts.' });
            }
            await user.save();
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        if (user.status !== 'active') {
            if (user.status === 'pending') {
                return res.status(403).json({ msg: 'Account Pending Approval: Please contact the administrator to activate your portal access.' });
            }
            if (user.status === 'inactive') {
                return res.status(403).json({ msg: 'Account Inactive: Your login access is currently disabled.' });
            }
            if (user.status === 'blocked') {
                return res.status(403).json({ msg: 'Account Blocked: Access is locked due to security/administrative policy.' });
            }
            if (user.status === 'suspended') {
                return res.status(403).json({ msg: 'Account Suspended: Access to this portal has been revoked.' });
            }
            if (user.status === 'archived') {
                return res.status(403).json({ msg: 'Account Archived: This account is no longer active.' });
            }
            if (user.status === 'deleted') {
                return res.status(403).json({ msg: 'Account Deleted: This account does not exist anymore.' });
            }
            return res.status(403).json({ msg: `Access Denied: Your account status is currently: ${user.status || 'N/A'}` });
        }

        // Check if role portal is active
        const tenantStorage = require('../config/tenantContext');
        const context = tenantStorage.getStore();
        const tenantId = context ? context.tenantId : 1;
        const portalError = await checkPortalAccess(user, tenantId);
        if (portalError) {
            return res.status(403).json({ msg: portalError });
        }

        // Reset attempts and update login tracking
        user.login_attempts = 0;
        user.lockout_until = null;
        user.last_login_at = new Date();
        user.last_login_ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        user.last_login_agent = req.headers['user-agent'];
        await user.save();

        console.log(`✅ Login Success: User [${user.name}] authenticated`);

        let childId = null;
        let children = [];
        if (user.role === 'parent') {
            const StudentParentMap = require('../models/StudentParentMap');
            const Student = require('../models/Student');
            const mappings = await StudentParentMap.findAll({
                where: { parent_id: user.id }
            });
            const studentIds = mappings.map(m => m.student_id);
            if (studentIds.length > 0) {
                const childrenUsers = await User.findAll({
                    where: { id: studentIds },
                    attributes: ['id', 'name', 'username'],
                    include: [{ model: Student, attributes: ['standard'] }]
                });
                children = childrenUsers.map(c => ({ 
                    id: c.id, 
                    name: c.name, 
                    username: c.username, 
                    standard: c.Student ? c.Student.standard : 'N/A' 
                }));
                childId = children.length > 0 ? children[0].id : null;
            }
        }

        await createLoginAudit(user.id, 'Credentials');

        const institute = await Institute.findByPk(user.tenant_id, { bypassTenant: true });
        const tenantSubdomain = institute ? institute.subdomain : null;

        res.json({ 
            role: user.role, 
            name: user.name, 
            userId: user.id, 
            childId,
            children,
            username: user.username,
            tenantSubdomain,
            mustChangePassword: user.must_change_password
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST /api/auth/register
// @desc    Register a new user (Disabled: Registration is now handled via Enquiry flow)
router.post('/register', async (req, res) => {
    return res.status(403).json({ msg: 'Direct registration is disabled. Please submit an admission enquiry instead.' });
});

// @route   GET /api/auth/student-profile/:id
// @desc    Get detailed profile of a student
router.get('/student-profile/:id', async (req, res) => {
    try {
        const studentId = req.params.id;
        const callerId = req.headers['x-user-id'];
        const callerRole = req.headers['x-user-role'];

        if (callerRole === 'student' && String(studentId) !== String(callerId)) {
            return res.status(403).json({ msg: 'Access Denied: Cannot view other student\'s profile' });
        }
        if (callerRole === 'parent') {
            const StudentParentMap = require('../models/StudentParentMap');
            const hasRelation = await StudentParentMap.findOne({
                where: { parent_id: callerId, student_id: studentId }
            });
            if (!hasRelation) {
                return res.status(403).json({ msg: 'Access Denied: Cannot view other student\'s profile' });
            }
        }

        const Batch = require('../models/Batch');
        const FeePayment = require('../models/FeePayment');
        const Student = require('../models/Student');
        const user = await User.findByPk(req.params.id, {
            attributes: ['id', 'name', 'phone', 'email', 'role', 'username', 'status'],
            include: [
                {
                    model: Student
                },
                {
                    model: Enrollment,
                    include: [Course, Batch]
                },
                {
                    model: FeePayment
                }
            ]
        });
        if (!user) return res.status(404).json({ msg: 'Student not found' });
        
        const userJSON = user.toJSON();
        if (user.Student) {
            userJSON.standard = user.Student.standard;
            userJSON.dob = user.Student.dob;
            userJSON.blood_group = user.Student.blood_group;
        }
        res.json(userJSON);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/auth/profile/:id
// @desc    Get any user profile details
router.get('/profile/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: ['id', 'name', 'email', 'phone', 'role', 'username', 'status', 'google_id', 'biometric_credential_id']
        });
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/auth/profile/update
// @desc    Update current logged-in user's profile details
router.put('/profile/update', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) {
            return res.status(401).json({ msg: 'Unauthorized access. No user session found.' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User profile not found.' });
        }

        const { name, email, username, phone, password } = req.body;

        if (name !== undefined) user.name = name;
        if (email !== undefined) user.email = email;
        if (username !== undefined) user.username = username;
        if (phone !== undefined) user.phone = phone;
        if (password && password.trim() !== '') user.password = password;

        await user.save();

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            username: user.username
        });
    } catch (err) {
        console.error('Update Profile Error:', err);
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ msg: 'Username, Email, or Phone number is already registered by another account.' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/auth/users
// @desc    Get all users, optionally filter by role (e.g. ?role=student)
router.get('/users', async (req, res) => {
    try {
        let query = req.query.role ? { role: req.query.role } : {};

        const Student = require('../models/Student');
        const users = await User.findAll({ 
            where: query,
            include: req.query.role === 'student' ? [
                {
                    model: Enrollment,
                    include: [Course]
                },
                {
                    model: Student
                }
            ] : []
        });

        // Map Student profile attributes to top level for frontend backwards compatibility
        const mappedUsers = users.map(user => {
            const userJson = user.toJSON();
            if (userJson.Student) {
                userJson.standard = userJson.Student.standard;
                userJson.dob = userJson.Student.dob;
                userJson.blood_group = userJson.Student.blood_group;
            }
            if (userJson.Enrollments && userJson.Enrollments[0] && userJson.Enrollments[0].Course) {
                userJson.board = userJson.Enrollments[0].Course.board;
            } else {
                userJson.board = 'Unassigned';
            }
            return userJson;
        });

        res.json(mappedUsers);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

const { checkSubscriptionLimits } = require('../middleware/subscriptionMiddleware');

// @route   POST /api/auth/users
// @desc    Admin create new user explicitly
router.post('/users', checkSubscriptionLimits, async (req, res) => {
    try {
        const { name, email, username, role, phone, parent_id, standard, parent_name, parent_phone, address, dob, blood_group, parent_username } = req.body;
        if (!name || !role) return res.status(400).json({ msg: 'Name and role are required' });

        // Fetch current settings
        const tenantStorage = require('../config/tenantContext');
        const context = tenantStorage.getStore();
        const tenantId = context ? context.tenantId : 1;

        const Setting = require('../models/Setting');
        const { getSettings } = require('../config/settingsCache');
        const dbSettings = await Setting.findAll({ where: { tenant_id: tenantId } });
        const settingsMap = {};
        dbSettings.forEach(row => {
            try { settingsMap[row.key] = JSON.parse(row.value); } catch(e) { settingsMap[row.key] = row.value; }
        });
        const currentSettings = { ...getSettings(), ...settingsMap };

        // Determine if login creation is allowed for the target role
        let loginEnabled = true;
        if (role === 'student') {
            const mode = currentSettings.student_portal_mode || 'all';
            if (mode === 'disabled' || currentSettings.portal_enable_student === false) {
                loginEnabled = false;
            } else if (mode === 'standards') {
                const allowed = Array.isArray(currentSettings.student_portal_allowed_standards)
                    ? currentSettings.student_portal_allowed_standards
                    : [];
                if (!standard || !allowed.includes(standard)) {
                    loginEnabled = false;
                }
            }
        } else if (role === 'parent') {
            if (currentSettings.portal_enable_parent === false) loginEnabled = false;
        } else if (role === 'faculty') {
            if (currentSettings.portal_enable_faculty === false) loginEnabled = false;
        } else if (role === 'accountant') {
            if (currentSettings.portal_enable_accountant === false) loginEnabled = false;
        } else if (role === 'receptionist') {
            if (currentSettings.portal_enable_receptionist === false) loginEnabled = false;
        } else if (role === 'librarian') {
            if (currentSettings.portal_enable_librarian === false) loginEnabled = false;
        } else if (role === 'transport-manager') {
            if (currentSettings.portal_enable_transport === false) loginEnabled = false;
        } else if (role === 'hostel-manager') {
            if (currentSettings.portal_enable_hostel === false) loginEnabled = false;
        }

        const { generateTempPassword, hashPassword } = require('../utils/passwordHelper');
        
        // System automatically generates secure temporary password if login is enabled
        let tempPassword = null;
        let hashedPassword = '*';
        if (loginEnabled) {
            tempPassword = generateTempPassword();
            hashedPassword = await hashPassword(tempPassword);
        }

        // Determine if parent login should be created for students
        let parentLoginEnabled = true;
        if (currentSettings.portal_enable_parent === false) {
            parentLoginEnabled = false;
        }

        let parentTempPassword = null;
        let parentHashedPassword = '*';
        if (role === 'student' && parentLoginEnabled) {
            parentTempPassword = generateTempPassword();
            parentHashedPassword = await hashPassword(parentTempPassword);
        }

        // Auto-generate sequential username if not manually specified
        let resolvedUsername = username;
        if (!resolvedUsername && (role === 'student' || role === 'parent' || role === 'faculty')) {
            const count = await User.count({ where: { role } });
            const seq = String(count + 1).padStart(2, '0');
            resolvedUsername = `${role}${seq}`;
        }

        const newUser = await User.create({
            name,
            email: email || `${name.split(' ')[0].toLowerCase()}@${getDomain()}`,
            password: hashedPassword, // Store ONLY bcrypt hash (or '*' if login disabled)
            role,
            phone,
            username: resolvedUsername,
            status: loginEnabled ? 'active' : 'inactive',
            must_change_password: loginEnabled
        });

        // Log manual user creation
        const AuditLog = require('../models/AuditLog');
        await AuditLog.create({
            user_id: newUser.id,
            action: 'CREATE_USER',
            table_name: 'users',
            record_id: newUser.id,
            details: `Created User ${newUser.username} with role ${newUser.role}`
        });

        const Student = require('../models/Student');
        const Parent = require('../models/Parent');
        const StudentParentMap = require('../models/StudentParentMap');

        if (role === 'student') {
            await Student.create({
                user_id: newUser.id,
                standard,
                dob: dob || null,
                blood_group
            });

            if (parent_id) {
                await StudentParentMap.create({
                    student_id: newUser.id,
                    parent_id: parent_id,
                    relation_type: 'guardian',
                    is_billing_contact: true,
                    is_emergency_contact: true
                });
            }
        }

        if (role === 'parent') {
            await Parent.create({
                user_id: newUser.id,
                address
            });

            if (parent_id) { // in legacy parameters, parent_id represents target student_id
                await StudentParentMap.create({
                    student_id: parent_id,
                    parent_id: newUser.id,
                    relation_type: 'guardian',
                    is_billing_contact: true,
                    is_emergency_contact: true
                });
            }
        }

        if (role === 'student') {
            const { batch_id, fee_plan, total_installments, token_amount } = req.body;
            if (batch_id) {
                const Batch = require('../models/Batch');
                const Course = require('../models/Course');
                const batch = await Batch.findByPk(batch_id);
                if (batch) {
                    const matchedCourse = await Course.findOne({
                        where: { class_range: batch.standard, board: batch.board },
                        order: [['fees', 'DESC']]
                    });
                    const courseId = matchedCourse ? matchedCourse.id : null;
                    const { getStandardFee } = require('../utils/feeHelper');
                    const totalFees = getStandardFee(batch.standard, matchedCourse);
                    const plan = fee_plan || 'One-time';
                    const installments = plan === 'EMI' ? (parseInt(total_installments) || 4) : 1;
                    const instAmount = (totalFees - parseFloat(token_amount || 0)) / installments;

                    const Enrollment = require('../models/Enrollment');
                    await Enrollment.create({
                        student_id: newUser.id,
                        batch_id: batch_id,
                        course_id: courseId,
                        batch_year: '2025-26',
                        fee_plan: plan,
                        total_installments: installments,
                        installment_amount: instAmount,
                        next_due_date: plan === 'EMI' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null
                    });

                    if (parseFloat(token_amount) > 0) {
                        const FeePayment = require('../models/FeePayment');
                        await FeePayment.create({
                            student_id: newUser.id,
                            amount_paid: token_amount,
                            payment_date: new Date().toISOString().split('T')[0],
                            payment_mode: 'Cash'
                        });
                    }
                }
            }

            // Also auto-create parent credentials & parent account
            let resolvedParentUsername = parent_username;

            if (!resolvedParentUsername) {
                const count = await User.count({ where: { role: 'parent' } });
                const seq = String(count + 1).padStart(2, '0');
                resolvedParentUsername = `parent${seq}`;
            }
            
            const newParent = await User.create({
                name: parent_name || `${name} Parent`,
                email: `parent_${newUser.id}@${getDomain()}`,
                password: parentHashedPassword, // Store ONLY bcrypt hash (or '*' if login disabled)
                role: 'parent',
                phone: parent_phone || phone,
                username: resolvedParentUsername,
                status: parentLoginEnabled ? 'active' : 'inactive',
                must_change_password: parentLoginEnabled
            });

            await AuditLog.create({
                user_id: newParent.id,
                action: 'CREATE_USER',
                table_name: 'users',
                record_id: newParent.id,
                details: `Created Parent user ${newParent.username} (${newParent.name}) for student ${newUser.username}`
            });

            await Parent.create({
                user_id: newParent.id,
                address: address || 'Restored from admission'
            });

            await StudentParentMap.create({
                student_id: newUser.id,
                parent_id: newParent.id,
                relation_type: 'guardian',
                is_billing_contact: true,
                is_emergency_contact: true
            });

            // Create corresponding approved Registration record
            const Registration = require('../models/Registration');
            await Registration.create({
                name,
                email: email || `${phone}@${getDomain()}`,
                phone: phone || '0000000000',
                class: standard || '9th',
                board: req.body.board || 'State Board',
                course_interest: req.body.course_interest || 'General Admission',
                password: hashedPassword,
                status: 'approved',
                token_amount: token_amount || 0
            });

            // Create corresponding Converted Enquiry record
            const Enquiry = require('../models/Enquiry');
            await Enquiry.create({
                name,
                email: email || `${phone}@${getDomain()}`,
                phone: phone || '0000000000',
                class_range: standard || '9th',
                board: req.body.board || 'State Board',
                exam_target: req.body.exam_target || 'None',
                message: 'Manually added via Student Directory',
                status: 'Converted',
                parent_name: parent_name || '',
                parent_phone: parent_phone || '',
                address: address || '',
                dob: dob || null,
                blood_group: blood_group || ''
            });
        }

        res.status(201).json({
            user: newUser,
            tempPassword: tempPassword,
            parentTempPassword: parentTempPassword
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/auth/users/:id
// @desc    Update user
router.put('/users/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        
        const oldEmail = user.email;
        const oldPhone = user.phone;

        const updateData = { ...req.body };
        if (updateData.dob === '') {
            updateData.dob = null;
        }
        await user.update(updateData);

        const Student = require('../models/Student');
        const Parent = require('../models/Parent');
        const StudentParentMap = require('../models/StudentParentMap');

        if (user.role === 'student') {
            let studentProfile = await Student.findOne({ where: { user_id: user.id } });
            if (studentProfile) {
                await studentProfile.update({
                    standard: req.body.standard,
                    dob: req.body.dob || null,
                    blood_group: req.body.blood_group
                });
            } else {
                await Student.create({
                    user_id: user.id,
                    standard: req.body.standard,
                    dob: req.body.dob || null,
                    blood_group: req.body.blood_group
                });
            }

            // 1. Sync corresponding Parent user account details
            if (updateData.parent_name || updateData.parent_phone) {
                const mapping = await StudentParentMap.findOne({ where: { student_id: user.id } });
                if (mapping) {
                    const parentUser = await User.findByPk(mapping.parent_id);
                    if (parentUser) {
                        const parentUpdate = {};
                        if (updateData.parent_name) parentUpdate.name = updateData.parent_name;
                        if (updateData.parent_phone) parentUpdate.phone = updateData.parent_phone;
                        await parentUser.update(parentUpdate);
                    }
                }
            }

            // 2. Sync corresponding Enquiry record
            const Enquiry = require('../models/Enquiry');
            const matchingEnquiry = await Enquiry.findOne({
                where: {
                    [Op.or]: [
                        { email: oldEmail },
                        { phone: oldPhone },
                        { email: user.email },
                        { phone: user.phone }
                    ]
                }
            });
            if (matchingEnquiry) {
                await matchingEnquiry.update({
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    class_range: req.body.standard,
                    parent_name: req.body.parent_name,
                    parent_phone: req.body.parent_phone,
                    address: req.body.address,
                    dob: req.body.dob,
                    blood_group: req.body.blood_group
                });
            }

            // 3. Sync corresponding Registration record
            const Registration = require('../models/Registration');
            const matchingRegistration = await Registration.findOne({
                where: {
                    [Op.or]: [
                        { email: oldEmail },
                        { phone: oldPhone },
                        { email: user.email },
                        { phone: user.phone }
                    ]
                }
            });
            if (matchingRegistration) {
                await matchingRegistration.update({
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    class: req.body.standard
                });
            }

            if (req.body.batch_id) {
                const { batch_id, fee_plan, total_installments, token_amount } = req.body;
                const Batch = require('../models/Batch');
                const Course = require('../models/Course');
                const batch = await Batch.findByPk(batch_id);
                if (batch) {
                    const matchedCourse = await Course.findOne({
                        where: { class_range: batch.standard, board: batch.board },
                        order: [['fees', 'DESC']]
                    });
                    const courseId = matchedCourse ? matchedCourse.id : null;
                    const { getStandardFee } = require('../utils/feeHelper');
                    const totalFees = getStandardFee(batch.standard, matchedCourse);
                    const plan = fee_plan || 'One-time';
                    const installments = plan === 'EMI' ? (parseInt(total_installments) || 4) : 1;

                    let enrollment = await Enrollment.findOne({ where: { student_id: user.id } });
                    
                    let instAmount;
                    if (enrollment && 
                        String(enrollment.batch_id) === String(batch_id) && 
                        enrollment.fee_plan === plan && 
                        parseInt(enrollment.total_installments) === parseInt(installments) && 
                        !parseFloat(token_amount)) {
                        // No fee/plan details changed, retain existing installment amount
                        instAmount = enrollment.installment_amount;
                    } else {
                        // Recalculate
                        const FeePayment = require('../models/FeePayment');
                        const existingPaid = await FeePayment.sum('amount_paid', { where: { student_id: user.id } }) || 0;
                        const totalDeduction = parseFloat(existingPaid) + parseFloat(token_amount || 0);
                        instAmount = (totalFees - totalDeduction) / installments;
                    }

                    if (enrollment) {
                        await enrollment.update({
                            batch_id: batch_id,
                            course_id: courseId,
                            fee_plan: plan,
                            total_installments: installments,
                            installment_amount: instAmount
                        });
                    } else {
                        await Enrollment.create({
                            student_id: user.id,
                            batch_id: batch_id,
                            course_id: courseId,
                            batch_year: '2025-26',
                            fee_plan: plan,
                            total_installments: installments,
                            installment_amount: instAmount,
                            next_due_date: plan === 'EMI' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null
                        });
                    }
                }
            }
        }

        if (user.role === 'parent') {
            let parentProfile = await Parent.findOne({ where: { user_id: user.id } });
            if (parentProfile) {
                await parentProfile.update({
                    address: req.body.address,
                    alt_phone: req.body.alt_phone
                });
            } else {
                await Parent.create({
                    user_id: user.id,
                    address: req.body.address,
                    alt_phone: req.body.alt_phone
                });
            }
        }

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/auth/users/:id/reset-password
// @desc    Admin resets user password, generating a new temporary password and forcing change on next login
router.post('/users/:id/reset-password', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User profile not found' });
        }

        const { generateTempPassword, hashPassword } = require('../utils/passwordHelper');
        const tempPassword = generateTempPassword();
        const hashedPassword = await hashPassword(tempPassword);

        user.password = hashedPassword;
        user.must_change_password = true; // Force password change on login!
        await user.save();

        // Audit reset action
        const AuditLog = require('../models/AuditLog');
        await AuditLog.create({
            user_id: user.id,
            action: 'RESET_PASSWORD_ADMIN',
            table_name: 'users',
            record_id: user.id,
            details: `Admin reset password for user ${user.username || user.email}`
        });

        res.json({
            msg: 'Password reset successfully',
            username: user.username,
            tempPassword: tempPassword
        });
    } catch (err) {
        console.error('Admin Password Reset Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   DELETE /api/auth/users/:id
// @desc    Delete user
router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (user.role === 'student') {
            const Enrollment = require('../models/Enrollment');
            const FeePayment = require('../models/FeePayment');
            const Attendance = require('../models/Attendance');
            const Result = require('../models/Result');
            const IssuedBook = require('../models/IssuedBook');
            const TransportAssignment = require('../models/TransportAssignment');
            const Certificate = require('../models/Certificate');
            const Registration = require('../models/Registration');
            const Enquiry = require('../models/Enquiry');

            // 1. Delete Parent User(s) and Student Profiles
            const StudentParentMap = require('../models/StudentParentMap');
            const Parent = require('../models/Parent');
            const Student = require('../models/Student');
            const mappings = await StudentParentMap.findAll({ where: { student_id: user.id } });
            const parentIds = mappings.map(m => m.parent_id);
            if (parentIds.length > 0) {
                await User.destroy({ where: { id: parentIds, role: 'parent' } });
                await Parent.destroy({ where: { user_id: parentIds } });
            }
            await StudentParentMap.destroy({ where: { student_id: user.id } });
            await Student.destroy({ where: { user_id: user.id } });

            // 2. Delete Enrollment
            await Enrollment.destroy({ where: { student_id: user.id } });

            // 3. Delete Fee Payments
            await FeePayment.destroy({ where: { student_id: user.id } });

            // 4. Delete Attendance Records
            await Attendance.destroy({ where: { student_id: user.id } });

            // 5. Delete Results
            await Result.destroy({ where: { student_id: user.id } });

            // 6. Delete Library Issued Books
            await IssuedBook.destroy({ where: { student_id: user.id } });

            // 7. Delete Transport Assignments
            await TransportAssignment.destroy({ where: { student_id: user.id } });

            // 8. Delete Certificates
            await Certificate.destroy({ where: { student_id: user.id } });

            // 9. Delete corresponding Registrations and Enquiries (matched by email/phone/name)
            const searchOr = [];
            if (user.email) searchOr.push({ email: user.email });
            if (user.phone) searchOr.push({ phone: user.phone });
            if (user.name) searchOr.push({ name: user.name });

            if (searchOr.length > 0) {
                await Registration.destroy({ where: { [Op.or]: searchOr } });
                await Enquiry.destroy({ where: { [Op.or]: searchOr } });
            }
        }

        await user.destroy();
        res.json({ msg: 'Deleted user and all associated records' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/auth/users/:id/status
// @desc    Update user status and role (Admin only)
router.put('/users/:id/status', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        
        const { status, role } = req.body;
        if (status) user.status = status;
        if (role) user.role = role;
        
        await user.save();

        // Sync parent-student status to keep both active or suspended in lockstep
        await user.save();

        // Sync parent-student status to keep both active or suspended in lockstep
        if (status) {
            const StudentParentMap = require('../models/StudentParentMap');
            if (user.role === 'student') {
                const mappings = await StudentParentMap.findAll({ where: { student_id: user.id } });
                const parentIds = mappings.map(m => m.parent_id);
                if (parentIds.length > 0) {
                    await User.update({ status }, { where: { id: parentIds, role: 'parent' } });
                }
            } else if (user.role === 'parent') {
                const mappings = await StudentParentMap.findAll({ where: { parent_id: user.id } });
                const studentIds = mappings.map(m => m.student_id);
                if (studentIds.length > 0) {
                    await User.update({ status }, { where: { id: studentIds, role: 'student' } });
                }
            }
        }
        
        res.json({ msg: 'User updated successfully', user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// --- Audit Log Helper ---
const createLoginAudit = async (userId, method) => {
    try {
        const AuditLog = require('../models/AuditLog');
        await AuditLog.create({
            user_id: userId,
            action: 'LOGIN_SUCCESS',
            table_name: 'users',
            record_id: userId,
            details: `Successfully logged in via ${method}`
        });
    } catch (err) {
        console.error('Audit Log Error:', err);
    }
};

// --- Mobile OTP Authentication ---
const { sendSMS } = require('../utils/sms');

// @route   POST /api/auth/otp/send
// @desc    Generate and send OTP to phone
router.post('/otp/send', async (req, res) => {
    const { phone, role } = req.body;
    if (!phone) return res.status(400).json({ msg: 'Phone number is required' });

    try {
        const queryWhere = { phone };
        if (role) {
            queryWhere.role = role;
        }
        const user = await User.findOne({ where: queryWhere });
        if (!user) {
            return res.status(404).json({ msg: 'Phone number not registered' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp_code = otp;
        user.otp_expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity
        await user.save();

        await sendSMS(phone, `Your Ambition Tutorials verification code is: ${otp}. Valid for 5 minutes.`);
        res.json({ msg: `OTP sent successfully. (Developer Debug: Code is ${otp})`, otp });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/auth/otp/verify
// @desc    Verify OTP code and authenticate
router.post('/otp/verify', async (req, res) => {
    const { phone, role, otp_code } = req.body;
    if (!phone || !otp_code) return res.status(400).json({ msg: 'Phone number and verification code are required' });

    try {
        const queryWhere = { phone };
        if (role) {
            queryWhere.role = role;
        }
        const user = await User.findOne({ where: queryWhere });
        if (!user || user.otp_code !== otp_code || new Date() > new Date(user.otp_expiry)) {
            return res.status(400).json({ msg: 'Invalid or expired verification code' });
        }

        if (user.status !== 'active') {
            if (user.status === 'pending') {
                return res.status(403).json({ msg: 'Account Pending Approval: Please contact the administrator to activate your portal access.' });
            }
            if (user.status === 'inactive') {
                return res.status(403).json({ msg: 'Account Inactive: Your login access is currently disabled.' });
            }
            if (user.status === 'blocked') {
                return res.status(403).json({ msg: 'Account Blocked: Access is locked due to security/administrative policy.' });
            }
            if (user.status === 'suspended') {
                return res.status(403).json({ msg: 'Account Suspended: Access to this portal has been revoked.' });
            }
            if (user.status === 'archived') {
                return res.status(403).json({ msg: 'Account Archived: This account is no longer active.' });
            }
            if (user.status === 'deleted') {
                return res.status(403).json({ msg: 'Account Deleted: This account does not exist anymore.' });
            }
            return res.status(403).json({ msg: `Access Denied: Your account status is currently: ${user.status || 'N/A'}` });
        }

        // Check if role portal is active
        const tenantStorage = require('../config/tenantContext');
        const context = tenantStorage.getStore();
        const tenantId = context ? context.tenantId : 1;
        const portalError = await checkPortalAccess(user, tenantId);
        if (portalError) {
            return res.status(403).json({ msg: portalError });
        }

        user.otp_code = null;
        user.otp_expiry = null;
        user.last_login_at = new Date();
        user.last_login_ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        user.last_login_agent = req.headers['user-agent'];
        await user.save();

        await createLoginAudit(user.id, 'Mobile OTP');

        let childId = null;
        let children = [];
        if (user.role === 'parent') {
            const StudentParentMap = require('../models/StudentParentMap');
            const Student = require('../models/Student');
            const mappings = await StudentParentMap.findAll({
                where: { parent_id: user.id }
            });
            const studentIds = mappings.map(m => m.student_id);
            if (studentIds.length > 0) {
                const childrenUsers = await User.findAll({
                    where: { id: studentIds },
                    attributes: ['id', 'name', 'username'],
                    include: [{ model: Student, attributes: ['standard'] }]
                });
                children = childrenUsers.map(c => ({ 
                    id: c.id, 
                    name: c.name, 
                    username: c.username, 
                    standard: c.Student ? c.Student.standard : 'N/A' 
                }));
                childId = children.length > 0 ? children[0].id : null;
            }
        }

        const institute = await Institute.findByPk(user.tenant_id, { bypassTenant: true });
        const tenantSubdomain = institute ? institute.subdomain : null;

        res.json({ 
            role: user.role, 
            name: user.name, 
            userId: user.id, 
            childId,
            children,
            username: user.username,
            password: user.password,
            tenantSubdomain,
            mustChangePassword: user.must_change_password
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// --- Google OAuth Mapping ---
// @route   POST /api/auth/google-login
// @desc    Validate Google account and authenticate
router.post('/google-login', async (req, res) => {
    const { email, google_id, role, name } = req.body;
    if (!email) return res.status(400).json({ msg: 'Email is required' });

    try {
        let user = await User.findOne({ where: { email } });
        if (!user) {
            // Check if first-time user creation is allowed by the institution settings
            const tenantStorage = require('../config/tenantContext');
            const context = tenantStorage.getStore();
            const tenantId = context ? context.tenantId : 1;

            const Setting = require('../models/Setting');
            const { getSettings } = require('../config/settingsCache');
            const dbSettings = await Setting.findAll({ where: { tenant_id: tenantId } });
            const settingsMap = {};
            dbSettings.forEach(row => {
                try {
                    settingsMap[row.key] = JSON.parse(row.value);
                } catch (e) {
                    settingsMap[row.key] = row.value;
                }
            });
            const currentSettings = { ...getSettings(), ...settingsMap };

            if (currentSettings.allow_self_onboarding === false) {
                return res.status(403).json({ msg: 'Self-onboarding is disabled by this institution. Please contact your administrator to register.' });
            }

            // Auto-create user for first-time Google sign-in
            const targetRole = role || 'student';
            const tempUsername = `${targetRole}_google_${Math.random().toString(36).substring(7)}`;
            user = await User.create({
                name: name || email.split('@')[0],
                email,
                role: targetRole,
                status: 'active',
                google_id,
                username: tempUsername,
                password: `google_oauth_${Date.now()}`, // Simulated password since using OAuth
                branch_id: 1 // Default local branch
            });

            // Create corresponding profile type record if needed
            if (targetRole === 'student') {
                const Student = require('../models/Student');
                await Student.create({
                    user_id: user.id,
                    standard: '9th', // Default standard
                    blood_group: 'Not Specified'
                });
            }
        } else {
            // Link existing account using email if not linked
            if (!user.google_id) {
                user.google_id = google_id;
                await user.save();
            }
        }

        if (user.status !== 'active') {
            if (user.status === 'pending') {
                return res.status(403).json({ msg: 'Account Pending Approval: Please contact the administrator to activate your portal access.' });
            }
            if (user.status === 'inactive') {
                return res.status(403).json({ msg: 'Account Inactive: Your login access is currently disabled.' });
            }
            if (user.status === 'blocked') {
                return res.status(403).json({ msg: 'Account Blocked: Access is locked due to security/administrative policy.' });
            }
            if (user.status === 'suspended') {
                return res.status(403).json({ msg: 'Account Suspended: Access to this portal has been revoked.' });
            }
            if (user.status === 'archived') {
                return res.status(403).json({ msg: 'Account Archived: This account is no longer active.' });
            }
            if (user.status === 'deleted') {
                return res.status(403).json({ msg: 'Account Deleted: This account does not exist anymore.' });
            }
            return res.status(403).json({ msg: `Access Denied: Your account status is currently: ${user.status || 'N/A'}` });
        }

        // Check if role portal is active
        const tenantStorage = require('../config/tenantContext');
        const context = tenantStorage.getStore();
        const tenantId = context ? context.tenantId : 1;
        const portalError = await checkPortalAccess(user, tenantId);
        if (portalError) {
            return res.status(403).json({ msg: portalError });
        }

        // Auto-link Google ID if not set
        if (!user.google_id && google_id) {
            user.google_id = google_id;
        }

        // Update login stats
        user.last_login_at = new Date();
        user.last_login_ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        user.last_login_agent = req.headers['user-agent'];
        await user.save();

        await createLoginAudit(user.id, 'Google Sign-In');

        let childId = null;
        let children = [];
        if (user.role === 'parent') {
            const StudentParentMap = require('../models/StudentParentMap');
            const Student = require('../models/Student');
            const mappings = await StudentParentMap.findAll({
                where: { parent_id: user.id }
            });
            const studentIds = mappings.map(m => m.student_id);
            if (studentIds.length > 0) {
                const childrenUsers = await User.findAll({
                    where: { id: studentIds },
                    attributes: ['id', 'name', 'username'],
                    include: [{ model: Student, attributes: ['standard'] }]
                });
                children = childrenUsers.map(c => ({ 
                    id: c.id, 
                    name: c.name, 
                    username: c.username, 
                    standard: c.Student ? c.Student.standard : 'N/A' 
                }));
                childId = children.length > 0 ? children[0].id : null;
            }
        }

        const institute = await Institute.findByPk(user.tenant_id, { bypassTenant: true });
        const tenantSubdomain = institute ? institute.subdomain : null;

        res.json({ 
            role: user.role, 
            name: user.name, 
            userId: user.id, 
            childId,
            children,
            username: user.username,
            password: user.password,
            tenantSubdomain,
            mustChangePassword: user.must_change_password
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// --- Forgot Password Recovery ---
// @route   POST /api/auth/forgot-password
// @desc    Generate recovery token and send code
router.post('/forgot-password', async (req, res) => {
    const { identity } = req.body; // Can be email, username, or phone
    if (!identity) return res.status(400).json({ msg: 'Email, username, or phone is required' });

    try {
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { email: identity },
                    { username: identity },
                    { phone: identity }
                ]
            }
        });

        if (!user) {
            return res.status(404).json({ msg: 'No registered user matches the provided info' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp_code = otp;
        user.otp_expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes validity
        await user.save();

        console.log(`\n==================================`);
        console.log(`PASSWORD RECOVERY REQUEST`);
        console.log(`User: ${user.name} (${user.username})`);
        console.log(`Recovery Code: ${otp}`);
        console.log(`Current Password: ${user.password}`);
        console.log(`==================================\n`);

        if (user.phone) {
            await sendSMS(user.phone, `Your Ambition Tutorials password recovery code is: ${otp}. Valid for 10 minutes.`);
        }

        res.json({ msg: `Recovery code dispatched. (Developer Debug: Code is ${otp})`, otp });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password using validation code
router.post('/reset-password', async (req, res) => {
    const { identity, otp_code, new_password } = req.body;
    if (!identity || !otp_code || !new_password) {
        return res.status(400).json({ msg: 'Identity, verification code, and new password are required' });
    }

    try {
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { email: identity },
                    { username: identity },
                    { phone: identity }
                ]
            }
        });

        if (!user || user.otp_code !== otp_code || new Date() > new Date(user.otp_expiry)) {
            return res.status(400).json({ msg: 'Invalid or expired verification code' });
        }

        user.password = new_password;
        user.otp_code = null;
        user.otp_expiry = null;
        await user.save();

        // Create log entry
        const AuditLog = require('../models/AuditLog');
        await AuditLog.create({
            user_id: user.id,
            action: 'PASSWORD_RESET',
            table_name: 'users',
            record_id: user.id,
            details: 'Password was successfully reset'
        });

        res.json({ msg: 'Password reset successful! You can now log in with your new password.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// --- Biometric Authentication WebAuthn Mock/Simulator ---
// @route   POST /api/auth/biometric/register-challenge
router.post('/biometric/register-challenge', async (req, res) => {
    const { userId } = req.body;
    try {
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const challenge = Math.random().toString(36).substring(2);
        res.json({
            challenge,
            rp: { name: 'Ambition Tutorials ERP' },
            user: { id: user.id, name: user.username, displayName: user.name },
            pubKeyCredParams: [{ type: 'public-key', alg: -7 }]
        });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/auth/biometric/register-verify
router.post('/biometric/register-verify', async (req, res) => {
    const { userId, credentialId, publicKey } = req.body;
    try {
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // Update directly on User record (stored in 'users' table)
        await user.update({
            biometric_credential_id: credentialId,
            biometric_public_key: publicKey
        });

        // Sync to Student profile if exists
        const Student = require('../models/Student');
        let studentProfile = await Student.findOne({ where: { user_id: user.id } });
        if (studentProfile) {
            await studentProfile.update({
                biometric_credential_id: credentialId,
                biometric_public_key: publicKey
            });
        }

        res.json({ msg: 'Biometric device registered successfully!' });
    } catch (err) {
        console.error('Biometric Register Verify Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/auth/biometric/login-challenge
router.post('/biometric/login-challenge', async (req, res) => {
    const { username, role } = req.body;
    try {
        const challenge = Math.random().toString(36).substring(2);
        
        if (username) {
            const userWhere = { username };
            if (role) userWhere.role = role;
            const user = await User.findOne({ where: userWhere });
            if (!user) return res.status(404).json({ msg: 'User profile not found' });

            let credentialId = user.biometric_credential_id;

            // Fallback to Student table
            if (!credentialId) {
                const Student = require('../models/Student');
                const studentProfile = await Student.findOne({ where: { user_id: user.id } });
                if (studentProfile) {
                    credentialId = studentProfile.biometric_credential_id;
                }
            }

            if (!credentialId) {
                return res.status(400).json({ msg: 'Biometric authentication not set up for this account' });
            }

            return res.json({
                challenge,
                credentialId: credentialId
            });
        }

        // Usernameless login challenge
        res.json({ challenge });
    } catch (err) {
        console.error('Biometric Login Challenge Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/auth/biometric/login-verify
router.post('/biometric/login-verify', async (req, res) => {
    const { username, role, credentialId } = req.body;
    try {
        let user;
        if (username) {
            const userWhere = { username };
            if (role) userWhere.role = role;
            user = await User.findOne({ where: userWhere });
        } else {
            // Find by credential ID on User table
            user = await User.findOne({ where: { biometric_credential_id: credentialId } });
            if (!user) {
                // Fallback: search by credential ID in Student table
                const Student = require('../models/Student');
                const studentProfile = await Student.findOne({ where: { biometric_credential_id: credentialId } });
                if (studentProfile) {
                    user = await User.findByPk(studentProfile.user_id);
                }
            }
        }

        if (!user) return res.status(404).json({ msg: 'User profile not found or biometric key not registered' });

        let isValid = user.biometric_credential_id === credentialId;

        // Fallback validation against Student profile
        if (!isValid) {
            const Student = require('../models/Student');
            const studentProfile = await Student.findOne({ where: { user_id: user.id } });
            if (studentProfile && studentProfile.biometric_credential_id === credentialId) {
                isValid = true;
            }
        }

        if (!isValid) {
            return res.status(400).json({ msg: 'Biometric validation failed' });
        }

        if (user.status !== 'active') {
            if (user.status === 'pending') {
                return res.status(403).json({ msg: 'Account Pending Approval: Please contact the administrator to activate your portal access.' });
            }
            if (user.status === 'inactive') {
                return res.status(403).json({ msg: 'Account Inactive: Your login access is currently disabled.' });
            }
            if (user.status === 'blocked') {
                return res.status(403).json({ msg: 'Account Blocked: Access is locked due to security/administrative policy.' });
            }
            if (user.status === 'suspended') {
                return res.status(403).json({ msg: 'Account Suspended: Access to this portal has been revoked.' });
            }
            if (user.status === 'archived') {
                return res.status(403).json({ msg: 'Account Archived: This account is no longer active.' });
            }
            if (user.status === 'deleted') {
                return res.status(403).json({ msg: 'Account Deleted: This account does not exist anymore.' });
            }
            return res.status(403).json({ msg: `Access Denied: Your account status is currently: ${user.status || 'N/A'}` });
        }

        // Check if role portal is active
        const tenantStorage = require('../config/tenantContext');
        const context = tenantStorage.getStore();
        const tenantId = context ? context.tenantId : 1;
        const portalError = await checkPortalAccess(user, tenantId);
        if (portalError) {
            return res.status(403).json({ msg: portalError });
        }

        // Update login stats
        user.last_login_at = new Date();
        user.last_login_ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        user.last_login_agent = req.headers['user-agent'];
        await user.save();

        await createLoginAudit(user.id, 'Biometric Sign-In');

        let childId = null;
        let children = [];
        if (user.role === 'parent') {
            const StudentParentMap = require('../models/StudentParentMap');
            const mappings = await StudentParentMap.findAll({
                where: { parent_id: user.id }
            });
            const studentIds = mappings.map(m => m.student_id);
            if (studentIds.length > 0) {
                const childrenUsers = await User.findAll({
                    where: { id: studentIds },
                    attributes: ['id', 'name', 'username'],
                    include: [{ model: Student, attributes: ['standard'] }]
                });
                children = childrenUsers.map(c => ({ 
                    id: c.id, 
                    name: c.name, 
                    username: c.username, 
                    standard: c.Student ? c.Student.standard : 'N/A' 
                }));
                childId = children.length > 0 ? children[0].id : null;
            }
        }

        res.json({ 
            role: user.role, 
            name: user.name, 
            userId: user.id, 
            childId,
            children,
            username: user.username,
            password: user.password,
            mustChangePassword: user.must_change_password
        });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/auth/first-login-change-password
// @desc    Force change temporary password on first login
router.post('/first-login-change-password', async (req, res) => {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword) {
        return res.status(400).json({ msg: 'User ID and new password are required' });
    }

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (!user.must_change_password) {
            return res.status(400).json({ msg: 'Password change is not forced for this account.' });
        }

        // Validate password strength policy
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ msg: 'Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a digit, and a special character.' });
        }

        const { hashPassword } = require('../utils/passwordHelper');
        const hashedPassword = await hashPassword(newPassword);

        user.password = hashedPassword;
        user.must_change_password = false;
        await user.save();

        res.json({ msg: 'Password updated successfully! You can now access your dashboard.' });
    } catch (err) {
        console.error('First Login Password Change Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
