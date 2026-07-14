const { Sequelize } = require('sequelize');
require('dotenv').config({ override: true });
const { initializeSettings } = require('./settingsCache');

// Determine whether to use local MySQL database or live Supabase/Postgre database.
// 1. If running on Render (process.env.RENDER is 'true'), use live database.
// 2. If running locally:
//    - If process.env.FORCE_LIVE_DB is 'true' and DATABASE_URL is defined, use live database.
//    - Otherwise, default to local MySQL.
const isRender = process.env.RENDER === 'true';
const forceLive = process.env.FORCE_LIVE_DB === 'true';
const useLiveDB = isRender || (forceLive && process.env.DATABASE_URL);

// Auto-detect dialect from DATABASE_URL prefix, or fallback to DB_DIALECT or 'mysql'
let dbDialect = 'mysql';
if (useLiveDB && process.env.DATABASE_URL) {
    if (process.env.DATABASE_URL.startsWith('postgres://') || process.env.DATABASE_URL.startsWith('postgresql://')) {
        dbDialect = 'postgres';
    } else if (process.env.DATABASE_URL.startsWith('mysql://')) {
        dbDialect = 'mysql';
    }
} else if (process.env.DB_DIALECT) {
    dbDialect = process.env.DB_DIALECT;
}

const isPostgres = dbDialect === 'postgres' || dbDialect === 'postgresql';

let sequelize;

if (useLiveDB && process.env.DATABASE_URL) {
    console.log(`📡 Connecting to LIVE Database (Supabase/PostgreSQL) - Mode: ${isRender ? 'Render Live' : 'Forced Live Local'}`);
    // Connection string URI configuration (e.g. postgresql://... or mysql://...)
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: isPostgres ? 'postgres' : 'mysql',
        logging: false,
        dialectOptions: isPostgres ? {
            ssl: {
                require: true,
                rejectUnauthorized: false // Required for hosted services like Supabase
            }
        } : {}
    });
} else {
    console.log("💻 Connecting to LOCAL Database (MySQL)");
    // Standard host/user/password configuration (typical for local MySQL workbench)
    sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || (isPostgres ? 5432 : 3306),
            dialect: isPostgres ? 'postgres' : 'mysql',
            logging: false,
            dialectOptions: isPostgres ? {
                ssl: {
                    require: true,
                    rejectUnauthorized: false
                }
            } : {}
        }
    );
}

// Override define to inject tenant_id dynamically into multi-tenant models
const originalDefine = sequelize.define;
sequelize.define = function (modelName, attributes, options) {
    const globalModels = ['Subscription', 'Institute', 'GlobalBoard', 'GlobalStandard', 'GlobalSubject', 'GlobalChapter', 'GlobalTopic', 'GlobalQuestion', 'GlobalSyllabusVersion', 'Announcement'];
    if (!globalModels.includes(modelName) && !attributes.tenant_id) {
        attributes.tenant_id = {
            type: Sequelize.DataTypes.INTEGER,
            allowNull: false
        };
    }
    const transactionalModels = ['Attendance', 'Result', 'FeePayment', 'Assignment', 'Batch', 'Submission'];
    if (transactionalModels.includes(modelName)) {
        attributes.is_archived = {
            type: Sequelize.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        };
    }
    return originalDefine.call(this, modelName, attributes, options);
};

// Import AsyncLocalStorage context for multi-tenancy query injection
const tenantStorage = require('./tenantContext');

const injectTenantScope = (options, tenantId) => {
    if (!options) return;
    const model = options.model;
    if (model && model.rawAttributes) {
        options.where = options.where || {};
        if (model.rawAttributes.tenant_id && options.where.tenant_id === undefined) {
            options.where.tenant_id = tenantId;
        }
        if (model.rawAttributes.is_archived && options.where.is_archived === undefined && !options.includeArchived) {
            options.where.is_archived = 0;
        }
    }
    if (options.include) {
        if (!Array.isArray(options.include)) {
            options.include = [options.include];
        }
        options.include = options.include.map(inc => {
            let normalized = inc;
            if (typeof inc === 'function' || (inc.prototype && inc.prototype instanceof Sequelize.Model)) {
                normalized = { model: inc };
            }
            if (normalized.required === undefined) {
                normalized.required = false;
            }
            injectTenantScope(normalized, tenantId);
            return normalized;
        });
    }
};

// Add global hooks to automatically scope queries and creations by tenant_id
sequelize.addHook('beforeFind', function(options) {
    const context = tenantStorage.getStore();
    if (options && !options.model) {
        options.model = this;
    }
    if (context && context.tenantId && !options.bypassTenant) {
        injectTenantScope(options, context.tenantId);
    }
});

sequelize.addHook('beforeValidate', (instance) => {
    const context = tenantStorage.getStore();
    const tenantId = (context && context.tenantId) ? context.tenantId : 1;
    if (instance.tenant_id === undefined || instance.tenant_id === null) {
        instance.tenant_id = tenantId;
    }
});

sequelize.addHook('beforeBulkCreate', (instances) => {
    const context = tenantStorage.getStore();
    const tenantId = (context && context.tenantId) ? context.tenantId : 1;
    instances.forEach(instance => {
        if (instance.tenant_id === undefined || instance.tenant_id === null) {
            instance.tenant_id = tenantId;
        }
    });
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log(`Database connected successfully via Sequelize (${sequelize.getDialect()}).`);
        await sequelize.sync();
        
        // Initialize settings cache from DB (or seed defaults)
        await initializeSettings();
        
        // Run dialect-specific migrations/adjustments
        const isMySQL = sequelize.getDialect() === 'mysql';
        
        if (isMySQL) {
            // Safely drop outdated single-column unique keys if they exist in users table
            try {
                await sequelize.query('ALTER TABLE users DROP INDEX email_2');
                console.log('Dropped outdated index email_2 from users table.');
            } catch (err) {
                // Ignore if it doesn't exist
            }
            try {
                await sequelize.query('ALTER TABLE users DROP INDEX username_2');
                console.log('Dropped outdated index username_2 from users table.');
            } catch (err) {
                // Ignore if it doesn't exist
            }
            try {
                await sequelize.query('ALTER TABLE users DROP INDEX email');
                console.log('Dropped outdated index email from users table.');
            } catch (err) {
                // Ignore if it doesn't exist
            }
            try {
                await sequelize.query('ALTER TABLE users DROP INDEX username');
                console.log('Dropped outdated index username from users table.');
            } catch (err) {
                // Ignore if it doesn't exist
            }

            // Safely add missing columns to institutes table if they are missing
            try {
                await sequelize.query('ALTER TABLE institutes ADD COLUMN code VARCHAR(255) NULL');
            } catch (err) {
                // Ignore if it already exists
            }
            try {
                await sequelize.query('ALTER TABLE institutes ADD COLUMN domain VARCHAR(255) NULL');
            } catch (err) {
                // Ignore if it already exists
            }
            try {
                await sequelize.query('ALTER TABLE institutes ADD COLUMN plan VARCHAR(255) NULL');
            } catch (err) {
                // Ignore if it already exists
            }
            try {
                await sequelize.query('ALTER TABLE institutes ADD COLUMN expiry_date DATE NULL');
            } catch (err) {
                // Ignore if it already exists
            }

            // Safely alter ENUM column in case of existing schemas
            try {
                await sequelize.query(`
                    ALTER TABLE users MODIFY COLUMN role ENUM('super-admin', 'admin', 'faculty', 'parent', 'student', 'accountant', 'receptionist', 'librarian', 'transport-manager') NOT NULL
                `);
                console.log('User roles enum column updated in database.');
            } catch (alterErr) {
                console.log('Notice: users role enum update query details:', alterErr.message);
            }

            try {
                await sequelize.query(`
                    ALTER TABLE fee_payments MODIFY COLUMN payment_mode VARCHAR(255) DEFAULT 'Cash'
                `);
                console.log('Fee payments payment_mode column altered to VARCHAR(255).');
            } catch (alterErr) {
                console.log('Notice: fee_payments payment_mode alter query details:', alterErr.message);
            }

            try {
                await sequelize.query(`
                    ALTER TABLE submissions ADD COLUMN marks INT DEFAULT NULL
                `);
                console.log('Submissions marks column added successfully.');
            } catch (alterErr) {
                console.log('Notice: submissions marks column addition details:', alterErr.message);
            }

            try {
                await sequelize.query(`
                    ALTER TABLE submissions ADD COLUMN feedback VARCHAR(255) DEFAULT NULL
                `);
                console.log('Submissions feedback column added successfully.');
            } catch (alterErr) {
                console.log('Notice: submissions feedback column addition details:', alterErr.message);
            }

            // Alter table notices to add new fields if they don't exist
            try {
                await sequelize.query(`
                    ALTER TABLE notices ADD COLUMN target_board VARCHAR(255) DEFAULT 'All'
                `);
                console.log('Notice: target_board column added.');
            } catch (err) {
                console.log('Notice: target_board column check details:', err.message);
            }

            try {
                await sequelize.query(`
                    ALTER TABLE notices ADD COLUMN target_exam VARCHAR(255) DEFAULT 'All'
                `);
                console.log('Notice: target_exam column added.');
            } catch (err) {
                console.log('Notice: target_exam column check details:', err.message);
            }

            try {
                await sequelize.query(`
                    ALTER TABLE notices ADD COLUMN target_batch VARCHAR(255) DEFAULT 'All'
                `);
                console.log('Notice: target_batch column added.');
            } catch (err) {
                console.log('Notice: target_batch column check details:', err.message);
            }

            try {
                await sequelize.query(`
                    ALTER TABLE batch_progress ADD COLUMN class_date DATE DEFAULT NULL
                `);
                console.log('Notice: batch_progress class_date column added.');
            } catch (err) {
                console.log('Notice: batch_progress class_date column check details:', err.message);
            }

            // Safe ALTER for MySQL
            const addColumnSafely = async (table, column, definition) => {
                try {
                    await sequelize.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
                    console.log(`MySQL: Column ${column} added to ${table}.`);
                } catch (err) {
                    // Ignore column already exists errors
                }
            };
            await addColumnSafely('users', 'google_id', "VARCHAR(255) DEFAULT NULL UNIQUE");
            await addColumnSafely('users', 'otp_code', "VARCHAR(10) DEFAULT NULL");
            await addColumnSafely('users', 'otp_expiry', "DATETIME DEFAULT NULL");
            await addColumnSafely('users', 'biometric_credential_id', "TEXT DEFAULT NULL");
            await addColumnSafely('users', 'biometric_public_key', "TEXT DEFAULT NULL");
            await addColumnSafely('users', 'biometric_sign_count', "INT DEFAULT 0");
            await addColumnSafely('users', 'login_attempts', "INT DEFAULT 0");
            await addColumnSafely('users', 'lockout_until', "DATETIME DEFAULT NULL");
            await addColumnSafely('users', 'last_login_at', "DATETIME DEFAULT NULL");
            await addColumnSafely('users', 'last_login_ip', "VARCHAR(255) DEFAULT NULL");
            await addColumnSafely('users', 'must_change_password', "TINYINT(1) DEFAULT 0");
            await addColumnSafely('subscriptions', 'max_parents', "INT DEFAULT -1");
            await addColumnSafely('subscriptions', 'max_faculty', "INT DEFAULT -1");
            await addColumnSafely('subscriptions', 'max_storage_gb', "INT DEFAULT -1");
            await addColumnSafely('subscriptions', 'duration_months', "INT DEFAULT 12");

        } else if (isPostgres) {
            console.log('PostgreSQL/Supabase detected. Skipping MySQL-specific ALTER TABLE queries. Checking and adding any missing columns...');
            try {
                await sequelize.query(`
                    ALTER TABLE batch_progress ADD COLUMN IF NOT EXISTS class_date DATE DEFAULT NULL
                `);
                console.log('Notice: batch_progress class_date column added on PostgreSQL.');
            } catch (err) {
                console.log('Notice: batch_progress class_date column check details on PostgreSQL:', err.message);
            }

            // Safe ALTER for PostgreSQL
            const addColumnPgSafely = async (table, column, definition) => {
                try {
                    await sequelize.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${definition}`);
                    console.log(`PostgreSQL: Column ${column} added to ${table}.`);
                } catch (err) {
                    // Ignore
                }
            };
            await addColumnPgSafely('users', 'google_id', "VARCHAR(255) UNIQUE DEFAULT NULL");
            await addColumnPgSafely('users', 'otp_code', "VARCHAR(10) DEFAULT NULL");
            await addColumnPgSafely('users', 'otp_expiry', "TIMESTAMP DEFAULT NULL");
            await addColumnPgSafely('users', 'biometric_credential_id', "TEXT DEFAULT NULL");
            await addColumnPgSafely('users', 'biometric_public_key', "TEXT DEFAULT NULL");
            await addColumnPgSafely('users', 'biometric_sign_count', "INTEGER DEFAULT 0");
            await addColumnPgSafely('users', 'login_attempts', "INTEGER DEFAULT 0");
            await addColumnPgSafely('users', 'lockout_until', "TIMESTAMP DEFAULT NULL");
            await addColumnPgSafely('users', 'last_login_at', "TIMESTAMP DEFAULT NULL");
            await addColumnPgSafely('users', 'last_login_ip', "VARCHAR(255) DEFAULT NULL");
            await addColumnPgSafely('users', 'last_login_agent', "VARCHAR(255) DEFAULT NULL");
            await addColumnPgSafely('users', 'must_change_password', "BOOLEAN DEFAULT FALSE");
            await addColumnPgSafely('subscriptions', 'max_parents', "INTEGER DEFAULT -1");
            await addColumnPgSafely('subscriptions', 'max_faculty', "INTEGER DEFAULT -1");
            await addColumnPgSafely('subscriptions', 'max_storage_gb', "INTEGER DEFAULT -1");
            await addColumnPgSafely('subscriptions', 'duration_months', "INTEGER DEFAULT 12");
        }

        console.log('Database synced successfully.');

        // Auto-seed subscriptions if count is 0
        try {
            const Subscription = require('../models/Subscription');
            const subCount = await Subscription.count();
            if (subCount === 0) {
                console.log('Seeding default subscription plans (Free Trial, Basic, Standard, Premium, Enterprise)...');
                await Subscription.bulkCreate([
                    {
                        id: 1,
                        name: 'Free Trial',
                        price: 0.00,
                        billing_cycle: 'monthly',
                        max_students: 15,
                        max_parents: 15,
                        max_faculty: 3,
                        max_storage_gb: 1,
                        features: 'lms_enabled,library_enabled',
                        duration_months: 1
                    },
                    {
                        id: 2,
                        name: 'Basic',
                        price: 15000.00,
                        billing_cycle: 'yearly',
                        max_students: 150,
                        max_parents: 150,
                        max_faculty: 10,
                        max_storage_gb: 5,
                        features: 'lms_enabled,library_enabled',
                        duration_months: 12
                    },
                    {
                        id: 3,
                        name: 'Standard',
                        price: 35000.00,
                        billing_cycle: 'yearly',
                        max_students: 600,
                        max_parents: 600,
                        max_faculty: 30,
                        max_storage_gb: 20,
                        features: 'lms_enabled,library_enabled,transport_enabled',
                        duration_months: 12
                    },
                    {
                        id: 4,
                        name: 'Premium',
                        price: 75000.00,
                        billing_cycle: 'yearly',
                        max_students: 2500,
                        max_parents: 2500,
                        max_faculty: 120,
                        max_storage_gb: 100,
                        features: 'lms_enabled,library_enabled,transport_enabled,biometrics_enabled',
                        duration_months: 12
                    },
                    {
                        id: 5,
                        name: 'Enterprise',
                        price: 180000.00,
                        billing_cycle: 'yearly',
                        max_students: -1,
                        max_parents: -1,
                        max_faculty: -1,
                        max_storage_gb: 500,
                        features: 'lms_enabled,library_enabled,transport_enabled,biometrics_enabled',
                        duration_months: 12
                    }
                ], { bypassTenant: true });
                console.log('Seeded default subscription plans successfully.');
            }
        } catch (subSeedErr) {
            console.error('Failed to seed default subscription plans:', subSeedErr.message);
        }

        // Auto-seed global syllabus if boards count is 0
        try {
            const GlobalBoard = require('../models/GlobalBoard');
            const boardCount = await GlobalBoard.count();
            if (boardCount === 0) {
                console.log('Seeding default global syllabus details (CBSE Class 10 Math)...');
                
                const GlobalStandard = require('../models/GlobalStandard');
                const GlobalSubject = require('../models/GlobalSubject');
                const GlobalChapter = require('../models/GlobalChapter');
                const GlobalTopic = require('../models/GlobalTopic');
                const GlobalQuestion = require('../models/GlobalQuestion');
                const GlobalSyllabusVersion = require('../models/GlobalSyllabusVersion');

                // 1. Seed CBSE Board
                const cbse = await GlobalBoard.create({
                    name: 'Central Board of Secondary Education',
                    code: 'CBSE'
                }, { bypassTenant: true });

                // 2. Seed Class 10
                const class10 = await GlobalStandard.create({
                    board_id: cbse.id,
                    name: 'Class 10'
                }, { bypassTenant: true });

                // 3. Seed Mathematics
                const math = await GlobalSubject.create({
                    standard_id: class10.id,
                    name: 'Mathematics',
                    code: 'MATH-041'
                }, { bypassTenant: true });

                // 4. Seed Chapters
                const cap1 = await GlobalChapter.create({
                    subject_id: math.id,
                    name: 'Real Numbers',
                    chapter_number: 1
                }, { bypassTenant: true });

                const cap2 = await GlobalChapter.create({
                    subject_id: math.id,
                    name: 'Polynomials',
                    chapter_number: 2
                }, { bypassTenant: true });

                // 5. Seed Topics
                const topic1 = await GlobalTopic.create({
                    chapter_id: cap1.id,
                    name: 'Fundamental Theorem of Arithmetic',
                    teaching_hours: 4.5,
                    learning_outcomes: 'Students will learn to find HCF and LCM of positive integers using prime factorization, and prove irrationality of numbers.'
                }, { bypassTenant: true });

                const topic2 = await GlobalTopic.create({
                    chapter_id: cap2.id,
                    name: 'Relationship between Zeroes and Coefficients of a Polynomial',
                    teaching_hours: 6.0,
                    learning_outcomes: 'Understand zeroes of a quadratic polynomial and verify relationship with coefficients.'
                }, { bypassTenant: true });

                // 6. Seed Question Bank
                await GlobalQuestion.create({
                    topic_id: topic1.id,
                    question_text: 'Find the HCF and LCM of 6 and 20 by the prime factorisation method.',
                    question_type: 'Short',
                    difficulty: 'Easy',
                    answer_key: 'HCF(6, 20) = 2. LCM(6, 20) = 60.'
                }, { bypassTenant: true });

                // 7. Seed Version Control
                await GlobalSyllabusVersion.create({
                    board_id: cbse.id,
                    version: 'v2026.1',
                    changes_summary: 'Standardized math teaching hours, updated learning outcomes block, added HCF/LCM question banks.',
                    status: 'Active',
                    effective_date: '2026-04-01'
                }, { bypassTenant: true });

                console.log('Seeded global syllabus successfully.');
            }
        } catch (sylSeedErr) {
            console.error('Failed to seed global syllabus:', sylSeedErr.message);
        }

        // Backfill missing Registrations (logic sync)
        try {
            const Enquiry = require('../models/Enquiry');
            const Registration = require('../models/Registration');
            const User = require('../models/User');
            const { Op } = require('sequelize');

            // 1. Backfill from Enquiries table
            const enquiries = await Enquiry.findAll();
            for (const enq of enquiries) {
                // If it looks like a registration or is converted/enrolled
                const isRegType = enq.status === 'Converted' || (enq.message && enq.message.toLowerCase().includes('register'));
                if (!isRegType) continue;

                const existingReg = await Registration.findOne({
                    where: {
                        [Op.or]: [
                            enq.email ? { email: enq.email } : null,
                            enq.phone ? { phone: enq.phone } : null
                        ].filter(Boolean)
                    }
                });

                if (!existingReg) {
                    const hasUser = await User.findOne({
                        where: {
                            role: 'student',
                            [Op.or]: [
                                enq.email ? { email: enq.email } : null,
                                enq.phone ? { phone: enq.phone } : null
                            ].filter(Boolean)
                        }
                    });

                    const regStatus = (enq.status === 'Converted' || hasUser) ? 'approved' : 'pending';

                    await Registration.create({
                        name: enq.name,
                        email: enq.email || `${enq.phone}@temp.com`,
                        phone: enq.phone,
                        class: enq.class_range,
                        board: enq.board || 'State Board',
                        course_interest: enq.exam_target || 'None',
                        password: 'studentpass123',
                        status: regStatus,
                        token_amount: 0,
                        created_at: enq.created_at || new Date()
                    });
                    console.log(`📡 Automatically backfilled missing registration queue record for student: ${enq.name}`);
                }
            }

            // 2. Backfill from Users table (role = 'student')
            const students = await User.findAll({ where: { role: 'student' } });
            for (const stud of students) {
                const existingReg = await Registration.findOne({
                    where: {
                        [Op.or]: [
                            stud.email ? { email: stud.email } : null,
                            stud.phone ? { phone: stud.phone } : null
                        ].filter(Boolean)
                    }
                });
                if (!existingReg) {
                    // Try to find board from matching enquiry if possible
                    let boardVal = 'State Board';
                    if (stud.phone || stud.email) {
                        const matchingEnq = await Enquiry.findOne({
                            where: {
                                [Op.or]: [
                                    stud.email ? { email: stud.email } : null,
                                    stud.phone ? { phone: stud.phone } : null
                                ].filter(Boolean)
                            }
                        });
                        if (matchingEnq && matchingEnq.board) {
                            boardVal = matchingEnq.board;
                        }
                    }

                    await Registration.create({
                        name: stud.name,
                        email: stud.email || `${stud.phone || 'temp'}@temp.com`,
                        phone: stud.phone || '0000000000',
                        class: stud.standard || '10th',
                        board: boardVal,
                        course_interest: 'General Admission',
                        password: stud.password || 'studentpass123',
                        status: stud.status === 'active' ? 'approved' : 'pending',
                        token_amount: 0,
                        created_at: new Date()
                    });
                    console.log(`📡 Automatically backfilled missing registration queue record from student User: ${stud.name}`);
                }
            }

            // 3. Backfill Users from approved Registrations
            const approvedRegs = await Registration.findAll({ where: { status: 'approved' } });
            for (const reg of approvedRegs) {
                const hasUser = await User.findOne({
                    where: {
                        role: 'student',
                        [Op.or]: [
                            reg.email ? { email: reg.email } : null,
                            reg.phone ? { phone: reg.phone } : null
                        ].filter(Boolean)
                    }
                });

                if (!hasUser) {
                    console.log(`⚙️ DB Auto-Healing: Found approved registration [${reg.name}] without student user. Rebuilding account...`);
                    
                    const { getDomain } = require('./domainHelper');
                    
                    // Generate sequential credentials helper
                    const getNextUsername = async (role) => {
                        const count = await User.count({ where: { role } });
                        return `${role}${String(count + 1).padStart(2, '0')}`;
                    };

                    const sUsername = await getNextUsername('student');
                    const pUsername = await getNextUsername('parent');
                    const sPassword = reg.password || 'studentpass123';
                    const pPassword = `Parent@${sUsername.slice(7) || '01'}`;

                    const Student = require('../models/Student');
                    const Parent = require('../models/Parent');
                    const StudentParentMap = require('../models/StudentParentMap');

                    // Create Student User
                    const newStudent = await User.create({
                        name: reg.name,
                        email: reg.email || `${reg.phone}@${getDomain()}`,
                        password: sPassword,
                        role: 'student',
                        phone: reg.phone,
                        username: sUsername,
                        status: 'active'
                    });

                    // Create Student Profile extension
                    await Student.create({
                        user_id: newStudent.id,
                        standard: reg.class || '9th'
                    });

                    // Create Parent User
                    const newParent = await User.create({
                        name: reg.name + ' Parent',
                        email: `parent_${newStudent.id}@${getDomain()}`,
                        password: pPassword,
                        role: 'parent',
                        phone: reg.phone,
                        username: pUsername,
                        status: 'active'
                    });

                    // Create Parent Profile extension
                    await Parent.create({
                        user_id: newParent.id,
                        address: 'Restored from registration backup'
                    });

                    // Create student parent mapping
                    await StudentParentMap.create({
                        student_id: newStudent.id,
                        parent_id: newParent.id,
                        relation_type: 'guardian',
                        is_billing_contact: true,
                        is_emergency_contact: true
                    });

                    // Rebuild Enrollment
                    const Enrollment = require('../models/Enrollment');
                    const Course = require('../models/Course');
                    const Batch = require('../models/Batch');

                    let courseId = 1;
                    const matchedCourse = await Course.findOne({ where: { title: reg.course_interest } });
                    if (matchedCourse) {
                        courseId = matchedCourse.id;
                    }

                    let batchId = null;
                    const matchedBatch = await Batch.findOne({ where: { standard: reg.class } });
                    if (matchedBatch) {
                        batchId = matchedBatch.id;
                    }

                    const { getStandardFee } = require('../utils/feeHelper');
                    const totalFees = getStandardFee(reg.class, matchedCourse);
                    const installments = 4;
                    const instAmount = (totalFees - parseFloat(reg.token_amount || 0)) / installments;

                    await Enrollment.create({
                        student_id: newStudent.id,
                        batch_id: batchId,
                        course_id: courseId,
                        batch_year: '2025-26',
                        fee_plan: 'EMI',
                        total_installments: installments,
                        installment_amount: instAmount,
                        next_due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    });

                    // Rebuild FeePayment
                    if (parseFloat(reg.token_amount) > 0) {
                        const FeePayment = require('../models/FeePayment');
                        await FeePayment.create({
                            student_id: newStudent.id,
                            amount_paid: reg.token_amount,
                            payment_date: new Date().toISOString().split('T')[0],
                            payment_mode: 'Cash'
                        });
                    }

                    console.log(`✅ Successfully auto-healed student user [${reg.name}] (Student ID: ${newStudent.id})`);
                }
            }
        } catch (backfillErr) {
            console.log('Notice: Backfill migration query details:', backfillErr.message);
        }

        // Check for empty database and auto-seed
        try {
            const User = require('../models/User');
            const userCount = await User.count();
            if (userCount === 0) {
                console.log('⚠️ No users found in database! Automatically seeding the database with realistic multi-role data...');
                const { execSync } = require('child_process');
                const path = require('path');
                try {
                    execSync('node seed.js', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
                    console.log('✅ Database seeded successfully!');
                } catch (seedErr) {
                    console.error('Failed to auto-seed database:', seedErr.message);
                }
            }
        } catch (countErr) {
            console.log('Notice: User count query details:', countErr.message);
        }

        // Ensure at least one super-admin user exists in the database (Self-Healing logic)
        try {
            const User = require('../models/User');
            const superAdmin = await User.findOne({
                where: { role: 'super-admin' },
                bypassTenant: true
            });
            if (!superAdmin) {
                console.log('⚠️ No Super Admin found in the database! Automatically creating default Super Admin...');
                await User.create({
                    name: 'Super Admin',
                    email: 'superadmin@portal.com',
                    password: 'superadmin',
                    role: 'super-admin',
                    phone: '9999999901',
                    status: 'active',
                    tenant_id: 1
                });
                console.log('✅ Default Super Admin account created: superadmin@portal.com / superadmin');
            }
        } catch (superAdminErr) {
            console.error('Failed to verify/create default Super Admin:', superAdminErr.message);
        }

    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
