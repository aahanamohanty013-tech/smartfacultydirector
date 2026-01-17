import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import SearchBar from './components/SearchBar';
import FacultyProfile from './pages/FacultyProfile';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CampusMap from './pages/CampusMap';
import Departments from './pages/Departments';
import Programs from './pages/Programs';
import FacultyList from './pages/FacultyList';

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

    // Hide nav on Departments, Programs, FacultyList as they have their own back buttons/layouts
    const hideNavPaths = ['/departments', '/programs', '/faculty-list'];
    if (hideNavPaths.includes(location.pathname)) return null;

    const isDashboard = location.pathname === '/dashboard';

    return (
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50 pointer-events-none">
            {/* Left Side - Pointer Events Auto */}
            <div className="flex items-center space-x-3 pointer-events-auto">
                <Link to="/" className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition">
                    <span className="text-2xl">🎓</span>
                </Link>
                <div>
                    <h1 className="text-lg font-bold leading-tight">Campus Portal</h1>
                    <p className="text-xs text-white/70">Excellence in Education</p>
                </div>
            </div>

            {/* Right Side - Auths (Hidden on Dashboard) */}
            {!isDashboard && (
                <div className="flex space-x-4 pointer-events-auto">
                    <Link to="/login" className="px-5 py-2 rounded-lg border border-white/30 hover:bg-white/10 transition backdrop-blur-sm text-sm font-medium">Log In</Link>
                    <Link to="/signup" className="px-5 py-2 rounded-lg bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 shadow-lg text-sm font-medium">Sign Up</Link>
                </div>
            )}
        </div>
    );
};

function Home() {
    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center p-4">

            {/* Hero Section */}
            <div className="flex flex-col items-center text-center space-y-6 max-w-4xl animate-fade-in-up">

                {/* Central Image Wrapper */}
                <div className="relative mb-4 group cursor-pointer">
                    <div className="w-48 h-48 rounded-full border-2 border-white/20 relative z-10 overflow-hidden bg-white shadow-2xl flex items-center justify-center">
                        <img src="/hero_logo.png" alt="Institution Logo" className="w-full h-full object-cover scale-[1.35]" />
                    </div>
                    {/* Floating Badge */}
                    <div className="absolute top-2 right-2 z-20 bg-gradient-to-r from-orange-400 to-pink-500 text-white p-2 rounded-full shadow-lg animate-bounce-slow">
                        ✨
                    </div>
                </div>

                {/* Text Content */}
                <div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-2">Find My Faculty</h2>
                    <p className="text-white/80 text-lg">Connect with professors, explore departments, and discover your academic journey</p>
                </div>

                {/* Stats / Pill Badges */}
                <div className="flex flex-wrap justify-center gap-4 text-sm font-medium">
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

                {/* Search Bar - Larger & Premium */}
                <div className="w-full max-w-2xl mt-8">
                    <div className="relative group">
                        {/* We wrap SearchBar to position it or styling, but SearchBar itself needs to be transparent/white-ready. 
                             Actually, let's keep using the Logic of SearchBar but style a wrapper here or pass props? 
                             For quick turnaround, we might need to modify SearchBar.jsx to look "glassy" or just wrap it.
                             Let's modify SearchBar.jsx next to match. For now, place it here.
                          */}
                        <SearchBar premiumMode={true} />
                    </div>
                </div>

            </div>

            {/* Bottom Action Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mt-16 px-4">
                <ActionCard icon="📖" label="Departments" color="bg-purple-500/20" link="/departments" />
                <ActionCard icon="🎓" label="Programs" color="bg-orange-500/20" link="/programs" />
                <ActionCard icon="👥" label="Faculty" color="bg-blue-500/20" link="/faculty-list" />
                <ActionCard icon="🗺️" label="Campus Map" color="bg-green-500/20" link="/map" />
            </div>
        </div>
    );
}

export default App;

const ActionCard = ({ icon, label, color, link }) => {
    const Card = (
        <div className={`aspect-square rounded-3xl ${color} backdrop-blur-sm border border-white/10 hover:bg-white/20 transition cursor-pointer flex flex-col items-center justify-center group h-full w-full`}>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition">
                {icon}
            </div>
            <span className="font-medium text-white/90">{label}</span>
        </div>
    );

    return link ? <Link to={link}>{Card}</Link> : Card;
};
