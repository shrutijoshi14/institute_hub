const express = require('express');
const router = express.Router();
const { Batch, Faculty, BatchFaculty } = require('../models/associations');

// @route   GET /api/batches
// @desc    Get all batches with their assigned faculty
router.get('/', async (req, res) => {
    try {
        const batches = await Batch.findAll({
            include: [{ model: Faculty, attributes: ['id', 'name', 'subject_expertise'] }]
        });
        res.json(batches);
    } catch (err) {
        console.error('Fetch Batches Error:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/batches
// @desc    Add a batch
router.post('/', async (req, res) => {
    try {
        const { name, standard, board, timing, facultyIds } = req.body;
        if (!name || !standard || !timing) {
            return res.status(400).json({ msg: 'Name, standard, and timing are required' });
        }
        
        const newBatch = await Batch.create({ name, standard, board: board || 'State Board', timing });
        
        if (facultyIds && facultyIds.length > 0) {
            const faculties = await Faculty.findAll({ where: { id: facultyIds } });
            await newBatch.addFaculties(faculties);
        }

        const batchWithFaculty = await Batch.findByPk(newBatch.id, {
            include: [{ model: Faculty, attributes: ['id', 'name', 'subject_expertise'] }]
        });

        res.status(201).json(batchWithFaculty);
    } catch (err) {
        console.error('Add Batch Error:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   PUT /api/batches/:id
// @desc    Update a batch
router.put('/:id', async (req, res) => {
    try {
        const batch = await Batch.findByPk(req.params.id);
        if (!batch) return res.status(404).json({ msg: 'Batch not found' });
        
        const { name, standard, board, timing, facultyIds } = req.body;
        await batch.update({ name, standard, board, timing });
        
        if (facultyIds) {
            const faculties = await Faculty.findAll({ where: { id: facultyIds } });
            await batch.setFaculties(faculties);
        }
        
        const updatedBatch = await Batch.findByPk(batch.id, {
            include: [{ model: Faculty, attributes: ['id', 'name', 'subject_expertise'] }]
        });
        
        res.json(updatedBatch);
    } catch (err) {
        console.error('Update Batch Error:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   DELETE /api/batches/:id
// @desc    Delete a batch
router.delete('/:id', async (req, res) => {
    try {
        const batch = await Batch.findByPk(req.params.id);
        if (!batch) return res.status(404).json({ msg: 'Batch not found' });
        
        await batch.destroy(); // Cascade takes care of join table if configured, but destroy is fine
        res.json({ msg: 'Batch deleted' });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
