const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'smart_faculty',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

(async () => {
    try {
        console.log("Attempting to delete 'Dr. Aahana M'...");
        const res = await pool.query("DELETE FROM faculty WHERE name = 'Dr. Aahana M'");
        console.log(`Deleted count: ${res.rowCount}`);
    } catch (e) {
        console.error("Error deleting user:", e);
    } finally {
        pool.end();
    }
})();
