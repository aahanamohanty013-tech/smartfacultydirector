import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';

const Admin = () => {
    // Add Faculty State
    const [name, setName] = useState('');
    const [dept, setDept] = useState('');
    const [room, setRoom] = useState('');
    const [floor, setFloor] = useState('');

    // Add Timetable State
    const [facultyList, setFacultyList] = useState([]);
    const [selectedFaculty, setSelectedFaculty] = useState('');
    const [day, setDay] = useState('Monday');
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [course, setCourse] = useState('');

    useEffect(() => {
        fetchFacultyList();
    }, []);

    const fetchFacultyList = async () => {
        try {
            const res = await fetch(`${API_URL}/api/faculties`);
            const data = await res.json();
            setFacultyList(data);
        } catch (err) {
            console.error("Failed to fetch faculty list", err);
        }
    };

    const handleFacultySubmit = async (e) => {
        e.preventDefault();
        const res = await fetch(`${API_URL}/api/faculty`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name, department: dept, room_number: room, floor_number: floor, aliases: []
            })
        });
        if (res.ok) {
            alert('Faculty Added Successfully!');
            setName(''); setDept(''); setRoom(''); setFloor('');
            fetchFacultyList(); // Refresh list so new faculty appears in dropdown
        }
        else alert('Error adding faculty');
    };

    const handleTimetableSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFaculty || !day || !start || !end || !course) {
            alert('Please fill all fields');
            return;
        }

        const res = await fetch(`${API_URL}/api/timetable`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                faculty_id: selectedFaculty,
                day_of_week: day,
                start_time: start,
                end_time: end,
                course_name: course
            })
        });

        if (res.ok) {
            alert('Timetable Entry Added!');
            setCourse(''); setStart(''); setEnd('');
        }
        else alert('Error adding timetable');
    };

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-fade-in">
            <div className="flex justify-between items-center border-b pb-4 border-gray-200">
                <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* 1. Add Faculty Section */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
                    <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
                        <span className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-3 text-xl">👤</span>
                        Add New Faculty
                    </h2>
                    <form onSubmit={handleFacultySubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1">Full Name</label>
                            <input className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Dr. John Doe" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1">Department</label>
                            <input className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                value={dept} onChange={e => setDept(e.target.value)} required placeholder="e.g. Computer Science" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Room No.</label>
                                <input className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    value={room} onChange={e => setRoom(e.target.value)} placeholder="e.g. CS-101" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Floor</label>
                                <input className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    value={floor} onChange={e => setFloor(e.target.value)} placeholder="e.g. 1st Floor" />
                            </div>
                        </div>
                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-blue-200 mt-2">
                            Add Faculty
                        </button>
                    </form>
                </div>

                {/* 2. Manage Timetable Section */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-green-500"></div>
                    <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
                        <span className="bg-green-100 text-green-600 p-2 rounded-lg mr-3 text-xl">📅</span>
                        Manage Schedule
                    </h2>
                    <form onSubmit={handleTimetableSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1">Select Faculty</label>
                            <select
                                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition bg-white"
                                value={selectedFaculty}
                                onChange={e => setSelectedFaculty(e.target.value)}
                                required
                            >
                                <option value="">-- Choose Faculty --</option>
                                {facultyList.map(f => (
                                    <option key={f.id} value={f.id}>{f.name} ({f.department})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1">Day of Week</label>
                            <select
                                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition bg-white"
                                value={day}
                                onChange={e => setDay(e.target.value)}
                            >
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Start Time</label>
                                <input type="time" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                                    value={start} onChange={e => setStart(e.target.value)} required />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">End Time</label>
                                <input type="time" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                                    value={end} onChange={e => setEnd(e.target.value)} required />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1">Course / Activity</label>
                            <input className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                                value={course} onChange={e => setCourse(e.target.value)} required placeholder="e.g. CS101 Lecture" />
                        </div>

                        <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-green-200 mt-2">
                            Add to Schedule
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Admin;
