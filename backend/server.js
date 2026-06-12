const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { connectDB } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check Endpoint for Render deployment validation
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

// Connect Database
connectDB();

// Initialize Associations
require('./models/associations');

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/enquiry', require('./routes/enquiryRoutes'));
app.use('/api/results', require('./routes/resultRoutes'));
app.use('/api/faculty', require('./routes/facultyRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/batches', require('./routes/batchRoutes'));
app.use('/api/progress', require('./routes/batchProgressRoutes'));
app.use('/api/registration', require('./routes/registrationRoutes'));
app.use('/api/fees', require('./routes/feeRoutes'));
app.use('/api/academic', require('./routes/academicRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/daily-tracker', require('./routes/dailyTrackerRoutes'));

app.use('/api/super-admin', require('./routes/superAdminRoutes'));
app.use('/api/accountant', require('./routes/accountantRoutes'));
app.use('/api/receptionist', require('./routes/receptionistRoutes'));
app.use('/api/library', require('./routes/libraryRoutes'));
app.use('/api/transport', require('./routes/transportRoutes'));
app.use('/api/extra-academic', require('./routes/extraAcademicRoutes'));

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
