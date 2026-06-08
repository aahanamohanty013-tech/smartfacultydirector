import React, { useState } from 'react';
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

    const [code, setCode] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [resending, setResending] = useState(false);
    const [resent, setResent] = useState(false);

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
                setSuccess('✅ Email verified successfully! Redirecting to login...');
                setTimeout(() => {
                    navigate('/login?verified=true');
                }, 2000);
            } else {
                setError(data.error || 'Verification failed. Please check your code and try again.');
            }
        } catch (err) {
            console.error(err);
            setError('Verification request failed. Please check your internet connection.');
        }
    };

    return (
        <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 shadow-2xl w-full max-w-md animate-fade-in-up">

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="text-5xl mb-3">📧</div>
                    <h2 className="text-3xl font-bold text-white mb-1">Check Your Email</h2>
                    <p className="text-white/60 text-sm">
                        A verification email has been sent to<br />
                        <span className="text-white font-semibold">{email}</span>
                    </p>
                </div>

                {/* Instruction Banner */}
                <div className="mb-6 p-4 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-sm text-indigo-200">
                    <p className="font-semibold mb-1">Two ways to verify:</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs text-indigo-200/80">
                        <li>Click the <strong>"Verify My Account"</strong> button in the email — it will automatically log you in.</li>
                        <li>Copy the 6-digit code from the email and enter it below.</li>
                    </ol>
                </div>

                {/* Code Entry Form */}
                <form onSubmit={handleVerify} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/20 border border-red-500/30 text-red-200 text-xs font-semibold rounded-lg">
                            ⚠️ {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-3 bg-green-500/20 border border-green-500/30 text-green-200 text-xs font-semibold rounded-lg">
                            {success}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm text-white/80 mb-2">Enter 6-Digit Code from Email</label>
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

                {/* Resend */}
                <div className="mt-4 text-center text-sm text-white/50">
                    Didn't receive an email?{' '}
                    {resent ? (
                        <span className="text-green-400 font-medium">New code sent! ✓</span>
                    ) : (
                        <button
                            type="button"
                            disabled={resending}
                            onClick={async () => {
                                setResending(true);
                                setError(null);
                                try {
                                    const r = await fetch(`${API_URL}/api/resend-verification`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ email, role })
                                    });
                                    const d = await r.json();
                                    if (r.ok) {
                                        setResent(true);
                                    } else {
                                        setError(d.error || 'Could not resend email.');
                                    }
                                } catch {
                                    setError('Network error. Please try again.');
                                }
                                setResending(false);
                            }}
                            className="text-white font-medium hover:underline disabled:opacity-50 bg-transparent border-none cursor-pointer"
                        >
                            {resending ? 'Sending...' : 'Resend verification email'}
                        </button>
                    )}
                </div>

                <div className="mt-4 text-center">
                    <Link to="/" className="text-white/40 hover:text-white text-xs transition">← Back to Home</Link>
                </div>
            </div>
        </div>
    );
};

export default Verify;

