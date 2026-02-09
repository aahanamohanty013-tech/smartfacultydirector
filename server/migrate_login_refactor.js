const { Pool } = require('pg');
require('dotenv').config();

// Default to local DB, but allow fallback if needed (though usually we want to be explicit)
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("Error: DATABASE_URL environment variable is not set.");
    process.exit(1);
}

const pool = new Pool({
    connectionString: connectionString,
    ssl: connectionString.includes('neon.tech') ? { rejectUnauthorized: false } : false
});

const migrate = async () => {
    try {
        console.log("Starting Migration to Refactor Login Constraints...");

        // 1. Drop UNIQUE constraint on username
        try {
            // Note: The constraint name 'users_username_key' is standard for 'username VARCHAR UNIQUE'
            // We use IF EXISTS to avoid errors if it was already dropped or named differently
            await pool.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key');
            console.log(" - Dropped UNIQUE constraint on 'username'");
        } catch (e) {
            console.error(" - Error dropping username constraint:", e.message);
        }

        // 1.5. Add EMAIL, IS_VERIFIED, VERIFICATION_TOKEN columns if they don't exist
        const columns = [
            { name: 'email', type: 'VARCHAR(255)' },
            { name: 'is_verified', type: 'BOOLEAN DEFAULT FALSE' },
            { name: 'verification_token', type: 'VARCHAR(255)' }
        ];

        for (const col of columns) {
            try {
                await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
                console.log(` - Added '${col.name}' column (if missing)`);
            } catch (e) {
                console.error(` - Error adding ${col.name} column:`, e.message);
            }
        }

        // 2. Ensure UNIQUE constraint on email (should exist, but good to ensure)
        try {
            // We can try adding it, if it fails it likely exists. 
            // Better: Check if it exists or just add unique index if not. 
            // Simple way: Add constraint, catch 'already exists' error.
            await pool.query('ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email)');
            console.log(" - Added UNIQUE constraint on 'email'");
        } catch (e) {
            if (e.code === '42701' || e.message.includes('already exists')) {
                console.log(" - UNIQUE constraint on 'email' already exists");
            } else {
                console.error(" - Error adding email constraint:", e.message);
            }
        }

        console.log("Migration Complete!");
        process.exit(0);

    } catch (err) {
        console.error("Migration Failed:", err);
        process.exit(1);
    }
};

migrate();
