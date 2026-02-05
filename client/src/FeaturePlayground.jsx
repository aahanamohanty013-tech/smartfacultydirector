import React, { useState } from 'react';
import { API_URL } from './config';

const FeaturePlayground = () => {
    const [logs, setLogs] = useState([]);

    const log = (msg) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

    // 1. Office Hours
    const [studentName, setStudentName] = useState('');
    const [urgency, setUrgency] = useState(2);
    const [nextStudent, setNextStudent] = useState(null);

    const handleEnqueue = async () => {
        const res = await fetch(`${API_URL}/api/office-hours/enqueue`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentName, urgency })
        });
        const data = await res.json();
        log(`Enqueued: ${studentName} (Urgency: ${urgency})`);
    };

    const handleNext = async () => {
        const res = await fetch(`${API_URL}/api/office-hours/next`);
        const data = await res.json();
        setNextStudent(data.studentName || 'None');
        log(`Next Student: ${data.studentName || 'Queue Empty'}`);
    };

    // 2. Meeting Scheduler
    const [facultyIds, setFacultyIds] = useState('1,2');
    const [slots, setSlots] = useState([]);

    const handleFindSlots = async () => {
        const ids = facultyIds.split(',').map(n => parseInt(n.trim()));
        const res = await fetch(`${API_URL}/api/meeting/find-slots`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ facultyIds: ids, day_of_week: 'Monday' }) // Default Monday
        });
        const data = await res.json();
        setSlots(data);
        log(`Found ${data.length} slots for faculty ${ids.join(',')}`);
    };

    // 3. Timetable Optimizer
    const [optimizeResult, setOptimizeResult] = useState(null);
    const handleOptimize = async () => {
        // Mock courses
        const courses = [
            { id: 101, name: 'CS101', facultyId: 1, hours: 1 },
            { id: 102, name: 'CS102', facultyId: 2, hours: 1 }
        ];
        log(`Optimizing for: ${courses.map(c => c.name).join(', ')}...`);
        const res = await fetch(`${API_URL}/api/timetable/optimize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courses })
        });
        const data = await res.json();
        if (data.error) log(`Optimization Failed: ${data.error}`);
        else {
            setOptimizeResult(data);
            log(`Optimization Success! Scheduled ${data.length} classes.`);
        }
    };

    // 4. Smart Notifications
    const [notifMsg, setNotifMsg] = useState('');
    const handleScheduleNotif = async () => {
        const dueTime = Date.now() + 5000; // 5 seconds from now
        const res = await fetch(`${API_URL}/api/notifications/schedule`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: notifMsg || 'Test Notification', dueTime })
        });
        log(`Scheduled notification for 5s from now.`);
    };

    const handleCheckNotif = async () => {
        const res = await fetch(`${API_URL}/api/notifications/due`);
        const data = await res.json();
        if (data.length > 0) {
            data.forEach(n => log(`🔔 NOTIFICATION: ${n.message}`));
        } else {
            log('No notifications due yet.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-10 font-sans">
            <h1 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
                🛠️ Smart Feature Playground
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Office Hours */}
                <div className="bg-white/10 p-6 rounded-xl border border-white/10">
                    <h2 className="text-xl font-bold mb-4 text-pink-400">1. Smart Office Hours (Priority Queue)</h2>
                    <div className="space-y-3">
                        <input className="bg-gray-800 border border-gray-700 p-2 rounded w-full text-white"
                            placeholder="Student Name" value={studentName} onChange={e => setStudentName(e.target.value)} />
                        <select className="bg-gray-800 border border-gray-700 p-2 rounded w-full text-white"
                            value={urgency} onChange={e => setUrgency(e.target.value)}>
                            <option value="1">High Priority (1)</option>
                            <option value="2">Medium Priority (2)</option>
                            <option value="3">Low Priority (3)</option>
                        </select>
                        <div className="flex gap-2">
                            <button onClick={handleEnqueue} className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-500">Enqueue</button>
                            <button onClick={handleNext} className="bg-green-600 px-4 py-2 rounded hover:bg-green-500">Call Next</button>
                        </div>
                        {nextStudent && <div className="mt-2 text-yellow-300">Next: {nextStudent}</div>}
                    </div>
                </div>

                {/* Meeting Scheduler */}
                <div className="bg-white/10 p-6 rounded-xl border border-white/10">
                    <h2 className="text-xl font-bold mb-4 text-purple-400">2. Meeting Scheduler (Interval Trees)</h2>
                    <div className="space-y-3">
                        <input className="bg-gray-800 border border-gray-700 p-2 rounded w-full text-white"
                            placeholder="Faculty IDs (comma sep)" value={facultyIds} onChange={e => setFacultyIds(e.target.value)} />
                        <button onClick={handleFindSlots} className="bg-purple-600 px-4 py-2 rounded hover:bg-purple-500">Find Slots (Monday)</button>
                        {slots.length > 0 && (
                            <div className="mt-2 text-sm text-gray-300">
                                {slots.map((s, i) => <div key={i}>{s.start} - {s.end}</div>)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Timetable Optimizer */}
                <div className="bg-white/10 p-6 rounded-xl border border-white/10">
                    <h2 className="text-xl font-bold mb-4 text-orange-400">3. Timetable Optimizer</h2>
                    <p className="text-sm text-gray-400 mb-2">Tries to schedule CS101 & CS102 for Faculty 1 & 2</p>
                    <button onClick={handleOptimize} className="bg-orange-600 px-4 py-2 rounded hover:bg-orange-500">Run Optimization</button>
                    {optimizeResult && (
                        <div className="mt-2 text-sm text-gray-300">
                            {optimizeResult.map((c, i) => <div key={i}>{c.name}: {c.day} {c.time}</div>)}
                        </div>
                    )}
                </div>

                {/* Notifications */}
                <div className="bg-white/10 p-6 rounded-xl border border-white/10">
                    <h2 className="text-xl font-bold mb-4 text-red-400">4. Smart Notifications</h2>
                    <div className="space-y-3">
                        <input className="bg-gray-800 border border-gray-700 p-2 rounded w-full text-white"
                            placeholder="Message" value={notifMsg} onChange={e => setNotifMsg(e.target.value)} />
                        <button onClick={handleScheduleNotif} className="bg-red-600 px-4 py-2 rounded hover:bg-red-500">Schedule (in 5s)</button>
                        <button onClick={handleCheckNotif} className="bg-gray-600 px-4 py-2 rounded hover:bg-gray-500">Check Due</button>
                    </div>
                </div>

            </div>

            {/* Console Output */}
            <div className="mt-10 bg-black p-4 rounded-xl border border-gray-800 font-mono text-sm h-64 overflow-y-auto">
                <div className="text-gray-500 mb-2">System Logs:</div>
                {logs.map((log, i) => <div key={i} className="mb-1 border-b border-gray-900 pb-1">{log}</div>)}
            </div>
        </div>
    );
};

export default FeaturePlayground;
