/* server/index.js - COMPLETE FILE */
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const trie = require('./trie');

const app = express();
const PORT = process.env.PORT || 5000;

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
            trie.insert(faculty.name, faculty);
            if (faculty.aliases && Array.isArray(faculty.aliases)) {
                faculty.aliases.forEach(alias => {
                    trie.insert(alias, faculty);
                });
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

    let bestVisitingTime = "Unknown";
    const todaysClasses = timetables
        .filter(t => t.day_of_week === currentDay)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

    let searchStartTime = currentTimeStr;
    if (status === 'In Class') {
        searchStartTime = currentClass.end_time;
    }

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

// --- API Routes ---
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
        // Serverless Cold Start Protection (FIXED)
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

// Start Server
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        initializeTrie();
    });
} else {
    // Vercel only: just init trie
    initializeTrie();
}

module.exports = app;
