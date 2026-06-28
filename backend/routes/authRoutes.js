const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { getDomain } = require('../config/domainHelper');

const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const { Op } = require('sequelize');

// @route   POST /api/auth/login
// @desc    Authenticate user & get token (supports email OR username)
router.post('/login', async (req, res) => {
    const { email, password, role } = req.body;
    console.log(`🔐 Login Attempt: User[${email}], Role[${role}]`);

    try {
        // Find user by email OR username (either works)
        const user = await User.findOne({
            where: {
                role,
                [Op.or]: [
                    { email: email },
                    { username: email },
                    { phone: email }
                ]
            }
        });

        if (!user) {
            console.log(`❌ Login Failed: User not found [${email}] with role [${role}]`);
            return res.status(400).json({ msg: 'Invalid Credentials or Role' });
        }

        if (password !== user.password) {
            console.log(`❌ Login Failed: Password mismatch for user [${email}]`);
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        if (user.status === 'pending') {
            return res.status(403).json({ msg: 'Account Pending Approval: Please contact the administrator to activate your portal access.' });
        }

        if (user.status === 'suspended') {
            return res.status(403).json({ msg: 'Account Suspended: Access to this portal has been revoked.' });
        }

        console.log(`✅ Login Success: User [${user.name}] authenticated`);

        let childId = null;
        if (user.role === 'parent') {
            childId = user.parent_id;
        }

        res.json({ 
            role: user.role, 
            name: user.name, 
            userId: user.id, 
            childId,
            username: user.username
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
            const parent = await User.findByPk(callerId);
            if (!parent || String(parent.parent_id) !== String(studentId)) {
                return res.status(403).json({ msg: 'Access Denied: Cannot view other student\'s profile' });
            }
        }

        const Batch = require('../models/Batch');
        const FeePayment = require('../models/FeePayment');
        const user = await User.findByPk(req.params.id, {
            attributes: ['id', 'name', 'phone', 'email', 'role', 'username', 'standard', 'parent_name', 'parent_phone', 'address', 'dob', 'blood_group', 'status'],
            include: [
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
        res.json(user);
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

// @route   GET /api/auth/users
// @desc    Get all users, optionally filter by role (e.g. ?role=student)
router.get('/users', async (req, res) => {
    try {
        let query = req.query.role ? { role: req.query.role } : {};

        const users = await User.findAll({ 
            where: query,
            include: req.query.role === 'student' ? [
                {
                    model: Enrollment,
                    include: [Course]
                }
            ] : []
        });
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/auth/users
// @desc    Admin create new user explicitly
router.post('/users', async (req, res) => {
    try {
                const { name, email, username, password, role, phone, parent_id, standard, parent_name, parent_phone, address, dob, blood_group, parent_username, parent_password } = req.body;
        if (!name || !role) return res.status(400).json({ msg: 'Name and role are required' });

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
            password: password || 'defaultpass123',
            role,
            phone,
            parent_id,
            username: resolvedUsername,
            standard,
            parent_name,
            parent_phone,
            address,
            dob: dob || null,
            blood_group,
            status: 'active'
        });

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
            let resolvedParentPassword = parent_password;

            if (!resolvedParentUsername) {
                const count = await User.count({ where: { role: 'parent' } });
                const seq = String(count + 1).padStart(2, '0');
                resolvedParentUsername = `parent${seq}`;
            }

            if (!resolvedParentPassword) {
                const count = await User.count({ where: { role: 'parent' } });
                const seq = String(count + 1).padStart(2, '0');
                resolvedParentPassword = `Parent@${seq}`;
            }
            
            await User.create({
                name: parent_name || `${name} Parent`,
                email: `parent_${newUser.id}@${getDomain()}`,
                password: resolvedParentPassword,
                role: 'parent',
                phone: parent_phone || phone,
                parent_id: newUser.id,
                username: resolvedParentUsername,
                status: 'active'
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
                password: password || 'defaultpass123',
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

        res.status(201).json(newUser);
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

        if (user.role === 'student') {
            // 1. Sync corresponding Parent user account details
            if (updateData.parent_name || updateData.parent_phone) {
                const parentUser = await User.findOne({ where: { parent_id: user.id, role: 'parent' } });
                if (parentUser) {
                    const parentUpdate = {};
                    if (updateData.parent_name) parentUpdate.name = updateData.parent_name;
                    if (updateData.parent_phone) parentUpdate.phone = updateData.parent_phone;
                    await parentUser.update(parentUpdate);
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
                    class_range: user.standard,
                    parent_name: user.parent_name,
                    parent_phone: user.parent_phone,
                    address: user.address,
                    dob: user.dob,
                    blood_group: user.blood_group
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
                    class: user.standard
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

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
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

            // 1. Delete Parent User(s)
            await User.destroy({ where: { parent_id: user.id, role: 'parent' } });

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
            if (user.role === 'student') {
                await User.update({ status }, { where: { parent_id: user.id, role: 'parent' } });
            } else if (user.role === 'parent') {
                await User.update({ status }, { where: { id: user.parent_id, role: 'student' } });
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
    if (!phone || !role) return res.status(400).json({ msg: 'Phone and role are required' });

    try {
        const user = await User.findOne({ where: { phone, role } });
        if (!user) {
            return res.status(404).json({ msg: 'Phone number not registered under this role' });
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
    if (!phone || !role || !otp_code) return res.status(400).json({ msg: 'Phone, role, and verification code are required' });

    try {
        const user = await User.findOne({ where: { phone, role } });
        if (!user || user.otp_code !== otp_code || new Date() > new Date(user.otp_expiry)) {
            return res.status(400).json({ msg: 'Invalid or expired verification code' });
        }

        user.otp_code = null;
        user.otp_expiry = null;
        await user.save();

        await createLoginAudit(user.id, 'Mobile OTP');

        let childId = null;
        if (user.role === 'parent') {
            childId = user.parent_id;
        }

        res.json({ 
            role: user.role, 
            name: user.name, 
            userId: user.id, 
            childId,
            username: user.username,
            password: user.password // Provide password visibility as requested
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
    const { email, google_id, role } = req.body;
    if (!email || !role) return res.status(400).json({ msg: 'Email and role are required' });

    try {
        const user = await User.findOne({ where: { email, role } });
        if (!user) {
            return res.status(404).json({ msg: 'No registered account matches this Google profile for the selected role' });
        }

        // Auto-link Google ID if not set
        if (!user.google_id && google_id) {
            user.google_id = google_id;
            await user.save();
        }

        await createLoginAudit(user.id, 'Google Sign-In');

        let childId = null;
        if (user.role === 'parent') {
            childId = user.parent_id;
        }

        res.json({ 
            role: user.role, 
            name: user.name, 
            userId: user.id, 
            childId,
            username: user.username,
            password: user.password
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

        user.biometric_credential_id = credentialId;
        user.biometric_public_key = publicKey;
        await user.save();

        res.json({ msg: 'Biometric device registered successfully!' });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/auth/biometric/login-challenge
router.post('/biometric/login-challenge', async (req, res) => {
    const { username, role } = req.body;
    try {
        const user = await User.findOne({ where: { username, role } });
        if (!user) return res.status(404).json({ msg: 'User profile not found' });
        if (!user.biometric_credential_id) {
            return res.status(400).json({ msg: 'Biometric authentication not set up for this account' });
        }

        const challenge = Math.random().toString(36).substring(2);
        res.json({
            challenge,
            credentialId: user.biometric_credential_id
        });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/auth/biometric/login-verify
router.post('/biometric/login-verify', async (req, res) => {
    const { username, role, credentialId } = req.body;
    try {
        const user = await User.findOne({ where: { username, role } });
        if (!user || user.biometric_credential_id !== credentialId) {
            return res.status(400).json({ msg: 'Biometric validation failed' });
        }

        await createLoginAudit(user.id, 'Biometric Sign-In');

        let childId = null;
        if (user.role === 'parent') {
            childId = user.parent_id;
        }

        res.json({ 
            role: user.role, 
            name: user.name, 
            userId: user.id, 
            childId,
            username: user.username,
            password: user.password
        });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
