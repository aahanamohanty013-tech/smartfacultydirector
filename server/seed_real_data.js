const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'smart_faculty',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false
});

const facultyData = [
    // --- First Floor ---
    { room: "CS A – 105", short: "Dr. PH", name: "Dr. Pavithra H", spec: "SDN, Software Engineering", floor: "1st Floor" },
    { room: "CS A – 104", short: "Dr. PSB", name: "Dr. Prapulla S B", spec: "Computer Networks, WSN", floor: "1st Floor" },
    { room: "CS A – 103", short: "Dr. HR", name: "Dr. Hemavathy R", spec: "Image Processing", floor: "1st Floor" },
    { room: "CS A – 102", short: "Dr. RS", name: "Dr. Rajashree Shettar", spec: "Information Retrieval, Data Mining", floor: "1st Floor" },
    { room: "CS A – 101", short: "Dr. MM", name: "Dr. Minal Moharir", spec: "High Performance Computing, Networks & Information Security", floor: "1st Floor" },
    { room: "CS A – 106", short: "Dr. CRM", name: "Dr. Chethana R Murthy", spec: "Wireless Cellular Networks", floor: "1st Floor" },
    { room: "CS A – 107", short: "Dr. VG", name: "Dr. Veena Gadad", spec: "Data Security & Privacy", floor: "1st Floor" },
    { room: "CS A – 108", short: "Mrs. KCG", name: "Prof. Ganashree K C", spec: "Image Processing, Algorithms", floor: "1st Floor" },
    { room: "CS A – 109", short: "Mrs. AUC", name: "Prof. Apoorva Udaya Kumar Chate", spec: "Machine Learning", floor: "1st Floor" },
    { room: "CS A – 110", short: "Dr. RMP", name: "Dr. Ramakanth Kumar P", spec: "Pattern Recognition, NLP", floor: "1st Floor" },
    { room: "CS A – 113", short: "Dr. SNM", name: "Dr. Sneha M", spec: "Network Security", floor: "1st Floor" },
    { room: "CS A – 114", short: "Dr. NSK", name: "Prof. Neethu S", spec: "SDN, Machine Learning, Embedded Systems", floor: "1st Floor" },

    // --- Second Floor ---
    { room: "CS A – 205", short: "Dr. SB", name: "Dr. Suma B", spec: "Data Mining, Image Processing", floor: "2nd Floor" },
    { room: "CS A – 204", short: "Dr. JS", name: "Dr. Jyoti Shetty", spec: "Virtualization, Cloud Computing", floor: "2nd Floor" },
    { room: "CS A – 203", short: "Dr. SCN", name: "Dr. Sowmyarani C N", spec: "Computer Security & Privacy", floor: "2nd Floor" },
    { room: "CS A – 202", short: "Dr. DN", name: "Dr. Deepamala N", spec: "NLP, Computer Networks", floor: "2nd Floor" },
    { room: "CS A – 201", short: "Dr. AS", name: "Dr. Anitha Sandeep", spec: "Information Security", floor: "2nd Floor" },
    { room: "CS A – 206", short: "Mrs. DD", name: "Prof. Deepika Dash", spec: "Compiler Design", floor: "2nd Floor" },
    { room: "CS A – 207", short: "Dr. ASP", name: "Dr. Anitha Sandeep", spec: "Information Security", floor: "2nd Floor" }, // Duplicate name, different room/short? Keeping both.
    { room: "CS A – 208", short: "Dr. SDV", name: "Dr. Sindhu D V", spec: "NLP, Speech Processing, Neural Networks", floor: "2nd Floor" },
    { room: "CS A – 209", short: "Mr. SHD", name: "Prof. Shraddha H D", spec: "Computer Science and Engineering", floor: "2nd Floor" },
    { room: "CS A – 210", short: "Dr. AN", name: "Dr. Azra Nasreen", spec: "Video Analytics", floor: "2nd Floor" },
    { room: "CS A – 211", short: "Dr. TP", name: "Dr. Praveena T", spec: "Computer Networks", floor: "2nd Floor" },
    { room: "CS A – 214", short: "Dr. MSS", name: "Dr. Smriti Srivastava", spec: "Wireless Mesh Networks", floor: "2nd Floor" },
    { room: "CS A – 215", short: "Dr. SMS", name: "Dr. Srividya M S", spec: "Computer Vision, Deep Learning, Machine Learning", floor: "2nd Floor" },

    // --- Third Floor ---
    { room: "CS A – 307", short: "Dr. MMN", name: "Dr. Manas M N", spec: "Data Mining", floor: "3rd Floor" },
    { room: "CS A – 306", short: "Dr. KB", name: "Dr. K Badari Nath", spec: "Embedded Systems", floor: "3rd Floor" },
    { room: "CS A – 305", short: "Dr. ARA", name: "Dr. Ashok Kumar", spec: "Video Analytics", floor: "3rd Floor" },
    { room: "CS A – 304", short: "Dr. MH", name: "Dr. Mohana", spec: "Quantum ML, GenAI, Deep Learning, Computer Vision", floor: "3rd Floor" },
    { room: "CS A – 303", short: "Dr. VH", name: "Dr. Vinay Hegde", spec: "NLP, Networks", floor: "3rd Floor" },
    { room: "CS A – 302", short: "Dr. HKK", name: "Dr. Krishnappa H K", spec: "Graph Theory, Graphics", floor: "3rd Floor" },
    { room: "CS A – 301", short: "Dr. GSN", name: "Dr. G S Nagaraja", spec: "Computer Networks, Network Management", floor: "3rd Floor" },
    { room: "CS A – 308", short: "Dr. KSK", name: "Dr. Karanam Sunil Kumar", spec: "Computer Vision, Machine Learning", floor: "3rd Floor" },
    { room: "CS A – 309", short: "Mrs. LKC", name: "Prof. L Kala Chandrashekhar", spec: "AI, Machine Learning, Blockchain Technologies", floor: "3rd Floor" },
    { room: "CS A – 310", short: "Mrs. NGD", name: "Prof. Nithyashree G D", spec: "Data Structures", floor: "3rd Floor" },
    { room: "CS A – 312", short: "Mrs. KSK", name: "Prof. Savitri Kulkarni", spec: "Machine Learning, Deep Learning", floor: "3rd Floor" },
    { room: "CS A – 313", short: "Dr. RJ", name: "Prof. Rajatha", spec: "AI, Machine Learning", floor: "3rd Floor" },
    { room: "CS A – 314", short: "Dr. MVP", name: "Prof. Mekhala Vinod Purohit", spec: "AI, Deep Learning, Computer Vision", floor: "3rd Floor" },
    { room: "CS A – 315", short: "Mrs. SGD", name: "Prof. Saraswathi Govind Datar", spec: "AI & ML in Healthcare", floor: "3rd Floor" },
    { room: "CS A – 317", short: "Mrs. DL", name: "Prof. Deepthi L", spec: "Computer Networks", floor: "3rd Floor" },
    { room: "CS A – 322", short: "Dr. MS", name: "Dr. Manonmani S", spec: "Image Processing, Machine Learning, Deep Learning", floor: "3rd Floor" },
    { room: "CS A – 323", short: "Dr. SBP", name: "Prof. Shweta Babu Prasad", spec: "Computer Networks, Blockchain", floor: "3rd Floor" },
    { room: "CS A – 318", short: "Dr. TD", name: "Dr. Pratiba D", spec: "Web Technologies", floor: "3rd Floor" },
    { room: "CS A – 319", short: "Dr. SANS", name: "Dr. Sandhya S", spec: "Networks and Virtualization", floor: "3rd Floor" }
];

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const courses = ['CS101', 'CS202', 'DAA', 'OS', 'CN', 'AI/ML', 'DBMS', 'SE', 'Web Tech', 'Labs', 'BlockChain', 'NLP'];
const timeSlots = [
    { start: '09:00:00', end: '10:00:00' }, { start: '10:00:00', end: '11:00:00' },
    { start: '11:30:00', end: '12:30:00' }, { start: '12:30:00', end: '13:30:00' },
    { start: '14:30:00', end: '15:30:00' }, { start: '15:30:00', end: '16:30:00' }
];

const seed = async () => {
    try {
        console.log("Connecting to Database for Real Data Seeding...");

        // Clear existing data
        await pool.query('DELETE FROM timetables');
        await pool.query('DELETE FROM users');
        await pool.query('DELETE FROM faculty');
        console.log("Cleared old data.");

        const facultyIds = [];

        for (const faculty of facultyData) {
            console.log(`Adding ${faculty.name}...`);

            // Construct aliases: start with the provided shortform, maybe add initials
            let aliases = [faculty.short];

            // Add automatic initials based alias if different
            // e.g. "Dr. Pavithra H" -> "PH" or "DPH"
            // The user provided explicit shortforms, so we prioritize those.

            const res = await pool.query(
                'INSERT INTO faculty (name, department, room_number, floor_number, aliases, specialization) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
                [faculty.name, 'Computer Science', faculty.room, faculty.floor, aliases, faculty.spec]
            );
            facultyIds.push({ id: res.rows[0].id, name: faculty.name });
        }

        console.log("Generating Mock Timetables for Real Faculty...");
        for (const f of facultyIds) {
            for (const day of days) {
                // Give each faculty ~3-4 classes a week randomly
                let classesToday = 0;
                for (const slot of timeSlots) {
                    if (Math.random() < 0.3 && classesToday < 3) {
                        const course = courses[Math.floor(Math.random() * courses.length)];
                        await pool.query(
                            'INSERT INTO timetables (faculty_id, day_of_week, start_time, end_time, course_name) VALUES ($1, $2, $3, $4, $5)',
                            [f.id, day, slot.start, slot.end, course]
                        );
                        classesToday++;
                    }
                }
            }
        }

        console.log("Real Data Seeding complete! 🌱");
        process.exit(0);
    } catch (err) {
        console.error("Seeding failed full error:", err);
        console.error("Message:", err.message);
        console.error("Detail:", err.detail);
        process.exit(1);
    }
};

seed();
