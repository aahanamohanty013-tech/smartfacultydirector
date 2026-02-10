
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'smart_faculty',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
    ssl: (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require')) ? { rejectUnauthorized: false } : false,
});

async function migrate() {
    try {
        console.log('Adding is_on_exam_duty and exam_duty_time columns to faculty table...');

        // Add is_on_exam_duty
        await pool.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='faculty' AND column_name='is_on_exam_duty') THEN
                    ALTER TABLE faculty ADD COLUMN is_on_exam_duty BOOLEAN DEFAULT FALSE;
                END IF;
            END
            $$;
        `);

        // Add exam_duty_time
        await pool.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='faculty' AND column_name='exam_duty_time') THEN
                    ALTER TABLE faculty ADD COLUMN exam_duty_time VARCHAR(50);
                END IF;
            END
            $$;
        `);

        console.log('Migration successful.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
