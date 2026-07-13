-- ==========================================
-- MULTI-TENANT SAAS MIGRATION SCRIPT
-- RUN THIS IN MYSQL WORKBENCH TO MIGRATE YOUR DATABASE
-- ==========================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Create Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    billing_cycle ENUM('monthly', 'yearly') NOT NULL DEFAULT 'monthly',
    max_users INT NOT NULL DEFAULT -1,
    max_students INT NOT NULL DEFAULT -1,
    features TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Create Institutes (Tenants) Table
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

-- 3. Create Academic Years Table
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

-- 4. Create Feature Flags Table
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
-- SEED DEFAULT SAAS CONFIG & FIRST TENANT
-- ==========================================

-- Seed default legacy plan if not exists
INSERT INTO subscriptions (id, name, price, billing_cycle, max_users, max_students) 
VALUES (1, 'Legacy Plan', 0.00, 'yearly', -1, -1)
ON DUPLICATE KEY UPDATE name=name;

-- Seed default tenant (Ambition Tutorials) if not exists
INSERT INTO institutes (id, name, subdomain, status, subscription_id, subscription_end_date) 
VALUES (1, 'Ambition Tutorials', 'ambition', 'active', 1, '2030-12-31')
ON DUPLICATE KEY UPDATE name=name;


-- ==========================================
-- ADD TENANT ID TO EXISTING TABLES AND BACKFILL
-- ==========================================

-- Table: users
ALTER TABLE users ADD COLUMN tenant_id INT NULL AFTER id;
UPDATE users SET tenant_id = 1 WHERE tenant_id IS NULL;
-- Adjust unique constraints for multi-tenant (drop old unique keys, create compound unique keys)
ALTER TABLE users DROP INDEX email;
ALTER TABLE users DROP INDEX username;
ALTER TABLE users MODIFY COLUMN tenant_id INT NOT NULL;
ALTER TABLE users ADD CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE;
ALTER TABLE users ADD UNIQUE KEY uq_user_email_tenant (email, tenant_id);
ALTER TABLE users ADD UNIQUE KEY uq_user_username_tenant (username, tenant_id);

-- Table: branches
ALTER TABLE branches ADD COLUMN tenant_id INT NULL;
UPDATE branches SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE branches MODIFY COLUMN tenant_id INT NOT NULL;
ALTER TABLE branches ADD CONSTRAINT fk_branches_tenant FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- Table: courses
ALTER TABLE courses ADD COLUMN tenant_id INT NULL;
UPDATE courses SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE courses MODIFY COLUMN tenant_id INT NOT NULL;
ALTER TABLE courses ADD CONSTRAINT fk_courses_tenant FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- Table: faculty
ALTER TABLE faculty ADD COLUMN tenant_id INT NULL;
UPDATE faculty SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE faculty MODIFY COLUMN tenant_id INT NOT NULL;
ALTER TABLE faculty ADD CONSTRAINT fk_faculty_tenant FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- Add user_id to link faculty with authentication record
ALTER TABLE faculty ADD COLUMN user_id INT NULL AFTER id;
UPDATE faculty f 
JOIN users u ON f.name = u.name AND u.role = 'faculty'
SET f.user_id = u.id;
ALTER TABLE faculty ADD CONSTRAINT fk_faculty_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Table: enrollments
ALTER TABLE enrollments ADD COLUMN tenant_id INT NULL;
UPDATE enrollments SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE enrollments MODIFY COLUMN tenant_id INT NOT NULL;
ALTER TABLE enrollments ADD CONSTRAINT fk_enrollments_tenant FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- Table: results
ALTER TABLE results ADD COLUMN tenant_id INT NULL;
UPDATE results SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE results MODIFY COLUMN tenant_id INT NOT NULL;
ALTER TABLE results ADD CONSTRAINT fk_results_tenant FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE;
ALTER TABLE results ADD INDEX idx_results_tenant_student (tenant_id, student_id);

-- Table: attendance
ALTER TABLE attendance ADD COLUMN tenant_id INT NULL;
UPDATE attendance SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE attendance MODIFY COLUMN tenant_id INT NOT NULL;
ALTER TABLE attendance ADD CONSTRAINT fk_attendance_tenant FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE;
-- Archiving Support: Add archived flag & index
ALTER TABLE attendance ADD COLUMN is_archived TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE attendance ADD INDEX idx_attendance_tenant_archive (tenant_id, is_archived);

-- Table: fee_payments
ALTER TABLE fee_payments ADD COLUMN tenant_id INT NULL;
UPDATE fee_payments SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE fee_payments MODIFY COLUMN tenant_id INT NOT NULL;
ALTER TABLE fee_payments ADD CONSTRAINT fk_fee_payments_tenant FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- Table: assignments
ALTER TABLE assignments ADD COLUMN tenant_id INT NULL;
UPDATE assignments SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE assignments MODIFY COLUMN tenant_id INT NOT NULL;
ALTER TABLE assignments ADD CONSTRAINT fk_assignments_tenant FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- Table: submissions
ALTER TABLE submissions ADD COLUMN tenant_id INT NULL;
UPDATE submissions SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE submissions MODIFY COLUMN tenant_id INT NOT NULL;
ALTER TABLE submissions ADD CONSTRAINT fk_submissions_tenant FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- Table: notices
ALTER TABLE notices ADD COLUMN tenant_id INT NULL;
UPDATE notices SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE notices MODIFY COLUMN tenant_id INT NOT NULL;
ALTER TABLE notices ADD CONSTRAINT fk_notices_tenant FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- Table: toppers
ALTER TABLE toppers ADD COLUMN tenant_id INT NULL;
ALTER TABLE toppers ADD COLUMN student_id INT NULL AFTER id;
UPDATE toppers SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE toppers t JOIN users u ON t.name = u.name AND u.role = 'student' SET t.student_id = u.id;
ALTER TABLE toppers MODIFY COLUMN tenant_id INT NOT NULL;
ALTER TABLE toppers ADD CONSTRAINT fk_toppers_tenant FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE;
ALTER TABLE toppers ADD CONSTRAINT fk_toppers_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE SET NULL;

-- Table: enquiries
ALTER TABLE enquiries ADD COLUMN tenant_id INT NULL;
UPDATE enquiries SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE enquiries MODIFY COLUMN tenant_id INT NOT NULL;
ALTER TABLE enquiries ADD CONSTRAINT fk_enquiries_tenant FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- Table: registrations
ALTER TABLE registrations ADD COLUMN tenant_id INT NULL;
UPDATE registrations SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE registrations MODIFY COLUMN tenant_id INT NOT NULL;
ALTER TABLE registrations ADD CONSTRAINT fk_registrations_tenant FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- Table: batches
ALTER TABLE batches ADD COLUMN tenant_id INT NULL;
UPDATE batches SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE batches MODIFY COLUMN tenant_id INT NOT NULL;
ALTER TABLE batches ADD CONSTRAINT fk_batches_tenant FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- Table: batch_faculty
ALTER TABLE batch_faculty ADD COLUMN tenant_id INT NULL;
UPDATE batch_faculty SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE batch_faculty MODIFY COLUMN tenant_id INT NOT NULL;
ALTER TABLE batch_faculty ADD CONSTRAINT fk_batch_faculty_tenant FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- Table: batch_progress
ALTER TABLE batch_progress ADD COLUMN tenant_id INT NULL;
UPDATE batch_progress SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE batch_progress MODIFY COLUMN tenant_id INT NOT NULL;
ALTER TABLE batch_progress ADD CONSTRAINT fk_batch_progress_tenant FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- Table: library_books
ALTER TABLE library_books ADD COLUMN tenant_id INT NULL;
UPDATE library_books SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE library_books MODIFY COLUMN tenant_id INT NOT NULL;
ALTER TABLE library_books ADD CONSTRAINT fk_library_books_tenant FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- Table: issued_books
ALTER TABLE issued_books ADD COLUMN tenant_id INT NULL;
UPDATE issued_books SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE issued_books MODIFY COLUMN tenant_id INT NOT NULL;
ALTER TABLE issued_books ADD CONSTRAINT fk_issued_books_tenant FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- Table: buses
ALTER TABLE buses ADD COLUMN tenant_id INT NULL;
UPDATE buses SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE buses MODIFY COLUMN tenant_id INT NOT NULL;
ALTER TABLE buses ADD CONSTRAINT fk_buses_tenant FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- Table: routes
ALTER TABLE routes ADD COLUMN tenant_id INT NULL;
UPDATE routes SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE routes MODIFY COLUMN tenant_id INT NOT NULL;
ALTER TABLE routes ADD CONSTRAINT fk_routes_tenant FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- Table: transport_assignments
ALTER TABLE transport_assignments ADD COLUMN tenant_id INT NULL;
UPDATE transport_assignments SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE transport_assignments MODIFY COLUMN tenant_id INT NOT NULL;
ALTER TABLE transport_assignments ADD CONSTRAINT fk_transport_assignments_tenant FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- Table: hostel (Fixed name)
ALTER TABLE hostel ADD COLUMN tenant_id INT NULL;
UPDATE hostel SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE hostel MODIFY COLUMN tenant_id INT NOT NULL;
ALTER TABLE hostel ADD CONSTRAINT fk_hostel_tenant FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- Table: rooms
ALTER TABLE rooms ADD COLUMN tenant_id INT NULL;
UPDATE rooms SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE rooms MODIFY COLUMN tenant_id INT NOT NULL;
ALTER TABLE rooms ADD CONSTRAINT fk_rooms_tenant FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- Table: certificates
ALTER TABLE certificates ADD COLUMN tenant_id INT NULL;
UPDATE certificates SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE certificates MODIFY COLUMN tenant_id INT NOT NULL;
ALTER TABLE certificates ADD CONSTRAINT fk_certificates_tenant FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- Table: salary (Fixed name)
ALTER TABLE salary ADD COLUMN tenant_id INT NULL;
UPDATE salary SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE salary MODIFY COLUMN tenant_id INT NOT NULL;
ALTER TABLE salary ADD CONSTRAINT fk_salary_tenant FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- Table: leaves
ALTER TABLE leaves ADD COLUMN tenant_id INT NULL;
UPDATE leaves SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE leaves MODIFY COLUMN tenant_id INT NOT NULL;
ALTER TABLE leaves ADD CONSTRAINT fk_leaves_tenant FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- Table: complaints
ALTER TABLE complaints ADD COLUMN tenant_id INT NULL;
UPDATE complaints SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE complaints MODIFY COLUMN tenant_id INT NOT NULL;
ALTER TABLE complaints ADD CONSTRAINT fk_complaints_tenant FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE;

-- Table: audit_logs
ALTER TABLE audit_logs ADD COLUMN tenant_id INT NULL;
UPDATE audit_logs SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE audit_logs MODIFY COLUMN tenant_id INT NOT NULL;
ALTER TABLE audit_logs ADD CONSTRAINT fk_audit_logs_tenant FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE;
ALTER TABLE audit_logs ADD INDEX idx_audit_tenant_date (tenant_id, created_at);

-- Table: activity_logs
ALTER TABLE activity_logs ADD COLUMN tenant_id INT NULL;
UPDATE activity_logs SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE activity_logs MODIFY COLUMN tenant_id INT NOT NULL;
ALTER TABLE activity_logs ADD CONSTRAINT fk_activity_logs_tenant FOREIGN KEY (tenant_id) REFERENCES institutes(id) ON DELETE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;
