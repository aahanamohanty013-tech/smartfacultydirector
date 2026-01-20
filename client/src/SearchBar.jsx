import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from './config';

const SearchBar = ({ premiumMode = false }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isFocused, setIsFocused] = useState(false);
    const navigate = useNavigate();
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsFocused(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (query.length > 1) {
            const fetchResults = async () => {
                try {
                    const res = await fetch(`${API_URL}/api/search?q=${query}`);
                    const data = await res.json();
                    setResults(data);
                } catch (err) {
                    console.error("Search failed", err);
                }
            };
            const debounce = setTimeout(fetchResults, 300);
            return () => clearTimeout(debounce);
        } else {
            setResults([]);
        }
    }, [query]);

    const handleSelect = (id) => {
        navigate(`/faculty/${id}`);
        setQuery('');
        setResults([]);
        setIsFocused(false);
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div className="relative flex items-center w-full">
                <div className="absolute left-4 text-gray-400 pointer-events-none z-10">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>

                <input
                    type="text"
                    className={`w-full py-4 pl-12 pr-4 rounded-full border transition-all duration-300 outline-none
                        ${premiumMode
                            ? "bg-white/90 backdrop-blur-xl border-white/20 text-gray-800 placeholder-gray-500 shadow-2xl focus:shadow-pink-500/20 focus:scale-[1.02]"
                            : "bg-white text-gray-800 border-gray-200 focus:ring-2 focus:ring-blue-500 shadow-sm"
                        }`}
                    placeholder={premiumMode ? "Search by name, department, or expertise..." : "Search faculty..."}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                />
            </div>

            {/* Dropdown Results */}
            {isFocused && (results.length > 0 || query.length > 1) && (
                <div className="absolute w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-fade-in-up">
                    {results.length > 0 ? (
                        results.map((faculty) => (
                            <div
                                key={faculty.id}
                                onClick={() => handleSelect(faculty.id)}
                                className="px-5 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none transition flex justify-between items-center group"
                            >
                                <div>
                                    <div className="font-semibold text-gray-800 group-hover:text-blue-600 transition">{faculty.name}</div>
                                    <div className="text-xs text-gray-500">{faculty.department}</div>
                                </div>
                                <span className="text-gray-300 group-hover:text-blue-400 text-sm">→</span>
                            </div>
                        ))
                    ) : (
                        // NO RESULTS MESSAGE
                        <div className="p-4 text-center text-gray-500 text-sm">
                            Couldn't find result for "<span className="font-bold text-gray-700">{query}</span>"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchBar;
