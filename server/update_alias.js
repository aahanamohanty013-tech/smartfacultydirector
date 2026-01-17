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
        console.log("Updating alias for 'Dr. Anjali Sharma'...");
        // Update aliases array to be just ['AS']
        const res = await pool.query(
            "UPDATE faculty SET aliases = ARRAY['AS'] WHERE name = 'Dr. Anjali Sharma' RETURNING *"
        );
        if (res.rows.length > 0) {
            console.log(`Updated successfully. New aliases: ${res.rows[0].aliases}`);
        } else {
            console.log("Faculty member not found.");
        }
    } catch (e) {
        console.error("Error updating user:", e);
    } finally {
        pool.end();
    }
})();
