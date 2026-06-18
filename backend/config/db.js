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
        } else if (isPostgres) {
            console.log('PostgreSQL/Supabase detected. Skipping MySQL-specific ALTER TABLE queries. Sequelize sync has already created/aligned columns.');
        }

        console.log('Database synced successfully.');

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

                    // Create Student User
                    const newStudent = await User.create({
                        name: reg.name,
                        email: reg.email || `${reg.phone}@${getDomain()}`,
                        password: sPassword,
                        role: 'student',
                        phone: reg.phone,
                        username: sUsername,
                        standard: reg.class || '9th',
                        parent_name: reg.name + ' Parent',
                        parent_phone: reg.phone,
                        address: 'Restored from registration backup',
                        status: 'active'
                    });

                    // Create Parent User
                    await User.create({
                        name: reg.name + ' Parent',
                        email: `parent_${newStudent.id}@${getDomain()}`,
                        password: pPassword,
                        role: 'parent',
                        phone: reg.phone,
                        parent_id: newStudent.id,
                        username: pUsername,
                        status: 'active'
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

    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
