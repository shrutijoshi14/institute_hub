-- ==========================================
-- MULTI-TENANT SAAS ROLLBACK SCRIPT
-- RUN THIS IN MYSQL WORKBENCH TO ROLL BACK YOUR DATABASE SCHEMA CHANGES
-- ==========================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Drop foreign key constraints from multi-tenant tables
ALTER TABLE users DROP FOREIGN KEY fk_users_tenant;
ALTER TABLE branches DROP FOREIGN KEY fk_branches_tenant;
ALTER TABLE courses DROP FOREIGN KEY fk_courses_tenant;
ALTER TABLE faculty DROP FOREIGN KEY fk_faculty_tenant;
ALTER TABLE faculty DROP FOREIGN KEY fk_faculty_user;
ALTER TABLE enrollments DROP FOREIGN KEY fk_enrollments_tenant;
ALTER TABLE results DROP FOREIGN KEY fk_results_tenant;
ALTER TABLE attendance DROP FOREIGN KEY fk_attendance_tenant;
ALTER TABLE fee_payments DROP FOREIGN KEY fk_fee_payments_tenant;
ALTER TABLE assignments DROP FOREIGN KEY fk_assignments_tenant;
ALTER TABLE submissions DROP FOREIGN KEY fk_submissions_tenant;
ALTER TABLE notices DROP FOREIGN KEY fk_notices_tenant;
ALTER TABLE toppers DROP FOREIGN KEY fk_toppers_tenant;
ALTER TABLE toppers DROP FOREIGN KEY fk_toppers_student;
ALTER TABLE enquiries DROP FOREIGN KEY fk_enquiries_tenant;
ALTER TABLE registrations DROP FOREIGN KEY fk_registrations_tenant;
ALTER TABLE batches DROP FOREIGN KEY fk_batches_tenant;
ALTER TABLE batch_faculty DROP FOREIGN KEY fk_batch_faculty_tenant;
ALTER TABLE batch_progress DROP FOREIGN KEY fk_batch_progress_tenant;
ALTER TABLE library_books DROP FOREIGN KEY fk_library_books_tenant;
ALTER TABLE issued_books DROP FOREIGN KEY fk_issued_books_tenant;
ALTER TABLE buses DROP FOREIGN KEY fk_buses_tenant;
ALTER TABLE routes DROP FOREIGN KEY fk_routes_tenant;
ALTER TABLE transport_assignments DROP FOREIGN KEY fk_transport_assignments_tenant;
ALTER TABLE hostel DROP FOREIGN KEY fk_hostel_tenant;
ALTER TABLE rooms DROP FOREIGN KEY fk_rooms_tenant;
ALTER TABLE certificates DROP FOREIGN KEY fk_certificates_tenant;
ALTER TABLE salary DROP FOREIGN KEY fk_salary_tenant;
ALTER TABLE leaves DROP FOREIGN KEY fk_leaves_tenant;
ALTER TABLE complaints DROP FOREIGN KEY fk_complaints_tenant;
ALTER TABLE audit_logs DROP FOREIGN KEY fk_audit_logs_tenant;
ALTER TABLE activity_logs DROP FOREIGN KEY fk_activity_logs_tenant;

-- 2. Drop tenant composite unique constraints and restore original unique constraints on Users table
ALTER TABLE users DROP INDEX uq_user_email_tenant;
ALTER TABLE users DROP INDEX uq_user_username_tenant;
ALTER TABLE users ADD UNIQUE KEY email (email);
ALTER TABLE users ADD UNIQUE KEY username (username);

-- 3. Drop indices added for performance/archive
ALTER TABLE results DROP INDEX idx_results_tenant_student;
ALTER TABLE attendance DROP INDEX idx_attendance_tenant_archive;
ALTER TABLE audit_logs DROP INDEX idx_audit_tenant_date;

-- 4. Drop tenant_id columns and specific columns added during migration
ALTER TABLE users DROP COLUMN tenant_id;
ALTER TABLE branches DROP COLUMN tenant_id;
ALTER TABLE courses DROP COLUMN tenant_id;
ALTER TABLE faculty DROP COLUMN tenant_id;
ALTER TABLE faculty DROP COLUMN user_id;
ALTER TABLE enrollments DROP COLUMN tenant_id;
ALTER TABLE results DROP COLUMN tenant_id;
ALTER TABLE attendance DROP COLUMN tenant_id;
ALTER TABLE attendance DROP COLUMN is_archived;
ALTER TABLE fee_payments DROP COLUMN tenant_id;
ALTER TABLE assignments DROP COLUMN tenant_id;
ALTER TABLE submissions DROP COLUMN tenant_id;
ALTER TABLE notices DROP COLUMN tenant_id;
ALTER TABLE toppers DROP COLUMN tenant_id;
ALTER TABLE toppers DROP COLUMN student_id;
ALTER TABLE enquiries DROP COLUMN tenant_id;
ALTER TABLE registrations DROP COLUMN tenant_id;
ALTER TABLE batches DROP COLUMN tenant_id;
ALTER TABLE batch_faculty DROP COLUMN tenant_id;
ALTER TABLE batch_progress DROP COLUMN tenant_id;
ALTER TABLE library_books DROP COLUMN tenant_id;
ALTER TABLE issued_books DROP COLUMN tenant_id;
ALTER TABLE buses DROP COLUMN tenant_id;
ALTER TABLE routes DROP COLUMN tenant_id;
ALTER TABLE transport_assignments DROP COLUMN tenant_id;
ALTER TABLE hostel DROP COLUMN tenant_id;
ALTER TABLE rooms DROP COLUMN tenant_id;
ALTER TABLE certificates DROP COLUMN tenant_id;
ALTER TABLE salary DROP COLUMN tenant_id;
ALTER TABLE leaves DROP COLUMN tenant_id;
ALTER TABLE complaints DROP COLUMN tenant_id;
ALTER TABLE audit_logs DROP COLUMN tenant_id;
ALTER TABLE activity_logs DROP COLUMN tenant_id;

-- 5. Drop new SaaS system tables
DROP TABLE IF EXISTS feature_flags;
DROP TABLE IF EXISTS academic_years;
DROP TABLE IF EXISTS institutes;
DROP TABLE IF EXISTS subscriptions;

SET FOREIGN_KEY_CHECKS = 1;
