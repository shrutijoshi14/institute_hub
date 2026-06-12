const express = require('express');
const router = express.Router();
const Topper = require('../models/Topper');

// @route   GET /api/results
// @desc    Get all toppers
router.get('/', async (req, res) => {
    try {
        const toppers = await Topper.findAll();
        res.json(toppers);
    } catch (err) {
        console.error('Fetch Results Error:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/results
// @desc    Add a new topper (Admin function)
router.post('/', async (req, res) => {
    try {
        const { name, percentage, batch, class: className, image_url } = req.body;
        const newTopper = await Topper.create({ name, percentage, batch, class: className, image_url });
        res.status(201).json(newTopper);
    } catch (err) {
        console.error('Add Topper Error:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
