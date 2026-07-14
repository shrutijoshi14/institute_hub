process.env.RENDER = 'true';
process.env.DATABASE_URL = 'postgresql://postgres.dwujzrutzwzbyzcxmcsb:Shruti%401408!!@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';
const { sequelize, connectDB } = require('./backend/config/db');
const { Batch, Faculty } = require('./backend/models/associations');
const tenantStorage = require('./backend/config/tenantContext');

async function test() {
    try {
        console.log('🔄 Running connectDB to migrate and connect...');
        await connectDB();
        console.log('✅ Connected and Migrated successfully!');

        // Run queries inside the tenant context (simulating tenant 2 'nes')
        await tenantStorage.run({ tenantId: 2 }, async () => {
            console.log('\n--- Testing Faculty.findAll() ---');
            try {
                const facs = await Faculty.findAll();
                console.log(`Success! Found ${facs.length} faculty members.`);
            } catch (err) {
                console.error('❌ Faculty Query Failed:', err);
            }

            console.log('\n--- Testing Batch.findAll() ---');
            try {
                const batches = await Batch.findAll({
                    include: [{ model: Faculty, attributes: ['id', 'name', 'subject_expertise'] }]
                });
                console.log(`Success! Found ${batches.length} batches.`);
            } catch (err) {
                console.error('❌ Batches Query Failed:', err);
            }
        });

    } catch (err) {
        console.error('General Error:', err);
    } finally {
        await sequelize.close();
    }
}

test();
