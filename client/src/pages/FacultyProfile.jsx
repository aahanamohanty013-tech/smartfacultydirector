import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { API_URL } from '../config';

const FacultyProfile = () => {
    const { id } = useParams();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const highlightQuery = queryParams.get('highlight') || '';

    const [faculty, setFaculty] = useState(null);
    const [loading, setLoading] = useState(true);

    // Student Session state
    const [student, setStudent] = useState(null);

    // Queue states
    const [queueInfo, setQueueInfo] = useState({ queue: [], totalWaitTime: 0, crowdLevel: 'Low' });
    const [urgency, setUrgency] = useState('Medium');
    const [checkedIn, setCheckedIn] = useState(null); // stores { position, waitTime }

    // Appointment Booking states
    const [bookingDay, setBookingDay] = useState('Monday');
    const [recommendedSlots, setRecommendedSlots] = useState([]);
    const [reason, setReason] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('09:30');
    const [bookingSuccess, setBookingSuccess] = useState(null);
    const [bookingError, setBookingError] = useState(null);

    useEffect(() => {
        // Fetch Faculty details
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

        // Parse student session
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser && storedUser.role === 'student') {
            setStudent(storedUser);
        }

        // Fetch queue status
        fetchQueueStatus();
    }, [id]);

    // Fetch recommended slots when booking day changes
    useEffect(() => {
        if (bookingDay) {
            fetch(`${API_URL}/api/faculty/${id}/recommend-slots?day=${bookingDay}`)
                .then(res => res.json())
                .then(data => setRecommendedSlots(data))
                .catch(err => console.error(err));
        }
    }, [bookingDay, id]);

    const fetchQueueStatus = () => {
        fetch(`${API_URL}/api/faculty/${id}/queue`)
            .then(res => res.json())
            .then(data => setQueueInfo(data))
            .catch(err => console.error(err));
    };

    // Helper to highlight searched terms
    const highlightText = (text, highlight) => {
        if (!text || !highlight) return text;
        const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
        return parts.map((part, index) => 
            part.toLowerCase() === highlight.toLowerCase() 
                ? <span key={index} className="bg-yellow-300 text-yellow-950 font-bold px-1 rounded shadow-sm">{part}</span> 
                : part
        );
    };

    // Walk-in Virtual Check-in
    const handleQueueCheckin = async (e) => {
        e.preventDefault();
        if (!student) return;

        try {
            const res = await fetch(`${API_URL}/api/queue/checkin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    faculty_id: id,
                    student_id: student.id,
                    urgency
                })
            });
            const data = await res.json();
            if (res.ok) {
                setCheckedIn({ position: data.position, waitTime: data.estimatedWaitTime });
                fetchQueueStatus();
            } else {
                alert(data.error || 'Failed to check in');
            }
        } catch (err) {
            console.error(err);
            alert('Queue check-in failed');
        }
    };

    // Request Appointment Booking
    const handleBookAppointment = async (e) => {
        e.preventDefault();
        if (!student) return;
        setBookingSuccess(null);
        setBookingError(null);

        try {
            const res = await fetch(`${API_URL}/api/faculty/${id}/appointments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: student.id,
                    reason,
                    day_of_week: bookingDay,
                    start_time: startTime,
                    end_time: endTime
                })
            });
            const data = await res.json();
            if (res.ok) {
                setBookingSuccess('Meeting requested! Wait for faculty review in your dashboard.');
                setReason('');
            } else {
                setBookingError(data.error || 'Request failed');
            }
        } catch (err) {
            console.error(err);
            setBookingError('Appointment request failed.');
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-500 text-lg animate-pulse">Loading profile...</div>;
    if (!faculty || faculty.error) return <div className="p-10 text-center text-red-500 text-lg">Faculty not found.</div>;

    const isAvailable = faculty.status === 'Likely Available';
    const statusColor = !isAvailable ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-green-100 text-green-800 border-green-200';
    const statusIcon = !isAvailable ? '⏳' : '✅';

    return (
        <div className="min-h-screen pt-24 px-6 pb-12 bg-[#7c2ae8]">
            <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up">

                {/* Navigation */}
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white/95">Faculty Profile</h2>
                    <Link to="/" className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition border border-white/10 text-sm font-medium">
                        ← Back to Home
                    </Link>
                </div>

                {/* Header Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Profile Image fallback */}
                        <div className="w-24 h-24 bg-indigo-100 rounded-full flex-shrink-0 overflow-hidden relative border-4 border-white shadow-sm flex items-center justify-center">
                            <span className="text-3xl font-bold text-indigo-800">
                                {faculty.name ? faculty.name.replace(/^(Dr\.|Ms\.|Mrs\.|Mr\.)\s+/i, '')[0] : '?'}
                            </span>
                        </div>

                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{faculty.name}</h1>
                            <p className="text-xl text-blue-600 font-semibold">{faculty.department}</p>
                            <div className="mt-3 flex flex-wrap gap-2 text-sm">
                                <span className="flex items-center text-gray-500 bg-gray-100 px-3 py-1 rounded-full"><span className="mr-1">📍</span> Room {faculty.room_number}, {faculty.floor_number}</span>
                                {faculty.specialization && <span className="flex items-center text-blue-800 bg-blue-50 px-3 py-1 rounded-full font-semibold">💡 {faculty.specialization}</span>}
                                {faculty.aliases && faculty.aliases.length > 0 && (
                                    <span className="flex items-center text-indigo-800 bg-indigo-50 px-3 py-1 rounded-full font-semibold">
                                        👤 Shortform: {faculty.aliases.join(', ')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={`mt-6 md:mt-0 px-6 py-3 rounded-full border ${statusColor} flex items-center shadow-sm whitespace-nowrap`}>
                        <span className="mr-2 text-xl">{statusIcon}</span>
                        <div>
                            <div className="text-xs uppercase font-bold tracking-wider opacity-70">Current Status</div>
                            <div className="font-bold text-lg">{faculty.status}</div>
                        </div>
                    </div>
                </div>

                {/* Biography & Research Section */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 space-y-4">
                    <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Biography & Research Interests</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Biography</h4>
                            <p className="text-gray-700 leading-relaxed text-sm">
                                {highlightText(faculty.bio || 'No bio listed for this faculty member.', highlightQuery)}
                            </p>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Research Interests</h4>
                            <p className="text-gray-700 leading-relaxed text-sm font-medium">
                                {highlightText(faculty.research_interests || 'No research interests listed.', highlightQuery)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Availability & Best Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">Best Visiting Time</h3>
                        <div className="flex items-center text-blue-700">
                            <span className="text-3xl mr-3">🕒</span>
                            <span className="text-2xl font-bold">{faculty.bestVisitingTime}</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-2">Calculated dynamically based on today's classes.</p>
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

                {/* Weekly Timetable */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-8 py-5 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-800">Weekly Lecture Schedule</h2>
                    </div>
                    <div className="overflow-x-auto font-medium">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-8 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Day</th>
                                    <th className="px-8 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Time</th>
                                    <th className="px-8 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Course / Activity</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {faculty.timetables && faculty.timetables.length > 0 ? faculty.timetables.map((t) => (
                                    <tr key={t.id} className="hover:bg-indigo-50/20 transition">
                                        <td className="px-8 py-3 whitespace-nowrap text-sm text-gray-800">{t.day_of_week}</td>
                                        <td className="px-8 py-3 whitespace-nowrap text-sm text-gray-600 font-mono">
                                            {t.start_time.slice(0, 5)} - {t.end_time.slice(0, 5)}
                                        </td>
                                        <td className="px-8 py-3 whitespace-nowrap text-sm text-gray-700">{t.course_name}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="3" className="px-8 py-6 text-center text-gray-400 italic">No schedule data.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Bottom Algorithmic Panels: Walk-in Queue & Booking System */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Walk-in Queue Panel */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center justify-between">
                                <span>🚶 Walk-in Queue Manager</span>
                                <span className={`text-xs px-2.5 py-1 rounded-full border font-bold uppercase ${queueInfo.crowdLevel === 'High' ? 'bg-red-100 text-red-800 border-red-200' : queueInfo.crowdLevel === 'Moderate' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-green-100 text-green-800 border-green-200'}`}>
                                    {queueInfo.crowdLevel} Crowd
                                </span>
                            </h3>
                            <p className="text-sm text-gray-400 mb-4">Are you on campus? Check in virtually to avoid waiting outside the door.</p>

                            <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 mb-6 flex items-center justify-between text-indigo-950">
                                <div>
                                    <div className="text-xs text-indigo-800 font-semibold uppercase tracking-wider">Queue Length</div>
                                    <div className="text-2xl font-bold">{queueInfo.queue ? queueInfo.queue.length : 0} student(s) waiting</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-indigo-800 font-semibold uppercase tracking-wider">Est. Wait Time</div>
                                    <div className="text-2xl font-bold">{queueInfo.totalWaitTime} mins</div>
                                </div>
                            </div>
                        </div>

                        {student ? (
                            checkedIn ? (
                                <div className="p-4 bg-green-50 rounded-xl border border-green-200 text-green-900 text-center">
                                    <div className="text-lg font-bold">✓ Checked In Successfully!</div>
                                    <div className="text-sm mt-1">
                                        Your queue index: <strong>#{checkedIn.position}</strong> • Estimated wait: <strong>{checkedIn.waitTime} minutes</strong>
                                    </div>
                                    <p className="text-xs text-green-700/80 mt-2">Make sure to reach Room {faculty.room_number} on time!</p>
                                </div>
                            ) : (
                                <form onSubmit={handleQueueCheckin} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Urgency Level</label>
                                        <select 
                                            value={urgency} 
                                            onChange={e => setUrgency(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-700 font-medium focus:outline-none"
                                        >
                                            <option value="High">High (Exam Query, Thesis, urgent sign-off - 20 mins)</option>
                                            <option value="Medium">Medium (Assignment Doubts, Course Questions - 15 mins)</option>
                                            <option value="Low">Low (General Advice, Casual Meeting - 10 mins)</option>
                                        </select>
                                    </div>
                                    <button 
                                        type="submit"
                                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow transition"
                                    >
                                        Virtual Check-in
                                    </button>
                                </form>
                            )
                        ) : (
                            <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-center text-sm text-gray-400 italic">
                                Please <Link to="/login" className="text-blue-600 font-bold hover:underline">Log In</Link> as a student to check in virtually.
                            </div>
                        )}
                    </div>

                    {/* Booking Panel */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">📅 Request Appointment</h3>
                        <p className="text-sm text-gray-400 mb-4">Request a dynamic meeting slot. Booking hours: <strong>9am to 4:30pm (Weekdays only)</strong>.</p>

                        {student ? (
                            <form onSubmit={handleBookAppointment} className="space-y-4">
                                {bookingSuccess && <div className="p-3 bg-green-100 text-green-800 text-xs font-semibold rounded border border-green-200">{bookingSuccess}</div>}
                                {bookingError && <div className="p-3 bg-red-100 text-red-800 text-xs font-semibold rounded border border-red-200">{bookingError}</div>}

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Student Name</label>
                                        <input type="text" className="w-full bg-gray-100 border border-gray-200 rounded-lg p-2 text-sm text-gray-500 cursor-not-allowed focus:outline-none" value={student.name} readOnly />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Student Email</label>
                                        <input type="text" className="w-full bg-gray-100 border border-gray-200 rounded-lg p-2 text-sm text-gray-500 cursor-not-allowed focus:outline-none" value={student.email} readOnly />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Day of Visit</label>
                                    <select 
                                        value={bookingDay} 
                                        onChange={e => setBookingDay(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm text-gray-700 font-medium focus:outline-none"
                                    >
                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>

                                {/* Suggestions Carousel/Helper */}
                                {recommendedSlots.length > 0 && (
                                    <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                                        <div className="text-[11px] font-bold text-blue-800 uppercase mb-1">Suggested Continuous-Free Slots (Keeps prof block free)</div>
                                        <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto pr-1">
                                            {recommendedSlots.map((slot, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => {
                                                        setStartTime(slot.start_time);
                                                        setEndTime(slot.end_time);
                                                    }}
                                                    className="px-2.5 py-1 text-xs bg-white text-blue-900 border border-blue-200 rounded-md hover:bg-blue-100 transition font-medium focus:outline-none whitespace-nowrap"
                                                >
                                                    {slot.start_time} - {slot.end_time}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Time</label>
                                        <input type="time" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:outline-none text-gray-700" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">End Time</label>
                                        <input type="time" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:outline-none text-gray-700" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reason for Visit</label>
                                    <textarea 
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm text-gray-700 focus:outline-none focus:bg-white resize-none"
                                        placeholder="Discuss assignment doubts / sign thesis form..." 
                                        rows="2"
                                        value={reason}
                                        onChange={e => setReason(e.target.value)}
                                        required
                                    />
                                </div>

                                <button 
                                    type="submit"
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow transition"
                                >
                                    Book Meeting
                                </button>
                            </form>
                        ) : (
                            <div className="p-8 bg-gray-50 border border-gray-100 rounded-xl text-center text-sm text-gray-400 italic">
                                Please <Link to="/login" className="text-blue-600 font-bold hover:underline">Log In</Link> as a student to schedule appointments.
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default FacultyProfile;
