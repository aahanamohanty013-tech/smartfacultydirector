import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../config';

const Signup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        shortform: '',
        password: '',
        specialization: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) {
                alert('Signup Successful!');
                navigate('/login');
            } else {
                alert(data.error);
            }
        } catch (err) {
            console.error(err);
            alert('Signup failed');
        }
    };

    return (
        <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 shadow-2xl w-full max-w-md animate-fade-in-up">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
                    <p className="text-white/60">Join the faculty directory</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                        <label className="block text-sm text-white/80 mb-1">Full Name</label>
                        <input name="name" type="text" onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:bg-white/10" placeholder="Dr. John Doe" required />
                    </div>
                    <div>
                        <label className="block text-sm text-white/80 mb-1">Shortform (Alias)</label>
                        <input name="shortform" type="text" onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:bg-white/10" placeholder="JND" required />
                    </div>
                    <div>
                        <label className="block text-sm text-white/80 mb-1">Specialization</label>
                        <input name="specialization" type="text" onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:bg-white/10" placeholder="e.g. AI, IoT" />
                    </div>
                    <div>
                        <label className="block text-sm text-white/80 mb-1">Password</label>
                        <input name="password" type="password" onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:bg-white/10" placeholder="••••••••" required />
                    </div>

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
