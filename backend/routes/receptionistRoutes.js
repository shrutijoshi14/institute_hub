const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const { Op } = require('sequelize');

// @route   GET /api/receptionist/visitors
// @desc    Get all visitor logs
router.get('/visitors', async (req, res) => {
    try {
        const logs = await Visitor.findAll({ order: [['check_in', 'DESC']] });
        res.json(logs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/receptionist/visitors
// @desc    Add a new visitor (check-in)
router.post('/visitors', async (req, res) => {
    try {
        const { name, purpose, contact, remarks } = req.body;
        const newVisitor = await Visitor.create({
            name,
            purpose,
            contact,
            remarks,
            check_in: new Date()
        });
        res.status(201).json(newVisitor);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   PUT /api/receptionist/visitors/:id
// @desc    Check-out visitor
router.put('/visitors/:id', async (req, res) => {
    try {
        const log = await Visitor.findByPk(req.params.id);
        if (!log) return res.status(404).json({ msg: 'Visitor record not found' });
        
        await log.update({
            check_out: new Date(),
            remarks: req.body.remarks || log.remarks
        });
        res.json(log);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET /api/receptionist/appointments
// @desc    Get all appointments
router.get('/appointments', async (req, res) => {
    try {
        const list = await Appointment.findAll({ order: [['date', 'DESC'], ['time', 'ASC']] });
        res.json(list);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/receptionist/appointments
// @desc    Book an appointment
router.post('/appointments', async (req, res) => {
    try {
        const { visitor_name, parent_phone, host_name, date, time, reason } = req.body;
        const newAppt = await Appointment.create({
            visitor_name,
            parent_phone,
            host_name,
            date,
            time,
            reason,
            status: 'scheduled'
        });
        res.status(201).json(newAppt);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   PUT /api/receptionist/appointments/:id
// @desc    Update appointment status
router.put('/appointments/:id', async (req, res) => {
    try {
        const appt = await Appointment.findByPk(req.params.id);
        if (!appt) return res.status(404).json({ msg: 'Appointment not found' });
        
        await appt.update({ status: req.body.status });
        res.json(appt);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET /api/receptionist/search-student
// @desc    Quick search for student profile and details
router.get('/search-student', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.json([]);

        const students = await User.findAll({
            where: {
                role: 'student',
                [Op.or]: [
                    { name: { [Op.like]: `%${query}%` } },
                    { phone: { [Op.like]: `%${query}%` } },
                    { username: { [Op.like]: `%${query}%` } }
                ]
            },
            include: [
                {
                    model: Enrollment,
                    include: [Course]
                }
            ],
            limit: 10
        });

        res.json(students);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
