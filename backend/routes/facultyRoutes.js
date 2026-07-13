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

const { checkSubscriptionLimits } = require('../middleware/subscriptionMiddleware');

router.post('/', checkSubscriptionLimits, async (req, res) => {
    try {
        const { name, qualification, experience, subject_expertise } = req.body;
        if (!name || !qualification) return res.status(400).json({ msg: 'Name and qualification are required' });

        // Fetch current settings
        const tenantStorage = require('../config/tenantContext');
        const context = tenantStorage.getStore();
        const tenantId = context ? context.tenantId : 1;

        const Setting = require('../models/Setting');
        const { getSettings } = require('../config/settingsCache');
        const dbSettings = await Setting.findAll({ where: { tenant_id: tenantId } });
        const settingsMap = {};
        dbSettings.forEach(row => {
            try { settingsMap[row.key] = JSON.parse(row.value); } catch(e) { settingsMap[row.key] = row.value; }
        });
        const currentSettings = { ...getSettings(), ...settingsMap };

        const facultyLoginEnabled = currentSettings.portal_enable_faculty !== false;

        const { generateTempPassword, hashPassword } = require('../utils/passwordHelper');
        
        let tempPassword = null;
        let hashedPassword = '*';
        if (facultyLoginEnabled) {
            tempPassword = generateTempPassword();
            hashedPassword = await hashPassword(tempPassword);
        }

        // Auto-generate sequential username
        const count = await User.count({ where: { role: 'faculty' } });
        const seq = String(count + 1).padStart(2, '0');
        const resolvedUsername = `faculty${seq}`;

        const newFaculty = await Faculty.create({ name, qualification, experience, subject_expertise });
        
        // Auto-create a user account for the faculty
        const email = `${name.split(' ')[0].toLowerCase()}@${getDomain()}`;
        await User.create({
            name,
            email,
            password: hashedPassword, // Store ONLY bcrypt hash (or '*' if login disabled)
            role: 'faculty',
            phone: '0000000000',
            username: resolvedUsername,
            status: facultyLoginEnabled ? 'active' : 'inactive',
            must_change_password: facultyLoginEnabled
        });

        res.status(201).json({
            faculty: newFaculty,
            username: resolvedUsername,
            tempPassword: tempPassword
        });
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
