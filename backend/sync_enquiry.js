const { sequelize } = require('./config/db');
const Enquiry = require('./models/Enquiry');

async function syncDb() {
    try {
        await sequelize.authenticate();
        await Enquiry.sync({ alter: true });
        console.log('Enquiry table synced successfully.');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sequelize.close();
    }
}
syncDb();
