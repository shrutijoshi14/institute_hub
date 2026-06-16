const { Sequelize } = require('sequelize');
require('dotenv').config({ override: true });

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
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
