import React from 'react';
import { Link } from 'react-router-dom';

const programs = [
    "B.E. in Aerospace Engineering",
    "B.E. in Biotechnology",
    "B.E. in Chemical Engineering",
    "B.E. in Civil Engineering",
    "B.E. in Computer Science and Engineering",
    "B.E. in Computer Science And Engineering(Artificial Intelligence And Machine Learning)",
    "B.E. in Computer Science and Engineering ( Cyber Security)",
    "B.E. in Computer Science and Engineering ( Data Science)",
    "B.E. in Electrical and Electronics Engineering",
    "B.E. in Electronics and Communication Engineering",
    "B.E. in Electronics and Instrumentation Engineering",
    "B.E. in Industrial Engineering and Management",
    "B.E. in Information Science and Engineering",
    "B.E. in Mechanical Engineering",
    "B.E. in Electronics and Telecommunication Engineering"
];

const Programs = () => {
    return (
        <div className="min-h-screen bg-[#7c2ae8] text-white p-8 pt-24 font-sans">
            <Link to="/" className="fixed top-6 left-6 text-white/70 hover:text-white transition z-10">
                ← Back to Home
            </Link>

            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-12 text-center">Programs</h1>

                <div className="flex flex-col gap-4">
                    {programs.map((prog, idx) => (
                        <div key={idx} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-6 flex justify-between items-center group cursor-pointer hover:bg-white/20 transition shadow-sm">
                            <span className="text-lg font-medium group-hover:translate-x-2 transition-transform duration-300">
                                {prog}
                            </span>
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/30 transition">
                                <span className="text-sm">↗</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Programs;

