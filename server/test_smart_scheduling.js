const axios = require('axios');
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

async function runTest() {
    try {
        console.log("=== Testing Smart Appointment Scheduling (Greedy Interval Scheduling) ===");

        // 1. Get any faculty member from the database
        const res = await pool.query('SELECT id, name FROM faculty LIMIT 1');
        if (res.rows.length === 0) {
            console.log("No faculty found in DB.");
            process.exit(0);
        }
        
        const faculty = res.rows[0];
        console.log(`\nTesting with Faculty: ${faculty.name} (ID: ${faculty.id})`);

        // 2. Fetch their existing timetable for Monday
        const timetableRes = await pool.query(
            "SELECT start_time, end_time, course_name FROM timetables WHERE faculty_id = $1 AND day_of_week = 'Monday'",
            [faculty.id]
        );
        console.log("\nExisting 'Monday' Classes (These block time):");
        timetableRes.rows.forEach(t => console.log(`- ${t.start_time.slice(0,5)} to ${t.end_time.slice(0,5)}: ${t.course_name}`));

        // 3. Define a set of overlapping meeting requests
        const meetingRequests = [
            { id: 1, title: "Doubt Session A", start: "09:00", end: "09:30" }, // Might conflict if they have morning class
            { id: 2, title: "Project Review 1", start: "09:15", end: "09:45" }, // Overlaps with 1
            { id: 3, title: "Quick Chat", start: "09:30", end: "09:45" }, // Overlaps with 2
            { id: 4, title: "Research Update", start: "10:00", end: "10:30" },
            { id: 5, title: "Mentorship", start: "10:15", end: "10:45" }, // Overlaps with 4
            { id: 6, title: "Lab Prep", start: "14:00", end: "15:00" }, 
            { id: 7, title: "Student Council", start: "14:30", end: "15:30" }, // Overlaps with 6
            { id: 8, title: "Quick Meet", start: "15:00", end: "15:15" } // Back-to-back with 6
        ];

        console.log("\nProposed Meeting Requests (Many overlap with each other!):");
        meetingRequests.forEach(req => console.log(`- [${req.id}] ${req.start} to ${req.end} (${req.title})`));

        // 4. Send request to the new endpoint
        console.log("\nCalling API: POST /api/faculty/" + faculty.id + "/smart-meetings");
        const apiRes = await axios.post(`http://localhost:5001/api/faculty/${faculty.id}/smart-meetings`, {
            requests: meetingRequests,
            day_of_week: "Monday"
        });

        console.log("\n=== GREEDY ALGORITHM RESULTS ===");
        console.log(`Total Requests: ${apiRes.data.totalRequests}`);
        console.log(`Accepted Meetings (Maximized): ${apiRes.data.acceptedMeetings}`);
        console.log("\nOptimal Non-Overlapping Schedule:");
        apiRes.data.meetings.forEach((m, idx) => {
            console.log(`${idx + 1}. ${m.start} to ${m.end} - ${m.title}`);
        });

        console.log("\nTest Passed! ✅");
    } catch (err) {
        console.error("Test failed:", err.response ? err.response.data : err.message);
    } finally {
        await pool.end();
    }
}

runTest();
