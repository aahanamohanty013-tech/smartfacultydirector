/* client/src/FacultyProfile.jsx */
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_URL } from './config';

const FacultyProfile = () => {
    const { id } = useParams();
    const [faculty, setFaculty] = useState(null);
    const [loading, setLoading] = useState(true);

    // Meeting Request State
    const [meetingForm, setMeetingForm] = useState({
        student_name: '',
        title: '',
        day_of_week: 'Monday',
        start_time: '09:00',
        end_time: '09:30'
    });
    const [requestStatus, setRequestStatus] = useState(null);
    const [meetingRequestsList, setMeetingRequestsList] = useState([]);

    const fetchMeetingRequests = () => {
        fetch(`${API_URL}/api/faculty/${id}/meeting-requests`)
            .then(res => res.json())
            .then(data => {
                setMeetingRequestsList(data);
            })
            .catch(err => console.error(err));
    };

    const submitMeetingRequest = async (e) => {
        e.preventDefault();
        setRequestStatus({ loading: true, message: null, error: null });
        try {
            const res = await fetch(`${API_URL}/api/meeting-requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...meetingForm, faculty_id: id })
            });
            if (res.ok) {
                setRequestStatus({ loading: false, message: 'Request submitted! The faculty will auto-schedule it.', error: null });
                setMeetingForm({ ...meetingForm, title: '', start_time: '', end_time: '' }); // Reset some fields
                fetchMeetingRequests();
            } else {
                setRequestStatus({ loading: false, message: null, error: 'Failed to submit.' });
            }
        } catch (err) {
            setRequestStatus({ loading: false, message: null, error: 'Network error.' });
        }
    };

    const handleDeleteRequest = async (requestId) => {
        if (!window.confirm("Are you sure you want to delete this request?")) return;
        try {
            const res = await fetch(`${API_URL}/api/meeting-requests/${requestId}`, { method: 'DELETE' });
            if (res.ok) {
                fetchMeetingRequests();
            } else {
                alert("Failed to delete request");
            }
        } catch (err) {
            alert("Network error");
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
            
        fetchMeetingRequests();
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

                            {faculty.research_papers && (
                                <div className="mt-6 pt-6 border-t border-gray-100 w-full max-w-2xl">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center">
                                        <span className="mr-2 text-lg">📄</span> Research Papers & Bio
                                    </h3>
                                    <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                                        {faculty.research_papers}
                                    </p>
                                </div>
                            )}
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

                {/* Request Meeting */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl shadow-sm border border-purple-100 overflow-hidden p-6 md:p-8">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                            <span className="text-2xl mr-2">📅</span> Request a Meeting
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Submit a request. The professor uses an <span className="font-semibold text-purple-700">Auto-Scheduler (Greedy Algorithm)</span> to perfectly organize all student requests!
                        </p>
                    </div>

                    <form onSubmit={submitMeetingRequest} className="bg-white p-6 rounded-xl shadow-inner border border-purple-50 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Your Name</label>
                                <input type="text" required className="w-full bg-white text-gray-900 border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 p-2 border" value={meetingForm.student_name} onChange={e => setMeetingForm({...meetingForm, student_name: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reason / Title</label>
                                <input type="text" required className="w-full bg-white text-gray-900 border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 p-2 border" value={meetingForm.title} onChange={e => setMeetingForm({...meetingForm, title: e.target.value})} placeholder="e.g. Project Review" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Day</label>
                                <select className="w-full bg-white text-gray-900 border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 p-2 border" value={meetingForm.day_of_week} onChange={e => setMeetingForm({...meetingForm, day_of_week: e.target.value})}>
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => <option key={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Time</label>
                                <input type="time" required className="w-full bg-white text-gray-900 border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 p-2 border" value={meetingForm.start_time} onChange={e => setMeetingForm({...meetingForm, start_time: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">End Time</label>
                                <input type="time" required className="w-full bg-white text-gray-900 border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 p-2 border" value={meetingForm.end_time} onChange={e => setMeetingForm({...meetingForm, end_time: e.target.value})} />
                            </div>
                        </div>
                        <button type="submit" disabled={requestStatus?.loading} className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg shadow-md transition">
                            {requestStatus?.loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                        
                        {requestStatus?.message && <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm font-bold text-center border border-green-200 mt-2">{requestStatus.message}</div>}
                        {requestStatus?.error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm font-bold text-center border border-red-200 mt-2">{requestStatus.error}</div>}
                    </form>
                </div>

                {/* Meeting Requests Status */}
                {meetingRequestsList.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-6 md:p-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                            <span className="mr-2">📋</span> Meeting Requests Status
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {meetingRequestsList.map(req => (
                                <div key={req.id} className={`p-4 rounded-xl border ${req.status === 'Approved' ? 'bg-green-50 border-green-200' : req.status === 'Rejected' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center">
                                            <div className="font-bold text-gray-900">{req.student_name}</div>
                                            <button onClick={() => handleDeleteRequest(req.id)} className="ml-2 text-red-500 opacity-50 hover:opacity-100 transition" title="Delete Request">
                                                ❌
                                            </button>
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${req.status === 'Approved' ? 'bg-green-100 text-green-700' : req.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'}`}>
                                            {req.status}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-700 mb-2">{req.title}</div>
                                    <div className="text-xs text-gray-500 font-mono">
                                        {req.day_of_week} • {req.start_time.slice(0,5)} - {req.end_time.slice(0,5)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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


