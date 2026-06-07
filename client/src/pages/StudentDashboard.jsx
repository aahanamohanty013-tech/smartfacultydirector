import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../config';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (!storedUser || storedUser.role !== 'student') {
            navigate('/login');
            return;
        }
        setStudent(storedUser);
        fetchDashboardData(storedUser.id);
    }, [navigate]);

    const fetchDashboardData = async (studentId) => {
        try {
            setLoading(true);
            
            // 1. Fetch appointments
            const apptRes = await fetch(`${API_URL}/api/student/${studentId}/appointments`);
            const apptData = await apptRes.json();
            setAppointments(apptData);

            // 2. Fetch notifications
            const notifRes = await fetch(`${API_URL}/api/student/${studentId}/notifications`);
            const notifData = await notifRes.json();
            setNotifications(notifData);

            setLoading(false);
        } catch (err) {
            console.error('Failed to load student dashboard data:', err);
            setLoading(false);
        }
    };

    const handleMarkRead = async () => {
        if (!student) return;
        try {
            const res = await fetch(`${API_URL}/api/student/notifications/read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student_id: student.id })
            });
            if (res.ok) {
                // Refresh data
                fetchDashboardData(student.id);
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

    const sectionClass = "bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl";
    const unreadNotifications = notifications.filter(n => !n.is_read);

    return (
        <div className="min-h-screen pt-24 px-6 pb-12">
            {/* Header */}
            <div className="max-w-6xl mx-auto flex justify-between items-center mb-8 animate-fade-in-up">
                <div className="flex items-center space-x-4">
                    <h1 className="text-3xl font-bold">Student Dashboard</h1>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-mono text-white/80">
                        {student.name} ({student.email})
                    </span>
                </div>
                <div className="flex space-x-3">
                    <Link to="/" className="px-5 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium backdrop-blur-sm transition">
                        Find Faculty
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="px-5 py-2 bg-red-500/80 hover:bg-red-600 rounded-lg text-white font-medium backdrop-blur-sm transition"
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Notifications Panel */}
                <div className={`${sectionClass} md:col-span-1 h-fit`}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold flex items-center">
                            <span className="mr-2">🔔</span> Alerts {unreadNotifications.length > 0 && (
                                <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 rounded-full text-white">{unreadNotifications.length}</span>
                            )}
                        </h2>
                        {unreadNotifications.length > 0 && (
                            <button
                                onClick={handleMarkRead}
                                className="text-xs text-blue-300 hover:text-blue-200 font-semibold"
                            >
                                Clear All
                            </button>
                        )}
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {notifications.length > 0 ? (
                            notifications.map(n => (
                                <div 
                                    key={n.id} 
                                    className={`p-3 rounded-xl border text-sm transition ${n.is_read ? 'bg-white/5 border-white/5 text-white/60' : 'bg-red-500/10 border-red-500/20 text-white'}`}
                                >
                                    <div className="font-semibold text-xs text-white/40 mb-1">
                                        {new Date(n.created_at).toLocaleString()}
                                    </div>
                                    <div>{n.message}</div>
                                </div>
                            ))
                        ) : (
                            <p className="text-white/40 text-center py-8 italic border border-dashed border-white/10 rounded-lg">No notifications.</p>
                        )}
                    </div>
                </div>

                {/* Appointments Panel */}
                <div className={`${sectionClass} md:col-span-2 flex flex-col`}>
                    <h2 className="text-xl font-bold flex items-center mb-6">
                        <span className="mr-2">📅</span> My Bookings
                    </h2>

                    <div className="space-y-4 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
                        {appointments.length > 0 ? (
                            appointments.map(appt => {
                                let statusPill = "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
                                if (appt.status === 'Scheduled') {
                                    statusPill = "bg-green-500/20 text-green-300 border-green-500/30";
                                } else if (appt.status === 'Declined') {
                                    statusPill = "bg-red-500/20 text-red-300 border-red-500/30";
                                }

                                return (
                                    <div 
                                        key={appt.id} 
                                        className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center space-x-3">
                                                <span className="font-bold text-white text-lg">{appt.faculty_name}</span>
                                                <span className="text-xs text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                                    📍 {appt.room_number} ({appt.floor_number})
                                                </span>
                                            </div>
                                            <div className="text-sm text-white/70">
                                                <strong>Day:</strong> {appt.day_of_week} • <strong>Time:</strong> {appt.start_time.slice(0, 5)} - {appt.end_time.slice(0, 5)}
                                            </div>
                                            <div className="text-sm text-white/60 italic mt-1">
                                                "Reason: {appt.reason}"
                                            </div>
                                        </div>
                                        <span className={`mt-3 md:mt-0 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${statusPill}`}>
                                            {appt.status === 'Scheduled' ? 'Approved' : appt.status}
                                        </span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-16 border border-dashed border-white/10 rounded-xl">
                                <p className="text-white/40 italic mb-4">No appointments requested yet.</p>
                                <Link to="/" className="px-5 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl shadow-lg transition">
                                    Browse Faculty Directory
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
