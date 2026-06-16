const express = require('express');
const router = express.Router();
const { BatchProgress, Batch, Course } = require('../models/associations');

// @route   GET /api/progress/:batch_id
// @desc    Get all syllabus progress for a specific batch
router.get('/:batch_id', async (req, res) => {
    try {
        const { batch_id } = req.params;
        const progress = await BatchProgress.findAll({
            where: { batch_id },
            include: [{ model: Course, attributes: ['id', 'title', 'subject', 'description'] }],
            order: [
                ['class_date', 'DESC'],
                ['class_time', 'DESC'],
                ['id', 'DESC']
            ]
        });
        res.json(progress);
    } catch (err) {
        console.error('BatchProgress Fetch Error:', err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/progress
// @desc    Update or create a syllabus progress record
router.post('/', async (req, res) => {
    try {
        const { batch_id, course_id, status, remarks, duration_hours, duration_minutes, class_time } = req.body;
        
        if (!batch_id || !course_id) {
            return res.status(400).json({ msg: 'batch_id and course_id are required' });
        }

        let progress = await BatchProgress.findOne({ where: { batch_id, course_id } });

        if (progress) {
            await progress.update({ 
                status: status || progress.status, 
                remarks: remarks !== undefined ? remarks : progress.remarks,
                duration_hours: duration_hours !== undefined ? duration_hours : progress.duration_hours,
                duration_minutes: duration_minutes !== undefined ? duration_minutes : progress.duration_minutes,
                class_time: class_time !== undefined ? class_time : progress.class_time
            });
        } else {
            progress = await BatchProgress.create({ 
                batch_id, 
                course_id, 
                status: status || 'Pending', 
                remarks: remarks || '',
                duration_hours,
                duration_minutes,
                class_time
            });
        }

        // Fetch it again to include the Course details
        const updatedProgress = await BatchProgress.findByPk(progress.id, {
            include: [{ model: Course, attributes: ['id', 'title', 'subject', 'description'] }]
        });

        res.json(updatedProgress);
    } catch (err) {
        console.error('BatchProgress Update Error:', err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/progress/schedule
// @desc    Schedule a class session
router.post('/schedule', async (req, res) => {
    try {
        const { batch_id, course_id, class_date, class_time, duration_hours, duration_minutes, remarks } = req.body;
        
        if (!batch_id || !course_id || !class_date) {
            return res.status(400).json({ msg: 'batch_id, course_id, and class_date are required' });
        }

        const progress = await BatchProgress.create({
            batch_id,
            course_id,
            class_date,
            class_time: class_time || '10:00 AM',
            duration_hours: duration_hours !== undefined ? duration_hours : 1,
            duration_minutes: duration_minutes !== undefined ? duration_minutes : 0,
            status: 'Pending',
            remarks: remarks || ''
        });

        const fullProgress = await BatchProgress.findByPk(progress.id, {
            include: [{ model: Course, attributes: ['id', 'title', 'subject', 'description'] }]
        });

        res.status(201).json(fullProgress);
    } catch (err) {
        console.error('Schedule Class Error:', err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/progress/:id
// @desc    Update a specific scheduled class progress record
router.put('/:id', async (req, res) => {
    try {
        const progress = await BatchProgress.findByPk(req.params.id);
        if (!progress) {
            return res.status(404).json({ msg: 'Class session not found' });
        }

        await progress.update(req.body);

        const updated = await BatchProgress.findByPk(progress.id, {
            include: [{ model: Course, attributes: ['id', 'title', 'subject', 'description'] }]
        });

        res.json(updated);
    } catch (err) {
        console.error('Update Class Session Error:', err);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/progress/:id
// @desc    Delete a specific scheduled class progress record
router.delete('/:id', async (req, res) => {
    try {
        const progress = await BatchProgress.findByPk(req.params.id);
        if (!progress) {
            return res.status(404).json({ msg: 'Class session not found' });
        }

        await progress.destroy();
        res.json({ msg: 'Class session deleted successfully' });
    } catch (err) {
        console.error('Delete Class Session Error:', err);
        res.status(500).send('Server Error');
    }
});


// @route   GET /api/progress/student/:student_id
// @desc    Get progress for all batches a student is in
// (If students are in batches based on standard, or if we have to look up the batch)
router.get('/student/:student_id', async (req, res) => {
    try {
        // For simplicity right now, if the frontend just passes standard, we can return batches for that standard
        // However, if we need standard from the frontend query:
        const standard = req.query.standard;
        if (!standard) return res.status(400).json({ msg: 'Standard query parameter is required' });

        const batches = await Batch.findAll({ where: { standard } });
        const batchIds = batches.map(b => b.id);

        const progress = await BatchProgress.findAll({
            where: { batch_id: batchIds },
            include: [
                { model: Course, attributes: ['id', 'title', 'subject', 'description'] },
                { model: Batch, attributes: ['id', 'name', 'standard'] }
            ]
        });

        res.json(progress);
    } catch (err) {
        console.error('Student Progress Error:', err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
