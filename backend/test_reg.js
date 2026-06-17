const { sequelize } = require('./config/db');
const Registration = require('./models/Registration');

async function run() {
    try {
        console.log("Forcing Live DB Connection...");
        const data = await Registration.findAll();
        console.log("Registrations count:", data.length);
    } catch (e) {
        console.error("Registrations fetch failed:", e.message);
    } finally {
        process.exit(0);
    }
}

run();
