const express = require('express');
const router = express.Router();
const Branch = require('../models/Branch');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { sequelize } = require('../config/db');

// @route   GET /api/super-admin/stats
// @desc    Get Global SaaS Statistics
router.get('/stats', async (req, res) => {
    try {
        const branchCount = await Branch.count();
        const adminCount = await User.count({ where: { role: 'admin' } });
        const studentCount = await User.count({ where: { role: 'student' } });
        
        // Sum total revenue from fee_payments
        const totalPaid = await sequelize.query(`
            SELECT SUM(amount_paid) as total FROM fee_payments
        `, { type: sequelize.QueryTypes.SELECT });
        const revenue = parseFloat(totalPaid[0]?.total || 0);

        res.json({
            branchCount,
            adminCount,
            studentCount,
            globalRevenue: revenue
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET /api/super-admin/branches
// @desc    Get all branches
router.get('/branches', async (req, res) => {
    try {
        const branches = await Branch.findAll();
        res.json(branches);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/super-admin/branches
// @desc    Create new branch
router.post('/branches', async (req, res) => {
    try {
        const { name, location, contact_email } = req.body;
        const newBranch = await Branch.create({ name, location, contact_email });
        
        // Log activity
        await AuditLog.create({
            action: 'CREATE_BRANCH',
            table_name: 'branches',
            record_id: newBranch.id,
            details: `Created branch ${name} at ${location}`
        });

        res.status(201).json(newBranch);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   PUT /api/super-admin/branches/:id
// @desc    Update branch details
router.put('/branches/:id', async (req, res) => {
    try {
        const branch = await Branch.findByPk(req.params.id);
        if (!branch) return res.status(404).json({ msg: 'Branch not found' });
        await branch.update(req.body);

        await AuditLog.create({
            action: 'UPDATE_BRANCH',
            table_name: 'branches',
            record_id: branch.id,
            details: `Updated branch ID ${branch.id} values`
        });

        res.json(branch);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   DELETE /api/super-admin/branches/:id
// @desc    Delete a branch
router.get('/branches/delete/:id', async (req, res) => {
    try {
        const branch = await Branch.findByPk(req.params.id);
        if (!branch) return res.status(404).json({ msg: 'Branch not found' });
        
        const branchName = branch.name;
        await branch.destroy();

        await AuditLog.create({
            action: 'DELETE_BRANCH',
            table_name: 'branches',
            record_id: req.params.id,
            details: `Deleted branch ${branchName}`
        });

        res.json({ msg: 'Branch deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET /api/super-admin/admins
// @desc    Get list of all institute admins
router.get('/admins', async (req, res) => {
    try {
        const admins = await User.findAll({ 
            where: { role: 'admin' },
            attributes: ['id', 'name', 'email', 'phone', 'status', 'branch_id']
        });
        res.json(admins);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET /api/super-admin/audit-logs
// @desc    Get audit logs
router.get('/audit-logs', async (req, res) => {
    try {
        const logs = await AuditLog.findAll({ order: [['created_at', 'DESC']], limit: 100 });
        res.json(logs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
