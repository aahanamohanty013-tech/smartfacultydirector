/* client/src/Dashboard.jsx */
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from './config';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [faculty, setFaculty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);

    const [formData, setFormData] = useState({});
    const [newClass, setNewClass] = useState({
        day_of_week: 'Monday', start_time: '09:00', end_time: '10:00', course_name: ''
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
                alert("Profile Updated Successfully!");
                setEditMode(false);
                fetchFacultyData(faculty.id);
            }
        } catch (err) {
            alert("Update failed");
        }
    };

    const handleAddClass = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/timetable`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newClass, faculty_id: faculty.id })
            });
            if (res.ok) {
                alert("Class Added!");
                setNewClass({ ...newClass, course_name: '' });
                fetchFacultyData(faculty.id);
            }
        } catch (err) {
            alert("Failed to add class");
        }
    };

    const handleDeleteClass = async (id) => {
        if (!window.confirm("Remove this class?")) return;
        try {
            const res = await fetch(`${API_URL}/api/timetable/${id}`, { method: 'DELETE' });
            if (res.ok) fetchFacultyData(faculty.id);
        } catch (err) {
            alert("Failed to delete");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/');
    };

    if (loading) return <div className="min-h-screen bg-[#7c2ae8] flex items-center justify-center text-white">Loading...</div>;

    const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition text-gray-900 bg-white";

    return (
        <div className="min-h-screen bg-[#7c2ae8] pt-24 pb-12 px-4">
            <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up">

                {/* Header */}
                <div className="flex justify-between items-center text-white">
                    <div>
                        <h1 className="text-3xl font-bold">Faculty Dashboard</h1>
                        <p className="text-white/70">Welcome back, {faculty.name}</p>
                    </div>
                    <div className="flex gap-4">
                        <Link to="/" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition">Back to Home</Link>
                        <button onClick={handleLogout} className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-bold transition shadow-lg">Logout</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Profile Card */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-800">My Profile</h2>
                                <button onClick={() => setEditMode(!editMode)} className="text-blue-600 text-sm font-semibold hover:underline">
                                    {editMode ? 'Cancel' : 'Edit'}
                                </button>
                            </div>

                            {editMode ? (
                                <form onSubmit={handleProfileUpdate} className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Room Number</label>
                                        <input type="text" className={inputClass} value={formData.room_number} onChange={e => setFormData({ ...formData, room_number: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Floor</label>
                                        <input type="text" className={inputClass} value={formData.floor_number} onChange={e => setFormData({ ...formData, floor_number: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Specialization</label>
                                        <input type="text" className={inputClass} value={formData.specialization} onChange={e => setFormData({ ...formData, specialization: e.target.value })} />
                                    </div>
                                    <button type="submit" className="w-full py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition">Save Changes</button>
                                </form>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="text-xs text-gray-400 uppercase font-bold">Location</div>
                                        <div className="text-gray-900 font-medium">Room {faculty.room_number}, Floor {faculty.floor_number}</div>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="text-xs text-gray-400 uppercase font-bold">Department</div>
                                        <div className="text-gray-900 font-medium">{faculty.department}</div>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="text-xs text-gray-400 uppercase font-bold">Specialization</div>
                                        <div className="text-blue-600 font-medium">{faculty.specialization || "Not set"}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Timetable Management */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800">Manage Timetable</h2>
                                <span className="text-xs text-gray-400 font-mono bg-white px-2 py-1 rounded border">Live Updates</span>
                            </div>

                            {/* Add Class Form */}
                            <div className="p-6 bg-blue-50/50 border-b border-blue-100">
                                <h3 className="text-sm font-bold text-blue-800 mb-3 uppercase tracking-wide">Add New Class</h3>
                                <form onSubmit={handleAddClass} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                    <div className="md:col-span-3">
                                        <label className="text-xs font-bold text-gray-400 mb-1 block">Day</label>
                                        <select className={inputClass} value={newClass.day_of_week} onChange={e => setNewClass({ ...newClass, day_of_week: e.target.value })}>
                                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-4">
                                        <label className="text-xs font-bold text-gray-400 mb-1 block">Course</label>
                                        <input type="text" placeholder="Course Name" className={inputClass} value={newClass.course_name} onChange={e => setNewClass({ ...newClass, course_name: e.target.value })} required />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="text-xs font-bold text-gray-400 mb-1 block">Time</label>
                                        <div className="flex gap-2 items-center">
                                            <input type="time" className={inputClass} value={newClass.start_time} onChange={e => setNewClass({ ...newClass, start_time: e.target.value })} required />
                                            <span className="text-gray-400 font-bold">-</span>
                                            <input type="time" className={inputClass} value={newClass.end_time} onChange={e => setNewClass({ ...newClass, end_time: e.target.value })} required />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-sm h-[42px]">
                                            Add
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Timetable List */}
                            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                                {faculty.timetables && faculty.timetables.length > 0 ? (
                                    faculty.timetables.map(t => (
                                        <div key={t.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-24 font-bold text-gray-700 text-sm bg-gray-100 text-center py-1 rounded">{t.day_of_week}</div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{t.course_name}</div>
                                                    <div className="text-xs text-gray-500">{t.start_time.slice(0, 5)} - {t.end_time.slice(0, 5)}</div>
                                                </div>
                                            </div>
                                            <button onClick={() => handleDeleteClass(t.id)} className="text-gray-300 hover:text-red-500 font-bold px-3 py-1 rounded transition group-hover:bg-white group-hover:shadow-sm">
                                                ✕
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-12 text-center text-gray-400 italic">No classes added yet.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
