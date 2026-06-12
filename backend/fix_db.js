require('dotenv').config();
const { sequelize } = require('./config/db');
const User = require('./models/User');
const Enrollment = require('./models/Enrollment');

async function fixDB() {
    try {
        await sequelize.authenticate();
        console.log('Connected');

        // Execute raw query to delete orphaned enrollments
        await sequelize.query(`
            DELETE FROM enrollments 
            WHERE student_id NOT IN (SELECT id FROM users)
        `);
        console.log('Deleted orphaned enrollments');

        await sequelize.sync({ alter: true });
        console.log('Sync complete');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
fixDB();
