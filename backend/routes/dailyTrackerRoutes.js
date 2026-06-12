const express = require('express');
const router = express.Router();
const { Batch, Course, Enrollment, User, BatchProgress, Attendance } = require('../models/associations');
const { sequelize } = require('../config/db');

// @route   GET /api/daily-tracker/subjects
// @desc    Get subjects for a specific standard and board
router.get('/subjects', async (req, res) => {
    try {
        const { standard, board } = req.query;
        if (!standard) return res.status(400).json({ msg: 'Standard is required' });

        const whereClause = { class_range: standard };
        if (board) whereClause.board = board;

        const courses = await Course.findAll({
            where: whereClause,
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('subject')), 'subject']],
            raw: true
        });

        res.json(courses.map(c => c.subject));
    } catch (err) {
        console.error('Fetch Subjects Error:', err);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/daily-tracker/topics
// @desc    Get topics (Courses) for a specific standard, board, and subject
router.get('/topics', async (req, res) => {
    try {
        const { standard, board, subject } = req.query;
        if (!standard || !subject) return res.status(400).json({ msg: 'Standard and subject are required' });

        const whereClause = { class_range: standard, subject };
        if (board) whereClause.board = board;

        const topics = await Course.findAll({ where: whereClause, order: [['id', 'ASC']] });
        res.json(topics);
    } catch (err) {
        console.error('Fetch Topics Error:', err);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/daily-tracker/students/:batch_id
// @desc    Get students enrolled in a specific batch
router.get('/students/:batch_id', async (req, res) => {
    try {
        const enrollments = await Enrollment.findAll({
            where: { batch_id: req.params.batch_id },
            include: [{ model: User, attributes: ['id', 'name', 'username'] }]
        });

        const students = enrollments.map(e => e.User).filter(Boolean);
        res.json(students);
    } catch (err) {
        console.error('Fetch Students Error:', err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/daily-tracker/submit
// @desc    Submit daily progress and attendance
router.post('/submit', async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { batch_id, course_id, date, status, remarks, attendance } = req.body;
        // attendance is an array of { student_id, status }

        if (!batch_id || !course_id || !date || !attendance) {
            return res.status(400).json({ msg: 'Missing required fields' });
        }

        // 1. Save or Update Batch Progress
        let progress = await BatchProgress.findOne({ where: { batch_id, course_id }, transaction: t });
        if (progress) {
            await progress.update({ status: status || 'Completed', remarks }, { transaction: t });
        } else {
            progress = await BatchProgress.create({
                batch_id,
                course_id,
                status: status || 'Completed',
                remarks: remarks || ''
            }, { transaction: t });
        }

        // 2. Save Attendance for each student
        for (const record of attendance) {
            // Check if record exists for this date and student and batch_progress_id
            let existingAtt = await Attendance.findOne({
                where: { 
                    student_id: record.student_id, 
                    date: date,
                    batch_progress_id: progress.id
                },
                transaction: t
            });

            if (existingAtt) {
                await existingAtt.update({ status: record.status }, { transaction: t });
            } else {
                await Attendance.create({
                    student_id: record.student_id,
                    date: date,
                    status: record.status,
                    batch_progress_id: progress.id
                }, { transaction: t });
            }
        }

        await t.commit();
        res.json({ msg: 'Daily Tracker submitted successfully' });
    } catch (err) {
        await t.rollback();
        console.error('Submit Daily Tracker Error:', err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
