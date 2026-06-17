const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const { getDomain } = require('../config/domainHelper');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const { Op } = require('sequelize');

// Helper: generate next sequential username like student01, student02...
const generateCredentials = async (role) => {
    const count = await User.count({ where: { role } });
    const seq = String(count + 1).padStart(2, '0'); // 01, 02...
    const username = `${role}${seq}`;
    const password = `${role.charAt(0).toUpperCase()}${role.slice(1)}@${seq}`; // Student@01
    return { username, password };
};

// @route   GET /api/registration
// @desc    Get all registrations
router.get('/', async (req, res) => {
    try {
        const registrations = await Registration.findAll({ order: [['created_at', 'DESC']] });
        res.json(registrations);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/registration
// @desc    Submit a new registration and create user account
router.post('/', async (req, res) => {
    try {
        const { name, email, username, phone, class: className, board, course_interest, password, fee_plan, total_installments, parent_username, parent_password, parent_name, parent_phone, address, dob, blood_group } = req.body;

        if (!name || !phone || !className || !board || !course_interest || !password) {
            return res.status(400).json({ msg: 'Please provide all required fields.' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email : email || 'no-email' } });
        if (existingUser && email) {
            return res.status(400).json({ msg: 'Email already registered.' });
        }

        const newRegistration = await Registration.create({
            name, email, phone, class: className, board, course_interest, password, token_amount: req.body.token_amount || 0
        });

        // Generate sequential credentials fallback
        const studentCreds = await generateCredentials('student');
        const parentCreds = await generateCredentials('parent');

        const resolvedUsername = username || studentCreds.username;
        const resolvedParentUsername = parent_username || parentCreds.username;
        const resolvedParentPassword = parent_password || parentCreds.password;

        // Automatically create Student User
        const newUser = await User.create({
            name,
            email: email || `${phone}@${getDomain()}`,
            password: password || studentCreds.password, // Use provided or auto-generated
            role: 'student',
            phone,
            username: resolvedUsername,
            standard: className,
            parent_name,
            parent_phone,
            address,
            dob: dob || null,
            blood_group,
            status: 'pending'
        });

        // Automatically create Parent User for this student
        const parentUser = await User.create({
            name: parent_name || `${name} Parent`,
            email: `parent_${newUser.id}@${getDomain()}`,
            password: resolvedParentPassword,
            role: 'parent',
            phone: parent_phone || phone,
            parent_id: newUser.id,
            username: resolvedParentUsername,
            status: 'pending'
        });

        console.log(`✅ Student Login: ${resolvedUsername} / ${password || studentCreds.password}`);
        console.log(`✅ Parent Login:  ${resolvedParentUsername} / ${resolvedParentPassword}`);

        // Map course_interest to the actual course ID in the database
        let courseId = 1; // Default fallback
        const matchedCourse = await Course.findOne({ where: { title: course_interest } });
        if (matchedCourse) {
            courseId = matchedCourse.id;
        } else {
            // Fallback heuristics if exact title match fails
            if (course_interest.includes('JEE') || course_interest.includes('NEET')) {
                const c = await Course.findOne({ where: { exam_target: ['JEE', 'NEET'] } });
                if (c) courseId = c.id;
            } else if (className.includes('11') || className.includes('12')) {
                const c = await Course.findOne({ where: { class_range: ['11th', 'HSC (12th)'] } });
                if (c) courseId = c.id;
            }
        }

        const { token_amount } = req.body;
        const course = await Course.findByPk(courseId);
        const { getStandardFee } = require('../utils/feeHelper');
        const totalFees = getStandardFee(className, course);
        const plan = fee_plan || 'One-time';
        const installments = plan === 'EMI' ? (parseInt(total_installments) || 4) : 1;
        const instAmount = (totalFees - parseFloat(token_amount || 0)) / installments;

        // Create Enrollment
        await Enrollment.create({
            student_id: newUser.id,
            course_id: courseId,
            batch_year: '2025-26',
            fee_plan: plan,
            total_installments: installments,
            installment_amount: instAmount,
            next_due_date: plan === 'EMI' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null
        });

        // Create Token Payment if exists
        if (parseFloat(token_amount) > 0) {
            const FeePayment = require('../models/FeePayment');
            await FeePayment.create({
                student_id: newUser.id,
                amount_paid: token_amount,
                payment_date: new Date().toISOString().split('T')[0],
                payment_mode: 'Online'
            });
        }

        res.status(201).json({ 
            msg: 'Registration successful. Awaiting admin approval.',
            data: newRegistration,
            credentials: {
                student: { username: (await User.findOne({ where: { id: newUser.id } })).username, note: 'Password as entered or auto-generated' },
                parent: { username: (await User.findOne({ where: { parent_id: newUser.id, role: 'parent' } })).username, note: 'Auto-generated' }
            }
        });
    } catch (err) {
        console.error('Registration Submission Error Details:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// @route   PUT /api/registration/:id
// @desc    Update registration status
router.put('/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const registration = await Registration.findByPk(req.params.id);
        if (!registration) return res.status(404).json({ msg: 'Registration not found' });
        
        registration.status = status;
        await registration.save();

        // Update corresponding Student and Parent User status
        const studentEmail = registration.email || `${registration.phone}@${getDomain()}`;
        const studentUser = await User.findOne({
            where: {
                role: 'student',
                [Op.or]: [
                    { email: studentEmail },
                    { phone: registration.phone }
                ]
            }
        });

        if (studentUser) {
            const userStatus = status === 'approved' ? 'active' : status === 'rejected' ? 'suspended' : 'pending';
            await studentUser.update({ status: userStatus });
            
            // Update parent status too
            const parentUser = await User.findOne({
                where: {
                    role: 'parent',
                    parent_id: studentUser.id
                }
            });
            if (parentUser) {
                await parentUser.update({ status: userStatus });
            }
        }
        
        res.json(registration);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/registration/:id
// @desc    Delete a registration
router.delete('/:id', async (req, res) => {
    try {
        const registration = await Registration.findByPk(req.params.id);
        if (!registration) return res.status(404).json({ msg: 'Registration not found' });
        
        await registration.destroy();
        res.json({ msg: 'Registration deleted' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
