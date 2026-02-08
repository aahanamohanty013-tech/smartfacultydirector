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

const eceFacultyData = [
    { name: "Dr. K.S. Geetha", designation: "Professor & Vice-Principal", spec: "Signal Processing, Image processing, Flexible Electronics", short: "KSG" },
    { name: "Dr. Prakash Biswagar", designation: "Professor", spec: "Communication Systems", short: "PB" },
    { name: "Dr. M. Uttara Kumari", designation: "Professor & Dean (R&D)", spec: "Signal Processing", short: "MUK" },
    { name: "Dr. Ramesh K B", designation: "Associate Professor", spec: "Signal Processing, Embedded System, Biomedical engineering", short: "RKB" },
    { name: "Dr. Veena Devi S V", designation: "Associate Professor", spec: "Image Processing & Signal Processing", short: "VDSV" },
    { name: "Dr. Govinda Raju M.", designation: "Associate Professor", spec: "Embedded systems, Multi Carrier Modulation Techniques", short: "GRM" },
    { name: "Dr. Mahesh A.", designation: "Associate Professor", spec: "Electromagnetics and Antennas", short: "MA" },
    { name: "Dr. Shilpa D.R.", designation: "Associate Professor & Assoc. Dean(P&T)", spec: "VLSI Design, ASIC Design", short: "SDR" },
    { name: "Dr. Abhay .A. Deshpande", designation: "Associate Professor", spec: "Communication System, Robotics, Control System, Signal Processing", short: "AAD" },
    { name: "Dr. Chethana G", designation: "Assistant Professor", spec: "Embedded systems, MIMO, AI/ML", short: "CG" },
    { name: "Dr. Sujata D. Badiger", designation: "Assistant Professor", spec: "Wireless Communication and Networking", short: "SDB" },
    { name: "Dr. Rohini S. Hallikar", designation: "Assistant Professor", spec: "Communication Systems", short: "RSH" },
    { name: "Dr. Sujatha Hiremath", designation: "Assistant Professor", spec: "VLSI Design", short: "SH" },
    { name: "Dr. Deepashree Devaraj", designation: "Assistant Professor (Selection Grade)", spec: "Medical image processing, Biomedical instrumentation", short: "DD" },
    { name: "Dr. Rajani Katiyar", designation: "Assistant Professor", spec: "Communication & Signal Processing", short: "RK" },
    { name: "Dr. K. A. Nethravathi", designation: "Assistant Professor", spec: "RADAR Signal Processing & Wireless Communication", short: "KAN" },
    { name: "Dr. Harsha", designation: "Assistant Professor", spec: "Medical Image Processing", short: "H" },
    { name: "Dr. Ramavenkateswaran.N.", designation: "Assistant Professor", spec: "Electron device fabrication and characterization, Thin film transistors, Nanomaterials", short: "RVN" },
    { name: "Dr. Roopa J.", designation: "Assistant Professor", spec: "2D materials based thin film flexible sensors", short: "RJ" },
    { name: "Dr. Rajasree. P. M", designation: "Assistant Professor", spec: "", short: "RPM" },
    { name: "P. Narashimaraja", designation: "Assistant Professor", spec: "Analog IC Design, Photonics", short: "PN" },
    { name: "Dr. Veena Divya. K", designation: "Assistant Professor", spec: "Image Processing", short: "VDK" },
    { name: "Ravishankar Holla", designation: "Assistant Professor", spec: "Sensors and sensor networks", short: "RH" },
    { name: "Dr. Sowmya Nag K", designation: "Assistant Professor", spec: "Wireless Communication, Network Security", short: "SNK" },
    { name: "Sujata Priyambada Mishra", designation: "Assistant Professor", spec: "Signal Processing", short: "SPM" },
    { name: "Neeta B.Malvi", designation: "Assistant Professor", spec: "Signal processing, Image Processing and cryptography", short: "NBM" },
    { name: "Deepika P", designation: "Assistant Professor", spec: "Low power VLSI design", short: "DP" },
    { name: "Shwetha Baliga", designation: "Assistant Professor", spec: "Signal processing", short: "SB" },
    { name: "Dr. Rajithkumar B K", designation: "Assistant Professor", spec: "Image processing & Machine Learning", short: "RBK" },
    { name: "Anusha L S", designation: "Assistant Professor", spec: "Signal Processing, Image Processing", short: "ALS" },
    { name: "S Praveen", designation: "Assistant Professor", spec: "Digital Electronics, Embedded System, VLSI Design", short: "SP" },
    { name: "Mrs Pratibha Kantanavar", designation: "Assistant Professor", spec: "Wireless Adhoc Networks", short: "PK" },
    { name: "Ms Sindhu Rajendran", designation: "Assistant Professor", spec: "Communication Systems, Networking", short: "SR" },
    { name: "Dr. Avik Banerjee", designation: "Assistant Professor", spec: "Wireless Communication, Cognitive radio Networks", short: "AB" },
    { name: "Dr. S Ravi Shankar", designation: "Visiting Professor", spec: "Electromagnetic Scattering, Antennas, Broadband Communication", short: "SRS" }
];

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const courses = ['EC101', 'EC202', 'Signals', 'Analog', 'Digital', 'VLSI', 'Control Systems', 'Communication', 'Microcontrollers', 'DSP', 'Embedded Systems', 'Electromagnetics'];
const timeSlots = [
    { start: '09:00:00', end: '10:00:00' }, { start: '10:00:00', end: '11:00:00' },
    { start: '11:30:00', end: '12:30:00' }, { start: '12:30:00', end: '13:30:00' },
    { start: '14:30:00', end: '15:30:00' }, { start: '15:30:00', end: '16:30:00' }
];

const seedECE = async () => {
    try {
        console.log("Adding ECE Faculty Data...");

        // We are NOT clearing existing data, just adding ECE faculty. 
        // If you want to clear ONLY ECE faculty first to avoid duplicates, uncomment below:
        // await pool.query("DELETE FROM faculty WHERE department = 'Electronics and Communication'");

        const facultyIds = [];

        for (const faculty of eceFacultyData) {
            console.log(`Adding ${faculty.name}...`);

            // Random room generation for demo purposes
            const floor = Math.random() > 0.5 ? "2nd Floor" : "3rd Floor";
            const room = `EC-${Math.floor(Math.random() * 100) + 200}`;

            const res = await pool.query(
                'INSERT INTO faculty (name, department, room_number, floor_number, aliases, specialization) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
                [faculty.name, 'Electronics and Communication', room, floor, [faculty.short], faculty.spec]
            );
            facultyIds.push({ id: res.rows[0].id, name: faculty.name });
        }

        console.log("Generating Mock Timetables for ECE Faculty...");
        for (const f of facultyIds) {
            for (const day of days) {
                let classesToday = 0;
                for (const slot of timeSlots) {
                    // Randomly assign classes
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

        console.log("ECE Data Seeding complete! 📡");
        process.exit(0);
    } catch (err) {
        console.error("Seeding failed full error:", err);
        process.exit(1);
    }
};

seedECE();
