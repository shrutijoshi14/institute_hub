const Institute = require('../models/Institute');
const Subscription = require('../models/Subscription');
const User = require('../models/User');

const checkSubscriptionLimits = async (req, res, next) => {
    try {
        const tenantId = req.tenantId || 1;
        const institute = await Institute.findByPk(tenantId, {
            include: [{ model: Subscription }],
            bypassTenant: true
        });

        if (!institute) {
            return res.status(404).json({ msg: 'Institute not found.' });
        }

        // 1. Suspension & Expiry Checks
        if (institute.status === 'suspended') {
            return res.status(403).json({ msg: 'SaaS Account Suspended: Access has been temporarily restricted. Please contact billing support.' });
        }

        if (institute.subscription_end_date) {
            const today = new Date();
            const expiry = new Date(institute.subscription_end_date);
            if (today > expiry) {
                return res.status(403).json({ msg: 'Subscription Expired: Your plan validity has expired. Please upgrade or renew your subscription.' });
            }
        }

        const subscription = institute.Subscription;
        if (!subscription) {
            return next(); // Default tier failsafe
        }

        const targetRole = req.body.role || (req.baseUrl.includes('faculty') ? 'faculty' : null);

        // 2. Student Limit Enforcement
        if (targetRole === 'student' || (req.body.status === 'approved' && req.baseUrl.includes('registration'))) {
            if (subscription.max_students !== -1) {
                const activeStudents = await User.count({
                    where: { role: 'student', tenant_id: tenantId, status: 'active' },
                    bypassTenant: true
                });

                if (activeStudents >= subscription.max_students) {
                    return res.status(403).json({
                        msg: `Upgrade Plan Required: Active students limit reached (${subscription.max_students} allowed). Please contact support to upgrade.`
                    });
                }
            }
        }

        // 3. Parent Limit Enforcement
        if (targetRole === 'parent') {
            if (subscription.max_parents !== -1 && subscription.max_parents !== undefined) {
                const activeParents = await User.count({
                    where: { role: 'parent', tenant_id: tenantId, status: 'active' },
                    bypassTenant: true
                });

                if (activeParents >= subscription.max_parents) {
                    return res.status(403).json({
                        msg: `Upgrade Plan Required: Active parents limit reached (${subscription.max_parents} allowed). Please contact support to upgrade.`
                    });
                }
            }
        }

        // 4. Faculty Limit Enforcement
        if (targetRole === 'faculty') {
            if (subscription.max_faculty !== -1 && subscription.max_faculty !== undefined) {
                const activeFaculty = await User.count({
                    where: { role: 'faculty', tenant_id: tenantId, status: 'active' },
                    bypassTenant: true
                });

                if (activeFaculty >= subscription.max_faculty) {
                    return res.status(403).json({
                        msg: `Upgrade Plan Required: Active faculty limit reached (${subscription.max_faculty} allowed). Please contact support to upgrade.`
                    });
                }
            }
        }

        // 5. User / Staff Limit Enforcement
        if (targetRole && ['admin', 'faculty', 'accountant', 'receptionist', 'librarian', 'transport-manager'].includes(targetRole)) {
            if (subscription.max_users !== -1) {
                const activeStaff = await User.count({
                    where: {
                        role: ['admin', 'faculty', 'accountant', 'receptionist', 'librarian', 'transport-manager'],
                        tenant_id: tenantId,
                        status: 'active'
                    },
                    bypassTenant: true
                });

                if (activeStaff >= subscription.max_users) {
                    return res.status(403).json({
                        msg: `Upgrade Plan Required: Staff count limit reached (${subscription.max_users} allowed). Please contact support to upgrade.`
                    });
                }
            }
        }

        // 6. Storage Limit Enforcement
        if (req.file || req.files || (req.path && req.path.includes('submissions'))) {
            if (subscription.max_storage_gb !== -1 && subscription.max_storage_gb !== undefined) {
                const fs = require('fs');
                const path = require('path');
                const Submission = require('../models/Submission');
                
                const submissions = await Submission.findAll({
                    where: { tenant_id: tenantId },
                    bypassTenant: true
                });
                
                let totalBytes = 0;
                submissions.forEach(sub => {
                    if (sub.file_path) {
                        try {
                            const fullPath = path.join(__dirname, '..', sub.file_path);
                            if (fs.existsSync(fullPath)) {
                                totalBytes += fs.statSync(fullPath).size;
                            }
                        } catch (e) {}
                    }
                });

                const totalGB = totalBytes / (1024 * 1024 * 1024);
                if (totalGB >= subscription.max_storage_gb) {
                    return res.status(403).json({
                        msg: `Upload Denied: Your tenant storage limit of ${subscription.max_storage_gb} GB has been exceeded. Please upgrade your plan.`
                    });
                }
            }
        }

        next();
    } catch (err) {
        console.error('Subscription enforcement error:', err);
        next(); // Failsafe: keep backend working if validator encounters an issue
    }
};

module.exports = { checkSubscriptionLimits };
