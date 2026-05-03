import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from './config';

const Login = () => {
    const navigate = useNavigate();
    const [role, setRole] = useState('faculty'); // 'faculty' or 'student'
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, role })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Login failed');

            localStorage.setItem('user', JSON.stringify(data)); // Save user
            alert(`Welcome back, ${data.username}!`);
            
            if (data.role === 'student') {
                navigate('/'); // Students go home
            } else {
                navigate('/dashboard'); // Faculty go to dashboard
            }
        } catch (err) {
            console.error('Login Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-gray-900 placeholder-gray-400 bg-white";

    return (
        <div className="min-h-screen bg-[#7c2ae8] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 animate-fade-in-up">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Login</h1>
                    <p className="text-gray-500 mt-2">Welcome back</p>
                </div>

                {/* Role Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                    <button type="button" onClick={() => setRole('student')} className={`flex-1 py-2 rounded-md text-sm font-bold transition ${role === 'student' ? 'bg-white shadow text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}>Student</button>
                    <button type="button" onClick={() => setRole('faculty')} className={`flex-1 py-2 rounded-md text-sm font-bold transition ${role === 'faculty' ? 'bg-white shadow text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}>Faculty</button>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium border border-red-100 flex items-center">
                        <span className="mr-2">⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input type="email" name="email" required placeholder={role === 'student' ? "name@rvce.edu.in" : "name@university.edu"} className={inputClass} value={formData.email} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input type="password" name="password" required placeholder="••••••••" className={inputClass} value={formData.password} onChange={handleChange} />
                    </div>
                    <button type="submit" disabled={loading} className={`w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-lg shadow-md hover:shadow-lg transform active:scale-95 transition-all text-sm uppercase tracking-wide ${loading ? 'opacity-70 cursor-wait' : 'hover:from-purple-700 hover:to-indigo-700'}`}>
                        {loading ? 'Logging In...' : 'Log In'}
                    </button>
                </form>
                <div className="mt-6 text-center text-sm text-gray-500">
                    Don't have an account? <Link to="/signup" className="text-purple-600 font-bold hover:underline">Sign Up</Link>
                </div>
                <div className="mt-4 text-center">
                    <Link to="/" className="text-gray-400 hover:text-gray-600 text-xs font-medium transition">← Back to Home</Link>
                </div>
            </div>
        </div>
    );
};
export default Login;

