const { Pool } = require('pg');
require('dotenv').config(); // Back to using safe env variables!

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const faculty3rdFloor = [
    "Dr. Nagaraja G.S", "Dr. Krishnappa H K", "Dr. Vinay V Hegde", "Dr. Ashok Kumar A R",
    "Dr. Mohana", "Dr. Badrinath K", "Dr. Manas M N", "Dr. Sandhya S", "Dr. Pratiba D",
    "Ms. Shwetha Babu Prasad", "Dr. Manonmani S", "Ms. Saraswathi G.D", "Ms. Deepthi L",
    "Ms. Mekhala V Purohit", "Ms. Savitri Kulkarni", "Ms. Rajatha", "Ms. Nithyashree",
    "Dr. Karanam Sunil Kumar", "Ms. L Kalachandrashekhar"
];

const faculty1stFloor = [
    "Dr. Ramakanth Kumar P", "Dr. Rajashree Shettar", "Dr. Minal Moharir", "Dr. Hemavathy R.",
    "Dr. Chethana R Murthy", "Dr. Prapulla S B", "Dr. H Pavithra", "Dr. Veena Gadad",
    "Dr. Sneha M", "Mrs. Ganashree K.C.", "Mrs. Neethu Sreekumaran", "Mrs. Apoorva Udaya Kumar C"
];

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const courses = ['CS101', 'CS202', 'DAA', 'OS', 'CN', 'AI/ML', 'DBMS', 'SE', 'Web Tech', 'Labs'];
const timeSlots = [
    { start: '09:00:00', end: '10:00:00' }, { start: '10:00:00', end: '11:00:00' },
    { start: '11:30:00', end: '12:30:00' }, { start: '12:30:00', end: '13:30:00' },
    { start: '14:30:00', end: '15:30:00' }, { start: '15:30:00', end: '16:30:00' }
];

const seed = async () => {
    try {
        console.log("Connecting to NEON DB...");

        await pool.query('DELETE FROM timetables');
        await pool.query('DELETE FROM users');
        await pool.query('DELETE FROM faculty');
        console.log("Cleared old data.");

        const insertFaculty = async (name, floor, room) => {
            const cleanName = name.replace(/^(Dr\.|Ms\.|Mrs\.|Mr\.)\s+/i, '');
            const alias = cleanName.split(/[\s\.]+/).filter(p => p.length > 0).map(p => p[0].toUpperCase()).join('');
            const specs = ['AI/ML', 'Data Science', 'Networks', 'IoT', 'Cyber Security', 'Web Dev'];
            const specialization = specs[Math.floor(Math.random() * specs.length)];

            console.log(`Adding ${name}...`);
            const res = await pool.query(
                'INSERT INTO faculty (name, department, room_number, floor_number, aliases, specialization) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
                [name, 'Computer Science', room, floor, [alias], specialization]
            );
            return res.rows[0].id;
        };

        const facultyIds = [];
        let room3 = 301;
        for (const name of faculty3rdFloor) {
            const id = await insertFaculty(name, '3rd Floor', `CS-${room3++}`);
            facultyIds.push({ id, name });
        }
        let room1 = 101;
        for (const name of faculty1stFloor) {
            const id = await insertFaculty(name, '1st Floor', `CS-${room1++}`);
            facultyIds.push({ id, name });
        }

        console.log("Generating Timetables...");
        for (const f of facultyIds) {
            for (const day of days) {
                for (const slot of timeSlots) {
                    if (Math.random() < 0.4) {
                        const course = courses[Math.floor(Math.random() * courses.length)];
                        await pool.query(
                            'INSERT INTO timetables (faculty_id, day_of_week, start_time, end_time, course_name) VALUES ($1, $2, $3, $4, $5)',
                            [f.id, day, slot.start, slot.end, course]
                        );
                    }
                }
            }
        }
        console.log("Seeding complete! 🌱");
        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
};

seed();
