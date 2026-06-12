const express = require('express');
const router = express.Router();
const Faculty = require('../models/Faculty');
const { getDomain } = require('../config/domainHelper');
const User = require('../models/User');

// @route   GET /api/faculty
// @desc    Get all faculty members
router.get('/', async (req, res) => {
    try {
        const { Batch } = require('../models/associations');
        const faculty = await Faculty.findAll({
            include: [{ model: Batch, attributes: ['id', 'name', 'timing', 'standard'] }]
        });
        res.json(faculty);
    } catch (err) {
        console.error('Fetch Faculty Error:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/faculty
// @desc    Add a faculty member
router.post('/', async (req, res) => {
    try {
        const { name, qualification, experience, subject_expertise } = req.body;
        if (!name || !qualification) return res.status(400).json({ msg: 'Name and qualification are required' });
        
        const newFaculty = await Faculty.create({ name, qualification, experience, subject_expertise });
        
        // Auto-create a user account for the faculty
        const email = `${name.split(' ')[0].toLowerCase()}@${getDomain()}`;
        await User.create({
            name,
            email,
            password: 'password123', // Default simple password representing their login
            role: 'faculty',
            phone: '0000000000'
        });

        res.status(201).json(newFaculty);
    } catch (err) {
        console.error('Add Faculty Error:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   PUT /api/faculty/:id
// @desc    Update a faculty member
router.put('/:id', async (req, res) => {
    try {
        const faculty = await Faculty.findByPk(req.params.id);
        if (!faculty) return res.status(404).json({ msg: 'Faculty not found' });
        
        await faculty.update(req.body);
        res.json(faculty);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   DELETE /api/faculty/:id
// @desc    Delete a faculty member
router.delete('/:id', async (req, res) => {
    try {
        const faculty = await Faculty.findByPk(req.params.id);
        if (!faculty) return res.status(404).json({ msg: 'Faculty not found' });
        
        await faculty.destroy();
        res.json({ msg: 'Faculty deleted' });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
