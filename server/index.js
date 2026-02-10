/* server/index.js */
const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const trie = require('./trie');

const app = express();
const PORT = process.env.PORT || 5001;

const priorityQueue = require('./lib/PriorityQueue');
const IntervalTree = require('./lib/IntervalTree');
const graph = require('./lib/Graph');
const scheduler = require('./lib/Scheduler');
const SegmentTree = require('./lib/SegmentTree');
const notificationManager = require('./lib/NotificationManager');

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
    ssl: (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require')) ? { rejectUnauthorized: false } : false,
});

// Initialize Data Structures (Trie, Graph)
const initializeData = async () => {
    try {
        console.log('Initializing Data Structures...');
        trie.clear();
        const res = await pool.query('SELECT * FROM faculty');
        const facultyList = res.rows;

        // Build Trie
        facultyList.forEach(faculty => {
            trie.insert(faculty.name, faculty);
            if (faculty.aliases && Array.isArray(faculty.aliases)) {
                faculty.aliases.forEach(alias => trie.insert(alias, faculty));
            }
            const parts = faculty.name.split(' ');
            if (parts.length > 1) {
                parts.forEach(part => trie.insert(part, faculty));
            }
            if (faculty.specialization) {
                const specParts = faculty.specialization.split(/[\s,]+/);
                specParts.forEach(sp => trie.insert(sp, faculty));
            }
        });

        // Build Graph
        graph.buildFromFaculty(facultyList);

        console.log(`Initialized: Trie (${facultyList.length} nodes), Graph.`);
    } catch (err) {
        console.error('Error initializing data:', err.message);
    }
};

// --- Helper Logic: Availability (Fixed for IST Timezone) ---
const calculateAvailability = (timetables, isOnLeave = false, isOnExamDuty = false, examDutyTime = '') => {
    // 0. CHECK "ON LEAVE" STATUS
    if (isOnLeave) {
        return {
            status: 'On Leave',
            currentDetails: 'Faculty is currently on leave.',
            bestVisitingTime: 'On Leave'
        };
    }

    // 0.5 CHECK "EXAM DUTY" STATUS
    if (isOnExamDuty) {
        return {
            status: 'Exam Duty',
            currentDetails: `Faculty is on exam duty at: ${examDutyTime}`,
            bestVisitingTime: 'After Exam Duty'
        };
    }

    const now = new Date();

    // Force Timezone to India Standard Time (IST)
    const timeOptions = { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit' };
    const dayOptions = { timeZone: 'Asia/Kolkata', weekday: 'long' };

    // Format: "HH:MM" (e.g., "09:30")
    const currentTimeStr = new Intl.DateTimeFormat('en-GB', timeOptions).format(now);
    // Format: "Monday"
    const currentDay = new Intl.DateTimeFormat('en-US', dayOptions).format(now);

    // 1. Check if currently in class
    const currentClass = timetables.find(t => {
        const start = t.start_time.slice(0, 5);
        const end = t.end_time.slice(0, 5);
        return t.day_of_week === currentDay &&
            currentTimeStr >= start &&
            currentTimeStr < end;
    });

    let status = 'Likely Available';
    let currentDetails = null;

    if (currentClass) {
        status = 'In Class';
        currentDetails = `Class: ${currentClass.course_name} (${currentClass.start_time.slice(0, 5)} - ${currentClass.end_time.slice(0, 5)})`;
    }

    // 2. Find Best Visiting Time (Next Free Slot)
    let bestVisitingTime = "Unknown";

    const todaysClasses = timetables
        .filter(t => t.day_of_week === currentDay)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

    let searchStartTime = currentTimeStr;
    if (status === 'In Class') {
        searchStartTime = currentClass.end_time.slice(0, 5);
    }

    const nextClass = todaysClasses.find(t => t.start_time.slice(0, 5) > searchStartTime);

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
            const currentHour = parseInt(currentTimeStr.split(':')[0]);
            if (currentHour >= 17) {
                bestVisitingTime = "Likely left for the day";
            } else {
                bestVisitingTime = "Now (Free for rest of day)";
            }
        }
    }

    return { status, currentDetails, bestVisitingTime };
};

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

// Search API
app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    try {
        if (!trie.root || Object.keys(trie.root.children).length === 0) {
            await initializeData();
        }
        let results = trie.search(q);
        if (results.length === 0) {
            results = trie.fuzzySearch(q);
        }
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Get Faculty Details
app.get('/api/faculty/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const facultyRes = await pool.query('SELECT * FROM faculty WHERE id = $1', [id]);
        if (facultyRes.rows.length === 0) return res.status(404).json({ error: 'Faculty not found' });
        const faculty = facultyRes.rows[0];

        const timetableRes = await pool.query('SELECT * FROM timetables WHERE faculty_id = $1 ORDER BY day_of_week, start_time', [id]);
        const timetables = timetableRes.rows;

        const availability = calculateAvailability(timetables, faculty.is_on_leave, faculty.is_on_exam_duty, faculty.exam_duty_time);
        res.json({ ...faculty, ...availability, timetables });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update Faculty
app.put('/api/faculty/:id', async (req, res) => {
    const { id } = req.params;
    const { room_number, floor_number, specialization, department, is_on_leave, is_on_exam_duty, exam_duty_time } = req.body;
    try {
        const result = await pool.query(
            'UPDATE faculty SET room_number = COALESCE($1, room_number), floor_number = COALESCE($2, floor_number), specialization = COALESCE($3, specialization), department = COALESCE($4, department), is_on_leave = COALESCE($5, is_on_leave), is_on_exam_duty = COALESCE($6, is_on_exam_duty), exam_duty_time = COALESCE($7, exam_duty_time) WHERE id = $8 RETURNING *',
            [room_number, floor_number, specialization, department, is_on_leave, is_on_exam_duty, exam_duty_time, id]
        );
        initializeData();
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Admin: Add Faculty
app.post('/api/faculty', async (req, res) => {
    const { name, department, room_number, floor_number, aliases } = req.body;
    try {
        const insertRes = await pool.query(
            'INSERT INTO faculty (name, department, room_number, floor_number, aliases) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, department, room_number, floor_number, aliases]
        );
        initializeData();
        res.json(insertRes.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add faculty' });
    }
});

// Auth: Signup
app.post('/api/signup', async (req, res) => {
    const { name, shortform, password, specialization, email } = req.body;
    try {
        // Domain Check
        if (!email.endsWith('@rvce.edu.in')) {
            return res.status(400).json({ error: 'invalid email id only for rvce faculty' });
        }

        // Check if email already exists
        const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Check if shortform (alias) already exists
        const aliasCheck = await pool.query('SELECT * FROM faculty WHERE $1 = ANY(aliases)', [shortform]);
        if (aliasCheck.rows.length > 0) {
            return res.status(400).json({ error: `Shortform '${shortform}' is already taken. Please choose another one.` });
        }

        const facultyRes = await pool.query(
            'INSERT INTO faculty (name, department, room_number, floor_number, aliases, specialization) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [name, 'Computer Science', 'TBD', 'TBD', [shortform], specialization || '']
        );
        const facultyId = facultyRes.rows[0].id;

        const verificationToken = crypto.randomBytes(32).toString('hex');

        await pool.query(
            'INSERT INTO users (username, password_hash, faculty_id, email, is_verified, verification_token) VALUES ($1, $2, $3, $4, $5, $6)',
            [name, password, facultyId, email, false, verificationToken] // is_verified = false
        );

        const verifyLink = `http://${req.headers.host}/api/verify/${verificationToken}`;

        // --- Email Logic ---
        if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) {
            const nodemailer = require('nodemailer');
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_APP_PASSWORD
                }
            });

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Smart Faculty Directory - Verify your Email',
                html: `
                    <h2>Welcome to Smart Faculty Directory!</h2>
                    <p>Please click the link below to verify your account:</p>
                    <a href="${verifyLink}" style="padding: 10px 20px; background-color: #7c2ae8; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
                    <p>Or copy this link: ${verifyLink}</p>
                `
            };

            await transporter.sendMail(mailOptions).then(info => {
                console.log('Email sent: ' + info.response);
            }).catch(error => {
                console.error('Error sending email:', error);
            });
        }

        console.log(`\n📧 [MOCK EMAIL] Verification Link for ${email}: ${verifyLink}\n`);

        initializeData();
        res.json({ success: true, message: 'Account created. Please check your email to verify.', facultyId });
    } catch (err) {
        console.error(err);
        if (err.constraint === 'users_username_key') {
            return res.status(500).json({ error: 'Username already taken.' });
        }
        res.status(500).json({ error: 'Signup failed.' });
    }
});

// Auth: Verify Email
app.get('/api/verify/:token', async (req, res) => {
    const { token } = req.params;
    try {
        const result = await pool.query(
            'UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE verification_token = $1 RETURNING *',
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).send('<h1>Invalid or Expired Verification Token</h1>');
        }

        // Redirect to login page on frontend
        // Assuming frontend is on port 5173 (dev) or same host (prod)
        // Ideally, use config or env for frontend URL
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.send(`
            <h1>Email Verified!</h1>
            <p>You can now <a href="${frontendUrl}/login">login here</a>.</p>
            <script>setTimeout(() => window.location.href = "${frontendUrl}/login", 3000)</script>
        `);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Auth: Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = result.rows[0];
        if (user.password_hash !== password) return res.status(401).json({ error: 'Invalid credentials' });

        if (!user.is_verified) {
            return res.status(403).json({ error: 'Please verify your email address before logging in.' });
        }

        res.json({ success: true, username: user.username, facultyId: user.faculty_id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Timetable
app.post('/api/timetable', async (req, res) => {
    const { faculty_id, day_of_week, start_time, end_time, course_name } = req.body;
    try {
        // --- Conflict Detection using Segment Tree ---
        const existingRes = await pool.query(
            'SELECT * FROM timetables WHERE faculty_id = $1 AND day_of_week = $2',
            [faculty_id, day_of_week]
        );
        const existing = existingRes.rows;

        // Map time to minutes (00:00 -> 24:00) = 0 -> 1440
        const toMinutes = (timeStr) => {
            const [h, m] = timeStr.split(':').map(Number);
            return h * 60 + m;
        };

        const segmentTree = new SegmentTree(1440); // 24 hours * 60 mins

        // Load existing
        existing.forEach(t => {
            const start = toMinutes(t.start_time);
            const end = toMinutes(t.end_time);
            segmentTree.update(start, end - 1, 1); // [start, end-1] to avoid abutment conflict? Or pure overlap.
        });

        const newStart = toMinutes(start_time);
        const newEnd = toMinutes(end_time);

        // Check range max
        const maxVal = segmentTree.query(newStart, newEnd - 1);
        if (maxVal > 0) {
            return res.status(409).json({ error: 'Conflict! Time slot overlaps with existing class.' });
        }

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

// --- Office Hours (Priority Queue) ---
app.post('/api/office-hours/enqueue', (req, res) => {
    const { studentName, urgency } = req.body; // urgency: 1=High, 2=Medium, 3=Low
    if (!studentName || !urgency) return res.status(400).json({ error: 'Missing fields' });

    const node = priorityQueue.enqueue(studentName, parseInt(urgency));
    res.json({ success: true, message: 'Added to queue', position: node });
});

app.get('/api/office-hours/next', (req, res) => {
    const nextStudent = priorityQueue.dequeue();
    if (!nextStudent) return res.json({ message: 'Queue is empty' });
    res.json(nextStudent);
});

app.get('/api/office-hours/peek', (req, res) => {
    const nextStudent = priorityQueue.peek();
    if (!nextStudent) return res.json({ message: 'Queue is empty' });
    res.json(nextStudent);
});

// --- Meeting Scheduler (Interval Trees) ---
app.post('/api/meeting/find-slots', async (req, res) => {
    const { facultyIds, date } = req.body; // date in "YYYY-MM-DD" or just day of week
    // For simplicity, assume "Monday" etc. passed or derived. 
    // Let's expect 'day_of_week' for now.
    const { day_of_week } = req.body;

    if (!facultyIds || !Array.isArray(facultyIds) || !day_of_week) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    try {
        // Fetch timetables for all faculty on that day
        const result = await pool.query(
            'SELECT * FROM timetables WHERE faculty_id = ANY($1) AND day_of_week = $2',
            [facultyIds, day_of_week]
        );
        const timetables = result.rows;

        // Build Interval Tree for each faculty
        // Actually, we can just merge all unavailable times for the group logic.
        // Or find intersection of free times.
        // Let's do: Find free slots for each, then find intersection.

        // Define working hours (e.g., 09:00 to 17:00)
        // Convert times to minutes for easier math? Or keep string "HH:MM" comparison
        // "HH:MM" comparison works lexicographically. 
        const WORK_START = "09:00";
        const WORK_END = "17:00";

        const facultyGaps = [];

        for (const fId of facultyIds) {
            const tree = new IntervalTree();
            const fTimetable = timetables.filter(t => t.faculty_id === fId);
            fTimetable.forEach(t => {
                tree.insert(t.start_time.slice(0, 5), t.end_time.slice(0, 5));
            });
            const gaps = tree.findGaps(WORK_START, WORK_END);
            facultyGaps.push(gaps);
        }

        // Find intersection of all gap lists
        if (facultyGaps.length === 0) return res.json([]);

        let commonSlots = facultyGaps[0];

        for (let i = 1; i < facultyGaps.length; i++) {
            const currentGaps = facultyGaps[i];
            const nextCommon = [];

            // Intersect commonSlots with currentGaps
            let p1 = 0, p2 = 0;
            while (p1 < commonSlots.length && p2 < currentGaps.length) {
                const s1 = commonSlots[p1];
                const s2 = currentGaps[p2];

                // Max of starts, Min of ends
                const start = s1.start > s2.start ? s1.start : s2.start;
                const end = s1.end < s2.end ? s1.end : s2.end;

                if (start < end) {
                    nextCommon.push({ start, end });
                }

                if (s1.end < s2.end) {
                    p1++;
                } else {
                    p2++;
                }
            }
            commonSlots = nextCommon;
        }

        res.json(commonSlots);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error finding slots' });
    }
});

// --- Faculty Recommendations (Graph) ---
app.get('/api/recommendations/:facultyId', async (req, res) => {
    const { facultyId } = req.params;
    try {
        const similarIds = graph.recommend(parseInt(facultyId));
        if (similarIds.length === 0) return res.json([]);

        const result = await pool.query('SELECT * FROM faculty WHERE id = ANY($1)', [similarIds]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error getting recommendations' });
    }
});

// --- Timetable Optimizer (Backtracking) ---
app.post('/api/timetable/optimize', async (req, res) => {
    // courses: [{ id: 1, name: 'CS101', facultyId: 5, hours: 2 }]
    const { courses } = req.body;
    if (!courses || !Array.isArray(courses)) return res.status(400).json({ error: 'Invalid courses' });

    try {
        // Fetch existing constraints
        const result = await pool.query('SELECT * FROM timetables');
        const existingTimetable = result.rows;

        // Simplify input: Split multi-hour courses into single hour chunks for the scheduler
        const expandedCourses = [];
        courses.forEach(c => {
            const hours = c.hours || 1;
            for (let i = 0; i < hours; i++) {
                expandedCourses.push({ ...c, chunkIndex: i });
            }
        });

        const optimizedSchedule = scheduler.optimize(expandedCourses, existingTimetable);

        if (!optimizedSchedule) {
            return res.status(409).json({ error: 'Conflict! Cannot schedule all courses.' });
        }

        res.json(optimizedSchedule);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Optimization failed' });
    }
});

// --- Smart Notifications (Heap-based) ---
app.post('/api/notifications/schedule', (req, res) => {
    const { message, dueTime } = req.body;
    if (!message || !dueTime) return res.status(400).json({ error: 'Missing fields' });

    notificationManager.schedule(message, dueTime);
    res.json({ success: true, message: 'Notification scheduled' });
});

app.get('/api/notifications/due', (req, res) => {
    const due = notificationManager.getDueNotifications();
    res.json(due);
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

// Start
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT} (Timezone: Asia/Kolkata)`);
        initializeData();
    });
} else {
    initializeData();
}

module.exports = app;
