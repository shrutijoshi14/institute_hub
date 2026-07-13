const express = require('express');
const router = express.Router();
const FeePayment = require('../models/FeePayment');
const User = require('../models/User');
const { sequelize } = require('../config/db');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const { sendSMS } = require('../utils/sms');
const { getStandardFee, getStandardCourseTitle, getStandardFeeSqlFragment, getStandardCourseTitleSqlFragment } = require('../utils/feeHelper');


// @route   GET /api/fees/stats
// @desc    Get comprehensive revenue & fee stats for admin
router.get('/stats', async (req, res) => {
    try {
        // Sum of all payments
        const totalRevenue = await FeePayment.sum('amount_paid') || 0;
        
        // Revenue by month (Dialect-aware query for MySQL & PostgreSQL compatibility)
        const isPostgres = sequelize.getDialect() === 'postgres';
        const monthlyQuery = isPostgres
            ? `
                SELECT TRIM(to_char(payment_date, 'Month')) as month, SUM(amount_paid) as total 
                FROM fee_payments 
                GROUP BY month, EXTRACT(MONTH FROM payment_date) 
                ORDER BY EXTRACT(MONTH FROM payment_date)
              `
            : "SELECT MONTHNAME(payment_date) as month, SUM(amount_paid) as total FROM fee_payments GROUP BY month ORDER BY FIELD(month, 'January','February','March','April','May','June','July','August','September','October','November','December')";
        
        const monthlyStats = await sequelize.query(monthlyQuery, { type: sequelize.QueryTypes.SELECT });

        // Pending Fees Calculation
        // Formula: Sum of fees for all enrollments (with fallback) - total payments
        const feeSql = getStandardFeeSqlFragment('s.standard', 'e.batch_id');
        const totalExpected = await sequelize.query(
            `SELECT SUM(
                COALESCE(
                    NULLIF(c.fees, 0),
                    ${feeSql}
                )
             ) as total 
             FROM enrollments e 
             LEFT JOIN courses c ON e.course_id = c.id
             LEFT JOIN users u ON e.student_id = u.id
             LEFT JOIN students s ON e.student_id = s.user_id`,
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

router.get('/student/:id', async (req, res) => {
    try {
        const studentId = req.params.id;
        const history = await FeePayment.findAll({ 
            where: { student_id: studentId },
            order: [['payment_date', 'DESC']]
        });

        // Resolve matching registration token amount to ensure visibility in student/parent portals
        const user = await User.findByPk(studentId);
        if (user) {
            const Registration = require('../models/Registration');
            const { Op } = require('sequelize');
            const reg = await Registration.findOne({
                where: {
                    [Op.or]: [
                        { email: user.email },
                        { phone: user.phone }
                    ]
                }
            });

            if (reg && parseFloat(reg.token_amount) > 0) {
                // If there isn't already a FeePayment representing the token payment
                const hasTokenPayment = history.some(p => parseFloat(p.amount_paid) === parseFloat(reg.token_amount));
                if (!hasTokenPayment) {
                    history.push({
                        id: `REG-${reg.id}`,
                        student_id: studentId,
                        amount_paid: parseFloat(reg.token_amount),
                        payment_date: reg.created_at || new Date(user.created_at || Date.now()).toISOString().split('T')[0],
                        payment_mode: 'Online (Registration Token)',
                        receipt_url: null
                    });
                    // Keep ordered DESC by date
                    history.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));
                }
            }
        }

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
        
        const student = await User.findByPk(studentId);
        if (!student) return res.status(404).json({ msg: 'Student not found' });
        const studentName = student.name;
        const standard = student.standard;

        // Find student enrollment and course fee
        const enrollment = await Enrollment.findOne({ where: { student_id: studentId } });
        
        let totalFees = 0;
        let courseTitle = 'Unassigned';
        let fee_plan = 'EMI';
        let total_installments = 1;
        let installment_amount = 0;
        let next_due_date = null;

        if (enrollment) {
            const course = enrollment.course_id ? await Course.findByPk(enrollment.course_id) : null;
            if (course && parseFloat(course.fees) > 0) {
                totalFees = parseFloat(course.fees);
                courseTitle = course.title;
            } else {
                totalFees = getStandardFee(standard || (enrollment.batch_id ? (await sequelize.query('SELECT standard FROM batches WHERE id = ?', { replacements: [enrollment.batch_id], type: sequelize.QueryTypes.SELECT }))[0]?.standard : null));
                courseTitle = getStandardCourseTitle(standard || (enrollment.batch_id ? (await sequelize.query('SELECT standard FROM batches WHERE id = ?', { replacements: [enrollment.batch_id], type: sequelize.QueryTypes.SELECT }))[0]?.standard : null));
            }
            fee_plan = enrollment.fee_plan;
            total_installments = enrollment.total_installments;
            installment_amount = enrollment.installment_amount;
            next_due_date = enrollment.next_due_date;
        } else {
            // Unenrolled fallback from user standard
            totalFees = getStandardFee(standard);
            courseTitle = getStandardCourseTitle(standard) + ' (Pending Admission)';
            installment_amount = totalFees;
        }

        // Sum of payments
        const totalPaidDb = await FeePayment.sum('amount_paid', { where: { student_id: studentId } }) || 0;
        let totalPaid = parseFloat(totalPaidDb);

        // Resolve matching registration token amount to ensure visibility in student/parent portals
        const Registration = require('../models/Registration');
        const { Op } = require('sequelize');
        const reg = await Registration.findOne({
            where: {
                [Op.or]: [
                    { email: student.email },
                    { phone: student.phone }
                ]
            }
        });

        if (reg && parseFloat(reg.token_amount) > 0) {
            // Check if there isn't already a FeePayment that represents this token payment
            const hasTokenPayment = await FeePayment.findOne({
                where: {
                    student_id: studentId,
                    amount_paid: reg.token_amount
                }
            });
            if (!hasTokenPayment) {
                totalPaid += parseFloat(reg.token_amount);
            }
        }

        res.json({
            studentName,
            courseTitle,
            totalFees,
            totalPaid: totalPaid,
            totalPending: Math.max(0, totalFees - totalPaid),
            fee_plan,
            total_installments,
            installment_amount,
            next_due_date
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
        const student = await User.findByPk(student_id);
        if (!student) {
            return res.status(404).json({ msg: 'Student not found.' });
        }
        
        const enrollment = await Enrollment.findOne({ where: { student_id } });
        
        let totalFees = 0;
        if (enrollment) {
            const course = enrollment.course_id ? await Course.findByPk(enrollment.course_id) : null;
            if (course && parseFloat(course.fees) > 0) {
                totalFees = parseFloat(course.fees);
            } else {
                const searchStandard = student.standard || (enrollment.batch_id ? (await sequelize.query('SELECT standard FROM batches WHERE id = ?', { replacements: [enrollment.batch_id], type: sequelize.QueryTypes.SELECT }))[0]?.standard : null);
                totalFees = getStandardFee(searchStandard);
            }
        } else {
            totalFees = getStandardFee(student.standard);
        }
        
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
        const titleSql = getStandardCourseTitleSqlFragment('s.standard', 'e.batch_id');
        const feeSql = getStandardFeeSqlFragment('s.standard', 'e.batch_id');
        const isPostgres = sequelize.getDialect() === 'postgres';
        const feePlanCast = isPostgres ? 'CAST(e.fee_plan AS VARCHAR)' : 'e.fee_plan';
        const query = `
            SELECT 
                u.id as student_id,
                u.name as name,
                u.phone as phone,
                COALESCE(
                    c.title, 
                    ${titleSql},
                    'General Course'
                ) as course,
                COALESCE(s.standard, 'Unassigned') as standard,
                COALESCE(
                    c.board, 
                    (SELECT board FROM courses WHERE class_range = s.standard AND fees > 0 ORDER BY fees DESC LIMIT 1),
                    (SELECT board FROM courses WHERE class_range = (SELECT standard FROM batches WHERE id = e.batch_id) AND fees > 0 ORDER BY fees DESC LIMIT 1),
                    'N/A'
                ) as board,
                COALESCE(
                    c.exam_target, 
                    (SELECT exam_target FROM courses WHERE class_range = s.standard AND fees > 0 ORDER BY fees DESC LIMIT 1),
                    (SELECT exam_target FROM courses WHERE class_range = (SELECT standard FROM batches WHERE id = e.batch_id) AND fees > 0 ORDER BY fees DESC LIMIT 1),
                    'None'
                ) as exam_target,
                e.batch_id as batch_id,
                COALESCE(
                    NULLIF(c.fees, 0), 
                    ${feeSql},
                    50000
                ) as totalFee,
                COALESCE(${feePlanCast}, 'N/A') as fee_plan,
                COALESCE(SUM(fp.amount_paid), 0) as paid,
                (
                    COALESCE(
                        NULLIF(c.fees, 0), 
                        ${feeSql},
                        50000
                    ) - COALESCE(SUM(fp.amount_paid), 0)
                ) as pending
            FROM users u
            LEFT JOIN students s ON u.id = s.user_id
            LEFT JOIN enrollments e ON u.id = e.student_id
            LEFT JOIN courses c ON e.course_id = c.id
            LEFT JOIN fee_payments fp ON u.id = fp.student_id
            WHERE u.role = 'student'
            GROUP BY u.id, u.name, u.phone, c.title, s.standard, c.board, c.exam_target, e.batch_id, c.fees, e.fee_plan, e.total_installments, e.installment_amount
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
