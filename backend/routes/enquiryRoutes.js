const express = require('express');
const router = express.Router();
const Enquiry = require('../models/Enquiry');
const { getDomain } = require('../config/domainHelper');

const generateCredentials = async (role) => {
    const User = require('../models/User');
    let count = await User.count({ where: { role } });
    let isUnique = false;
    let seq, username, password;
    
    while (!isUnique) {
        count++;
        seq = String(count).padStart(2, '0');
        username = `${role}${seq}`;
        
        const existing = await User.findOne({ where: { username } });
        if (!existing) {
            isUnique = true;
        }
    }
    
    password = `${role.charAt(0).toUpperCase()}${role.slice(1)}@${seq}`;
    return { username, password };
};

// @route   POST /api/enquiry
// @desc    Submit a new enquiry
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, class_range, board, exam_target, message, parent_name, parent_phone, address, dob, blood_group } = req.body;

        if (!name || !phone || !class_range) {
            return res.status(400).json({ msg: 'Please provide name, phone and class range.' });
        }

        const newEnquiry = await Enquiry.create({
            name,
            email,
            phone,
            class_range,
            board: board || 'State Board',
            exam_target: exam_target || 'None',
            message,
            parent_name,
            parent_phone,
            address,
            dob: dob || null,
            blood_group
        });

        res.status(201).json({ msg: 'Enquiry submitted successfully', data: newEnquiry });
    } catch (err) {
        console.error('Enquiry Submission Error:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET /api/enquiry
// @desc    Get all enquiries for admin
router.get('/', async (req, res) => {
    try {
        const data = await Enquiry.findAll({ order: [['created_at', 'DESC']] });
        res.json(data);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/enquiry/:id
// @desc    Update an enquiry
router.put('/:id', async (req, res) => {
    try {
        const enquiry = await Enquiry.findByPk(req.params.id);
        if (!enquiry) return res.status(404).json({ msg: 'Enquiry not found' });
        
        const { name, email, phone, class_range, board, exam_target, message, status, lost_reason, parent_name, parent_phone, address, dob, blood_group } = req.body;
        
        const oldEmail = enquiry.email;
        const oldPhone = enquiry.phone;

        await enquiry.update({ 
            name, email, phone, class_range, board, exam_target, message, status, lost_reason, parent_name, parent_phone, address, 
            dob: dob || null, 
            blood_group 
        });

        // Sync to corresponding Student User and Parent User accounts if student exists
        const User = require('../models/User');
        const { Op } = require('sequelize');
        const studentUser = await User.findOne({
            where: {
                role: 'student',
                [Op.or]: [
                    { email: oldEmail || 'no-email' },
                    { phone: oldPhone || 'no-phone' }
                ]
            }
        });

        if (studentUser) {
            await studentUser.update({
                name,
                email,
                phone,
                standard: class_range,
                parent_name,
                parent_phone,
                address,
                dob: dob || null,
                blood_group
            });

            // Update parent user account
            const parentUser = await User.findOne({ where: { parent_id: studentUser.id, role: 'parent' } });
            if (parentUser) {
                const parentUpdate = {};
                if (parent_name) parentUpdate.name = parent_name;
                if (parent_phone) parentUpdate.phone = parent_phone;
                await parentUser.update(parentUpdate);
            }
        }

        // Sync to corresponding Registration record if it exists
        const Registration = require('../models/Registration');
        const matchingRegistration = await Registration.findOne({
            where: {
                [Op.or]: [
                    { email: oldEmail || 'no-email' },
                    { phone: oldPhone || 'no-phone' }
                ]
            }
        });
        if (matchingRegistration) {
            await matchingRegistration.update({
                name,
                email,
                phone,
                class: class_range,
                board
            });
        }

        res.json({ msg: 'Enquiry updated' });
    } catch (err) {
        console.error('Enquiry Update Sync Error:', err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/enquiry/convert/:id
// @desc    Convert an enquiry to a registered student
router.post('/convert/:id', async (req, res) => {
    try {
        const enquiry = await Enquiry.findByPk(req.params.id);
        if (!enquiry) return res.status(404).json({ msg: 'Enquiry not found' });

        const { password, batch_id, fee_plan, standard, board } = req.body;
        if (!password || !batch_id) return res.status(400).json({ msg: 'Password and Batch are required for conversion.' });

        // Logic similar to registration but from enquiry data
        const User = require('../models/User');
        const Enrollment = require('../models/Enrollment');
        const Batch = require('../models/Batch');

        // 1. Check if student already exists
        const studentEmail = enquiry.email || `${enquiry.phone}@${getDomain()}`;
        const existingStudent = await User.findOne({ where: { email: studentEmail } });
        
        const { parent_name, parent_phone, address, dob, blood_group } = req.body;
        
        let newUser;
        let autoStudentCreds, autoParentCreds;
        if (existingStudent) {
            newUser = existingStudent;
            await newUser.update({ standard: standard || existingStudent.standard });
        } else {
            autoStudentCreds = await generateCredentials('student');

            newUser = await User.create({
                name: enquiry.name,
                email: studentEmail,
                password: password || autoStudentCreds.password,
                role: 'student',
                phone: enquiry.phone,
                username: autoStudentCreds.username,
                standard: standard || enquiry.class_range,
                parent_name: parent_name || '',
                parent_phone: parent_phone || enquiry.phone,
                address: address || '',
                dob: dob || null,
                blood_group: blood_group || '',
                status: 'active'
            });

            autoParentCreds = await generateCredentials('parent');

            // Automatically create Parent User for this student
            await User.create({
                name: parent_name || `${enquiry.name} Parent`,
                email: `parent_${newUser.id}@${getDomain()}`,
                password: autoParentCreds.password,
                role: 'parent',
                phone: parent_phone || enquiry.phone,
                parent_id: newUser.id,
                username: autoParentCreds.username,
                status: 'active'
            });

            console.log(`✅ Student Login: ${autoStudentCreds.username} / ${password || autoStudentCreds.password}`);
            console.log(`✅ Parent Login:  ${autoParentCreds.username} / ${autoParentCreds.password}`);
        }

        // 2. Create Enrollment
        const { token_amount, installments: customInstallments } = req.body;
        const batch = await Batch.findByPk(batch_id);
        if (!batch) throw new Error('Selected batch not found.');
        
        const Course = require('../models/Course');
        const matchedCourse = await Course.findOne({
            where: {
                class_range: batch.standard,
                board: batch.board
            },
            order: [['fees', 'DESC']]
        });
        
        const courseId = matchedCourse ? matchedCourse.id : null;
        const { getStandardFee } = require('../utils/feeHelper');
        const totalFees = getStandardFee(batch.standard, matchedCourse);
        const plan = fee_plan || 'One-time';
        const installments = customInstallments || (plan === 'EMI' ? 4 : 1);
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

        // 3. Create Token Payment if exists
        if (parseFloat(token_amount) > 0) {
            const FeePayment = require('../models/FeePayment');
            await FeePayment.create({
                student_id: newUser.id,
                amount_paid: token_amount,
                payment_date: new Date().toISOString().split('T')[0],
                payment_mode: 'Online'
            });
        }

        // 4. Create Registration Record (for Audit/Queue)
        const Registration = require('../models/Registration');
        await Registration.create({
            name: enquiry.name,
            email: studentEmail,
            phone: enquiry.phone,
            class: standard || enquiry.class_range || '9th',
            board: board || enquiry.board || 'State Board',
            course_interest: batch.name,
            password: password,
            status: 'approved',
            token_amount: token_amount || 0
        });

        // 5. Update enquiry status
        enquiry.status = 'Converted';
        await enquiry.save();

        res.json({ 
            msg: 'Enquiry successfully converted to student and enrolled!', 
            student: newUser,
            credentials: autoStudentCreds ? {
                student: { username: autoStudentCreds.username, password: password || autoStudentCreds.password },
                parent: { username: autoParentCreds?.username, password: autoParentCreds?.password }
            } : null
        });
    } catch (err) {
        console.error('Conversion Error Details:', err);
        res.status(500).json({ msg: 'Server Error during conversion', error: err.message });
    }
});

// @route   DELETE /api/enquiry/:id
// @desc    Delete an enquiry
router.delete('/:id', async (req, res) => {
    try {
        const enquiry = await Enquiry.findByPk(req.params.id);
        if (!enquiry) return res.status(404).json({ msg: 'Enquiry not found' });
        
        await enquiry.destroy();
        res.json({ msg: 'Enquiry deleted' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
