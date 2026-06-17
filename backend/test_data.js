const { sequelize } = require('./config/db');

async function run() {
    try {
        console.log("Querying registrations...");
        const data = await sequelize.query("SELECT * FROM registrations", { type: sequelize.QueryTypes.SELECT });
        console.log("Registrations count:", data.length);
        if (data.length > 0) {
            console.log("First record keys:", Object.keys(data[0]));
            console.log("First record:", data[0]);
        }
    } catch (e) {
        console.error("Query failed:", e.message);
    } finally {
        process.exit(0);
    }
}

run();
