import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import SearchBar from './SearchBar';
import FacultyProfile from './FacultyProfile'; // <--- THIS is what fixes the error!
import Admin from './Admin';
import Login from './Login';
import Signup from './Signup';
import Dashboard from './Dashboard';
import CampusMap from './CampusMap';
import Departments from './Departments';
import Programs from './Programs';
import FacultyList from './FacultyList';


function App() {
    return (
        <Router>
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700 font-sans text-white overflow-x-hidden">
                <GlobalNav />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/map" element={<CampusMap />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/faculty/:id" element={<FacultyProfile />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/departments" element={<Departments />} />
                    <Route path="/programs" element={<Programs />} />
                    <Route path="/faculty-list" element={<FacultyList />} />
                </Routes>
            </div>
        </Router>
    );
}

const GlobalNav = () => {
    const location = useLocation();
    const hideNavPaths = ['/departments', '/programs', '/faculty-list'];
    if (hideNavPaths.includes(location.pathname)) return null;
    const isDashboard = location.pathname === '/dashboard';

    return (
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50 pointer-events-none">
            <div className="flex items-center space-x-3 pointer-events-auto">
                <Link to="/" className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition">
                    <span className="text-2xl">🎓</span>
                </Link>
                <div>
                    <h1 className="text-lg font-bold leading-tight">Campus Portal</h1>
                    <p className="text-xs text-white/70">Excellence in Education</p>
                </div>
            </div>
            {!isDashboard && (
                <div className="flex space-x-4 pointer-events-auto">
                    <Link to="/login" className="px-5 py-2 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-md transition border border-white/10 shadow-lg">Log In</Link>
                    <Link to="/signup" className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 rounded-lg shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all">Sign Up</Link>
                </div>
            )}
        </div>
    );
};

/* IN client/src/App.jsx - Replace the 'Home' component */

const Home = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-20 pb-10 text-center relative z-10">
            <div className="animate-fade-in-up">
                {/* Logo Centered */}
                <div className="relative mb-4 group cursor-pointer flex justify-center">
                    <div className="w-48 h-48 rounded-full border-2 border-white/20 relative z-10 overflow-hidden bg-white shadow-2xl flex items-center justify-center">
                        <img src="/assets/hero_logo.png" alt="Institution Logo" className="w-full h-full object-cover scale-[1.35]" />
                    </div>
                </div>

                {/* New Title */}
                <h2 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 drop-shadow-2xl">
                    <span className="bg-clip-text text-transparent bg-gradient-to-t from-white to-indigo-100">Find My</span><br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-b from-blue-300 to-purple-200 text-5xl md:text-7xl">Faculty</span>
                </h2>

                {/* Stats / Pill Badges */}
                <div className="flex flex-wrap justify-center gap-4 text-sm font-medium mb-8">
                    <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center">
                        <span className="mr-2 text-yellow-400">🎗️</span> 100+ Expert Faculty
                    </div>
                    <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center">
                        <span className="mr-2 text-blue-400">📅</span> Office Hours
                    </div>
                    <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center">
                        <span className="mr-2 text-purple-400">✨</span> Top Ranked Institution
                    </div>
                </div>

                <div className="relative z-40 max-w-xl mx-auto mb-16 transform hover:scale-[1.02] transition-transform duration-300">
                    <SearchBar />
                </div>
            </div>

            {/* Grid with PROGRAMS added back */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full animate-fade-in-up delay-200">
                <QuickCard to="/faculty-list" icon="👥" title="Browse Faculty" desc="View all professors" color="bg-blue-500" />
                <QuickCard to="/departments" icon="🏛️" title="Departments" desc="Academic centers" color="bg-purple-500" />
                <QuickCard to="/programs" icon="🎓" title="Programs" desc="Course offerings" color="bg-orange-500" />
                <QuickCard to="/map" icon="🗺️" title="Campus Map" desc="Find classrooms" color="bg-pink-500" />
            </div>
        </div>
    );
};

const QuickCard = ({ to, icon, title, desc, color }) => (
    <Link to={to} className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl p-6 text-left">
        <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${color} rounded-bl-3xl`}><span className="text-4xl">↗</span></div>
        <div className="mb-4 text-4xl group-hover:scale-110 transition-transform duration-300 origin-left">{icon}</div>
        <h3 className="text-xl font-bold mb-1 group-hover:text-amber-300 transition-colors">{title}</h3>
        <p className="text-sm text-white/60">{desc}</p>
    </Link>
);

export default App;