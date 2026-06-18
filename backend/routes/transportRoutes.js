const express = require('express');
const router = express.Router();
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const TransportAssignment = require('../models/TransportAssignment');
const User = require('../models/User');
const { sequelize } = require('../config/db');

// @route   GET /api/transport/buses
// @desc    List all vehicles
router.get('/buses', async (req, res) => {
    try {
        const buses = await Bus.findAll();
        res.json(buses);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/transport/buses
// @desc    Create new bus
router.post('/buses', async (req, res) => {
    try {
        const { bus_number, capacity, driver_name, driver_phone, status } = req.body;
        const newBus = await Bus.create({ bus_number, capacity, driver_name, driver_phone, status });
        res.status(201).json(newBus);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   PUT /api/transport/buses/:id
// @desc    Update bus details
router.put('/buses/:id', async (req, res) => {
    try {
        const bus = await Bus.findByPk(req.params.id);
        if (!bus) return res.status(404).json({ msg: 'Bus not found' });
        await bus.update(req.body);
        res.json(bus);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   DELETE /api/transport/buses/:id
// @desc    Delete a bus
router.delete('/buses/:id', async (req, res) => {
    try {
        const bus = await Bus.findByPk(req.params.id);
        if (!bus) return res.status(404).json({ msg: 'Bus not found' });
        await bus.destroy();
        res.json({ msg: 'Bus deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET /api/transport/routes
// @desc    List all transport routes
router.get('/routes', async (req, res) => {
    try {
        const routes = await Route.findAll();
        res.json(routes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/transport/routes
// @desc    Create a transport route
router.post('/routes', async (req, res) => {
    try {
        const { route_name, start_point, end_point, stops, fee } = req.body;
        const newRoute = await Route.create({ route_name, start_point, end_point, stops, fee });
        res.status(201).json(newRoute);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   PUT /api/transport/routes/:id
// @desc    Update route details
router.put('/routes/:id', async (req, res) => {
    try {
        const route = await Route.findByPk(req.params.id);
        if (!route) return res.status(404).json({ msg: 'Route not found' });
        await route.update(req.body);
        res.json(route);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   DELETE /api/transport/routes/:id
// @desc    Delete route
router.delete('/routes/:id', async (req, res) => {
    try {
        const route = await Route.findByPk(req.params.id);
        if (!route) return res.status(404).json({ msg: 'Route not found' });
        await route.destroy();
        res.json({ msg: 'Route deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET /api/transport/assignments
// @desc    List all assigned students and vehicles
router.get('/assignments', async (req, res) => {
    try {
        const assignments = await sequelize.query(`
            SELECT ta.*, u.name as student_name, u.username as student_username,
                   r.route_name as route_name, r.fee as route_fee,
                   b.bus_number as bus_number, b.driver_name as driver_name
            FROM transport_assignments ta
            LEFT JOIN users u ON ta.student_id = u.id
            LEFT JOIN routes r ON ta.route_id = r.id
            LEFT JOIN buses b ON ta.bus_id = b.id
            ORDER BY ta.id DESC
        `, { type: sequelize.QueryTypes.SELECT });
        res.json(assignments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/transport/assignments
// @desc    Assign student to vehicle/route
router.post('/assignments', async (req, res) => {
    try {
        const { student_id, route_id, bus_id, pickup_point } = req.body;
        
        const student = await User.findOne({ where: { id: student_id, role: 'student' } });
        if (!student) return res.status(404).json({ msg: 'Student not found' });

        const route = await Route.findByPk(route_id);
        if (!route) return res.status(404).json({ msg: 'Route not found' });

        const bus = await Bus.findByPk(bus_id);
        if (!bus) return res.status(404).json({ msg: 'Bus not found' });

        const assignment = await TransportAssignment.create({
            student_id,
            route_id,
            bus_id,
            pickup_point
        });

        res.status(201).json(assignment);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   DELETE /api/transport/assignments/:id
// @desc    Remove student assignment
router.delete('/assignments/:id', async (req, res) => {
    try {
        const assignment = await TransportAssignment.findByPk(req.params.id);
        if (!assignment) return res.status(404).json({ msg: 'Assignment record not found' });
        await assignment.destroy();
        res.json({ msg: 'Student assignment removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
