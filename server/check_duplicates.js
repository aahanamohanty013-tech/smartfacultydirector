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

const check = async () => {
    try {
        const res = await pool.query(`
            SELECT name, count(*) 
            FROM faculty 
            WHERE department = 'Electronics and Communication' 
            GROUP BY name 
            HAVING count(*) > 1
        `);

        if (res.rows.length > 0) {
            console.log("Duplicates found:");
            console.table(res.rows);
        } else {
            console.log("No duplicates found.");

            // Count total
            const countRes = await pool.query("SELECT count(*) FROM faculty WHERE department = 'Electronics and Communication'");
            console.log(`Total ECE Faculty: ${countRes.rows[0].count}`);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

check();
