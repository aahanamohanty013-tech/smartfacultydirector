import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../config';

const Login = () => {
    const navigate = useNavigate();
    const [role, setRole] = useState('student'); // 'student' or 'faculty'
    
    // Form inputs
    const [nameOrEmail, setNameOrEmail] = useState(''); // Holds full name for faculty, email for student
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const endpoint = role === 'faculty' ? `${API_URL}/api/login` : `${API_URL}/api/student/login`;
            const payload = role === 'faculty' 
                ? { username: nameOrEmail, password } 
                : { email: nameOrEmail, password };

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                if (role === 'faculty') {
                    localStorage.setItem('user', JSON.stringify({ 
                        username: data.username, 
                        facultyId: data.facultyId, 
                        role: 'faculty' 
                    }));
                    navigate('/dashboard');
                } else {
                    localStorage.setItem('user', JSON.stringify({ 
                        id: data.id,
                        name: data.name, 
                        email: data.email, 
                        role: 'student' 
                    }));
                    navigate('/student-dashboard');
                }
            } else {
                alert(data.error || 'Login failed');
            }
        } catch (err) {
            console.error(err);
            alert('Login failed');
        }
    };

    const inputLabel = role === 'faculty' ? 'Full Name' : 'RVCE Email Address';
    const inputPlaceholder = role === 'faculty' ? 'e.g. Dr. Prashant Kumar' : 'e.g. student.cs24@rvce.edu.in';

    return (
        <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 shadow-2xl w-full max-w-md animate-fade-in-up">
                
                {/* Role Tabs */}
                <div className="flex border border-white/10 rounded-xl overflow-hidden mb-6">
                    <button 
                        type="button"
                        onClick={() => { setRole('student'); setNameOrEmail(''); }}
                        className={`flex-1 py-2 text-sm font-semibold transition ${role === 'student' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                    >
                        Student
                    </button>
                    <button 
                        type="button"
                        onClick={() => { setRole('faculty'); setNameOrEmail(''); }}
                        className={`flex-1 py-2 text-sm font-semibold transition ${role === 'faculty' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                    >
                        Faculty
                    </button>
                </div>

                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-white mb-1">Welcome Back</h2>
                    <p className="text-white/60">Log in to manage your campus connections</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm text-white/80 mb-2">{inputLabel}</label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:bg-white/10 transition"
                            placeholder={inputPlaceholder}
                            value={nameOrEmail}
                            onChange={(e) => setNameOrEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-white/80 mb-2">Password</label>
                        <input
                            type="password"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:bg-white/10 transition"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg transition transform hover:scale-[1.02]"
                    >
                        Log In
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-white/60">
                    Don't have an account? <Link to="/signup" className="text-white font-medium hover:underline">Sign Up</Link>
                </div>

                <div className="mt-4 text-center">
                    <Link to="/" className="text-white/40 hover:text-white text-xs transition">← Back to Home</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
