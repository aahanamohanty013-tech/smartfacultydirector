/* server/index.js */
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const trie = require('./trie'); // Make sure trie.js exists in the same folder

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

// --- Helper Logic: Availability (FIXED) ---
const calculateAvailability = (timetables) => {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayIndex = now.getDay();
    const currentDay = days[currentDayIndex];

    // Normalize time to "HH:MM" for accurate comparison
    const toHHMM = (timeStr) => timeStr ? timeStr.slice(0, 5) : "00:00";
    const currentTimeStr = toHHMM(now.toTimeString().split(' ')[0]);

    // 1. Check if currently in class
    const currentClass = timetables.find(t => {
        const start = toHHMM(t.start_time);
        const end = toHHMM(t.end_time);
        return t.day_of_week === currentDay &&
            currentTimeStr >= start &&
            currentTimeStr < end; // Changed to strictly less than end time
    });

    let status = 'Likely Available';
    let currentDetails = null;

    if (currentClass) {
        status = 'In Class';
        currentDetails = `Class: ${currentClass.course_name} (${toHHMM(currentClass.start_time)} - ${toHHMM(currentClass.end_time)})`;
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
        searchStartTime = toHHMM(currentClass.end_time);
    }

    // Find the first class that starts AFTER our search start time
    const nextClass = todaysClasses.find(t => toHHMM(t.start_time) > searchStartTime);

    if (nextClass) {
        if (status === 'In Class') {
            bestVisitingTime = `After ${toHHMM(currentClass.end_time)} (Free until ${toHHMM(nextClass.start_time)})`;
        } else {
            bestVisitingTime = `Now (Free until ${toHHMM(nextClass.start_time)})`;
        }
    } else {
        // No more classes today
        if (status === 'In Class') {
            bestVisitingTime = `After ${toHHMM(currentClass.end_time)} (Free for rest of day)`;
        } else {
            // Check if it's late (e.g. past 5 PM)
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

        // Plain text password check for MVP
        if (user.password_hash !== password) {
            console.log(`[LOGIN FAIL] Password Mismatch.`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log(`[LOGIN SUCCESS] User: ${username}`);
        res.json({ success: true, username: user.username, facultyId: user.faculty_id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Add Timetable
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
