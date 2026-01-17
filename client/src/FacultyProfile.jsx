import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_URL } from './config';

const FacultyProfile = () => {
    const { id } = useParams();
    const [faculty, setFaculty] = useState(null);
    const [loading, setLoading] = useState(true);

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

    const isAvailable = faculty.status === 'Likely Available';
    const statusColor = !isAvailable ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-green-100 text-green-800 border-green-200';
    const statusIcon = !isAvailable ? '⏳' : '✅';

    return (
        <div className="min-h-screen pt-24 px-6 pb-12">
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">

                {/* Navigation */}
                <div className="flex justify-end">
                    <button
                        onClick={() => window.location.href = '/'}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition border border-white/10 text-sm font-medium"
                    >
                        ← Back to Home
                    </button>
                </div>

                {/* Header Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">{faculty.name}</h1>
                        <p className="text-xl text-blue-600 font-medium">{faculty.department}</p>
                        <div className="mt-4 flex flex-col space-y-1 text-sm text-gray-500">
                            <span className="flex items-center"><span className="mr-1">📍</span> {faculty.room_number}, {faculty.floor_number}</span>
                            {faculty.specialization && <span className="flex items-center text-blue-800 bg-blue-50 px-2 py-1 rounded w-fit"><span className="mr-2">💡</span> {faculty.specialization}</span>}
                        </div>
                    </div>
                    <div className={`mt-4 md:mt-0 px-6 py-3 rounded-full border ${statusColor} flex items-center shadow-sm`}>
                        <span className="mr-2 text-xl">{statusIcon}</span>
                        <div>
                            <div className="text-xs uppercase font-bold tracking-wider opacity-70">Current Status</div>
                            <div className="font-bold text-lg">{faculty.status}</div>
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

                {/* Weekly Timetable */}
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
                                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Course / Activity</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {faculty.timetables.length > 0 ? faculty.timetables.map((t) => (
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
