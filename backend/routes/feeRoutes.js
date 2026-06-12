const express = require('express');
const router = express.Router();
const FeePayment = require('../models/FeePayment');
const User = require('../models/User');
const { sequelize } = require('../config/db');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const { sendSMS } = require('../utils/sms');

// @route   GET /api/fees/stats
// @desc    Get comprehensive revenue & fee stats for admin
router.get('/stats', async (req, res) => {
    try {
        // Sum of all payments
        const totalRevenue = await FeePayment.sum('amount_paid') || 0;
        
        // Revenue by month
        const monthlyStats = await sequelize.query(
            "SELECT MONTHNAME(payment_date) as month, SUM(amount_paid) as total FROM fee_payments GROUP BY month ORDER BY FIELD(month, 'January','February','March','April','May','June','July','August','September','October','November','December')",
            { type: sequelize.QueryTypes.SELECT }
        );

        // Pending Fees Calculation
        // Formula: Sum of fees for all enrollments - total payments
        const totalExpected = await sequelize.query(
            "SELECT SUM(c.fees) as total FROM enrollments e JOIN courses c ON e.course_id = c.id",
            { type: sequelize.QueryTypes.SELECT }
        );
        const expected = totalExpected[0].total || 0;
        const totalPending = expected - totalRevenue;

        // Total registered students
        const totalStudents = await User.count({ where: { role: 'student' } });

        res.json({ 
            totalRevenue, 
            monthlyStats, 
            totalPending: totalPending > 0 ? totalPending : 0,
            totalExpected: expected,
            totalStudents
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/fees/student/:id
// @desc    Get fee history for a student
router.get('/student/:id', async (req, res) => {
    try {
        const history = await FeePayment.findAll({ 
            where: { student_id: req.params.id },
            order: [['payment_date', 'DESC']]
        });
        res.json(history);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/fees/summary/:studentId
// @desc    Get fee summary (Total, Paid, Pending) for a student
router.get('/summary/:studentId', async (req, res) => {
    try {
        const studentId = req.params.studentId;
        
        // Find student enrollment and course fee
        const enrollment = await Enrollment.findOne({ where: { student_id: studentId } });
        if (!enrollment) return res.status(404).json({ msg: 'Enrollment not found' });
        
        const course = await Course.findByPk(enrollment.course_id);
        const totalFees = parseFloat(course.fees || 0);

        // Sum of payments
        const totalPaid = await FeePayment.sum('amount_paid', { where: { student_id: studentId } }) || 0;
        
        // Find student details
        const student = await User.findByPk(studentId);
        const studentName = student ? student.name : 'Student';

        res.json({
            studentName,
            courseTitle: course.title,
            totalFees,
            totalPaid: parseFloat(totalPaid),
            totalPending: totalFees - parseFloat(totalPaid),
            fee_plan: enrollment.fee_plan,
            total_installments: enrollment.total_installments,
            installment_amount: enrollment.installment_amount,
            next_due_date: enrollment.next_due_date
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/fees/pay
// @desc    Record a fee payment
router.post('/pay', async (req, res) => {
    try {
        const { student_id, amount_paid, payment_mode } = req.body;
        
        if (!student_id || !amount_paid) {
            return res.status(400).json({ msg: 'Missing required fields' });
        }
        
        const paymentAmount = parseFloat(amount_paid);
        if (paymentAmount <= 0) {
            return res.status(400).json({ msg: 'Payment amount must be greater than zero.' });
        }

        // 1. Calculate exact pending amount
        const enrollment = await Enrollment.findOne({ where: { student_id } });
        if (!enrollment) {
            return res.status(404).json({ msg: 'Student enrollment not found.' });
        }
        
        const course = await Course.findByPk(enrollment.course_id);
        if (!course) {
             return res.status(404).json({ msg: 'Course not found.' });
        }
        const totalFees = parseFloat(course.fees || 0);
        
        const totalPaidRes = await FeePayment.sum('amount_paid', { where: { student_id } }) || 0;
        const totalPaid = parseFloat(totalPaidRes);
        const pendingAmount = totalFees - totalPaid;
        
        if (paymentAmount > pendingAmount) {
            return res.status(400).json({ msg: `Payment amount (₹${paymentAmount}) cannot exceed the pending balance (₹${pendingAmount}).` });
        }

        const newPayment = await FeePayment.create({
            student_id,
            amount_paid: paymentAmount,
            payment_date: new Date().toISOString().split('T')[0],
            payment_mode: payment_mode || 'Online'
        });

        // Update Enrollment next_due_date if it's EMI
        if (enrollment.fee_plan === 'EMI' && enrollment.next_due_date) {
            // If paying at least one installment, push date by 30 days
            if (paymentAmount >= parseFloat(enrollment.installment_amount)) {
                const currentDue = new Date(enrollment.next_due_date);
                currentDue.setDate(currentDue.getDate() + 30);
                enrollment.next_due_date = currentDue.toISOString().split('T')[0];
                await enrollment.save();
            }
        }

        res.status(201).json(newPayment);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/fees/all-pending
// @desc    Get all students and their fee summaries for Admin
router.get('/all-pending', async (req, res) => {
    try {
        const query = `
            SELECT 
                u.id as student_id,
                u.name as name,
                u.phone as phone,
                c.title as course,
                c.class_range as standard,
                c.board as board,
                c.exam_target as exam_target,
                e.batch_id as batch_id,
                c.fees as totalFee,
                e.fee_plan as fee_plan,
                COALESCE(SUM(fp.amount_paid), 0) as paid,
                (c.fees - COALESCE(SUM(fp.amount_paid), 0)) as pending
            FROM users u
            JOIN enrollments e ON u.id = e.student_id
            JOIN courses c ON e.course_id = c.id
            LEFT JOIN fee_payments fp ON u.id = fp.student_id
            WHERE u.role = 'student'
            GROUP BY u.id, u.name, u.phone, c.title, c.class_range, c.board, c.exam_target, e.batch_id, c.fees, e.fee_plan
        `;
        const data = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT });
        
        // Map to format AdminFees expects: { id, name, course, totalFee, paid, pending, status, phone }
        const formattedData = data.map((row, index) => ({
            id: row.student_id,
            name: row.name,
            course: row.course,
            totalFee: parseFloat(row.totalFee),
            paid: parseFloat(row.paid),
            pending: parseFloat(row.pending),
            standard: row.standard,
            board: row.board,
            exam_target: row.exam_target,
            batch_id: row.batch_id,
            status: parseFloat(row.pending) > 0 ? 'Pending' : 'Paid',
            phone: row.phone || 'N/A',
            fee_plan: row.fee_plan
        }));
        
        res.json(formattedData);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
