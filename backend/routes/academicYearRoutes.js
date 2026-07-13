const express = require('express');
const router = express.Router();
const AcademicYear = require('../models/AcademicYear');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const { Op } = require('sequelize');

// @route   GET /api/academic-years
// @desc    Get all academic sessions
router.get('/', async (req, res) => {
    try {
        const sessions = await AcademicYear.findAll({ order: [['start_date', 'ASC']] });
        res.json(sessions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/academic-years
// @desc    Create a new academic session
router.post('/', async (req, res) => {
    const { name, start_date, end_date, is_active } = req.body;
    if (!name || !start_date || !end_date) {
        return res.status(400).json({ msg: 'Please enter all required fields' });
    }

    try {
        // Enforce only one active year per tenant
        if (is_active) {
            await AcademicYear.update({ is_active: false }, { where: { is_active: true } });
        }

        const newSession = await AcademicYear.create({
            name,
            start_date,
            end_date,
            is_active: !!is_active
        });

        res.status(201).json(newSession);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   PUT /api/academic-years/:id
// @desc    Update / Activate an academic session
router.put('/:id', async (req, res) => {
    try {
        const session = await AcademicYear.findByPk(req.params.id);
        if (!session) return res.status(404).json({ msg: 'Session not found' });

        const { is_active, name, start_date, end_date } = req.body;

        // If activating, set all others to inactive
        if (is_active && !session.is_active) {
            await AcademicYear.update({ is_active: false }, { where: { is_active: true } });
        }

        await session.update({
            name: name || session.name,
            start_date: start_date || session.start_date,
            end_date: end_date || session.end_date,
            is_active: is_active !== undefined ? is_active : session.is_active
        });

        res.json(session);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   DELETE /api/academic-years/:id
// @desc    Delete a session
router.delete('/:id', async (req, res) => {
    try {
        const session = await AcademicYear.findByPk(req.params.id);
        if (!session) return res.status(404).json({ msg: 'Session not found' });
        
        if (session.is_active) {
            return res.status(400).json({ msg: 'Cannot delete the active academic year.' });
        }

        await session.destroy();
        res.json({ msg: 'Session deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/academic-years/promote
// @desc    Batch promote students to new standard/batch/course for new session
router.post('/promote', async (req, res) => {
    const { studentIds, targetYearName, toCourseId, toBatchId, toStandard } = req.body;
    
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ msg: 'Please specify student IDs to promote' });
    }
    if (!targetYearName || !toCourseId || !toBatchId || !toStandard) {
        return res.status(400).json({ msg: 'Missing promotion parameters: year, course, batch, or standard' });
    }

    try {
        // Verify academic year exists
        const year = await AcademicYear.findOne({ where: { name: targetYearName } });
        if (!year) {
            return res.status(404).json({ msg: `Target academic year '${targetYearName}' not found` });
        }

        console.log(`🚀 Promoting ${studentIds.length} students to ${toStandard} (${targetYearName})`);

        // Batch update
        for (const studentId of studentIds) {
            const student = await User.findByPk(studentId);
            if (student && student.role === 'student') {
                // 1. Create a new enrollment record for this new academic year (preserving old enrollment records as history)
                await Enrollment.create({
                    student_id: studentId,
                    course_id: toCourseId,
                    batch_id: toBatchId,
                    batch_year: targetYearName,
                    fee_plan: 'One-time',
                    total_installments: 1,
                    installment_amount: 0.00
                });

                // 2. Update current active class (standard) inside student profile
                const Student = require('../models/Student');
                await Student.update({ standard: toStandard }, { where: { user_id: studentId } });
            }
        }

        res.json({ msg: `Successfully promoted ${studentIds.length} students to ${toStandard} for ${targetYearName}!` });
    } catch (err) {
        console.error('Promotion error:', err);
        res.status(500).json({ msg: 'Server Error during student promotion' });
    }
});

module.exports = router;
