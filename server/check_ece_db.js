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
        const res = await pool.query("SELECT name, department, specialization FROM faculty WHERE department = 'Electronics and Communication' ORDER BY id ASC");
        console.log(`Found ${res.rowCount} ECE Faculty members in database:`);
        res.rows.forEach((row, index) => {
            console.log(`${index + 1}. ${row.name} - ${row.specialization || 'No Specialization'}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

check();
