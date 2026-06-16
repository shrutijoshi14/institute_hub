require('dotenv').config({ override: true });
const mysql = require('mysql2/promise');
const { sequelize } = require('./config/db');

// Import all models
const User = require('./models/User');
const Course = require('./models/Course');
const Enrollment = require('./models/Enrollment');
const Faculty = require('./models/Faculty');
const Registration = require('./models/Registration');
const Result = require('./models/Result');
const Attendance = require('./models/Attendance');
const Notice = require('./models/Notice');
const FeePayment = require('./models/FeePayment');
const Assignment = require('./models/Assignment');
const Branch = require('./models/Branch');
const LibraryBook = require('./models/LibraryBook');
const IssuedBook = require('./models/IssuedBook');
const Bus = require('./models/Bus');
const Route = require('./models/Route');
const Hostel = require('./models/Hostel');
const Room = require('./models/Room');
const Expense = require('./models/Expense');
const Salary = require('./models/Salary');
const Leave = require('./models/Leave');
const Complaint = require('./models/Complaint');
const Announcement = require('./models/Announcement');
const Event = require('./models/Event');
const Visitor = require('./models/Visitor');
const Appointment = require('./models/Appointment');
const TransportAssignment = require('./models/TransportAssignment');

const seedData = async () => {
    try {
        const isMySQL = sequelize.getDialect() === 'mysql';

        // Safely check and create database if missing (normal on local environments)
        if (isMySQL) {
            try {
                console.log('Connecting to MySQL to verify database...');
                const connection = await mysql.createConnection({
                    host: process.env.DB_HOST || 'localhost',
                    user: process.env.DB_USER || 'root',
                    password: process.env.DB_PASSWORD,
                });
                
                await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'ambition_tutorials'}\`;`);
                console.log('Database verified/created!');
                await connection.end();
            } catch (dbErr) {
                console.log('Notice: Could not check/create database directly:', dbErr.message);
            }
        } else {
            console.log('Non-MySQL database detected. Skipping database creation step (database must exist on your hosted service).');
        }

        console.log('Syncing all Sequelize Models (forcing recreation)...');
        await sequelize.authenticate();
        
        if (isMySQL) {
            await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
        }
        await sequelize.sync({ force: true });
        if (isMySQL) {
            await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
        }
        console.log('Tables synced.');

        console.log('Injecting Branch, Course, and Faculty Seed Data...');
        const b1 = await Branch.create({ name: 'Downtown Branch', location: 'Downtown Avenue, NY', contact_email: 'downtown@portal.com' });
        const b2 = await Branch.create({ name: 'Westside Campus', location: 'Westside Boulevard, LA', contact_email: 'westside@portal.com' });

        const course1 = await Course.create({ title: '10th Board Mastery (SSC)', description: 'Complete board preparation', class_range: 'SSC (10th)', board: 'State Board', exam_target: 'None', fees: 30000 });
        const course2 = await Course.create({ title: '12th Commerce Board Mastery', description: 'Advanced commerce board preparation', class_range: 'HSC (12th)', board: 'CBSE', exam_target: 'None', fees: 35000 });

        const facultyMember = await Faculty.create({ name: 'Grace Hopper', qualification: 'PhD Software Engineering', experience: '12 Years', subject_expertise: 'Compilers' });

        console.log('Injecting Users for all 9 Enterprise Roles...');
        // 1. Super Admin
        await User.create({ name: 'Super Admin', email: 'superadmin@portal.com', password: 'superadmin', role: 'super-admin', phone: '9999999901', status: 'active' });
        // 2. Institute Admin
        const adminUser = await User.create({ name: 'Downtown Admin', email: 'admin@portal.com', password: 'admin', role: 'admin', phone: '9999999902', status: 'active', branch_id: b1.id });
        // 3. Faculty
        const facultyUser = await User.create({ name: 'Grace Hopper', email: 'faculty@portal.com', password: 'faculty', role: 'faculty', phone: '9999999903', status: 'active', branch_id: b1.id });
        // 4. Student
        const studentUser = await User.create({ name: 'Nathaniel Scott', email: 'student@portal.com', password: 'student', role: 'student', phone: '9999999904', status: 'active', branch_id: b1.id, username: 'student01' });
        // 5. Parent
        const parentUser = await User.create({ name: 'Dan Scott', email: 'parent@portal.com', password: 'parent', role: 'parent', phone: '9999999905', status: 'active', parent_id: studentUser.id, username: 'parent01' });
        // 6. Accountant
        await User.create({ name: 'Jane Finance', email: 'accountant@portal.com', password: 'accountant', role: 'accountant', phone: '9999999906', status: 'active', branch_id: b1.id });
        // 7. Receptionist
        await User.create({ name: 'Clara Frontdesk', email: 'receptionist@portal.com', password: 'receptionist', role: 'receptionist', phone: '9999999907', status: 'active', branch_id: b1.id });
        // 8. Librarian
        await User.create({ name: 'Lydia Bookworm', email: 'librarian@portal.com', password: 'librarian', role: 'librarian', phone: '9999999908', status: 'active', branch_id: b1.id });
        // 9. Transport Manager
        await User.create({ name: 'Driver Joe', email: 'transport@portal.com', password: 'transport', role: 'transport-manager', phone: '9999999909', status: 'active', branch_id: b1.id });

        console.log('Wiring Student Course Enrollment...');
        await Enrollment.create({ student_id: studentUser.id, course_id: course1.id, batch_year: '2026', fee_plan: 'EMI', total_installments: 4, installment_amount: 7500 });

        console.log('Injecting Academic Notices, Homework & Results...');
        await Notice.create({ title: 'Final Semester Schedule', content: 'Exams commence on Nov 15th.', target_role: 'all' });
        await Notice.create({ title: 'Holiday Announcement', content: 'Institute will remain closed for Thanksgiving.', target_role: 'student' });

        await Assignment.create({ course_id: course1.id, title: 'Maths Assignment 1', description: 'Solve Algebra chapters 1 to 3', due_date: '2026-06-15' });

        await Result.create({ student_id: studentUser.id, subject: 'Algebra', marks_obtained: 85, total_marks: 100, exam_date: '2026-05-20', comments: 'Excellent performance!' });

        console.log('Injecting Accountant Expenses and Salaries...');
        await Expense.create({ title: 'Internet Leased Line Broadband', amount: 5400.00, category: 'Utilities', date: '2026-05-01', description: 'Office lease line payment' });
        await Expense.create({ title: 'Whiteboard markers and books', amount: 1200.00, category: 'Stationery', date: '2026-05-10', description: 'Markers for all classrooms' });

        await Salary.create({ user_id: facultyUser.id, month: 'May', year: 2026, amount: 45000.00, status: 'paid', payment_date: '2026-05-28' });
        await Salary.create({ user_id: adminUser.id, month: 'May', year: 2026, amount: 60000.00, status: 'pending' });

        console.log('Injecting Librarian Books & Borrow Log...');
        const book1 = await LibraryBook.create({ title: 'Introduction to Algorithms', author: 'Cormen, Leiserson', isbn: '978-0262033848', category: 'Computer Science', total_copies: 5, available_copies: 4 });
        const book2 = await LibraryBook.create({ title: 'Advanced Calculus', author: 'Gerald B. Folland', isbn: '978-0821826669', category: 'Mathematics', total_copies: 3, available_copies: 3 });

        await IssuedBook.create({ book_id: book1.id, student_id: studentUser.id, issue_date: '2026-05-25', status: 'issued', fine_amount: 0.00 });

        console.log('Injecting Transport Buses, Routes & Assignment...');
        const route1 = await Route.create({ route_name: 'Downtown Express', start_point: 'Main Terminal', end_point: 'Downtown Campus', stops: 'Stops: Term-A, Term-B, Central-Station', fee: 1200.00 });
        const bus1 = await Bus.create({ bus_number: 'NY-BUS-2026', capacity: 40, driver_name: 'Joe Sullivan', driver_phone: '9888887777', status: 'active' });

        await TransportAssignment.create({ student_id: studentUser.id, route_id: route1.id, bus_id: bus1.id, pickup_point: 'Term-B Stop' });

        console.log('Injecting Hostel & Room Details...');
        const hostel1 = await Hostel.create({ name: 'Tagore Boys Hostel', type: 'boys', address: 'Lane 4 Campus Outer', capacity: 100 });
        await Room.create({ hostel_id: hostel1.id, room_number: 'B-101', type: 'double', capacity: 2, occupied: 1, fee: 3500.00 });

        console.log('Injecting Receptionist Visitors & Scheduled Appointments...');
        await Visitor.create({ name: 'Mark Gable (Parent)', purpose: 'Enquiry for 9th Standard admission', contact: '9876543210', check_in: new Date(), remarks: 'Interested in State Board' });
        await Appointment.create({ visitor_name: 'Mark Gable', parent_phone: '9876543210', host_name: 'Downtown Admin', date: '2026-05-29', time: '11:30 AM', reason: 'Admission form submission', status: 'scheduled' });

        console.log('Injecting Announcements & Leaves...');
        await Announcement.create({ title: 'Welcome to the New ERP Portal!', content: 'All modules are now connected and online for our students, parents, faculty, and administrative staff.' });
        await Leave.create({ user_id: facultyUser.id, type: 'sick', start_date: '2026-06-01', end_date: '2026-06-02', reason: 'Flu symptoms', status: 'pending' });

        console.log('Seeding completed successfully with connected data loops!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding Error:', err);
        process.exit(1);
    }
};

seedData();
