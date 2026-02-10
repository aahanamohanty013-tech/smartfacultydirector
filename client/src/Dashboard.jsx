/* client/src/Dashboard.jsx */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from './config';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [faculty, setFaculty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);

    // Form States
    const [formData, setFormData] = useState({});
    const [newClass, setNewClass] = useState({
        day_of_week: 'Monday',
        start_time: '09:00',
        end_time: '10:00',
        course_name: ''
    });

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (!storedUser || !storedUser.facultyId) {
            navigate('/login');
            return;
        }
        setUser(storedUser);
        fetchFacultyData(storedUser.facultyId);
    }, [navigate]);

    const fetchFacultyData = async (facultyId) => {
        try {
            const res = await fetch(`${API_URL}/api/faculty/${facultyId}`);
            const data = await res.json();
            setFaculty(data);
            setFormData({
                room_number: data.room_number,
                floor_number: data.floor_number,
                specialization: data.specialization || '',
                department: data.department
            });
            setLoading(false);
        } catch (err) {
            console.error("Failed to load data", err);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/faculty/${faculty.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                alert("Profile Updated");
                setEditMode(false);
                fetchFacultyData(faculty.id);
            }
        } catch (err) {
            alert("Update failed");
        }
    };

    const handleAddClass = async (e) => {
        e.preventDefault();

        // --- COLLISION DETECTION LOGIC ---
        if (faculty.timetables) {
            const isOverlap = faculty.timetables.some(t => {
                if (t.day_of_week !== newClass.day_of_week) return false;

                // Compare times (HH:MM string comparison works for 24h format)
                // Existing: "09:00:00" -> "09:00"
                const tStart = t.start_time.slice(0, 5);
                const tEnd = t.end_time.slice(0, 5);

                // Overlap if (NewStart < OldEnd) and (NewEnd > OldStart)
                return (newClass.start_time < tEnd && newClass.end_time > tStart);
            });

            if (isOverlap) {
                alert("Can not assign class since it is already in the timetable, if you wish to proceed please delete the previous class to add");
                return; // Stop execution
            }
        }
        // ---------------------------------

        try {
            const res = await fetch(`${API_URL}/api/timetable`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newClass, faculty_id: faculty.id })
            });
            if (res.ok) {
                alert("Class Added");
                setNewClass({ ...newClass, course_name: '' }); // Reset name
                fetchFacultyData(faculty.id); // Refresh list
            }
        } catch (err) {
            alert("Failed to add class");
        }
    };

    const handleDeleteClass = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            const res = await fetch(`${API_URL}/api/timetable/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchFacultyData(faculty.id);
            }
        } catch (err) {
            alert("Failed to delete");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/');
    };

    if (loading) return <div className="p-8 text-center text-white">Loading dashboard...</div>;

    // Common Input Style for Glass UI
    const glassInput = "w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white placeholder-white/50 focus:outline-none focus:bg-white/20";
    const glassLabel = "block text-sm text-white/80 mb-1";
    const sectionClass = "bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl";

    return (
        <div className="min-h-screen pt-24 px-6 pb-6 animate-fade-in-up">
            {/* Header */}
            <div className="max-w-6xl mx-auto flex justify-between items-center mb-8">
                <div className="flex items-center space-x-4">
                    <h1 className="text-3xl font-bold">Faculty Dashboard</h1>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-mono text-white/80">
                        {faculty.name}
                    </span>
                </div>
                <button
                    onClick={handleLogout}
                    className="px-6 py-2 bg-red-500/80 hover:bg-red-600 rounded-lg text-white font-medium backdrop-blur-sm transition shadow-lg"
                >
                    Logout
                </button>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Profile Section */}
                <div className={`${sectionClass} h-fit`}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold flex items-center"><span className="mr-2">👤</span> My Profile</h2>
                        <button
                            onClick={() => setEditMode(!editMode)}
                            className="text-yellow-300 hover:text-yellow-200 text-sm font-medium"
                        >
                            {editMode ? 'Cancel' : 'Edit Details'}
                        </button>
                    </div>

                    {/* STATUS TOGGLE */}
                    <div className="mb-6 bg-white/5 p-4 rounded-xl border border-white/10 flex items-center justify-between">
                        <div>
                            <div className="font-bold text-lg text-white">Status: {faculty.is_on_leave ? '🔴 On Leave' : '🟢 Active'}</div>
                            <div className="text-xs text-white/60">Toggle this when you are away.</div>
                        </div>
                        <button
                            onClick={() => {
                                const newStatus = !faculty.is_on_leave;
                                // Optimistic Update
                                setFaculty({ ...faculty, is_on_leave: newStatus });
                                // API Call
                                fetch(`${API_URL}/api/faculty/${faculty.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ is_on_leave: newStatus })
                                }).then(res => {
                                    if (!res.ok) alert("Failed to update status");
                                });
                            }}
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition ${faculty.is_on_leave ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                        >
                            {faculty.is_on_leave ? 'Mark as Active' : 'Mark as On Leave'}
                        </button>
                    </div>

                    {/* EXAM DUTY TOGGLE */}
                    <div className="mb-6 bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-bold text-lg text-white">Exam Duty: {faculty.is_on_exam_duty ? '📝 On Duty' : '❌ Off Duty'}</div>
                                <div className="text-xs text-white/60">Enable this when you have invigilation duty.</div>
                            </div>
                            <button
                                onClick={() => {
                                    const newStatus = !faculty.is_on_exam_duty;
                                    const updates = { is_on_exam_duty: newStatus };
                                    if (!newStatus) updates.exam_duty_time = ''; // Clear time if turning off

                                    // Optimistic Update
                                    setFaculty({ ...faculty, ...updates });

                                    // API Call
                                    fetch(`${API_URL}/api/faculty/${faculty.id}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(updates)
                                    }).then(res => {
                                        if (!res.ok) alert("Failed to update exam duty status");
                                    });
                                }}
                                className={`px-4 py-2 rounded-lg font-bold text-sm transition ${faculty.is_on_exam_duty ? 'bg-purple-500 hover:bg-purple-600' : 'bg-gray-500 hover:bg-gray-600'}`}
                            >
                                {faculty.is_on_exam_duty ? 'Disable Exam Duty' : 'Enable Exam Duty'}
                            </button>
                        </div>

                        {faculty.is_on_exam_duty && (
                            <div className="animate-fade-in-up">
                                <label className={glassLabel}>Exam Time / Details</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className={glassInput}
                                        placeholder="e.g. 10:00 AM - 1:00 PM (Room 404)"
                                        value={faculty.exam_duty_time || ''}
                                        onChange={(e) => {
                                            const newTime = e.target.value;
                                            setFaculty({ ...faculty, exam_duty_time: newTime });
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            fetch(`${API_URL}/api/faculty/${faculty.id}`, {
                                                method: 'PUT',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ exam_duty_time: faculty.exam_duty_time })
                                            }).then(res => {
                                                if (res.ok) alert("Time Updated");
                                                else alert("Failed to save time");
                                            });
                                        }}
                                        className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg text-white font-bold text-sm"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {editMode ? (
                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                            <div>
                                <label className={glassLabel}>Department</label>
                                <input className={glassInput} value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={glassLabel}>Room</label>
                                    <input className={glassInput} value={formData.room_number} onChange={e => setFormData({ ...formData, room_number: e.target.value })} />
                                </div>
                                <div>
                                    <label className={glassLabel}>Floor</label>
                                    <input className={glassInput} value={formData.floor_number} onChange={e => setFormData({ ...formData, floor_number: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className={glassLabel}>Specialization</label>
                                <input className={glassInput} value={formData.specialization} onChange={e => setFormData({ ...formData, specialization: e.target.value })} />
                            </div>
                            <button type="submit" className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 rounded-lg hover:shadow-lg transition">Save Changes</button>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                <div className="text-3xl mr-4">📍</div>
                                <div>
                                    <div className="text-xs text-white/50 uppercase">Location</div>
                                    <div className="font-semibold">{faculty.room_number}, {faculty.floor_number}</div>
                                </div>
                            </div>
                            <div className="flex items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                <div className="text-3xl mr-4">🏢</div>
                                <div>
                                    <div className="text-xs text-white/50 uppercase">Department</div>
                                    <div className="font-semibold">{faculty.department}</div>
                                </div>
                            </div>
                            <div className="flex items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                <div className="text-3xl mr-4">💡</div>
                                <div>
                                    <div className="text-xs text-white/50 uppercase">Specialization</div>
                                    <div className="font-semibold">{faculty.specialization || "Not set"}</div>
                                </div>
                            </div>

                            <div className="mt-4 p-4 bg-blue-500/20 rounded-xl border border-blue-400/30">
                                <div className="text-sm">Current Status: <strong className="text-blue-200">{faculty.status}</strong></div>
                                <div className="text-xs text-white/70 mt-1">{faculty.bestVisitingTime}</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Timetable Section */}
                <div className={`${sectionClass} flex flex-col`}>
                    <h2 className="text-xl font-bold flex items-center mb-6"><span className="mr-2">📅</span> My Schedule</h2>

                    {/* Add Class Form */}
                    <form onSubmit={handleAddClass} className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
                        <h3 className="text-sm font-bold text-white/70">Add New Class</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <select className={glassInput} value={newClass.day_of_week} onChange={e => setNewClass({ ...newClass, day_of_week: e.target.value })}>
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => <option key={d} value={d} className="text-black">{d}</option>)}
                            </select>
                            <input className={glassInput} placeholder="Subject/Course" value={newClass.course_name} onChange={e => setNewClass({ ...newClass, course_name: e.target.value })} required />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <input type="time" className={glassInput} value={newClass.start_time} onChange={e => setNewClass({ ...newClass, start_time: e.target.value })} required />
                            <input type="time" className={glassInput} value={newClass.end_time} onChange={e => setNewClass({ ...newClass, end_time: e.target.value })} required />
                        </div>
                        <button type="submit" className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-2 rounded-lg transition">+ Add Class</button>
                    </form>

                    {/* Class List */}
                    <div className="space-y-2 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                        {faculty.timetables && faculty.timetables.length > 0 ? (
                            faculty.timetables.map(t => (
                                <div key={t.id} className="flex justify-between items-center p-3 bg-black/20 rounded-lg border border-white/5 group hover:border-white/20 transition">
                                    <div>
                                        <div className="font-bold text-yellow-300">{t.day_of_week}</div>
                                        <div className="text-xs text-white/70">{t.start_time.slice(0, 5)} - {t.end_time.slice(0, 5)}</div>
                                        <div className="text-sm">{t.course_name}</div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteClass(t.id)}
                                        className="text-gray-400 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-white/30 italic py-8">No classes added yet</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;


