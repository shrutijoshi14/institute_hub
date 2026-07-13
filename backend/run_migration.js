const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    const isRollback = process.argv.includes('--rollback');
    const sqlFile = isRollback ? 'rollback.sql' : 'migration.sql';
    const filePath = path.join(__dirname, '..', 'database', sqlFile);
    
    console.log(`Reading SQL file: ${filePath}`);
    if (!fs.existsSync(filePath)) {
        console.error(`Error: SQL file not found at ${filePath}`);
        process.exit(1);
    }
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Simple parser to split SQL queries while ignoring comments and keeping valid SQL lines
    const lines = sqlContent.split('\n');
    let queries = [];
    let currentQuery = '';
    
    for (let line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('--') || trimmed === '') {
            continue;
        }
        currentQuery += line + '\n';
        if (trimmed.endsWith(';')) {
            queries.push(currentQuery.trim());
            currentQuery = '';
        }
    }
    if (currentQuery.trim()) {
        queries.push(currentQuery.trim());
    }

    console.log(`Connecting to local MySQL database (${process.env.DB_NAME}) at ${process.env.DB_HOST}...`);
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'ambition_tutorials',
        multipleStatements: true
    });

    console.log('Connected successfully. Executing queries...');
    
    // Turn off foreign keys temporarily for safer sequential execution if tables are modified
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
    
    for (let i = 0; i < queries.length; i++) {
        const query = queries[i];
        // Skip global checks if they were split out or are SET statements
        if (query.toUpperCase().startsWith('SET ')) {
            await connection.query(query);
            continue;
        }
        try {
            await connection.query(query);
            console.log(`[Query ${i+1}/${queries.length}] Executed successfully.`);
        } catch (err) {
            console.error(`[Error on Query ${i+1}]`, err.message);
            console.error(`Failed Query Detail:\n${query}\n`);
            if (!isRollback) {
                console.log('Stopping execution due to migration error.');
                break;
            }
        }
    }
    
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
    await connection.end();
    console.log('Execution finished!');
}

run().catch(err => {
    console.error('Database migration script failed:', err);
    process.exit(1);
});
