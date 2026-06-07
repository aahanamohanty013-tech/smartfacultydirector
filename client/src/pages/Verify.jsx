import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { API_URL } from '../config';

const Verify = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Parse params or state
    const state = location.state || {};
    const queryParams = new URLSearchParams(location.search);
    
    const email = state.email || queryParams.get('email') || '';
    const role = state.role || queryParams.get('role') || 'student';
    const initialMockCode = state.mockCode || queryParams.get('mockCode') || '';

    const [code, setCode] = useState('');
    const [mockCode, setMockCode] = useState(initialMockCode);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleVerify = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch(`${API_URL}/api/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, role, code })
            });
            const data = await res.json();

            if (res.ok) {
                setSuccess('Email verified successfully! You will be redirected to log in.');
                setTimeout(() => {
                    navigate('/login');
                }, 2500);
            } else {
                setError(data.error || 'Verification failed');
            }
        } catch (err) {
            console.error(err);
            setError('Verification request failed.');
        }
    };

    return (
        <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 shadow-2xl w-full max-w-md animate-fade-in-up">
                
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-white mb-1">Verify Email</h2>
                    <p className="text-white/60">An email verification code has been sent to {email}</p>
                </div>

                {mockCode && (
                    <div className="mb-6 p-4 bg-blue-500/20 border border-blue-400/30 rounded-xl text-left text-sm text-blue-200">
                        <div className="font-bold text-xs uppercase tracking-wider mb-1">📬 Mock Email Service (Sandbox)</div>
                        <div className="font-medium text-xs">
                            Since this is a simulated sandbox environment, the verification code sent to your email is:
                        </div>
                        <div className="mt-2 text-2xl font-mono font-extrabold tracking-widest text-center text-white bg-blue-500/40 py-2 rounded-lg border border-blue-300/20">
                            {mockCode}
                        </div>
                    </div>
                )}

                <form onSubmit={handleVerify} className="space-y-4">
                    {error && <div className="p-3 bg-red-500/20 border border-red-500/30 text-red-200 text-xs font-semibold rounded-lg">{error}</div>}
                    {success && <div className="p-3 bg-green-500/20 border border-green-500/30 text-green-200 text-xs font-semibold rounded-lg">{success}</div>}

                    <div>
                        <label className="block text-sm text-white/80 mb-2">Enter 6-Digit Code</label>
                        <input
                            type="text"
                            maxLength="6"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 text-center text-2xl font-mono tracking-widest focus:outline-none focus:bg-white/10 transition"
                            placeholder="000000"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg transition transform hover:scale-[1.02]"
                    >
                        Verify & Continue
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-white/60">
                    Need help? <Link to="/signup" className="text-white font-medium hover:underline">Sign up again</Link>
                </div>

                <div className="mt-4 text-center">
                    <Link to="/" className="text-white/40 hover:text-white text-xs transition">← Back to Home</Link>
                </div>
            </div>
        </div>
    );
};

export default Verify;
