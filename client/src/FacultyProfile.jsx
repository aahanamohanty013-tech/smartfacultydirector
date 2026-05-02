/* client/src/FacultyProfile.jsx */
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_URL } from './config';

const FacultyProfile = () => {
    const { id } = useParams();
    const [faculty, setFaculty] = useState(null);
    const [loading, setLoading] = useState(true);

    // Smart Scheduler State
    const [isScheduling, setIsScheduling] = useState(false);
    const [smartResults, setSmartResults] = useState(null);
    const [schedulerError, setSchedulerError] = useState(null);

    const runSmartScheduler = async () => {
        setIsScheduling(true);
        setSchedulerError(null);
        
        // Define some overlapping mock requests for testing
        const meetingRequests = [
            { id: 1, title: "Doubt Session A", start: "09:00", end: "09:30" },
            { id: 2, title: "Project Review 1", start: "09:15", end: "09:45" },
            { id: 3, title: "Quick Chat", start: "09:30", end: "09:45" },
            { id: 4, title: "Research Update", start: "10:00", end: "10:30" },
            { id: 5, title: "Mentorship", start: "10:15", end: "10:45" },
            { id: 6, title: "Lab Prep", start: "14:00", end: "15:00" }, 
            { id: 7, title: "Student Council", start: "14:30", end: "15:30" },
            { id: 8, title: "Quick Meet", start: "15:00", end: "15:15" }
        ];

        // Determine current day of week to check against their real timetable
        const dayOptions = { timeZone: 'Asia/Kolkata', weekday: 'long' };
        const currentDay = new Intl.DateTimeFormat('en-US', dayOptions).format(new Date());

        try {
            const res = await fetch(`${API_URL}/api/faculty/${id}/smart-meetings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requests: meetingRequests,
                    day_of_week: currentDay
                })
            });

            const data = await res.json();
            if (res.ok) {
                setSmartResults(data);
            } else {
                setSchedulerError(data.error || 'Failed to run smart scheduler');
            }
        } catch (err) {
            console.error(err);
            setSchedulerError('Network error');
        } finally {
            setIsScheduling(false);
        }
    };

    useEffect(() => {
        fetch(`${API_URL}/api/faculty/${id}`)
            .then(res => res.json())
            .then(data => {
                setFaculty(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [id]);

    if (loading) return <div className="p-10 text-center text-gray-500 text-lg animate-pulse">Loading profile...</div>;
    if (!faculty || faculty.error) return <div className="p-10 text-center text-red-500 text-lg">Faculty not found.</div>;

    // --- AVAILABILITY LOGIC ---
    const isAvailable = faculty.status === 'Likely Available';
    const isOnLeave = faculty.status === 'On Leave';

    // Status Logic
    let statusColor = isAvailable ? 'bg-green-100 text-green-800 border-green-200' : 'bg-amber-100 text-amber-800 border-amber-200';
    let statusIcon = isAvailable ? '✅' : '⏳';

    if (isOnLeave) {
        statusColor = 'bg-red-100 text-red-800 border-red-200';
        statusIcon = '⛔';
    }

    return (
        <div className="min-h-screen pt-24 px-6 pb-12 bg-[#7c2ae8]">
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">

                {/* Back Button */}
                <div className="flex justify-end">
                    <Link to="/" className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition border border-white/10 text-sm font-medium">
                        ← Back to Home
                    </Link>
                </div>

                {/* Header Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Avatar */}
                        <div className="w-24 h-24 bg-gray-200 rounded-full flex-shrink-0 overflow-hidden relative border-4 border-white shadow-sm">
                            <img
                                src={`/assets/${faculty.name}.jpg`}
                                alt={faculty.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-2xl font-bold text-gray-400" style={{ display: 'none' }}>
                                {faculty.name ? faculty.name.charAt(0) : '?'}
                            </div>
                        </div>

                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{faculty.name}</h1>
                            {faculty.aliases && faculty.aliases.length > 0 && (
                                <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md mb-2 font-mono">
                                    {faculty.aliases.join(', ')}
                                </span>
                            )}
                            <p className="text-xl text-blue-600 font-medium">{faculty.department}</p>
                            <div className="mt-4 flex flex-col space-y-1 text-sm text-gray-500">
                                <span className="flex items-center"><span className="mr-1">📍</span> <span className="font-semibold mr-1">Cabin:</span> {faculty.room_number}, {faculty.floor_number}</span>
                                {faculty.specialization && <span className="flex items-center text-blue-800 bg-blue-50 px-2 py-1 rounded w-fit"><span className="mr-2">💡</span> {faculty.specialization}</span>}
                            </div>
                        </div>
                    </div>

                    {/* STATUS BADGE */}
                    <div className={`mt-6 md:mt-0 px-6 py-3 rounded-full border ${statusColor} flex items-center shadow-sm whitespace-nowrap`}>
                        <span className="mr-2 text-xl">{statusIcon}</span>
                        <div>
                            <div className="text-xs uppercase font-bold tracking-wider opacity-70">Current Status</div>
                            <div className="font-bold text-lg">{faculty.status}</div>
                        </div>
                    </div>
                </div>

                {/* Availability Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">Best Visiting Time</h3>
                        <div className="flex items-center text-blue-700">
                            <span className="text-3xl mr-3">🕒</span>
                            <span className="text-2xl font-bold">{faculty.bestVisitingTime}</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-2">Calculated based on today's schedule.</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">Current Activity</h3>
                        {faculty.currentDetails ? (
                            <div className="text-gray-800 font-medium text-lg border-l-4 border-amber-400 pl-3">
                                {faculty.currentDetails}
                            </div>
                        ) : (
                            <div className="text-gray-400 italic">No class scheduled right now.</div>
                        )}
                    </div>
                </div>

                {/* Smart Appointment Scheduler */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl shadow-sm border border-purple-100 overflow-hidden p-6 md:p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:flex-wrap md:gap-4 mb-6">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                                <span className="text-2xl mr-2">✨</span> Smart Appointment Scheduler
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Powered by <span className="font-semibold text-purple-700">Greedy Interval Scheduling</span>. 
                                Automatically finds the maximum number of non-overlapping meetings from a messy list of requests.
                            </p>
                        </div>
                        <button 
                            onClick={runSmartScheduler}
                            disabled={isScheduling}
                            className={`mt-4 md:mt-0 px-6 py-3 rounded-xl text-white font-bold shadow-md transition-all ${isScheduling ? 'bg-purple-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 hover:shadow-lg transform hover:-translate-y-0.5'}`}
                        >
                            {isScheduling ? 'Running Algorithm...' : 'Run Smart Scheduler'}
                        </button>
                    </div>

                    {schedulerError && (
                        <div className="p-4 bg-red-100 text-red-700 rounded-lg mb-6 text-sm border border-red-200">
                            {schedulerError}
                        </div>
                    )}

                    {smartResults && (
                        <div className="bg-white rounded-xl p-6 shadow-inner border border-purple-50 animate-fade-in-up">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Results for</span>
                                    <div className="text-lg font-bold text-gray-800">{smartResults.day}</div>
                                </div>
                                <div className="flex gap-4 text-center">
                                    <div className="bg-gray-50 px-4 py-2 rounded-lg">
                                        <div className="text-2xl font-bold text-gray-700">{smartResults.totalRequests}</div>
                                        <div className="text-xs text-gray-500 font-medium">Total Requests</div>
                                    </div>
                                    <div className="bg-purple-50 px-4 py-2 rounded-lg border border-purple-100 shadow-sm">
                                        <div className="text-2xl font-bold text-purple-700">{smartResults.acceptedMeetings}</div>
                                        <div className="text-xs text-purple-600 font-medium">Accepted (Maximized)</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {smartResults.meetings.map((meeting, idx) => (
                                    <div key={idx} className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition border border-transparent hover:border-gray-100 group">
                                        <div className="bg-purple-100 text-purple-700 font-bold px-3 py-1 rounded-md text-sm font-mono mr-4 group-hover:bg-purple-200 transition">
                                            {meeting.start} - {meeting.end}
                                        </div>
                                        <div className="font-medium text-gray-800">{meeting.title}</div>
                                        <div className="ml-auto text-green-500 opacity-0 group-hover:opacity-100 transition">
                                            <span className="text-sm font-bold flex items-center"><span className="mr-1 text-lg">✓</span> Scheduled</span>
                                        </div>
                                    </div>
                                ))}
                                {smartResults.meetings.length === 0 && (
                                    <div className="text-center text-gray-500 py-4 italic">No optimal meetings could be scheduled.</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Timetable */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-gray-800">Weekly Schedule</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Day</th>
                                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Course</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {faculty.timetables && faculty.timetables.length > 0 ? faculty.timetables.map((t) => (
                                    <tr key={t.id} className="hover:bg-gray-50 transition">
                                        <td className="px-8 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.day_of_week}</td>
                                        <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-600 font-mono bg-gray-50 rounded-sm">
                                            {t.start_time.slice(0, 5)} - {t.end_time.slice(0, 5)}
                                        </td>
                                        <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-700">{t.course_name}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="3" className="px-8 py-8 text-center text-gray-400 italic">No schedule data available.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FacultyProfile;


