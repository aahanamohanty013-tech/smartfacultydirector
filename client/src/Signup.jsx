import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from './config';

const Signup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        shortform: '',
        password: '',
        specialization: ''
    });
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
            const response = await fetch(`${API_URL}/api/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Signup failed');
            }

            alert('Account created! Please log in.');
            navigate('/login');

        } catch (err) {
            console.error('Signup Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#7c2ae8] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 animate-fade-in-up">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Faculty Sign Up</h1>
                    <p className="text-gray-500 mt-2">Join the directory</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium border border-red-100 flex items-center">
                        <span className="mr-2">⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            required
                            placeholder="e.g. Dr. Aahan Mohanty"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Faculty Alias (Shortform)</label>
                        <input
                            type="text"
                            name="shortform"
                            required
                            placeholder="e.g. AM"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                            value={formData.shortform}
                            onChange={handleChange}
                        />
                        <p className="text-xs text-gray-400 mt-1">Used for timetables (must be unique)</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                        <input
                            type="text"
                            name="specialization"
                            placeholder="e.g. AI, Machine Learning"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                            value={formData.specialization}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            name="password"
                            required
                            placeholder="••••••••"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-lg shadow-md hover:shadow-lg transform active:scale-95 transition-all text-sm uppercase tracking-wide
                            ${loading ? 'opacity-70 cursor-wait' : 'hover:from-purple-700 hover:to-indigo-700'}
                        `}
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    Already have an account?{' '}
                    <Link to="/login" className="text-purple-600 font-bold hover:underline">
                        Log In
                    </Link>
                </div>

                <div className="mt-4 text-center">
                    <Link to="/" className="text-gray-400 hover:text-gray-600 text-xs font-medium transition">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;