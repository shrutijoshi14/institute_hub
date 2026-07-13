const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Result = require('../models/Result');
const FeePayment = require('../models/FeePayment');
const Assignment = require('../models/Assignment');
const Batch = require('../models/Batch');
const { Op } = require('sequelize');

// Map frontend types to model classes and date column names
const modelMap = {
    attendance: { model: Attendance, dateCol: 'date' },
    results: { model: Result, dateCol: 'exam_date' },
    fees: { model: FeePayment, dateCol: 'payment_date' },
    assignments: { model: Assignment, dateCol: 'due_date' },
    batches: { model: Batch, dateCol: 'id' } // For batches we filter by ID or archive all
};

// @route   GET /api/archive/stats
// @desc    Get counts of active and archived records
router.get('/stats', async (req, res) => {
    try {
        const stats = {};
        for (const [key, config] of Object.entries(modelMap)) {
            const active = await config.model.count({
                where: { is_archived: 0 }
            });
            const archived = await config.model.count({
                where: { is_archived: 1 },
                includeArchived: true // bypasses the automatic is_archived = 0 hook filter
            });
            stats[key] = { active, archived };
        }
        res.json(stats);
    } catch (err) {
        console.error('Archive Stats Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/archive/run
// @desc    Archive records older than a specific date
router.post('/run', async (req, res) => {
    const { type, beforeDate } = req.body;
    if (!type || !modelMap[type]) {
        return res.status(400).json({ msg: 'Invalid target module type specified.' });
    }
    if (!beforeDate && type !== 'batches') {
        return res.status(400).json({ msg: 'Please provide a cut-off date to archive.' });
    }

    try {
        const config = modelMap[type];
        const whereClause = { is_archived: 0 };
        
        if (type !== 'batches') {
            whereClause[config.dateCol] = { [Op.lt]: beforeDate };
        }

        // Run bulk update using update method, passing includeArchived to allow target selection
        const [updatedRows] = await config.model.update(
            { is_archived: 1 },
            { 
                where: whereClause,
                includeArchived: true 
            }
        );

        res.json({
            msg: `Successfully archived ${updatedRows} ${type} records.`,
            archivedCount: updatedRows
        });
    } catch (err) {
        console.error('Run Archive Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/archive/restore
// @desc    Restore archived records
router.post('/restore', async (req, res) => {
    const { type } = req.body;
    if (!type || !modelMap[type]) {
        return res.status(400).json({ msg: 'Invalid target module type specified.' });
    }

    try {
        const config = modelMap[type];
        const [updatedRows] = await config.model.update(
            { is_archived: 0 },
            { 
                where: { is_archived: 1 },
                includeArchived: true 
            }
        );

        res.json({
            msg: `Successfully restored ${updatedRows} archived ${type} records.`,
            restoredCount: updatedRows
        });
    } catch (err) {
        console.error('Restore Archive Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
