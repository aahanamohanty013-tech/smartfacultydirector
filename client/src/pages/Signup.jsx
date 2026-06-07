import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../config';

const Signup = () => {
    const navigate = useNavigate();
    const [role, setRole] = useState('student'); // 'student' or 'faculty'

    // Faculty Form State
    const [facultyData, setFacultyData] = useState({
        name: '',
        email: '',
        shortform: '',
        password: '',
        specialization: ''
    });

    // Student Form State
    const [studentData, setStudentData] = useState({
        name: '',
        email: '',
        password: ''
    });

    const handleFacultyChange = (e) => {
        setFacultyData({ ...facultyData, [e.target.name]: e.target.value });
    };

    const handleStudentChange = (e) => {
        setStudentData({ ...studentData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        try {
            const endpoint = role === 'faculty' ? `${API_URL}/api/signup` : `${API_URL}/api/student/signup`;
            const payload = role === 'faculty' ? facultyData : studentData;

            // Simple frontend checks
            if (role === 'student' && !studentData.email.endsWith('@rvce.edu.in')) {
                alert('Only @rvce.edu.in emails are allowed.');
                return;
            }
            if (role === 'faculty' && !facultyData.email.endsWith('@rvce.edu.in')) {
                alert('Only @rvce.edu.in emails are allowed.');
                return;
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                alert('Registration Successful! Please Log In.');
                navigate('/login');
            } else {
                alert(data.error || 'Registration failed');
            }
        } catch (err) {
            console.error(err);
            alert('Signup failed');
        }
    };

    return (
        <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 shadow-2xl w-full max-w-md animate-fade-in-up">
                
                {/* Role Tabs */}
                <div className="flex border border-white/10 rounded-xl overflow-hidden mb-6">
                    <button 
                        type="button"
                        onClick={() => setRole('student')}
                        className={`flex-1 py-2 text-sm font-semibold transition ${role === 'student' ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                    >
                        Student
                    </button>
                    <button 
                        type="button"
                        onClick={() => setRole('faculty')}
                        className={`flex-1 py-2 text-sm font-semibold transition ${role === 'faculty' ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                    >
                        Faculty
                    </button>
                </div>

                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-white mb-1">Create Account</h2>
                    <p className="text-white/60">Join the campus directory network</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                    {role === 'student' ? (
                        <>
                            <div>
                                <label className="block text-sm text-white/80 mb-1">Full Name</label>
                                <input name="name" type="text" onChange={handleStudentChange} value={studentData.name} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:bg-white/10" placeholder="Aahan" required />
                            </div>
                            <div>
                                <label className="block text-sm text-white/80 mb-1">RVCE Email</label>
                                <input name="email" type="email" onChange={handleStudentChange} value={studentData.email} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:bg-white/10" placeholder="aahan.cs24@rvce.edu.in" required />
                            </div>
                            <div>
                                <label className="block text-sm text-white/80 mb-1">Password</label>
                                <input name="password" type="password" onChange={handleStudentChange} value={studentData.password} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:bg-white/10" placeholder="••••••••" required />
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm text-white/80 mb-1">Full Name</label>
                                <input name="name" type="text" onChange={handleFacultyChange} value={facultyData.name} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:bg-white/10" placeholder="Dr. John Doe" required />
                            </div>
                            <div>
                                <label className="block text-sm text-white/80 mb-1">RVCE Email</label>
                                <input name="email" type="email" onChange={handleFacultyChange} value={facultyData.email} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:bg-white/10" placeholder="drjohndoe@rvce.edu.in" required />
                            </div>
                            <div>
                                <label className="block text-sm text-white/80 mb-1">Shortform (Alias)</label>
                                <input name="shortform" type="text" onChange={handleFacultyChange} value={facultyData.shortform} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:bg-white/10" placeholder="JND" required />
                            </div>
                            <div>
                                <label className="block text-sm text-white/80 mb-1">Specialization</label>
                                <input name="specialization" type="text" onChange={handleFacultyChange} value={facultyData.specialization} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:bg-white/10" placeholder="e.g. AI, IoT" />
                            </div>
                            <div>
                                <label className="block text-sm text-white/80 mb-1">Password</label>
                                <input name="password" type="password" onChange={handleFacultyChange} value={facultyData.password} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:bg-white/10" placeholder="••••••••" required />
                            </div>
                        </>
                    )}

                    <button type="submit" className="w-full py-3 mt-4 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold rounded-xl shadow-lg transition transform hover:scale-[1.02]">
                        Sign Up
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-white/60">
                    Already have an account? <Link to="/login" className="text-white font-medium hover:underline">Log In</Link>
                </div>
                <div className="mt-4 text-center">
                    <Link to="/" className="text-white/40 hover:text-white text-xs transition">← Back to Home</Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;
