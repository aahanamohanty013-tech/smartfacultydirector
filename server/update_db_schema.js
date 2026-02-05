const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false
});

const migrate = async () => {
    try {
        console.log("🔌 Connecting to database...");
        // Add is_on_leave column if it doesn't exist
        await pool.query(`
            ALTER TABLE faculty 
            ADD COLUMN IF NOT EXISTS is_on_leave BOOLEAN DEFAULT FALSE;
        `);
        console.log("✅ Successfully added 'is_on_leave' column to 'faculty' table.");
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
    } finally {
        await pool.end();
    }
};

migrate();
