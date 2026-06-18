const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/db');
const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');
const Notice = require('../models/Notice');
const Result = require('../models/Result');
const Submission = require('../models/Submission');
const BatchProgress = require('../models/BatchProgress');

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
            standardFilter = ` AND (c.class_range = ${sequelize.escape(standard)} OR u.standard = ${sequelize.escape(standard)}) `;
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
                AVG(r.marks_obtained) as average_marks
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
            WHERE 1=1 ${standard && standard !== 'All' ? ` AND (u.standard = ${sequelize.escape(standard)} OR u.id IN (SELECT student_id FROM enrollments e JOIN batches b2 ON e.batch_id = b2.id WHERE b2.standard = ${sequelize.escape(standard)})) ` : ""}
            ORDER BY a.date DESC LIMIT 5
        `, { type: sequelize.QueryTypes.SELECT });

        const recentResults = await sequelize.query(`
            SELECT r.*, u.name as student_name 
            FROM results r 
            JOIN users u ON r.student_id = u.id 
            WHERE 1=1 ${standard && standard !== 'All' ? ` AND (u.standard = ${sequelize.escape(standard)} OR u.id IN (SELECT student_id FROM enrollments e JOIN batches b2 ON e.batch_id = b2.id WHERE b2.standard = ${sequelize.escape(standard)})) ` : ""}
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
                WHERE 1=1 ${standard && standard !== 'All' ? ` AND (u.standard = ${sequelize.escape(standard)} OR u.id IN (SELECT student_id FROM enrollments e JOIN batches b2 ON e.batch_id = b2.id WHERE b2.standard = ${sequelize.escape(standard)})) ` : ""}
                ORDER BY a.date DESC LIMIT 500
            `;
        } else {
            query = `
                SELECT r.*, u.name as student_name 
                FROM results r 
                JOIN users u ON r.student_id = u.id 
                WHERE 1=1 ${standard && standard !== 'All' ? ` AND (u.standard = ${sequelize.escape(standard)} OR u.id IN (SELECT student_id FROM enrollments e JOIN batches b2 ON e.batch_id = b2.id WHERE b2.standard = ${sequelize.escape(standard)})) ` : ""}
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
        let payload = [];
        if (Array.isArray(req.body)) {
            payload = req.body;
        } else if (req.body.records && Array.isArray(req.body.records)) {
            payload = req.body.records;
        }

        let batch_progress_id = req.body.batch_progress_id;
        if (!batch_progress_id && payload.length > 0) {
            batch_progress_id = payload[0].batch_progress_id;
        }

        if (batch_progress_id) {
            const bp = await BatchProgress.findByPk(batch_progress_id);
            if (bp && bp.status !== 'Completed') {
                return res.status(400).json({ msg: "Attendance can only be submitted after the class is marked as Completed." });
            }
        }

        if (payload.length > 0) {
            // Delete existing records for these students on these dates/class sessions to avoid duplicates
            for (const rec of payload) {
                await Attendance.destroy({
                    where: {
                        student_id: rec.student_id,
                        date: rec.date,
                        ...(rec.batch_progress_id ? { batch_progress_id: rec.batch_progress_id } : {})
                    }
                });
            }
            const records = await Attendance.bulkCreate(payload);
            res.status(201).json(records);
        } else {
            const { student_id, date, status } = req.body;
            // Delete existing single entry first to prevent duplicate
            await Attendance.destroy({
                where: {
                    student_id,
                    date,
                    ...(batch_progress_id ? { batch_progress_id } : {})
                }
            });
            const newRecord = await Attendance.create({ student_id, date, status, batch_progress_id });
            res.status(201).json(newRecord);
        }
    } catch (err) {
        console.error(err);
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
        const Enrollment = require('../models/Enrollment');
        const enrollObj = await Enrollment.findOne({ where: { student_id: studentId } });
        let pendingTasks = 0;
        if (enrollObj) {
            const courseId = enrollObj.course_id;
            const courseAssignments = await Assignment.findAll({ where: { course_id: courseId } });
            const assignmentIds = courseAssignments.map(a => a.id);
            if (assignmentIds.length > 0) {
                const submittedCount = await Submission.count({
                    where: {
                        student_id: studentId,
                        assignment_id: assignmentIds
                    }
                });
                pendingTasks = Math.max(0, assignmentIds.length - submittedCount);
            }
        }

        // Registered Courses count
        const enrollment = await sequelize.query(`
            SELECT COUNT(*) as count FROM enrollments WHERE student_id = ?
        `, { replacements: [studentId], type: sequelize.QueryTypes.SELECT });

        // Latest Notice
        const latestNotice = await Notice.findOne({ order: [['created_at', 'DESC']] });

        // Fee stats
        const Course = require('../models/Course');
        const enrollRec = await sequelize.query(`
            SELECT e.course_id, e.batch_id, u.standard 
            FROM enrollments e 
            JOIN users u ON e.student_id = u.id 
            WHERE e.student_id = ?
        `, { replacements: [studentId], type: sequelize.QueryTypes.SELECT });

        const userRec = await sequelize.query(`
            SELECT standard FROM users WHERE id = ?
        `, { replacements: [studentId], type: sequelize.QueryTypes.SELECT });
        const userStandard = userRec[0]?.standard;

        let totalFees = 0;
        if (enrollRec[0]) {
            const row = enrollRec[0];
            const course = row.course_id ? await Course.findByPk(row.course_id) : null;
            if (course && parseFloat(course.fees) > 0) {
                totalFees = parseFloat(course.fees);
            } else {
                const searchStandard = row.standard || userStandard || (row.batch_id ? (await sequelize.query('SELECT standard FROM batches WHERE id = ?', { replacements: [row.batch_id], type: sequelize.QueryTypes.SELECT }))[0]?.standard : null);
                const { getStandardFee } = require('../utils/feeHelper');
                totalFees = getStandardFee(searchStandard);
            }
        } else if (userStandard) {
            const { getStandardFee } = require('../utils/feeHelper');
            totalFees = getStandardFee(userStandard);
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
        const { getStandardFeeSqlFragment } = require('../utils/feeHelper');
        const feeSql = getStandardFeeSqlFragment('u.standard', 'e.batch_id');
        
        let expectedQuery = `
            SELECT SUM(COALESCE(NULLIF(c.fees, 0), ${feeSql})) as expected
            FROM enrollments e
            LEFT JOIN courses c ON e.course_id = c.id
            LEFT JOIN users u ON e.student_id = u.id
        `;
        
        let collectedQuery = `
            SELECT SUM(fp.amount_paid) as collected
            FROM fee_payments fp
            LEFT JOIN users u ON fp.student_id = u.id
        `;
        
        if (standard && standard !== 'All') {
            const escapedStandard = sequelize.escape(standard);
            expectedQuery += ` WHERE COALESCE(u.standard, (SELECT standard FROM batches WHERE id = e.batch_id)) = ${escapedStandard} `;
            collectedQuery += ` WHERE COALESCE(u.standard, (SELECT standard FROM batches b JOIN enrollments e ON b.id = e.batch_id WHERE e.student_id = u.id LIMIT 1)) = ${escapedStandard} `;
        }
        
        const expectedRes = await sequelize.query(expectedQuery, { type: sequelize.QueryTypes.SELECT });
        const collectedRes = await sequelize.query(collectedQuery, { type: sequelize.QueryTypes.SELECT });
        
        const expectedVal = parseFloat(expectedRes[0]?.expected) || 0;
        const collectedVal = parseFloat(collectedRes[0]?.collected) || 0;
        
        res.json({
            totalExpected: expectedVal,
            totalCollected: collectedVal,
            totalPending: expectedVal - collectedVal
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
