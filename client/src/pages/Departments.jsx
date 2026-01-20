import React from 'react';
import { Link } from 'react-router-dom';

const departments = [
    "Aerospace Engineering",
    "Artificial Intelligence & Machine Learning",
    "Biotechnology",
    "Chemical Engineering",
    "Civil Engineering",
    "Computer Science and Engineering",
    "Electrical and Electronics Engineering",
    "Electronics and Communication Engineering",
    "Electronics and Instrumentation Engineering",
    "Industrial Engineering and Management",
    "Information Science and Engineering",
    "Mechanical Engineering",
    "Electronics and Telecommunication Engineering",
    "Physics",
    "Chemistry",
    "Maths",
    "Physical Education & Sports"
];

const Departments = () => {
    // Split into two columns
    const half = Math.ceil(departments.length / 2);
    const col1 = departments.slice(0, half);
    const col2 = departments.slice(half);

    return (
        <div className="min-h-screen bg-[#7c2ae8] text-white p-8 pt-24 font-sans">
            <Link to="/" className="fixed top-6 left-6 text-white/70 hover:text-white transition z-10">
                ← Back to Home
            </Link>

            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold mb-12 text-center">Departments</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-lg">
                    {/* Column 1 */}
                    <div className="flex flex-col gap-4">
                        {col1.map((dept, idx) => (
                            <div key={idx} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/20 transition cursor-pointer flex items-center shadow-sm group">
                                <span className="w-2 h-2 bg-pink-400 rounded-full mr-4 group-hover:scale-150 transition"></span>
                                {dept}
                            </div>
                        ))}
                    </div>

                    {/* Column 2 */}
                    <div className="flex flex-col gap-4">
                        {col2.map((dept, idx) => (
                            <div key={idx} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/20 transition cursor-pointer flex items-center shadow-sm group">
                                <span className="w-2 h-2 bg-indigo-400 rounded-full mr-4 group-hover:scale-150 transition"></span>
                                {dept}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Departments;

