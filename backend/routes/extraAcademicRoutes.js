const express = require('express');
const router = express.Router();
const Leave = require('../models/Leave');
const Complaint = require('../models/Complaint');
const Chat = require('../models/Chat');
const Announcement = require('../models/Announcement');
const Event = require('../models/Event');
const User = require('../models/User');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');

// --- Leave Requests ---
// @route   GET /api/extra-academic/leaves
// @desc    List all leave requests with requester details
router.get('/leaves', async (req, res) => {
    try {
        const list = await sequelize.query(`
            SELECT l.*, u.name as user_name, u.role as user_role
            FROM leaves l
            JOIN users u ON l.user_id = u.id
            ORDER BY l.start_date DESC
        `, { type: sequelize.QueryTypes.SELECT });
        res.json(list);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET /api/extra-academic/leaves/user/:userId
// @desc    Get leave requests for a single user
router.get('/leaves/user/:userId', async (req, res) => {
    try {
        const list = await Leave.findAll({ 
            where: { user_id: req.params.userId },
            order: [['start_date', 'DESC']]
        });
        res.json(list);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/extra-academic/leaves
// @desc    Submit a leave request
router.post('/leaves', async (req, res) => {
    try {
        const { user_id, type, start_date, end_date, reason } = req.body;
        const newLeave = await Leave.create({
            user_id,
            type,
            start_date,
            end_date,
            reason,
            status: 'pending'
        });
        res.status(201).json(newLeave);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   PUT /api/extra-academic/leaves/:id
// @desc    Approve/reject leave request
router.put('/leaves/:id', async (req, res) => {
    try {
        const record = await Leave.findByPk(req.params.id);
        if (!record) return res.status(404).json({ msg: 'Leave request not found' });
        
        await record.update({
            status: req.body.status,
            remarks: req.body.remarks || record.remarks
        });
        res.json(record);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// --- Complaints ---
// @route   GET /api/extra-academic/complaints
// @desc    List all complaints with reporter details
router.get('/complaints', async (req, res) => {
    try {
        const list = await sequelize.query(`
            SELECT c.*, u.name as reporter_name, u.role as reporter_role
            FROM complaints c
            JOIN users u ON c.user_id = u.id
            ORDER BY c.created_at DESC
        `, { type: sequelize.QueryTypes.SELECT });
        res.json(list);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/extra-academic/complaints
// @desc    File a complaint
router.post('/complaints', async (req, res) => {
    try {
        const { user_id, title, description, category } = req.body;
        const record = await Complaint.create({
            user_id,
            title,
            description,
            category: category || 'General',
            status: 'pending'
        });
        res.status(201).json(record);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   PUT /api/extra-academic/complaints/:id
// @desc    Update complaint status (resolve/in-progress)
router.put('/complaints/:id', async (req, res) => {
    try {
        const record = await Complaint.findByPk(req.params.id);
        if (!record) return res.status(404).json({ msg: 'Complaint not found' });
        
        await record.update({ status: req.body.status });
        res.json(record);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET /api/extra-academic/complaints/user/:userId
// @desc    List complaints filed by a specific user
router.get('/complaints/user/:userId', async (req, res) => {
    try {
        const list = await sequelize.query(`
            SELECT c.*, u.name as reporter_name, u.role as reporter_role
            FROM complaints c
            JOIN users u ON c.user_id = u.id
            WHERE c.user_id = :userId
            ORDER BY c.created_at DESC
        `, { 
            replacements: { userId: req.params.userId },
            type: sequelize.QueryTypes.SELECT 
        });
        res.json(list);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   DELETE /api/extra-academic/complaints/:id
// @desc    Delete a complaint
router.delete('/complaints/:id', async (req, res) => {
    try {
        const record = await Complaint.findByPk(req.params.id);
        if (!record) return res.status(404).json({ msg: 'Complaint not found' });
        await record.destroy();
        res.json({ msg: 'Complaint deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// --- Announcements ---
// @route   GET /api/extra-academic/announcements
// @desc    Get all broadcast announcements matching tenant
router.get('/announcements', async (req, res) => {
    try {
        const tenantId = req.tenantId || 1;
        const list = await Announcement.findAll({ 
            order: [['created_at', 'DESC']],
            bypassTenant: true
        });
        
        // Filter announcements targeted to this tenant
        const filtered = list.filter(ann => {
            if (ann.target_type === 'all') return true;
            if (ann.target_type === 'specific') {
                const ids = ann.target_institutes ? ann.target_institutes.split(',').map(Number) : [];
                return ids.includes(Number(tenantId));
            }
            return false;
        });

        res.json(filtered);
    } catch (err) {
        console.error('Fetch tenant announcements error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/extra-academic/announcements
// @desc    Broadcast a new announcement
router.post('/announcements', async (req, res) => {
    try {
        const { title, content } = req.body;
        const newAnn = await Announcement.create({ title, content });
        res.status(201).json(newAnn);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// --- Events ---
// @route   GET /api/extra-academic/events
// @desc    Get all calendar events
router.get('/events', async (req, res) => {
    try {
        const list = await Event.findAll({ order: [['date', 'ASC']] });
        res.json(list);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/extra-academic/events
// @desc    Create new event
router.post('/events', async (req, res) => {
    try {
        const { title, description, date, time, location } = req.body;
        const newEvent = await Event.create({ title, description, date, time, location });
        res.status(201).json(newEvent);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// --- Chat Messages ---
// @route   GET /api/extra-academic/chats
// @desc    Get chat logs between two users
router.get('/chats', async (req, res) => {
    try {
        const { sender_id, receiver_id } = req.query;
        if (!sender_id || !receiver_id) return res.status(400).json({ msg: 'Missing sender or receiver ID' });

        const history = await Chat.findAll({
            where: {
                [Op.or]: [
                    { sender_id, receiver_id },
                    { sender_id: receiver_id, receiver_id: sender_id }
                ]
            },
            order: [['created_at', 'ASC']]
        });
        res.json(history);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/extra-academic/chats
// @desc    Send a direct message
router.post('/chats', async (req, res) => {
    try {
        const { sender_id, receiver_id, message } = req.body;
        const newMsg = await Chat.create({ sender_id, receiver_id, message });
        res.status(201).json(newMsg);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
