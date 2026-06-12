const express = require('express');
const router = express.Router();
const Course = require('../models/Course');

// @route   GET /api/courses
// @desc    Get all courses
router.get('/', async (req, res) => {
    try {
        const courses = await Course.findAll();
        res.json(courses);
    } catch (err) {
        console.error('Fetch Courses Error:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/courses
// @desc    Add a course
router.post('/', async (req, res) => {
    try {
        const { title, description, class_range, board, exam_target, fees, subject } = req.body;
        if (!title || !class_range || !board) return res.status(400).json({ msg: 'Title, class range, and board are required' });
        
        const newCourse = await Course.create({ 
            title, 
            description: description || '', 
            class_range,
            board,
            exam_target: exam_target || 'None',
            fees: fees || 0,
            subject: subject || 'General'
        });
        res.status(201).json(newCourse);
    } catch (err) {
        console.error('Add Course Error:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   PUT /api/courses/:id
// @desc    Update a course
router.put('/:id', async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.id);
        if (!course) return res.status(404).json({ msg: 'Course not found' });
        
        const { title, description, class_range, board, exam_target, fees, subject } = req.body;
        await course.update({ 
            title: title || course.title, 
            description: description !== undefined ? description : course.description, 
            class_range: class_range || course.class_range,
            board: board || course.board,
            exam_target: exam_target || course.exam_target,
            fees: fees !== undefined ? fees : course.fees 
        });
        res.json(course);
    } catch (err) {
        console.error('Update Course Error:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   DELETE /api/courses/:id
// @desc    Delete a course
router.delete('/:id', async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.id);
        if (!course) return res.status(404).json({ msg: 'Course not found' });
        
        await course.destroy();
        res.json({ msg: 'Course deleted' });
    } catch (err) {
        console.error('Delete Course Error:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
