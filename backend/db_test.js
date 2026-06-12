const { sequelize } = require('./config/db');

async function test() {
    try {
        console.log('--- Step 1: Users JOIN Enrollments ---');
        const step1 = await sequelize.query(`
            SELECT u.id as student_id, u.name, e.course_id
            FROM users u
            JOIN enrollments e ON u.id = e.student_id
            WHERE u.role = 'student'
        `, { type: sequelize.QueryTypes.SELECT });
        console.log('Step 1 results:', step1);

        console.log('--- Step 2: Checking Course IDs existence ---');
        const courseIds = [...new Set(step1.map(s => s.course_id).filter(id => id !== null))];
        if (courseIds.length > 0) {
            const courses = await sequelize.query(`
                SELECT id, title, fees FROM courses WHERE id IN (${courseIds.join(',')})
            `, { type: sequelize.QueryTypes.SELECT });
            console.log('Matching Courses:', courses);
        } else {
            console.log('No non-null course IDs found in enrollments!');
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

test();
