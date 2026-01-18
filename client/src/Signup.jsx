import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from './config';

const Signup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        shortform: '',
        specialization: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
            if (!response.ok) throw new Error(data.error || 'Signup failed');

            alert('Account created! Please log in.');
            navigate('/login');
        } catch (err) {
            console.error('Signup Error:', err);
            if (err.message.includes('Unexpected token')) {
                setError('Server connection failed. Make sure the backend is running on port 5001.');
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-gray-900 placeholder-gray-400 bg-white";

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
                        <input type="text" name="name" required placeholder="e.g. Dr. Aahan Mohanty" className={inputClass} value={formData.name} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Faculty Alias (Shortform)</label>
                        <input type="text" name="shortform" required placeholder="e.g. AM" className={inputClass} value={formData.shortform} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                        <input type="text" name="specialization" placeholder="e.g. AI, Machine Learning" className={inputClass} value={formData.specialization} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input type="password" name="password" required placeholder="••••••••" className={inputClass} value={formData.password} onChange={handleChange} />
                    </div>
                    <button type="submit" disabled={loading} className={`w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-lg shadow-md hover:shadow-lg transform active:scale-95 transition-all text-sm uppercase tracking-wide ${loading ? 'opacity-70 cursor-wait' : 'hover:from-purple-700 hover:to-indigo-700'}`}>
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>
                <div className="mt-6 text-center text-sm text-gray-500">
                    Already have an account? <Link to="/login" className="text-purple-600 font-bold hover:underline">Log In</Link>
                </div>
                <div className="mt-4 text-center">
                    <Link to="/" className="text-gray-400 hover:text-gray-600 text-xs font-medium transition">← Back to Home</Link>
                </div>
            </div>
        </div>
    );
};
export default Signup;