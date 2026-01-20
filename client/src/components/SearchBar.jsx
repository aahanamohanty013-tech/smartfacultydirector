import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SearchBar = ({ premiumMode }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const navigate = useNavigate();

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim()) {
                fetch(`/api/search?q=${encodeURIComponent(query)}`)
                    .then(res => res.json())
                    .then(data => setResults(data))
                    .catch(err => console.error(err));
            } else {
                setResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div className="relative z-30">
            <div className={`relative flex items-center w-full rounded-2xl transition-all ${premiumMode ? 'bg-white shadow-2xl h-14' : 'bg-white shadow-md border border-gray-200 h-12'}`}>
                <span className={`pl-4 text-xl ${premiumMode ? 'text-gray-400' : 'text-gray-400'}`}>🔍</span>
                <input
                    type="text"
                    className="w-full h-full px-4 rounded-2xl focus:outline-none text-gray-700 placeholder-gray-400 bg-transparent"
                    placeholder={premiumMode ? "Search by name, department, or expertise..." : "Search faculty..."}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                />
                {premiumMode && (
                    <button className="mr-2 p-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl shadow-md hover:shadow-lg transition">
                        Go
                    </button>
                )}
            </div>

            {/* Suggestions Dropdown */}
            {results.length > 0 && showSuggestions && (
                <div className="absolute w-full mt-2 bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100 animate-fade-in-up text-left">
                    {results.map((faculty) => (
                        <div
                            key={faculty.id}
                            onClick={() => {
                                navigate(`/faculty/${faculty.id}`);
                                setShowSuggestions(false);
                            }}
                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 border-gray-50 transition flex justify-between items-center group"
                        >
                            <div>
                                <div className="font-semibold text-gray-800 group-hover:text-blue-700">{faculty.name}</div>
                                <div className="text-xs text-gray-500">{faculty.department} {faculty.specialization ? `• ${faculty.specialization}` : ''}</div>
                            </div>
                            <span className="text-gray-300 group-hover:text-blue-400">→</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
export default SearchBar;
