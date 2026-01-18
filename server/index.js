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
        // There is a future class today.
        // If we are currently in class, the best time is AFTER this class UNTIL the next one.
        // If we are free, the best time is NOW UNTIL the next class.

        if (status === 'In Class') {
            bestVisitingTime = `After ${currentClass.end_time.slice(0, 5)} (Free until ${nextClass.start_time.slice(0, 5)})`;
        } else {
            bestVisitingTime = `Now (Free until ${nextClass.start_time.slice(0, 5)})`;
        }
    } else {
        // No more classes today after 'searchStartTime'
        if (status === 'In Class') {
            bestVisitingTime = `After ${currentClass.end_time.slice(0, 5)} (Free for rest of day)`;
        } else {
            bestVisitingTime = "Now (Free for rest of day)";
        }
    }

    // Fallback: If it's late (e.g. after 5pm) and we say "Now", it might be odd if they aren't on campus.
    // For this prototype, we stick to schedule logic.

    return { status, currentDetails, bestVisitingTime };
};

// --- API Routes ---

// List all faculty (for Admin)
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
// Search API (Trie)
app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);

    try {
        // Serverless Cold Start Protection:
        // If Trie is empty (e.g. server just woke up), re-fill it from DB.
        if (!trie.root || Object.keys(trie.root.children).length === 0) {
            console.log('Trie is empty, re-initializing...');
            await initializeTrie();
        }

        const results = trie.search(q);
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Search failed' });
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

// Update Faculty Details (for Dashboard)
app.put('/api/faculty/:id', async (req, res) => {
    const { id } = req.params;
    const { room_number, floor_number, specialization, department } = req.body;
    try {
        const result = await pool.query(
            'UPDATE faculty SET room_number = COALESCE($1, room_number), floor_number = COALESCE($2, floor_number), specialization = COALESCE($3, specialization), department = COALESCE($4, department) WHERE id = $5 RETURNING *',
            [room_number, floor_number, specialization, department, id]
        );
        initializeTrie(); // Re-index for search
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
        // Update Trie
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
        // 1. Create Faculty Profile
        // Defaulting to CS department for now as per requirement context
        const facultyRes = await pool.query(
            'INSERT INTO faculty (name, department, room_number, floor_number, aliases, specialization) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [name, 'Computer Science', 'TBD', 'TBD', [shortform], specialization || '']
        );
        const facultyId = facultyRes.rows[0].id;

        // 2. Create User Account
        // Using Full Name as username
        await pool.query(
            'INSERT INTO users (username, password_hash, faculty_id) VALUES ($1, $2, $3)',
            [name, password, facultyId]
        );

        // Update Trie
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
        console.log(`[LOGIN ATTEMPT] Username: ${username}, Password: ${password}`);
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        if (result.rows.length === 0) {
            console.log(`[LOGIN FAIL] User not found: ${username}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        console.log(`[LOGIN FOUND] User: ${user.username}, Stored Hash: ${user.password_hash}`);

        // Plain text password check for MVP
        if (user.password_hash !== password) {
            console.log(`[LOGIN FAIL] Password Mismatch. Provided: ${password}, Stored: ${user.password_hash}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log(`[LOGIN SUCCESS] User: ${username}`);
        res.json({ success: true, username: user.username, facultyId: user.faculty_id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Admin: Add Timetable
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
