const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Salary = require('../models/Salary');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const FeePayment = require('../models/FeePayment');
const { sequelize } = require('../config/db');

// @route   GET /api/accountant/stats
// @desc    Financial stats summary (income vs expenses vs payroll)
router.get('/stats', async (req, res) => {
    try {
        const feesPaidRec = await sequelize.query(`
            SELECT SUM(amount_paid) as total FROM fee_payments
        `, { type: sequelize.QueryTypes.SELECT });
        const totalIncome = parseFloat(feesPaidRec[0]?.total || 0);

        const expenseRec = await sequelize.query(`
            SELECT SUM(amount) as total FROM expenses
        `, { type: sequelize.QueryTypes.SELECT });
        const totalExpenses = parseFloat(expenseRec[0]?.total || 0);

        const salaryRec = await sequelize.query(`
            SELECT SUM(amount) as total FROM salary WHERE status = 'paid'
        `, { type: sequelize.QueryTypes.SELECT });
        const totalPayroll = parseFloat(salaryRec[0]?.total || 0);

        res.json({
            totalIncome,
            totalExpenses,
            totalPayroll,
            netBalance: totalIncome - totalExpenses - totalPayroll
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET /api/accountant/expenses
// @desc    List all expenses
router.get('/expenses', async (req, res) => {
    try {
        const expenses = await Expense.findAll({ order: [['date', 'DESC']] });
        res.json(expenses);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/accountant/expenses
// @desc    Add expense
router.post('/expenses', async (req, res) => {
    try {
        const { title, amount, category, date, description } = req.body;
        const newExpense = await Expense.create({ title, amount, category, date, description });
        res.status(201).json(newExpense);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   PUT /api/accountant/expenses/:id
// @desc    Update expense
router.put('/expenses/:id', async (req, res) => {
    try {
        const expense = await Expense.findByPk(req.params.id);
        if (!expense) return res.status(404).json({ msg: 'Expense not found' });
        await expense.update(req.body);
        res.json(expense);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   DELETE /api/accountant/expenses/:id
// @desc    Delete expense
router.delete('/expenses/:id', async (req, res) => {
    try {
        const expense = await Expense.findByPk(req.params.id);
        if (!expense) return res.status(404).json({ msg: 'Expense not found' });
        await expense.destroy();
        res.json({ msg: 'Expense deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET /api/accountant/salaries
// @desc    List processed salaries
router.get('/salaries', async (req, res) => {
    try {
        const salaries = await sequelize.query(`
            SELECT s.*, u.name as staff_name, u.role as staff_role 
            FROM salary s
            JOIN users u ON s.user_id = u.id
            ORDER BY s.year DESC, s.month DESC
        `, { type: sequelize.QueryTypes.SELECT });
        res.json(salaries);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET /api/accountant/staff
// @desc    Get staff members list for salary setup (roles faculty, admin, accountant, receptionist, librarian, transport-manager)
router.get('/staff', async (req, res) => {
    try {
        const staff = await User.findAll({
            where: {
                role: ['faculty', 'admin', 'accountant', 'receptionist', 'librarian', 'transport-manager']
            },
            attributes: ['id', 'name', 'email', 'role', 'phone']
        });
        res.json(staff);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/accountant/salaries
// @desc    Generate/Log a salary slip
router.post('/salaries', async (req, res) => {
    try {
        const { user_id, month, year, amount, status, payment_date } = req.body;
        const newSalary = await Salary.create({
            user_id,
            month,
            year,
            amount,
            status: status || 'pending',
            payment_date: status === 'paid' ? (payment_date || new Date().toISOString().split('T')[0]) : null
        });
        res.status(201).json(newSalary);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   PUT /api/accountant/salaries/:id
// @desc    Pay salary/update status
router.put('/salaries/:id', async (req, res) => {
    try {
        const salary = await Salary.findByPk(req.params.id);
        if (!salary) return res.status(404).json({ msg: 'Salary slip not found' });
        
        await salary.update({
            status: req.body.status,
            payment_date: req.body.status === 'paid' ? new Date().toISOString().split('T')[0] : null
        });
        res.json(salary);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET /api/accountant/pending-fees
// @desc    List all students with pending fees
router.get('/pending-fees', async (req, res) => {
    try {
        const pending = await sequelize.query(`
            SELECT 
                u.id as student_id, 
                u.name as student_name, 
                u.phone as student_phone, 
                c.title as course_title,
                c.fees as total_fees,
                COALESCE(SUM(f.amount_paid), 0) as paid_fees,
                (c.fees - COALESCE(SUM(f.amount_paid), 0)) as pending_fees
            FROM users u
            JOIN enrollments e ON u.id = e.student_id
            JOIN courses c ON e.course_id = c.id
            LEFT JOIN fee_payments f ON u.id = f.student_id
            WHERE u.role = 'student'
            GROUP BY u.id, u.name, u.phone, c.title, c.fees
            HAVING pending_fees > 0
        `, { type: sequelize.QueryTypes.SELECT });
        res.json(pending);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
