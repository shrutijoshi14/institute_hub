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
                    { username: email }
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

// @route   GET /api/auth/users
// @desc    Get all users, optionally filter by role (e.g. ?role=student)
router.get('/users', async (req, res) => {
    try {
        const query = req.query.role ? { role: req.query.role } : {};
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
            dob,
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
                    const totalFees = matchedCourse ? parseFloat(matchedCourse.fees) : 50000;
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
        await user.update(req.body);

        if (user.role === 'student' && req.body.batch_id) {
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
                const totalFees = matchedCourse ? parseFloat(matchedCourse.fees) : 50000;
                const plan = fee_plan || 'One-time';
                const installments = plan === 'EMI' ? (parseInt(total_installments) || 4) : 1;
                const instAmount = (totalFees - parseFloat(token_amount || 0)) / installments;

                let enrollment = await Enrollment.findOne({ where: { student_id: user.id } });
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
        await user.destroy();
        res.json({ msg: 'Deleted user' });
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

module.exports = router;
