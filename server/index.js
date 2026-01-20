/* server/index.js */
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const trie = require('./trie');

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

// Initialize Trie
const initializeTrie = async () => {
    try {
        console.log('Initializing Trie...');
        trie.clear();
        const res = await pool.query('SELECT * FROM faculty');
        const facultyList = res.rows;

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
        console.log(`Trie initialized with ${facultyList.length} faculty members.`);
    } catch (err) {
        console.error('Error initializing Trie:', err.message);
    }
};

// --- Helper Logic: Availability (Fixed for IST Timezone) ---
const calculateAvailability = (timetables) => {
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
            await initializeTrie();
        }
        const results = trie.search(q);
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

        const availability = calculateAvailability(timetables);
        res.json({ ...faculty, ...availability, timetables });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update Faculty
app.put('/api/faculty/:id', async (req, res) => {
    const { id } = req.params;
    const { room_number, floor_number, specialization, department } = req.body;
    try {
        const result = await pool.query(
            'UPDATE faculty SET room_number = COALESCE($1, room_number), floor_number = COALESCE($2, floor_number), specialization = COALESCE($3, specialization), department = COALESCE($4, department) WHERE id = $5 RETURNING *',
            [room_number, floor_number, specialization, department, id]
        );
        initializeTrie();
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
        initializeTrie();
        res.json(insertRes.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add faculty' });
    }
});

// Auth: Signup
app.post('/api/signup', async (req, res) => {
    const { name, shortform, password, specialization } = req.body;
    try {
        const facultyRes = await pool.query(
            'INSERT INTO faculty (name, department, room_number, floor_number, aliases, specialization) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [name, 'Computer Science', 'TBD', 'TBD', [shortform], specialization || '']
        );
        const facultyId = facultyRes.rows[0].id;
        await pool.query(
            'INSERT INTO users (username, password_hash, faculty_id) VALUES ($1, $2, $3)',
            [name, password, facultyId]
        );
        initializeTrie();
        res.json({ success: true, message: 'Account created', facultyId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Signup failed. Username/Shortform might be taken.' });
    }
});

// Auth: Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = result.rows[0];
        if (user.password_hash !== password) return res.status(401).json({ error: 'Invalid credentials' });

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

// Start
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT} (Timezone: Asia/Kolkata)`);
        initializeTrie();
    });
} else {
    initializeTrie();
}

module.exports = app;
