const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'smart_faculty',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false
});

const verify = async () => {
    try {
        console.log("Verifying ECE Data...");

        const countRes = await pool.query("SELECT count(*) FROM faculty WHERE department = 'Electronics and Communication'");
        console.log(`ECE Faculty Count: ${countRes.rows[0].count}`);

        const timetableRes = await pool.query(`
            SELECT f.name, count(t.id) as class_count 
            FROM faculty f 
            JOIN timetables t ON f.id = t.faculty_id 
            WHERE f.department = 'Electronics and Communication' 
            GROUP BY f.name 
            LIMIT 5
        `);

        console.log("Sample Timetable Counts:");
        timetableRes.rows.forEach(r => console.log(`- ${r.name}: ${r.class_count} classes`));

        if (parseInt(countRes.rows[0].count) > 0) {
            console.log("Verification SUCCESS: ECE Faculty found.");
        } else {
            console.log("Verification FAILED: No ECE Faculty found.");
        }
        process.exit(0);
    } catch (err) {
        console.error("Verification failed:", err);
        process.exit(1);
    }
};

verify();
