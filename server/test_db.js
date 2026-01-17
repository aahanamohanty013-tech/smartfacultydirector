const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'smart_faculty',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('Error acquiring client', err.code, err.message);
        console.log('Ensure PostgreSQL is running and the credentials in .env (or defaults) are correct.');
    } else {
        console.log('Successfully connected to database!');
        client.release();
    }
    pool.end();
});
