import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

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

    // Queue & Appointment States
    const [queueData, setQueueData] = useState({ queue: [], totalWaitTime: 0, crowdLevel: 'Low' });
    const [appointments, setAppointments] = useState([]);
    const [greedyDay, setGreedyDay] = useState('Monday');

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (!storedUser || storedUser.role !== 'faculty') {
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
                department: data.department,
                research_interests: data.research_interests || '',
                bio: data.bio || ''
            });

            // Fetch Walk-in Queue & Appointments
            fetchQueue(facultyId);
            fetchAppointments(facultyId);

            setLoading(false);
        } catch (err) {
            console.error("Failed to load data", err);
        }
    };

    const fetchQueue = async (facultyId) => {
        try {
            const res = await fetch(`${API_URL}/api/faculty/${facultyId}/queue`);
            const data = await res.json();
            setQueueData(data);
        } catch (err) {
            console.error('Failed to fetch queue', err);
        }
    };

    const fetchAppointments = async (facultyId) => {
        try {
            const res = await fetch(`${API_URL}/api/faculty/${facultyId}/appointments`);
            const data = await res.json();
            setAppointments(data);
        } catch (err) {
            console.error('Failed to fetch appointments', err);
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
        try {
            const res = await fetch(`${API_URL}/api/timetable`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newClass, faculty_id: faculty.id })
            });
            if (res.ok) {
                alert("Class Added");
                setNewClass({ ...newClass, course_name: '' }); // Reset
                fetchFacultyData(faculty.id);
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

    // Queue handlers
    const handleServeQueue = async (id) => {
        try {
            const res = await fetch(`${API_URL}/api/queue/serve/${id}`, { method: 'POST' });
            if (res.ok) {
                fetchQueue(faculty.id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleCompleteQueue = async (id) => {
        try {
            const res = await fetch(`${API_URL}/api/queue/complete/${id}`, { method: 'POST' });
            if (res.ok) {
                fetchQueue(faculty.id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Appointment Handlers
    const handleApproveAppointment = async (id) => {
        try {
            const res = await fetch(`${API_URL}/api/appointments/approve/${id}`, { method: 'POST' });
            if (res.ok) {
                fetchAppointments(faculty.id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeclineAppointment = async (id) => {
        if (!window.confirm("Are you sure you want to decline this request? The student will be notified.")) return;
        try {
            const res = await fetch(`${API_URL}/api/appointments/decline/${id}`, { method: 'POST' });
            if (res.ok) {
                fetchAppointments(faculty.id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleProcessGreedy = async () => {
        if (!window.confirm(`Auto-approve suggestion calculations for ${greedyDay}? Unselected overlapping requests will be declined and notified.`)) return;
        try {
            const res = await fetch(`${API_URL}/api/appointments/process-greedy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    faculty_id: faculty.id,
                    day_of_week: greedyDay
                })
            });
            if (res.ok) {
                const data = await res.json();
                alert(`Greedy schedule resolved: ${data.scheduledCount} approved, ${data.rejectedCount} declined due to overlap.`);
                fetchAppointments(faculty.id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/');
    };

    if (loading) return <div className="p-8 text-center text-white">Loading dashboard...</div>;

    const glassInput = "w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white placeholder-white/50 focus:outline-none focus:bg-white/20";
    const glassLabel = "block text-sm text-white/80 mb-1";
    const sectionClass = "bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl";

    return (
        <div className="min-h-screen pt-24 px-6 pb-12">
            {/* Header */}
            <div className="max-w-6xl mx-auto flex justify-between items-center mb-8 animate-fade-in-up">
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

            <div className="max-w-6xl mx-auto space-y-8">
                
                {/* Row 1: Profile and Lecture Timetable */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Profile Section */}
                    <div className={`${sectionClass} h-fit`}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center"><span className="mr-2">👤</span> My Profile</h2>
                            <button
                                onClick={() => setEditMode(!editMode)}
                                className="text-yellow-300 hover:text-yellow-200 text-sm font-semibold"
                            >
                                {editMode ? 'Cancel' : 'Edit Details'}
                            </button>
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
                                <div>
                                    <label className={glassLabel}>Biography</label>
                                    <textarea className={`${glassInput} resize-none`} rows="2" value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} />
                                </div>
                                <div>
                                    <label className={glassLabel}>Research Interests</label>
                                    <textarea className={`${glassInput} resize-none`} rows="2" value={formData.research_interests} onChange={e => setFormData({ ...formData, research_interests: e.target.value })} />
                                </div>
                                <button type="submit" className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 rounded-lg hover:shadow-lg transition">Save Changes</button>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                        <div className="text-xs text-white/50 uppercase">Location</div>
                                        <div className="font-semibold">{faculty.room_number}, {faculty.floor_number}</div>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                        <div className="text-xs text-white/50 uppercase">Department</div>
                                        <div className="font-semibold">{faculty.department}</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                        <div className="text-xs text-white/50 uppercase">Specialization</div>
                                        <div className="font-semibold">{faculty.specialization || "Not set"}</div>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                        <div className="text-xs text-white/50 uppercase">Shortform / Alias</div>
                                        <div className="font-semibold">{faculty.aliases && faculty.aliases.length > 0 ? faculty.aliases.join(', ') : "Not set"}</div>
                                    </div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                    <div className="text-xs text-white/50 uppercase">Biography</div>
                                    <div className="text-sm font-medium">{faculty.bio || "No bio listed."}</div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                    <div className="text-xs text-white/50 uppercase">Research Interests</div>
                                    <div className="text-sm font-medium">{faculty.research_interests || "No research listed."}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Schedule Section */}
                    <div className={`${sectionClass} flex flex-col`}>
                        <h2 className="text-xl font-bold flex items-center mb-6"><span className="mr-2">📅</span> My Class Schedule</h2>

                        {/* Add Class Form */}
                        <form onSubmit={handleAddClass} className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
                            <h3 className="text-sm font-bold text-white/70">Add New Class</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <select className={glassInput} value={newClass.day_of_week} onChange={e => setNewClass({ ...newClass, day_of_week: e.target.value })}>
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => <option key={d} value={d} className="text-black">{d}</option>)}
                                </select>
                                <input className={glassInput} placeholder="Course Name" value={newClass.course_name} onChange={e => setNewClass({ ...newClass, course_name: e.target.value })} required />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <input type="time" className={glassInput} value={newClass.start_time} onChange={e => setNewClass({ ...newClass, start_time: e.target.value })} required />
                                <input type="time" className={glassInput} value={newClass.end_time} onChange={e => setNewClass({ ...newClass, end_time: e.target.value })} required />
                            </div>
                            <button type="submit" className="w-full bg-blue-600/80 hover:bg-blue-600 text-white py-2 rounded-lg text-sm transition font-medium">Add Class</button>
                        </form>

                        {/* List Classes */}
                        <div className="flex-1 overflow-y-auto space-y-2 max-h-[250px] pr-2 custom-scrollbar">
                            {faculty.timetables && faculty.timetables.length > 0 ? (
                                faculty.timetables.map(t => (
                                    <div key={t.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition group">
                                        <div className="text-sm">
                                            <div className="font-bold text-white">{t.day_of_week}</div>
                                            <div className="text-white/70 text-xs"> {t.start_time.slice(0, 5)} - {t.end_time.slice(0, 5)} • <span className="text-yellow-300 font-semibold">{t.course_name}</span></div>
                                        </div>
                                        <button onClick={() => handleDeleteClass(t.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition px-2">Delete</button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-white/40 text-center py-8 italic border border-dashed border-white/10 rounded-lg">No classes scheduled.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Row 2: Walk-in Queue Monitor and Appointment Booking Requests */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* Walk-in Queue Monitor */}
                    <div className={`${sectionClass} md:col-span-1 flex flex-col justify-between`}>
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold flex items-center">
                                    <span className="mr-2">🚶</span> Live Queue
                                </h2>
                                <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${queueData.crowdLevel === 'High' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-green-100 text-green-800 border-green-200'}`}>
                                    {queueData.crowdLevel}
                                </span>
                            </div>

                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar mb-6">
                                {queueData.queue && queueData.queue.length > 0 ? (
                                    queueData.queue.map((student, idx) => {
                                        let badgeColor = "bg-green-500/20 text-green-300 border-green-500/30";
                                        if (student.urgency === 'High') badgeColor = "bg-red-500/20 text-red-300 border-red-500/30";
                                        else if (student.urgency === 'Medium') badgeColor = "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";

                                        return (
                                            <div 
                                                key={student.id} 
                                                className={`p-3 rounded-xl border flex flex-col justify-between hover:bg-white/10 transition ${student.status === 'Serving' ? 'bg-indigo-500/20 border-indigo-400/40' : 'bg-white/5 border-white/5'}`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <span className="font-bold text-white text-sm">#{idx + 1} {student.student_name}</span>
                                                        <div className="text-[10px] text-white/50">{student.student_email}</div>
                                                    </div>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${badgeColor} font-bold`}>
                                                        {student.urgency}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between items-center mt-3 border-t border-white/5 pt-2">
                                                    <div className="text-[10px] text-white/60">
                                                        Wait: <strong>{student.wait_time_before} mins</strong>
                                                    </div>
                                                    <div className="flex space-x-1.5">
                                                        {student.status === 'Waiting' ? (
                                                            <button 
                                                                onClick={() => handleServeQueue(student.id)}
                                                                className="px-2.5 py-1 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded transition"
                                                            >
                                                                Serve
                                                            </button>
                                                        ) : (
                                                            <button 
                                                                onClick={() => handleCompleteQueue(student.id)}
                                                                className="px-2.5 py-1 text-[10px] font-bold bg-green-600 hover:bg-green-700 text-white rounded transition"
                                                            >
                                                                Done
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-white/40 text-center py-12 italic border border-dashed border-white/10 rounded-lg">No walk-ins waiting.</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-center text-xs text-white/60">
                            Estimated clear time: <strong>{queueData.totalWaitTime} minutes</strong>
                        </div>
                    </div>

                    {/* Appointment Bookings Manager */}
                    <div className={`${sectionClass} md:col-span-2 flex flex-col`}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <h2 className="text-xl font-bold flex items-center">
                                <span className="mr-2">📅</span> Booking Planner
                            </h2>
                            {/* Greedy Action Bar */}
                            <div className="flex items-center space-x-2 w-full sm:w-auto">
                                <select 
                                    value={greedyDay}
                                    onChange={e => setGreedyDay(e.target.value)}
                                    className="bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium focus:outline-none"
                                >
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => <option key={d} value={d} className="text-black">{d}</option>)}
                                </select>
                                <button
                                    onClick={handleProcessGreedy}
                                    className="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-lg text-xs font-bold transition shadow-md whitespace-nowrap"
                                >
                                    ⚡ Run Greedy Scheduler
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
                            {appointments.length > 0 ? (
                                appointments.map(appt => {
                                    let statusColor = "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
                                    if (appt.status === 'Scheduled') statusColor = "bg-green-500/20 text-green-300 border-green-500/30";
                                    else if (appt.status === 'Declined') statusColor = "bg-red-500/20 text-red-300 border-red-500/30";

                                    return (
                                        <div 
                                            key={appt.id}
                                            className={`p-4 rounded-xl border transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${appt.status === 'Pending' && appt.suggested ? 'bg-green-500/10 border-green-500/30 ring-1 ring-green-500/20' : 'bg-white/5 border-white/5'}`}
                                        >
                                            <div className="space-y-1 flex-1">
                                                <div className="flex items-center space-x-3">
                                                    <span className="font-bold text-white text-base">{appt.student_name}</span>
                                                    <span className="text-[10px] text-white/50 font-mono">{appt.student_email}</span>
                                                    {appt.status === 'Pending' && appt.suggested && (
                                                        <span className="bg-green-500 text-green-950 font-extrabold text-[9px] px-2 py-0.5 rounded-full shadow-sm tracking-wider uppercase">
                                                            ★ Suggested (EFTF Optimal)
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-white/70">
                                                    <strong>Day:</strong> {appt.day_of_week} • <strong>Time:</strong> {appt.start_time.slice(0, 5)} - {appt.end_time.slice(0, 5)}
                                                </div>
                                                <div className="text-xs text-white/60 italic mt-1 font-medium">
                                                    "Reason: {appt.reason}"
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusColor}`}>
                                                    {appt.status}
                                                </span>
                                                {appt.status === 'Pending' && (
                                                    <div className="flex space-x-1">
                                                        <button 
                                                            onClick={() => handleApproveAppointment(appt.id)}
                                                            className="p-1 bg-green-600 hover:bg-green-700 text-white rounded text-[11px] font-bold px-2.5 transition"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeclineAppointment(appt.id)}
                                                            className="p-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold px-2.5 transition"
                                                        >
                                                            Decline
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-white/40 text-center py-16 italic border border-dashed border-white/10 rounded-lg">No appointments requested yet.</p>
                            )}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default Dashboard;
