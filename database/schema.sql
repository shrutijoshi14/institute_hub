-- Database Schema for Ambition Tutorials (Multi-Tenant SaaS)

CREATE DATABASE IF NOT EXISTS ambition_tutorials;
USE ambition_tutorials;

-- Cleanup existing tables for fresh setup
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS registrations, submissions, enquiries, toppers, notices, fee_payments, 
                     attendance, results, enrollments, faculty, courses, users, 
                     academic_years, feature_flags, institutes, subscriptions;
SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================
-- SYSTEM MASTER TABLES (SaaS Configuration)
-- ==========================================

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    billing_cycle ENUM('monthly', 'yearly') NOT NULL DEFAULT 'monthly',
    max_users INT NOT NULL DEFAULT -1, -- -1 represents unlimited
    max_students INT NOT NULL DEFAULT -1,
    features TEXT NULL, -- JSON config of active modules
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Institutes (Tenants) table
CREATE TABLE IF NOT EXISTS institutes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) NOT NULL UNIQUE,
    custom_domain VARCHAR(255) NULL UNIQUE,
    status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
    subscription_id INT NULL,
    subscription_end_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Academic Years table
CREATE TABLE IF NOT EXISTS academic_years (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_tenant_academic_year (tenant_id, name),
    FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Feature Flags table
CREATE TABLE IF NOT EXISTS feature_flags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    feature_key VARCHAR(100) NOT NULL,
    is_enabled TINYINT(1) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_tenant_feature (tenant_id, feature_key),
    FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ==========================================
-- TENANT SPECIFIC MASTER & TRANSACTION TABLES
-- ==========================================

-- Users table (Admins, Faculty, Parents, Students)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('super-admin', 'admin', 'faculty', 'parent', 'student', 'accountant', 'receptionist', 'librarian', 'transport-manager') NOT NULL,
    phone VARCHAR(20),
    parent_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE,
    UNIQUE KEY uq_user_email_tenant (email, tenant_id),
    -- Added fields for student details (maintained from User.js model schema)
    username VARCHAR(255) NULL,
    standard VARCHAR(50) NULL,
    parent_name VARCHAR(255) NULL,
    parent_phone VARCHAR(20) NULL,
    address TEXT NULL,
    dob DATE NULL,
    blood_group VARCHAR(10) NULL,
    google_id VARCHAR(255) NULL,
    otp_code VARCHAR(10) NULL,
    otp_expiry DATETIME NULL,
    biometric_credential_id TEXT NULL,
    biometric_public_key TEXT NULL,
    biometric_sign_count INT DEFAULT 0,
    UNIQUE KEY uq_user_username_tenant (username, tenant_id)
) ENGINE=InnoDB;

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    class_range VARCHAR(50), 
    board VARCHAR(50), 
    fees DECIMAL(10, 2),
    syllabus_url VARCHAR(255),
    FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Faculty profile details table (linked to user account)
CREATE TABLE IF NOT EXISTS faculty (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    user_id INT NULL,
    name VARCHAR(255) NOT NULL,
    qualification VARCHAR(255) NOT NULL,
    experience VARCHAR(100) NOT NULL,
    subject_expertise VARCHAR(255) NOT NULL,
    image_url VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Students/Enrollments
CREATE TABLE IF NOT EXISTS enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    student_id INT,
    course_id INT,
    batch_year VARCHAR(20),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Results / Performance
CREATE TABLE IF NOT EXISTS results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    student_id INT,
    subject VARCHAR(100),
    marks_obtained INT,
    total_marks INT,
    exam_date DATE,
    comments TEXT,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE,
    INDEX idx_results_tenant_student (tenant_id, student_id)
) ENGINE=InnoDB;

-- Attendance Tracking
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    student_id INT,
    date DATE NOT NULL,
    status ENUM('present', 'absent', 'late') DEFAULT 'present',
    is_archived TINYINT(1) NOT NULL DEFAULT 0,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE,
    INDEX idx_attendance_tenant_archive (tenant_id, is_archived)
) ENGINE=InnoDB;

-- Fee Management
CREATE TABLE IF NOT EXISTS fee_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    student_id INT,
    amount_paid DECIMAL(10, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_mode ENUM('Cash', 'Online', 'Cheque') DEFAULT 'Cash',
    receipt_url VARCHAR(255),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Assignments / Homework
CREATE TABLE IF NOT EXISTS assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    course_id INT,
    file_url VARCHAR(255),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Notice Board
CREATE TABLE IF NOT EXISTS notices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    target_role ENUM('all', 'student', 'parent') DEFAULT 'all',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Toppers
CREATE TABLE IF NOT EXISTS toppers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    student_id INT NULL,
    name VARCHAR(255) NOT NULL,
    percentage DECIMAL(5, 2),
    batch VARCHAR(20),
    class VARCHAR(20),
    image_url VARCHAR(255),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Enquiries
CREATE TABLE IF NOT EXISTS enquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    class_interest VARCHAR(100),
    message TEXT,
    status ENUM('pending', 'contacted', 'resolved') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    assignment_id INT,
    student_id INT,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'submitted',
    file_path VARCHAR(255),
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Registrations table
CREATE TABLE IF NOT EXISTS registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    class VARCHAR(50) NOT NULL,
    board VARCHAR(50) NOT NULL,
    course_interest VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- ==========================================
-- SEED INITIAL DATA
-- ==========================================

-- 1. Initial Subscriptions
INSERT INTO subscriptions (id, name, price, billing_cycle, max_users, max_students) VALUES 
(1, 'Legacy Plan', 0.00, 'yearly', -1, -1);

-- 2. Initial Institutes (Tenants)
INSERT INTO institutes (id, name, subdomain, status, subscription_id, subscription_end_date) VALUES 
(1, 'Ambition Tutorials', 'ambition', 'active', 1, '2030-12-31');

-- 3. Initial Users (Passwords are hashed as 'password123' usually, but here we use simple text for manual seeding)
INSERT INTO users (id, tenant_id, name, email, password, role, phone) VALUES 
(1, 1, 'Admin Ambition', 'admin@ambition.com', 'admin123', 'admin', '9876543210'),
(2, 1, 'Rahul Student', 'rahul@student.com', 'student123', 'student', '9876543211'),
(3, 1, 'Mr. Sharma Parent', 'sharma@parent.com', 'parent123', 'parent', '9876543212');

-- 4. Initial Courses
INSERT INTO courses (id, tenant_id, title, description, class_range, board, fees, syllabus_url) VALUES 
(1, 1, 'Primary Foundation', 'Focus on basic logic and conceptual clarity.', '5th - 7th', 'CBSE/ICSE/State', 15000, '/syllabus/primary.pdf'),
(2, 1, 'Pre-Board Excellence', 'Intensive training for Core Science & Math.', '8th - 9th', 'All Boards', 22000, '/syllabus/secondary.pdf'),
(3, 1, 'SSC Board Mastery', 'Comprehensive board prep with 50+ mock tests.', '10th Std', 'State/CBSE', 30000, '/syllabus/ssc.pdf'),
(4, 1, 'Science Stream (HSC)', 'Advanced PCM/B with expert professors.', '11th - 12th', 'State/CBSE', 55000, '/syllabus/hsc_sci.pdf'),
(5, 1, 'Commerce (HSC)', 'Professional guidance for Accounts & Economics.', '11th - 12th', 'State Board', 45000, '/syllabus/hsc_comm.pdf'),
(6, 1, 'Entrance Prep (JEE/NEET)', 'Rigorous 2-year program for national success.', 'JEE/NEET', 'NTA', 75000, '/syllabus/entrance.pdf'),
(7, 1, 'MHT-CET Special', 'Fast-track crash course for state entrance.', 'MHT-CET', 'State Entrance', 25000, '/syllabus/cet.pdf');

-- 5. Initial Faculty
INSERT INTO faculty (id, tenant_id, name, qualification, experience, subject_expertise, image_url) VALUES 
(1, 1, 'Prof. Rajesh Patil', 'M.Sc. Mathematics', '18+ Years', 'Mathematics (Calculus)', '/assets/WhatsApp Image 2026-03-16 at 4.50.46 PM.jpeg'),
(2, 1, 'Dr. Sunita Sharma', 'Ph.D. Physics', '12+ Years', 'Physics (Quantum mechanics)', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400'),
(3, 1, 'Prof. Amit Mehra', 'M.Tech Chemical Engg.', '15+ Years', 'Chemistry (Organic)', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400');

-- 6. Initial Toppers
INSERT INTO toppers (id, tenant_id, student_id, name, percentage, batch, class, image_url) VALUES 
(1, 1, NULL, 'Prathamesh S.', 98.40, '2025', 'SSC 2025', '/assets/10th result.jpeg'),
(2, 1, NULL, 'Shruti J.', 97.20, '2025', 'SSC 2025', '/assets/10th result.jpeg'),
(3, 1, NULL, 'Siddhesh K.', 96.80, '2025', 'SSC 2025', '/assets/10th result.jpeg'),
(4, 1, NULL, 'Ananya D.', 95.50, '2024', 'HSC 2024', '/assets/12th result.jpeg'),
(5, 1, NULL, 'Rajesh K.', 93.00, '2024', 'HSC 2024', '/assets/12th result.jpeg');

-- 7. Initial Notices
INSERT INTO notices (id, tenant_id, title, content, target_role) VALUES 
(1, 1, 'Welcome to Ambition Tutorials', 'We are glad to have you on board. Check your dashboard for the latest syllabus.', 'all'),
(2, 1, 'Mock Test on Sunday', 'SSC Students have a mock test this Sunday at 10 AM.', 'student'),
(3, 1, 'Parent-Teacher Meeting', 'PTM scheduled for next Saturday. Reporting mandatory.', 'parent');

-- 8. Initial Attendance
INSERT INTO attendance (tenant_id, student_id, date, status) VALUES 
(1, 2, '2026-03-10', 'present'),
(1, 2, '2026-03-11', 'present'),
(1, 2, '2026-03-12', 'absent'),
(1, 2, '2026-03-13', 'present');

-- 9. Initial Fee Payments
INSERT INTO fee_payments (tenant_id, student_id, amount_paid, payment_date, payment_mode) VALUES 
(1, 2, 5000, '2026-03-01', 'Cash'),
(1, 2, 10000, '2026-03-10', 'Online');
