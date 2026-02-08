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
        const countRes = await pool.query("SELECT count(*) FROM faculty");
        console.log(`Total Faculty Count: ${countRes.rows[0].count}`);

        const eceCount = await pool.query("SELECT count(*) FROM faculty WHERE department = 'Electronics and Communication'");
        console.log(`ECE Faculty Count: ${eceCount.rows[0].count}`);

        const maxIdRes = await pool.query("SELECT MAX(id) FROM faculty");
        console.log(`Max ID: ${maxIdRes.rows[0].max}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

check();
