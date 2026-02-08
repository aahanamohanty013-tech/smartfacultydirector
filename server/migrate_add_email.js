const { Pool } = require('pg');
require('dotenv').config();

// Use Neon connection
const neonConnectionString = process.env.NEON_DATABASE_URL;
if (!neonConnectionString) {
    console.error("Error: NEON_DATABASE_URL environment variable is not set.");
    process.exit(1);
}
const pool = new Pool({
    connectionString: neonConnectionString,
    ssl: { rejectUnauthorized: false }
});

const migrate = async () => {
    try {
        console.log("Starting Migration to add Email & Verification columns...");

        // Check if columns exist before adding? Or just try/catch

        // 1. Add email column (UNIQUE)
        try {
            await pool.query('ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE');
            console.log(" - Added 'email' column");
        } catch (e) {
            if (e.code === '42701') console.log(" - 'email' column already exists");
            else console.error(" - Error adding 'email':", e.message);
        }

        // 2. Add is_verified (BOOLEAN DEFAULT FALSE)
        try {
            await pool.query('ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE');
            console.log(" - Added 'is_verified' column");
        } catch (e) {
            if (e.code === '42701') console.log(" - 'is_verified' column already exists");
            else console.error(" - Error adding 'is_verified':", e.message);
        }

        // 3. Add verification_token (VARCHAR)
        try {
            await pool.query('ALTER TABLE users ADD COLUMN verification_token VARCHAR(255)');
            console.log(" - Added 'verification_token' column");
        } catch (e) {
            if (e.code === '42701') console.log(" - 'verification_token' column already exists");
            else console.error(" - Error adding 'verification_token':", e.message);
        }

        // 4. Update existing users to be verified (so current users don't get locked out)
        await pool.query("UPDATE users SET is_verified = TRUE WHERE is_verified IS NULL OR email IS NULL");
        console.log(" - Marked existing users as verified");

        console.log("Migration Complete!");
        process.exit(0);

    } catch (err) {
        console.error("Migration Failed:", err);
        process.exit(1);
    }
};

migrate();
