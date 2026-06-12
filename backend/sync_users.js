const { sequelize } = require('./config/db');
const User = require('./models/User');

async function syncDb() {
    try {
        await sequelize.authenticate();
        console.log('Connected.');
        // Alter sync to add new columns without dropping
        await User.sync({ alter: true });
        console.log('User table synced successfully.');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sequelize.close();
    }
}

syncDb();
