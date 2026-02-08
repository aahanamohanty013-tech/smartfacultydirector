/* client/src/FacultyList.jsx */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from './config';

const FacultyList = () => {
    const [faculties, setFaculties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDepartment, setSelectedDepartment] = useState('All');

    useEffect(() => {
        fetch(`${API_URL}/api/faculties`)
            .then(res => res.json())
            .then(data => {
                setFaculties(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching faculty:", err);
                setError("Failed to load faculty list.");
                setLoading(false);
            });
    }, []);

    const filteredFaculties = selectedDepartment === 'All'
        ? faculties
        : faculties.filter(f => {
            if (selectedDepartment === 'ECE Dept') {
                return f.department?.trim() === 'Electronics and Communication' || f.department?.includes('Electronics');
            }
            return f.department === selectedDepartment;
        });

    const departments = ['All', 'Computer Science', 'Electronics and Communication', 'Mathematics', 'Physics', 'Chemistry'];

    if (loading) return <div className="min-h-screen bg-[#7c2ae8] flex items-center justify-center text-white font-sans text-xl animate-pulse">Loading Faculty Directory...</div>;
    if (error) return <div className="min-h-screen bg-[#7c2ae8] flex items-center justify-center text-white font-sans">{error}</div>;

    return (
        <div className="min-h-screen bg-[#7c2ae8] pt-24 px-4 pb-12 font-sans text-white">
            <Link to="/" className="fixed top-6 left-6 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition border border-white/10 text-sm font-medium z-50">
                ← Back to Home
            </Link>

            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col items-center mb-10 text-center animate-fade-in-up">
                    <h1 className="text-4xl font-bold mb-2">Faculty Directory</h1>
                    <p className="text-white/70 mb-6">Connect with our esteemed professors</p>

                    <div className="relative">
                        <select
                            value={selectedDepartment}
                            onChange={(e) => setSelectedDepartment(e.target.value)}
                            className="appearance-none bg-white/10 border border-white/20 text-white py-3 px-6 pr-10 rounded-full focus:outline-none focus:border-pink-400 hover:bg-white/20 transition cursor-pointer font-medium"
                        >
                            <option value="All" className="bg-purple-900 text-white">All Departments</option>
                            <option value="Computer Science" className="bg-purple-900 text-white">Computer Science</option>
                            <option value="ECE Dept" className="bg-purple-900 text-white">ECE Dept</option>
                            <option value="Mathematics" className="bg-purple-900 text-white">Mathematics</option>
                            <option value="Physics" className="bg-purple-900 text-white">Physics</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-3xl overflow-hidden border border-white/20 shadow-2xl animate-fade-in-up delay-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/10 text-white/90 uppercase text-xs tracking-wider border-b border-white/10">
                                    <th className="p-6 font-semibold">Profile</th>
                                    <th className="p-6 font-semibold">Name & Alias (Shortform)</th>
                                    <th className="p-6 font-semibold">Department</th>
                                    <th className="p-6 font-semibold">Cabin</th>
                                    <th className="p-6 font-semibold">Specialization</th>
                                    <th className="p-6 font-semibold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {filteredFaculties.map((faculty) => (
                                    <tr key={faculty.id} className="hover:bg-white/5 transition duration-200 group">

                                        {/* Avatar Column */}
                                        <td className="p-6">
                                            <div className="w-16 h-16 rounded-full bg-white/20 flex-shrink-0 overflow-hidden border-2 border-white/30">
                                                <img
                                                    src={`/assets/${faculty.name}.jpg`}
                                                    alt={faculty.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 font-bold text-xl" style={{ display: 'none' }}>
                                                    {faculty.name.charAt(0)}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Name & Alias Column */}
                                        <td className="p-6">
                                            <div className="font-bold text-lg text-white group-hover:text-pink-200 transition">{faculty.name}</div>
                                            {faculty.aliases && faculty.aliases.length > 0 && (
                                                <div className="mt-1 inline-block px-3 py-1 rounded-full bg-indigo-500/40 text-xs font-mono text-indigo-100 border border-indigo-400/30">
                                                    {faculty.aliases[0]}
                                                </div>
                                            )}
                                        </td>

                                        {/* Department Column */}
                                        <td className="p-6 text-white/80 font-medium">
                                            {faculty.department}
                                        </td>

                                        {/* Cabin Column */}
                                        <td className="p-6 text-white/80 font-mono text-sm">
                                            {faculty.room_number || "--"}
                                        </td>

                                        {/* Specialization Column */}
                                        <td className="p-6">
                                            {faculty.specialization ? (
                                                <span className="text-sm px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-100 border border-emerald-500/30">
                                                    {faculty.specialization}
                                                </span>
                                            ) : (
                                                <span className="text-white/40 italic text-sm">--</span>
                                            )}
                                        </td>

                                        {/* View Profile Action */}
                                        <td className="p-6 text-right">
                                            <Link to={`/faculty/${faculty.id}`} className="px-5 py-2 rounded-lg bg-white text-purple-900 font-bold text-sm hover:bg-purple-100 transition shadow-lg transform hover:-translate-y-0.5 inline-block">
                                                View Profile
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FacultyList;


