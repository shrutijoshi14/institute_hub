-- Database Schema for Ambition Tutorials

CREATE DATABASE IF NOT EXISTS ambition_tutorials;
USE ambition_tutorials;

-- Cleanup existing tables for fresh setup
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS users, courses, faculty, enrollments, results, attendance, fee_payments, assignments, notices, toppers, enquiries, registrations;
SET FOREIGN_KEY_CHECKS = 1;

-- Users table (Admins, Faculty, Parents, Students)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'faculty', 'parent', 'student') NOT NULL,
    phone VARCHAR(20),
    parent_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    class_range VARCHAR(50), 
    board VARCHAR(50), 
    fees DECIMAL(10, 2),
    syllabus_url VARCHAR(255)
);

-- Faculty table
CREATE TABLE IF NOT EXISTS faculty (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    qualification VARCHAR(255) NOT NULL,
    experience VARCHAR(100) NOT NULL,
    subject_expertise VARCHAR(255) NOT NULL,
    image_url VARCHAR(255)
);

-- Students/Enrollments
CREATE TABLE IF NOT EXISTS enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    course_id INT,
    batch_year VARCHAR(20),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Results / Performance
CREATE TABLE IF NOT EXISTS results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    subject VARCHAR(100),
    marks_obtained INT,
    total_marks INT,
    exam_date DATE,
    comments TEXT,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Attendance Tracking
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    date DATE NOT NULL,
    status ENUM('present', 'absent', 'late') DEFAULT 'present',
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Fee Management
CREATE TABLE IF NOT EXISTS fee_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    amount_paid DECIMAL(10, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_mode ENUM('Cash', 'Online', 'Cheque') DEFAULT 'Cash',
    receipt_url VARCHAR(255),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Assignments / Homework
CREATE TABLE IF NOT EXISTS assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    course_id INT,
    file_url VARCHAR(255),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Notice Board
CREATE TABLE IF NOT EXISTS notices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    target_role ENUM('all', 'student', 'parent') DEFAULT 'all',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Toppers
CREATE TABLE IF NOT EXISTS toppers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    percentage DECIMAL(5, 2),
    batch VARCHAR(20),
    class VARCHAR(20),
    image_url VARCHAR(255)
);

-- Enquiries
CREATE TABLE IF NOT EXISTS enquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    class_interest VARCHAR(100),
    message TEXT,
    status ENUM('pending', 'contacted', 'resolved') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT,
    student_id INT,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'submitted',
    file_path VARCHAR(255),
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Registrations table
CREATE TABLE IF NOT EXISTS registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    class VARCHAR(50) NOT NULL,
    board VARCHAR(50) NOT NULL,
    course_interest VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial Users (Passwords are hashed as 'password123' usually, but here we use simple text for manual seeding if needed, or rely on auth system)
-- In production, these should be hashed. For this template:
INSERT IGNORE INTO users (id, name, email, password, role, phone) VALUES 
(1, 'Admin Ambition', 'admin@ambition.com', 'admin123', 'admin', '9876543210'),
(2, 'Rahul Student', 'rahul@student.com', 'student123', 'student', '9876543211'),
(3, 'Mr. Sharma Parent', 'sharma@parent.com', 'parent123', 'parent', '9876543212');

-- Initial Courses
INSERT IGNORE INTO courses (id, title, description, class_range, board, fees, syllabus_url) VALUES 
(1, 'Primary Foundation', 'Focus on basic logic and conceptual clarity.', '5th - 7th', 'CBSE/ICSE/State', 15000, '/syllabus/primary.pdf'),
(2, 'Pre-Board Excellence', 'Intensive training for Core Science & Math.', '8th - 9th', 'All Boards', 22000, '/syllabus/secondary.pdf'),
(3, 'SSC Board Mastery', 'Comprehensive board prep with 50+ mock tests.', '10th Std', 'State/CBSE', 30000, '/syllabus/ssc.pdf'),
(4, 'Science Stream (HSC)', 'Advanced PCM/B with expert professors.', '11th - 12th', 'State/CBSE', 55000, '/syllabus/hsc_sci.pdf'),
(5, 'Commerce (HSC)', 'Professional guidance for Accounts & Economics.', '11th - 12th', 'State Board', 45000, '/syllabus/hsc_comm.pdf'),
(6, 'Entrance Prep (JEE/NEET)', 'Rigorous 2-year program for national success.', 'JEE/NEET', 'NTA', 75000, '/syllabus/entrance.pdf'),
(7, 'MHT-CET Special', 'Fast-track crash course for state entrance.', 'MHT-CET', 'State Entrance', 25000, '/syllabus/cet.pdf');

-- Initial Faculty
INSERT IGNORE INTO faculty (id, name, qualification, experience, subject_expertise, image_url) VALUES 
(1, 'Prof. Rajesh Patil', 'M.Sc. Mathematics', '18+ Years', 'Mathematics (Calculus)', '/assets/WhatsApp Image 2026-03-16 at 4.50.46 PM.jpeg'),
(2, 'Dr. Sunita Sharma', 'Ph.D. Physics', '12+ Years', 'Physics (Quantum mechanics)', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400'),
(3, 'Prof. Amit Mehra', 'M.Tech Chemical Engg.', '15+ Years', 'Chemistry (Organic)', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400');

-- Initial Toppers
INSERT IGNORE INTO toppers (id, name, percentage, batch, class, image_url) VALUES 
(1, 'Prathamesh S.', 98.40, '2025', 'SSC 2025', '/assets/10th result.jpeg'),
(2, 'Shruti J.', 97.20, '2025', 'SSC 2025', '/assets/10th result.jpeg'),
(3, 'Siddhesh K.', 96.80, '2025', 'SSC 2025', '/assets/10th result.jpeg'),
(4, 'Ananya D.', 95.50, '2024', 'HSC 2024', '/assets/12th result.jpeg'),
(5, 'Rajesh K.', 93.00, '2024', 'HSC 2024', '/assets/12th result.jpeg');

-- Initial Notices
INSERT IGNORE INTO notices (id, title, content, target_role) VALUES 
(1, 'Welcome to Ambition Tutorials', 'We are glad to have you on board. Check your dashboard for the latest syllabus.', 'all'),
(2, 'Mock Test on Sunday', 'SSC Students have a mock test this Sunday at 10 AM.', 'student'),
(3, 'Parent-Teacher Meeting', 'PTM scheduled for next Saturday. Reporting mandatory.', 'parent');

-- Initial Attendance
INSERT IGNORE INTO attendance (student_id, date, status) VALUES 
(2, '2026-03-10', 'present'),
(2, '2026-03-11', 'present'),
(2, '2026-03-12', 'absent'),
(2, '2026-03-13', 'present');

-- Initial Fee Payments
INSERT IGNORE INTO fee_payments (student_id, amount_paid, payment_date, payment_mode) VALUES 
(2, 5000, '2026-03-01', 'Cash'),
(2, 10000, '2026-03-10', 'Online');
