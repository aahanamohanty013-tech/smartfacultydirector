const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const trie = require('./trie');
const { kmpSearch } = require('./kmp');
const { scheduleAppointments, getRecommendedQuickMeetSlots, timeToMinutes } = require('./scheduler');
const { processQueue } = require('./priorityQueue');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'smart_faculty',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

// Initialize Trie with data from DB
const initializeTrie = async () => {
    try {
        console.log('Initializing Trie...');
        trie.clear();
        const res = await pool.query('SELECT * FROM faculty');
        const facultyList = res.rows;

        facultyList.forEach(faculty => {
            // Insert full name
            trie.insert(faculty.name, faculty);

            // Insert aliases if any
            if (faculty.aliases && Array.isArray(faculty.aliases)) {
                faculty.aliases.forEach(alias => {
                    trie.insert(alias, faculty);
                });
            }

            // Insert by parts of name (e.g. "Kumar" for "Prashant Kumar")
            const parts = faculty.name.split(' ');
            if (parts.length > 1) {
                parts.forEach(part => trie.insert(part, faculty));
            }

            // Insert matching specialization keywords
            if (faculty.specialization) {
                const specParts = faculty.specialization.split(/[\s,]+/);
                specParts.forEach(sp => trie.insert(sp, faculty));
            }
        });
        console.log(`Trie initialized with ${facultyList.length} faculty members.`);
    } catch (err) {
        console.error('Error initializing Trie - Database might be down or empty:', err.message);
    }
};

// --- Helper Logic: Availability ---
const calculateAvailability = (timetables) => {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayIndex = now.getDay();
    const currentDay = days[currentDayIndex];
    const currentTimeStr = now.toTimeString().split(' ')[0]; // "HH:MM:SS"

    // 1. Check if currently in class
    const currentClass = timetables.find(t =>
        t.day_of_week === currentDay &&
        currentTimeStr >= t.start_time &&
        currentTimeStr <= t.end_time
    );

    let status = 'Likely Available';
    let currentDetails = null;

    if (currentClass) {
        status = 'In Class';
        currentDetails = `Class: ${currentClass.course_name} (${currentClass.start_time.slice(0, 5)} - ${currentClass.end_time.slice(0, 5)})`;
    }

    // 2. Find Best Visiting Time (Next Free Slot)
    let bestVisitingTime = "Unknown"; // Default

    // Get today's classes sorted by time
    const todaysClasses = timetables
        .filter(t => t.day_of_week === currentDay)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

    // Determine where to start searching for a gap
    let searchStartTime = currentTimeStr;
    if (status === 'In Class') {
        searchStartTime = currentClass.end_time;
    }

    // Find the first class that starts AFTER our search start time
    const nextClass = todaysClasses.find(t => t.start_time > searchStartTime);

    if (nextClass) {
        if (status === 'In Class') {
            bestVisitingTime = `After ${currentClass.end_time.slice(0, 5)} (Free until ${nextClass.start_time.slice(0, 5)})`;
        } else {
            bestVisitingTime = `Now (Free until ${nextClass.start_time.slice(0, 5)})`;
        }
    } else {
        if (status === 'In Class') {
            bestVisitingTime = `After ${currentClass.end_time.slice(0, 5)} (Free for rest of day)`;
        } else {
            bestVisitingTime = "Now (Free for rest of day)";
        }
    }

    return { status, currentDetails, bestVisitingTime };
};

// --- Helper Logic: Student Graduation Checker ---
function isStudentGraduated(email) {
    if (!email) return false;
    const username = email.split('@')[0];
    const match = username.match(/\d+/);
    if (!match) return false; // Allowed if no number sequence is found

    const yearCode = parseInt(match[0], 10);
    const startYear = yearCode < 100 ? 2000 + yearCode : yearCode;
    const gradYear = startYear + 4;

    const currentLocalTime = new Date();
    const gradDate = new Date(gradYear, 8, 1); // September 1st of graduation year

    return currentLocalTime >= gradDate;
}

// --- API Routes ---

// List all faculty
app.get('/api/faculties', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM faculty ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Search API (Trie)
app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);

    try {
        if (!trie.root || Object.keys(trie.root.children).length === 0) {
            await initializeTrie();
        }
        
        // 1. Trie Search (Prefix matching)
        const trieResults = trie.search(q);

        // 2. Database Substring Search (Fallback/Symmetric checks)
        const dbRes = await pool.query(
            `SELECT * FROM faculty 
             WHERE name ILIKE $1 
                OR department ILIKE $1 
                OR specialization ILIKE $1 
                OR EXISTS (
                    SELECT 1 FROM unnest(aliases) a 
                    WHERE a ILIKE $1
                )`,
            [`%${q}%`]
        );
        const dbResults = dbRes.rows;

        // Merge results without duplicate IDs
        const mergedResults = [...trieResults];
        const seenIds = new Set(trieResults.map(f => f.id));

        dbResults.forEach(faculty => {
            if (!seenIds.has(faculty.id)) {
                mergedResults.push(faculty);
                seenIds.add(faculty.id);
            }
        });

        res.json(mergedResults);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Search API (KMP for Research interests and bio)
app.get('/api/search/kmp', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);

    try {
        const result = await pool.query('SELECT * FROM faculty ORDER BY name ASC');
        const facultyList = result.rows;

        // Filter using KMP algorithm
        const filtered = facultyList.filter(f => 
            kmpSearch(f.research_interests, q) || 
            kmpSearch(f.bio, q) ||
            kmpSearch(f.specialization, q) ||
            kmpSearch(f.department, q)
        );

        res.json(filtered);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'KMP Search failed' });
    }
});

// Get Faculty Details & Availability
app.get('/api/faculty/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Fetch Faculty Info
        const facultyRes = await pool.query('SELECT * FROM faculty WHERE id = $1', [id]);
        if (facultyRes.rows.length === 0) return res.status(404).json({ error: 'Faculty not found' });
        const faculty = facultyRes.rows[0];

        // Fetch Timetable
        const timetableRes = await pool.query('SELECT * FROM timetables WHERE faculty_id = $1 ORDER BY day_of_week, start_time', [id]);
        const timetables = timetableRes.rows;

        // Compute Availability
        const availability = calculateAvailability(timetables);

        res.json({ ...faculty, ...availability, timetables });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update Faculty Details
app.put('/api/faculty/:id', async (req, res) => {
    const { id } = req.params;
    const { room_number, floor_number, specialization, department, research_interests, bio } = req.body;
    try {
        const result = await pool.query(
            'UPDATE faculty SET room_number = COALESCE($1, room_number), floor_number = COALESCE($2, floor_number), specialization = COALESCE($3, specialization), department = COALESCE($4, department), research_interests = COALESCE($5, research_interests), bio = COALESCE($6, bio) WHERE id = $7 RETURNING *',
            [room_number, floor_number, specialization, department, research_interests, bio, id]
        );
        initializeTrie(); // Re-index
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Admin: Add Faculty
app.post('/api/faculty', async (req, res) => {
    const { name, department, room_number, floor_number, aliases, specialization, research_interests, bio } = req.body;
    try {
        const insertRes = await pool.query(
            'INSERT INTO faculty (name, department, room_number, floor_number, aliases, specialization, research_interests, bio) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [name, department, room_number, floor_number, aliases, specialization, research_interests, bio]
        );
        initializeTrie();
        res.json(insertRes.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add faculty' });
    }
});

// --- Auth Routes: Faculty ---
app.post('/api/signup', async (req, res) => {
    const { name, email, shortform, password, specialization } = req.body;

    // Enforce Domain Check
    if (!email || !email.endsWith('@rvce.edu.in')) {
        return res.status(400).json({ error: 'Only @rvce.edu.in email domain is allowed' });
    }

    try {
        const facultyRes = await pool.query(
            'INSERT INTO faculty (name, department, room_number, floor_number, aliases, specialization) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [name, 'Computer Science', 'TBD', 'TBD', [shortform], specialization || '']
        );
        const facultyId = facultyRes.rows[0].id;

        await pool.query(
            'INSERT INTO users (username, email, password_hash, faculty_id) VALUES ($1, $2, $3, $4)',
            [name, email, password, facultyId]
        );

        initializeTrie();
        res.json({ success: true, message: 'Account created', facultyId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Signup failed. Email or Shortform might be taken.' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    // Enforce Domain Check
    if (!email || !email.endsWith('@rvce.edu.in')) {
        return res.status(400).json({ error: 'Only @rvce.edu.in email domain is allowed' });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        if (user.password_hash !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.json({ success: true, username: user.username, email: user.email, facultyId: user.faculty_id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// --- Auth Routes: Student ---
app.post('/api/student/signup', async (req, res) => {
    const { name, email, password } = req.body;

    // 1. Enforce Domain Check
    if (!email || !email.endsWith('@rvce.edu.in')) {
        return res.status(400).json({ error: 'Only @rvce.edu.in email domain is allowed' });
    }

    // 2. Graduation Year Check
    if (isStudentGraduated(email)) {
        return res.status(400).json({ error: 'Registration blocked. Student account is expired/graduated.' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO students (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
            [name, email, password]
        );
        res.json({ success: true, student: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Signup failed. Email might already be registered.' });
    }
});

app.post('/api/student/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM students WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const student = result.rows[0];
        if (student.password_hash !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Graduation Year Check on login
        if (isStudentGraduated(student.email)) {
            return res.status(400).json({ error: 'Login blocked. Student account is expired/graduated.' });
        }

        res.json({ success: true, id: student.id, name: student.name, email: student.email });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// --- Appointment Booking Routes ---

// Create an Appointment Request
app.post('/api/faculty/:id/appointments', async (req, res) => {
    const facultyId = req.params.id;
    const { student_id, reason, day_of_week, start_time, end_time } = req.body;

    // 1. Fetch Student for email validation
    try {
        const studentRes = await pool.query('SELECT * FROM students WHERE id = $1', [student_id]);
        if (studentRes.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }
        const student = studentRes.rows[0];

        // 2. Graduation Year Check
        if (isStudentGraduated(student.email)) {
            return res.status(400).json({ error: 'Scheduling blocked. Student account is expired/graduated.' });
        }

        // 3. Weekday Constraint Check
        const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        if (!weekdays.includes(day_of_week)) {
            return res.status(400).json({ error: 'Appointments can only be scheduled on weekdays (Monday - Friday).' });
        }

        // 4. Timing Constraints: Between 9:00 AM and 4:30 PM (inclusive)
        const requestStartMins = timeToMinutes(start_time);
        const requestEndMins = timeToMinutes(end_time);
        const startBound = timeToMinutes('09:00');
        const endBound = timeToMinutes('16:30');

        if (requestStartMins < startBound || requestEndMins > endBound || requestStartMins >= requestEndMins) {
            return res.status(400).json({ error: 'Appointments must be scheduled between 9:00 AM and 4:30 PM.' });
        }

        // Save Appointment Request as Pending
        const insertRes = await pool.query(
            'INSERT INTO appointments (faculty_id, student_id, reason, day_of_week, start_time, end_time) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [facultyId, student_id, reason, day_of_week, start_time, end_time]
        );

        res.json(insertRes.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create appointment request' });
    }
});

// Get Faculty Appointments & Suggested Optimal Schedule
app.get('/api/faculty/:id/appointments', async (req, res) => {
    const facultyId = req.params.id;
    try {
        // Fetch all appointments
        const appointmentsRes = await pool.query(
            `SELECT a.*, s.name as student_name, s.email as student_email 
             FROM appointments a 
             JOIN students s ON a.student_id = s.id 
             WHERE a.faculty_id = $1 
             ORDER BY a.day_of_week, a.start_time`,
            [facultyId]
        );
        const appointments = appointmentsRes.rows;

        // Group by day of week to solve Greedy Interval Scheduling per day
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const optimalSuggestions = [];

        for (const day of days) {
            const dayPending = appointments.filter(a => a.day_of_week === day && a.status === 'Pending');
            const dayScheduled = appointments.filter(a => a.day_of_week === day && a.status === 'Scheduled');

            const { scheduled } = scheduleAppointments(dayPending, dayScheduled);
            optimalSuggestions.push(...scheduled);
        }

        const optimalIds = new Set(optimalSuggestions.map(a => a.id));

        // Add 'suggested' boolean property to response rows
        const updatedAppointments = appointments.map(app => ({
            ...app,
            suggested: optimalIds.has(app.id) || app.status === 'Scheduled'
        }));

        res.json(updatedAppointments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
});

// Get Student Appointments
app.get('/api/student/:id/appointments', async (req, res) => {
    const studentId = req.params.id;
    try {
        const result = await pool.query(
            `SELECT a.*, f.name as faculty_name, f.room_number, f.floor_number 
             FROM appointments a 
             JOIN faculty f ON a.faculty_id = f.id 
             WHERE a.student_id = $1 
             ORDER BY a.day_of_week, a.start_time`,
            [studentId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Recommended Slots for Faculty
app.get('/api/faculty/:id/recommend-slots', async (req, res) => {
    const facultyId = req.params.id;
    const { day } = req.query;

    if (!day) return res.status(400).json({ error: 'Day parameter is required' });

    try {
        const timetableRes = await pool.query('SELECT * FROM timetables WHERE faculty_id = $1', [facultyId]);
        const appointmentsRes = await pool.query('SELECT * FROM appointments WHERE faculty_id = $1', [facultyId]);

        const slots = getRecommendedQuickMeetSlots(timetableRes.rows, appointmentsRes.rows, day);
        res.json(slots);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Run Greedy Interval Scheduling (Auto-approve optimal set)
app.post('/api/appointments/process-greedy', async (req, res) => {
    const { faculty_id, day_of_week } = req.body;
    try {
        // Fetch all appointments for day
        const appointmentsRes = await pool.query(
            'SELECT * FROM appointments WHERE faculty_id = $1 AND day_of_week = $2',
            [faculty_id, day_of_week]
        );
        const appointments = appointmentsRes.rows;

        const pending = appointments.filter(a => a.status === 'Pending');
        const scheduled = appointments.filter(a => a.status === 'Scheduled');

        const { scheduled: toSchedule, rejected: toReject } = scheduleAppointments(pending, scheduled);

        const facultyInfo = await pool.query('SELECT name FROM faculty WHERE id = $1', [faculty_id]);
        const facultyName = facultyInfo.rows[0].name;

        // Update to Scheduled
        for (const item of toSchedule) {
            await pool.query("UPDATE appointments SET status = 'Scheduled' WHERE id = $1", [item.id]);
        }

        // Update to Declined due to conflict and Notify Students
        for (const item of toReject) {
            await pool.query("UPDATE appointments SET status = 'Declined' WHERE id = $1", [item.id]);
            const msg = `Your appointment request with ${facultyName} on ${day_of_week} from ${item.start_time.slice(0, 5)} to ${item.end_time.slice(0, 5)} was rejected due to a scheduling conflict.`;
            await pool.query('INSERT INTO notifications (student_id, message) VALUES ($1, $2)', [item.student_id, msg]);
        }

        res.json({ success: true, scheduledCount: toSchedule.length, rejectedCount: toReject.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Scheduling process failed' });
    }
});

// Manually Approve Specific Request
app.post('/api/appointments/approve/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("UPDATE appointments SET status = 'Scheduled' WHERE id = $1", [id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to approve appointment' });
    }
});

// Manually Decline Specific Request
app.post('/api/appointments/decline/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const appointmentRes = await pool.query(
            `SELECT a.*, f.name as faculty_name 
             FROM appointments a 
             JOIN faculty f ON a.faculty_id = f.id 
             WHERE a.id = $1`,
            [id]
        );

        if (appointmentRes.rows.length > 0) {
            const app = appointmentRes.rows[0];
            await pool.query("UPDATE appointments SET status = 'Declined' WHERE id = $1", [id]);
            const msg = `Your appointment request with ${app.faculty_name} on ${app.day_of_week} from ${app.start_time.slice(0,5)} to ${app.end_time.slice(0,5)} has been declined.`;
            await pool.query('INSERT INTO notifications (student_id, message) VALUES ($1, $2)', [app.student_id, msg]);
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to decline appointment' });
    }
});

// --- Walk-in Virtual Queue Routes ---

// Student virtual check-in
app.post('/api/queue/checkin', async (req, res) => {
    const { faculty_id, student_id, urgency } = req.body;

    try {
        // Check if student has active queue entry
        const activeRes = await pool.query(
            "SELECT * FROM queue_entries WHERE student_id = $1 AND status IN ('Waiting', 'Serving')",
            [student_id]
        );
        if (activeRes.rows.length > 0) {
            return res.status(400).json({ error: 'You are already checked in or being served' });
        }

        // Insert new entry
        await pool.query(
            'INSERT INTO queue_entries (faculty_id, student_id, urgency) VALUES ($1, $2, $3)',
            [faculty_id, student_id, urgency]
        );

        // Fetch all current active entries to compute positions
        const listRes = await pool.query(
            "SELECT q.*, s.name as student_name FROM queue_entries q JOIN students s ON q.student_id = s.id WHERE q.faculty_id = $1 AND q.status IN ('Waiting', 'Serving')",
            [faculty_id]
        );

        const { sortedQueue } = processQueue(listRes.rows);
        const myNode = sortedQueue.find(node => node.student_id === student_id);

        res.json({
            success: true,
            position: sortedQueue.indexOf(myNode) + 1,
            estimatedWaitTime: myNode.wait_time_before
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to check-in to queue' });
    }
});

// Fetch Current Active Queue for Faculty
app.get('/api/faculty/:id/queue', async (req, res) => {
    const facultyId = req.params.id;

    try {
        const listRes = await pool.query(
            `SELECT q.*, s.name as student_name, s.email as student_email 
             FROM queue_entries q 
             JOIN students s ON q.student_id = s.id 
             WHERE q.faculty_id = $1 AND q.status IN ('Waiting', 'Serving')`,
            [facultyId]
        );

        const { sortedQueue, totalWaitTime, crowdLevel } = processQueue(listRes.rows);

        res.json({
            queue: sortedQueue,
            totalWaitTime,
            crowdLevel
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch queue' });
    }
});

// Update Queue Entry State: Serve
app.post('/api/queue/serve/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("UPDATE queue_entries SET status = 'Serving' WHERE id = $1", [id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to serve student' });
    }
});

// Update Queue Entry State: Complete
app.post('/api/queue/complete/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("UPDATE queue_entries SET status = 'Completed' WHERE id = $1", [id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to complete session' });
    }
});

// Get Student Notifications
app.get('/api/student/:id/notifications', async (req, res) => {
    const studentId = req.params.id;
    try {
        const result = await pool.query(
            'SELECT * FROM notifications WHERE student_id = $1 ORDER BY created_at DESC',
            [studentId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Mark student notifications as read
app.post('/api/student/notifications/read', async (req, res) => {
    const { student_id } = req.body;
    try {
        await pool.query('UPDATE notifications SET is_read = TRUE WHERE student_id = $1', [student_id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Timetable management routes ---
app.post('/api/timetable', async (req, res) => {
    const { faculty_id, day_of_week, start_time, end_time, course_name } = req.body;
    try {
        const insertRes = await pool.query(
            'INSERT INTO timetables (faculty_id, day_of_week, start_time, end_time, course_name) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [faculty_id, day_of_week, start_time, end_time, course_name]
        );
        res.json(insertRes.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add timetable' });
    }
});

app.delete('/api/timetable/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM timetables WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete timetable' });
    }
});

// Start Server
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        initializeTrie();
    });
} else {
    initializeTrie();
}

module.exports = app;
