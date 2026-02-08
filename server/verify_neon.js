const { Pool } = require('pg');

// User provided connection string
require('dotenv').config();

// User provided connection string
const neonConnectionString = process.env.NEON_DATABASE_URL;
if (!neonConnectionString) {
    console.error("Error: NEON_DATABASE_URL environment variable is not set.");
    process.exit(1);
}

const pool = new Pool({
    connectionString: neonConnectionString,
    ssl: { rejectUnauthorized: false }
});

const verify = async () => {
    try {
        console.log("Verifying Neon DB Data...");

        const countRes = await pool.query("SELECT count(*) FROM faculty");
        console.log(`Total Faculty Count: ${countRes.rows[0].count}`);

        const eceCount = await pool.query("SELECT count(*) FROM faculty WHERE department = 'Electronics and Communication'");
        console.log(`ECE Faculty Count: ${eceCount.rows[0].count}`);

        const timetableRes = await pool.query("SELECT count(*) FROM timetables");
        console.log(`Total Timetable Entries: ${timetableRes.rows[0].count}`);

        process.exit(0);
    } catch (err) {
        console.error("Verification failed:", err);
        process.exit(1);
    }
};

verify();
