const { Pool } = require('pg');
require('dotenv').config();

// Local DB (Source)
const localPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'smart_faculty',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false
});

// Neon DB (Target)
const neonConnectionString = 'postgresql://neondb_owner:npg_ELY1Ct6ByHDu@ep-aged-cake-ah52k9am-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';
const neonPool = new Pool({
    connectionString: neonConnectionString,
    ssl: { rejectUnauthorized: false } // Neon usually requires SSL
});

const migrate = async () => {
    try {
        console.log("Starting Migration...");
        console.log("1. Fetching data from Local DB...");

        const facultyRes = await localPool.query('SELECT * FROM faculty ORDER BY id ASC');
        const usersRes = await localPool.query('SELECT * FROM users ORDER BY id ASC'); // Users might reference faculty
        const timetablesRes = await localPool.query('SELECT * FROM timetables ORDER BY id ASC');

        console.log(`   - Found ${facultyRes.rows.length} faculty`);
        console.log(`   - Found ${usersRes.rows.length} users`);
        console.log(`   - Found ${timetablesRes.rows.length} timetable entries`);

        console.log("2. Preparing Target DB (Neon)...");
        // Clear tables in reverse order of dependency
        await neonPool.query('DELETE FROM timetables');
        await neonPool.query('DELETE FROM users');
        await neonPool.query('DELETE FROM faculty');
        console.log("   - Cleared existing data in Neon DB (timetables, users, faculty)");

        // 2.5 Ensure Tables Exist (Using schema from schema.sql logic, essentially)
        // Just in case Neon DB is empty/fresh.
        await neonPool.query(`
            CREATE TABLE IF NOT EXISTS faculty (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                department VARCHAR(100) NOT NULL,
                room_number VARCHAR(20),
                floor_number VARCHAR(20),
                aliases TEXT[],
                specialization VARCHAR(255),
                is_on_leave BOOLEAN DEFAULT FALSE
            );
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                faculty_id INTEGER REFERENCES faculty(id) ON DELETE SET NULL
            );
            CREATE TABLE IF NOT EXISTS timetables (
                id SERIAL PRIMARY KEY,
                faculty_id INTEGER REFERENCES faculty(id) ON DELETE CASCADE,
                day_of_week VARCHAR(10) NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                course_name VARCHAR(100),
                location VARCHAR(50)
            );
        `);
        console.log("   - Ensured tables exist");

        console.log("3. Migrating Data...");

        // Insert Faculty
        console.log("   - Inserting Faculty...");
        for (const f of facultyRes.rows) {
            await neonPool.query(
                'INSERT INTO faculty (id, name, department, room_number, floor_number, aliases, specialization, is_on_leave) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                [f.id, f.name, f.department, f.room_number, f.floor_number, f.aliases, f.specialization, f.is_on_leave]
            );
        }

        // Insert Users
        console.log("   - Inserting Users...");
        for (const u of usersRes.rows) {
            await neonPool.query(
                'INSERT INTO users (id, username, password_hash, faculty_id) VALUES ($1, $2, $3, $4)',
                [u.id, u.username, u.password_hash, u.faculty_id]
            );
        }

        // Insert Timetables
        console.log("   - Inserting Timetables...");
        // Batch insert or loop? Loop is safer for error handling in this script.
        for (const t of timetablesRes.rows) {
            await neonPool.query(
                'INSERT INTO timetables (id, faculty_id, day_of_week, start_time, end_time, course_name, location) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [t.id, t.faculty_id, t.day_of_week, t.start_time, t.end_time, t.course_name, t.location]
            );
        }

        console.log("4. Updating Sequences...");
        // Update sequences so new inserts don't collide
        await neonPool.query("SELECT setval('faculty_id_seq', (SELECT MAX(id) FROM faculty))");
        await neonPool.query("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))");
        await neonPool.query("SELECT setval('timetables_id_seq', (SELECT MAX(id) FROM timetables))");

        console.log("Migration Complete! 🚀");
        process.exit(0);

    } catch (err) {
        console.error("Migration Failed:", err);
        process.exit(1);
    }
};

migrate();
