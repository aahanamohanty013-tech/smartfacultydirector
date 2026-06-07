/* client/src/FacultyList.jsx - COMPLETE FILE */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';

const FacultyList = () => {
    const [faculties, setFaculties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDept, setSelectedDept] = useState('All');

    useEffect(() => {
        fetch(`${API_URL}/api/faculties`)
            .then(res => res.json())
            .then(data => {
                setFaculties(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching faculty:", err);
                setError("Failed to load faculty.");
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="min-h-screen bg-[#7c2ae8] flex items-center justify-center text-white font-sans">Loading...</div>;
    if (error) return <div className="min-h-screen bg-[#7c2ae8] flex items-center justify-center text-white font-sans">{error}</div>;

    // Get unique department names for dropdown
    const departments = ['All', ...new Set(faculties.map(f => f.department).filter(Boolean))];

    // Group faculties by department
    const groupedFaculties = faculties.reduce((acc, faculty) => {
        const dept = faculty.department || 'Other';
        if (selectedDept !== 'All' && dept !== selectedDept) return acc;
        if (!acc[dept]) acc[dept] = [];
        acc[dept].push(faculty);
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-[#7c2ae8] p-8 pt-24 font-sans text-white">
            <Link to="/" className="fixed top-6 left-6 text-white/70 hover:text-white transition z-10">
                ← Back to Home
            </Link>

            <div className="max-w-7xl mx-auto flex flex-col items-center">
                
                {/* Department Filter Dropdown */}
                <div className="mb-12 w-full max-w-2xl text-left bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-white">Filter Directory</h3>
                        <p className="text-xs text-white/60 mt-0.5">Select a department to view its faculty members</p>
                    </div>
                    <select
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                        className="bg-white/15 border border-white/20 rounded-xl px-4 py-2.5 text-white font-semibold focus:outline-none focus:bg-white/30 transition text-sm cursor-pointer min-w-[220px]"
                    >
                        {departments.map((d) => (
                            <option key={d} value={d} className="text-black font-medium">
                                {d === 'All' ? 'All Departments' : d}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="w-full space-y-12 animate-fade-in-up">
                    {Object.entries(groupedFaculties).map(([department, deptFaculties]) => (
                        <div key={department} className="space-y-6">
                            <h2 className="text-3xl font-extrabold text-white border-b border-white/20 pb-2 text-left tracking-wide">
                                🏢 {department}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 w-full">
                                {deptFaculties.map((faculty) => (
                                    <Link to={`/faculty/${faculty.id}`} key={faculty.id} className="bg-white/20 backdrop-blur-md rounded-[2.5rem] p-8 hover:bg-white/30 transition cursor-pointer flex flex-col items-center text-center border border-white/10 shadow-lg min-h-[340px] justify-center relative group w-full max-w-sm mx-auto">

                                        {/* Avatar / Image Logic */}
                                        <div className="w-28 h-28 bg-[#e5e7eb] rounded-full mb-6 flex items-center justify-center shadow-inner mx-auto overflow-hidden relative">
                                            <img
                                                src={`/assets/${faculty.name}.jpg`}
                                                alt={faculty.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                            <span className="text-gray-600 font-bold text-4xl absolute w-full h-full flex items-center justify-center bg-[#e5e7eb]" style={{ display: 'none' }}>
                                                {faculty.name.charAt(0)}
                                            </span>
                                        </div>

                                        <h2 className="text-2xl font-bold mb-2 leading-tight">{faculty.name}</h2>
                                        <p className="text-white/90 text-sm mb-5 font-medium">{faculty.department}</p>

                                        {faculty.aliases && faculty.aliases.length > 0 && (
                                            <span className="bg-[#6366f1] text-white px-8 py-1.5 rounded-lg text-sm font-semibold shadow-sm tracking-wide">
                                                {faculty.aliases[0]}
                                            </span>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
export default FacultyList;
