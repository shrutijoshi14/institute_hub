const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/db');
const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');
const Notice = require('../models/Notice');
const Result = require('../models/Result');
const Submission = require('../models/Submission');

// Ensure tables are synced (for dev)
Submission.sync();

// @route   GET /api/academic/attendance/:studentId
router.get('/attendance/:studentId', async (req, res) => {
    try {
        const data = await Attendance.findAll({ where: { student_id: req.params.studentId } });
        res.json(data);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/academic/results/:studentId
router.get('/results/:studentId', async (req, res) => {
    try {
        const data = await Result.findAll({ where: { student_id: req.params.studentId } });
        res.json(data);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/academic/notices
router.get('/notices', async (req, res) => {
    try {
        const data = await Notice.findAll({ order: [['created_at', 'DESC']] });
        res.json(data);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/academic/assignments/all
router.get('/assignments/all', async (req, res) => {
    try {
        const data = await sequelize.query(`
            SELECT a.*, c.title as course_title, c.class_range as standard, c.board as board, c.exam_target as exam_target
            FROM assignments a
            JOIN courses c ON a.course_id = c.id
        `, { type: sequelize.QueryTypes.SELECT });
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/academic/assignments/:courseId
router.get('/assignments/:courseId', async (req, res) => {
    try {
        const data = await Assignment.findAll({ where: { course_id: req.params.courseId } });
        res.json(data);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/academic/student/assignments/:studentId
router.get('/student/assignments/:studentId', async (req, res) => {
    try {
        const Enrollment = require('../models/Enrollment');
        const enrollment = await Enrollment.findOne({ where: { student_id: req.params.studentId } });
        if (!enrollment) {
            return res.json([]);
        }
        const data = await Assignment.findAll({ where: { course_id: enrollment.course_id } });
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/academic/admin/reports
router.get('/admin/reports', async (req, res) => {
    try {
        const { standard } = req.query;
        let standardFilter = "";
        if (standard && standard !== 'All') {
            standardFilter = ` AND c.class_range = ${sequelize.escape(standard)} `;
        }

        const attendanceReport = await sequelize.query(`
            SELECT 
                u.id as student_id, 
                u.name as student_name,
                e.batch_id as batch_id,
                c.class_range as standard,
                c.board as board,
                c.exam_target as exam_target,
                COUNT(a.id) as total_days,
                COALESCE(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END), 0) as present_days
            FROM users u
            LEFT JOIN attendance a ON u.id = a.student_id
            LEFT JOIN enrollments e ON u.id = e.student_id
            LEFT JOIN courses c ON e.course_id = c.id
            WHERE u.role = 'student' ${standardFilter}
            GROUP BY u.id, u.name, e.batch_id, c.class_range, c.board, c.exam_target
        `, { type: sequelize.QueryTypes.SELECT });

        const performanceReport = await sequelize.query(`
            SELECT 
                u.id as student_id, 
                u.name as student_name,
                e.batch_id as batch_id,
                COALESCE(AVG(r.marks_obtained), 0) as average_marks
            FROM users u
            LEFT JOIN results r ON u.id = r.student_id
            LEFT JOIN enrollments e ON u.id = e.student_id
            LEFT JOIN courses c ON e.course_id = c.id
            WHERE u.role = 'student' ${standardFilter}
            GROUP BY u.id, u.name, e.batch_id
        `, { type: sequelize.QueryTypes.SELECT });

        const recentAttendance = await sequelize.query(`
            SELECT a.*, u.name as student_name,
                   b.name as batch_name, b.standard as standard,
                   c.subject as subject, c.title as topic
            FROM attendance a 
            JOIN users u ON a.student_id = u.id 
            LEFT JOIN batch_progress bp ON a.batch_progress_id = bp.id
            LEFT JOIN batches b ON bp.batch_id = b.id
            LEFT JOIN courses c ON bp.course_id = c.id
            WHERE 1=1 ${standard && standard !== 'All' ? ` AND u.id IN (SELECT student_id FROM enrollments e JOIN batches b2 ON e.batch_id = b2.id WHERE b2.standard = ${sequelize.escape(standard)}) ` : ""}
            ORDER BY a.date DESC LIMIT 5
        `, { type: sequelize.QueryTypes.SELECT });

        const recentResults = await sequelize.query(`
            SELECT r.*, u.name as student_name 
            FROM results r 
            JOIN users u ON r.student_id = u.id 
            WHERE 1=1 ${standard && standard !== 'All' ? ` AND u.id IN (SELECT student_id FROM enrollments e JOIN batches b2 ON e.batch_id = b2.id WHERE b2.standard = ${sequelize.escape(standard)}) ` : ""}
            ORDER BY r.exam_date DESC LIMIT 5
        `, { type: sequelize.QueryTypes.SELECT });

        res.json({ attendanceReport, performanceReport, recentAttendance, recentResults });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/academic/admin/history/:type
router.get('/admin/history/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const { standard } = req.query;
        let standardFilter = "";
        if (standard && standard !== 'All') {
            standardFilter = ` AND c.class_range = ${sequelize.escape(standard)} `;
        }

        let query = "";
        if (type === 'attendance') {
            query = `
                SELECT a.*, u.name as student_name,
                       COALESCE(b.name, b2.name) as batch_name,
                       COALESCE(b.standard, b2.standard) as standard,
                       b2.board as board,
                       c2.exam_target as exam_target,
                       COALESCE(bp.batch_id, e.batch_id) as batch_id,
                       c.subject as subject, c.title as topic
                FROM attendance a 
                JOIN users u ON a.student_id = u.id 
                LEFT JOIN batch_progress bp ON a.batch_progress_id = bp.id
                LEFT JOIN batches b ON bp.batch_id = b.id
                LEFT JOIN courses c ON bp.course_id = c.id
                LEFT JOIN enrollments e ON a.student_id = e.student_id
                LEFT JOIN batches b2 ON e.batch_id = b2.id
                LEFT JOIN courses c2 ON e.course_id = c2.id
                WHERE 1=1 ${standard && standard !== 'All' ? ` AND u.id IN (SELECT student_id FROM enrollments e JOIN batches b2 ON e.batch_id = b2.id WHERE b2.standard = ${sequelize.escape(standard)}) ` : ""}
                ORDER BY a.date DESC LIMIT 500
            `;
        } else {
            query = `
                SELECT r.*, u.name as student_name 
                FROM results r 
                JOIN users u ON r.student_id = u.id 
                WHERE 1=1 ${standard && standard !== 'All' ? ` AND u.id IN (SELECT student_id FROM enrollments e JOIN batches b2 ON e.batch_id = b2.id WHERE b2.standard = ${sequelize.escape(standard)}) ` : ""}
                ORDER BY r.exam_date DESC LIMIT 500
            `;
        }
        const history = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT });
        res.json(history);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/academic/notices
router.post('/notices', async (req, res) => {
    try {
        const { title, content, target_role, target_standard, target_board, target_exam, target_batch } = req.body;
        if (!title || !content) {
            return res.status(400).json({ msg: 'Please provide title and content.' });
        }
        const newNotice = await Notice.create({ 
            title, 
            content, 
            target_role: target_role || 'all',
            target_standard: target_standard || 'All',
            target_board: target_board || 'All',
            target_exam: target_exam || 'All',
            target_batch: target_batch || 'All'
        });
        res.status(201).json(newNotice);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Attendance Management
router.post('/attendance', async (req, res) => {
    try {
        const { student_id, date, status } = req.body;
        const newRecord = await Attendance.create({ student_id, date, status });
        res.status(201).json(newRecord);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.put('/attendance/:id', async (req, res) => {
    try {
        const record = await Attendance.findByPk(req.params.id);
        if (!record) return res.status(404).json({ msg: 'Record not found' });
        await record.update(req.body);
        res.json(record);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.delete('/attendance/:id', async (req, res) => {
    try {
        const record = await Attendance.findByPk(req.params.id);
        if (!record) return res.status(404).json({ msg: 'Record not found' });
        await record.destroy();
        res.json({ msg: 'Attendance deleted' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Results Management
router.post('/results', async (req, res) => {
    try {
        const { student_id, subject, marks_obtained, total_marks, exam_date, comments } = req.body;
        const newResult = await Result.create({ student_id, subject, marks_obtained, total_marks, exam_date, comments });
        res.status(201).json(newResult);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.put('/results/:id', async (req, res) => {
    try {
        const result = await Result.findByPk(req.params.id);
        if (!result) return res.status(404).json({ msg: 'Result not found' });
        await result.update(req.body);
        res.json(result);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.delete('/results/:id', async (req, res) => {
    try {
        const result = await Result.findByPk(req.params.id);
        if (!result) return res.status(404).json({ msg: 'Result not found' });
        await result.destroy();
        res.json({ msg: 'Result deleted' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Assignments Management
router.post('/assignments', async (req, res) => {
    try {
        const { course_id, title, description, due_date } = req.body;
        const newAssignment = await Assignment.create({ course_id, title, description, due_date });
        res.status(201).json(newAssignment);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.put('/assignments/:id', async (req, res) => {
    try {
        const assignment = await Assignment.findByPk(req.params.id);
        if (!assignment) return res.status(404).json({ msg: 'Not found' });
        await assignment.update(req.body);
        res.json(assignment);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.delete('/assignments/:id', async (req, res) => {
    try {
        const assignment = await Assignment.findByPk(req.params.id);
        if (!assignment) return res.status(404).json({ msg: 'Not found' });
        await assignment.destroy();
        res.json({ msg: 'Deleted' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Notices Management missing PUT & DELETE
router.put('/notices/:id', async (req, res) => {
    try {
        const notice = await Notice.findByPk(req.params.id);
        if (!notice) return res.status(404).json({ msg: 'Not found' });
        await notice.update(req.body);
        res.json(notice);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.delete('/notices/:id', async (req, res) => {
    try {
        const notice = await Notice.findByPk(req.params.id);
        if (!notice) return res.status(404).json({ msg: 'Not found' });
        await notice.destroy();
        res.json({ msg: 'Deleted' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/academic/student/dashboard/:studentId
router.get('/student/dashboard/:studentId', async (req, res) => {
    try {
        const studentId = req.params.studentId;
        
        // Attendance %
        const attendance = await sequelize.query(`
            SELECT 
                COUNT(*) as total_days,
                COALESCE(SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END), 0) as present_days
            FROM attendance
            WHERE student_id = ?
        `, { replacements: [studentId], type: sequelize.QueryTypes.SELECT });
        
        const row = attendance[0] || {};
        const totalDays = parseInt(row.total_days) || 0;
        const presentDays = parseInt(row.present_days) || 0;
        const attendancePerc = totalDays > 0 ? Math.round((presentDays * 100) / totalDays) : 0;

        // Pending Assignments (assignments in student's course)
        // Simplified: Count assignments with no submission (placeholder logic)
        const pendingTasks = await Assignment.count(); 

        // Registered Courses count
        const enrollment = await sequelize.query(`
            SELECT COUNT(*) as count FROM enrollments WHERE student_id = ?
        `, { replacements: [studentId], type: sequelize.QueryTypes.SELECT });

        // Latest Notice
        const latestNotice = await Notice.findOne({ order: [['created_at', 'DESC']] });

        // Fee stats
        const enrollRec = await sequelize.query(`
            SELECT course_id FROM enrollments WHERE student_id = ?
        `, { replacements: [studentId], type: sequelize.QueryTypes.SELECT });

        let totalFees = 0;
        if (enrollRec[0] && enrollRec[0].course_id) {
            const courseRec = await sequelize.query(`
                SELECT fees FROM courses WHERE id = ?
            `, { replacements: [enrollRec[0].course_id], type: sequelize.QueryTypes.SELECT });
            totalFees = parseFloat(courseRec[0]?.fees || 0);
        }

        const paidRec = await sequelize.query(`
            SELECT SUM(amount_paid) as total FROM fee_payments WHERE student_id = ?
        `, { replacements: [studentId], type: sequelize.QueryTypes.SELECT });
        const totalPaid = parseFloat(paidRec[0]?.total || 0);
        const totalPending = totalFees - totalPaid;

        res.json({
            attendancePerc,
            pendingTasks,
            courseCount: enrollment[0].count,
            latestNotice,
            totalFees,
            totalPaid,
            totalPending: totalPending > 0 ? totalPending : 0
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Submissions Management (Students)
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) return cb(null, true);
        cb(new Error('Only JPEG, PNG, and PDF files are allowed!'));
    }
});

router.post('/submissions', upload.single('assignment_file'), async (req, res) => {
    try {
        const { assignment_id, student_id } = req.body;
        const file_path = req.file ? req.file.path : null;

        if (!assignment_id || !student_id) {
            return res.status(400).json({ msg: 'Missing student or assignment ID.' });
        }
        
        // Update model to include file_path
        const newSubmission = await Submission.create({ 
            assignment_id, 
            student_id,
            submission_date: new Date(),
            file_path: file_path
        });
        
        res.status(201).json({ msg: 'Assignment submitted successfully!', data: newSubmission });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// GET all submissions for a course/admin view
router.get('/submissions/all', async (req, res) => {
    try {
        const submissions = await sequelize.query(`
            SELECT s.*, u.name as student_name, a.title as assignment_title,
                   c.class_range as standard, c.board as board, c.exam_target as exam_target,
                   e.batch_id as batch_id
            FROM submissions s
            JOIN users u ON s.student_id = u.id
            JOIN assignments a ON s.assignment_id = a.id
            JOIN courses c ON a.course_id = c.id
            LEFT JOIN enrollments e ON e.student_id = u.id
            ORDER BY s.submission_date DESC
        `, { type: sequelize.QueryTypes.SELECT });
        res.json(submissions);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/academic/submissions/:id
// @desc    Grade/check a student submission (Faculty/Admin only)
router.put('/submissions/:id', async (req, res) => {
    try {
        const { status, marks, feedback } = req.body;
        const submission = await Submission.findByPk(req.params.id);
        if (!submission) return res.status(404).json({ msg: 'Submission not found' });
        
        await submission.update({
            status: status || submission.status,
            marks: marks !== undefined ? marks : submission.marks,
            feedback: feedback !== undefined ? feedback : submission.feedback
        });
        
        res.json({ msg: 'Submission updated successfully!', data: submission });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/academic/submissions/student/:studentId
// @desc    Get submissions made by a specific student
router.get('/submissions/student/:studentId', async (req, res) => {
    try {
        const submissions = await Submission.findAll({
            where: { student_id: req.params.studentId }
        });
        res.json(submissions);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/academic/admin/finance/summary
router.get('/admin/finance/summary', async (req, res) => {
    try {
        const { standard } = req.query;
        let standardFilterCourse = "";
        let standardFilterPayment = "";
        
        if (standard && standard !== 'All') {
            const escapedStandard = sequelize.escape(standard);
            standardFilterCourse = ` WHERE c.class_range = ${escapedStandard} `;
            standardFilterPayment = ` WHERE student_id IN (SELECT student_id FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE c.class_range = ${escapedStandard}) `;
        }

        const stats = await sequelize.query(`
            SELECT 
                (SELECT SUM(fees) FROM courses c JOIN enrollments e ON c.id = e.course_id ${standardFilterCourse}) as total_expected,
                (SELECT SUM(amount_paid) FROM fee_payments ${standardFilterPayment}) as total_collected
        `, { type: sequelize.QueryTypes.SELECT });
        
        const summary = stats[0] || { total_expected: 0, total_collected: 0 };
        res.json({
            totalExpected: parseFloat(summary.total_expected) || 0,
            totalCollected: parseFloat(summary.total_collected) || 0,
            totalPending: (parseFloat(summary.total_expected) || 0) - (parseFloat(summary.total_collected) || 0)
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/academic/admin/batch/students/:courseId
router.get('/admin/batch/students/:courseId', async (req, res) => {
    try {
        const students = await sequelize.query(`
            SELECT u.id, u.name, u.email, u.phone, e.batch_year
            FROM users u
            JOIN enrollments e ON u.id = e.student_id
            WHERE e.course_id = ? AND u.role = 'student'
        `, { replacements: [req.params.courseId], type: sequelize.QueryTypes.SELECT });
        res.json(students);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.put('/notices/:id', async (req, res) => {
    try {
        const notice = await Notice.findByPk(req.params.id);
        if (!notice) return res.status(404).json({ msg: 'Notice not found' });
        const { title, content, target_role, target_standard, target_board, target_exam, target_batch } = req.body;
        await notice.update({ 
            title, 
            content, 
            target_role: target_role || 'all',
            target_standard: target_standard || 'All',
            target_board: target_board || 'All',
            target_exam: target_exam || 'All',
            target_batch: target_batch || 'All'
        });
        res.json(notice);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.delete('/notices/:id', async (req, res) => {
    try {
        const notice = await Notice.findByPk(req.params.id);
        if (!notice) return res.status(404).json({ msg: 'Notice not found' });
        await notice.destroy();
        res.json({ msg: 'Notice deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
