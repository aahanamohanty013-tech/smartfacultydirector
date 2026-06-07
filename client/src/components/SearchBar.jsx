import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

const SearchBar = ({ premiumMode }) => {
    const [query, setQuery] = useState('');
    const [searchMode, setSearchMode] = useState('trie'); // 'trie' (Name/Alias) or 'kmp' (Research/Bio)
    const [results, setResults] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const navigate = useNavigate();

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim()) {
                const endpoint = searchMode === 'trie' ? '/api/search' : '/api/search/kmp';
                fetch(`${API_URL}${endpoint}?q=${encodeURIComponent(query)}`)
                    .then(res => res.json())
                    .then(data => setResults(data))
                    .catch(err => console.error(err));
            } else {
                setResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [query, searchMode]);

    return (
        <div className="relative z-30">
            {/* Search Mode Toggle */}
            <div className="flex space-x-2 mb-3 justify-center">
                <button 
                    type="button"
                    onClick={() => { setSearchMode('trie'); setResults([]); }} 
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition shadow-sm border ${searchMode === 'trie' ? 'bg-white text-indigo-950 border-white' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
                >
                    🔍 Name / Alias (Trie)
                </button>
                <button 
                    type="button"
                    onClick={() => { setSearchMode('kmp'); setResults([]); }} 
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition shadow-sm border ${searchMode === 'kmp' ? 'bg-white text-indigo-950 border-white' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
                >
                    🔬 Research & Bio (KMP Match)
                </button>
            </div>

            {/* Input Wrapper */}
            <div className={`relative flex items-center w-full rounded-2xl transition-all ${premiumMode ? 'bg-white shadow-2xl h-14' : 'bg-white shadow-md border border-gray-200 h-12'}`}>
                <span className="pl-4 text-xl text-gray-400">🔍</span>
                <input
                    type="text"
                    className="w-full h-full px-4 rounded-2xl focus:outline-none text-gray-700 placeholder-gray-400 bg-transparent font-medium"
                    placeholder={searchMode === 'trie' ? "Search by name, department, initials (e.g. PK)..." : "Search research keywords, skills, bios (KMP matching)..."}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                />
                {premiumMode && (
                    <button className="mr-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl shadow-md hover:shadow-lg transition font-semibold text-sm">
                        Find
                    </button>
                )}
            </div>

            {/* Suggestions Dropdown */}
            {results.length > 0 && showSuggestions && (
                <div className="absolute w-full mt-2 bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100 animate-fade-in-up text-left z-50 max-h-72 overflow-y-auto">
                    {results.map((faculty) => (
                        <div
                            key={faculty.id}
                            onClick={() => {
                                // If KMP mode, pass the query as highlight parameter
                                const highlightParam = searchMode === 'kmp' ? `?highlight=${encodeURIComponent(query)}` : '';
                                navigate(`/faculty/${faculty.id}${highlightParam}`);
                                setShowSuggestions(false);
                            }}
                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 border-gray-50 transition flex justify-between items-center group"
                        >
                            <div className="pr-4">
                                <div className="font-semibold text-gray-800 group-hover:text-blue-700">{faculty.name}</div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                    {faculty.department} • <span className="text-blue-600 font-medium">{faculty.specialization}</span>
                                </div>
                                {searchMode === 'kmp' && faculty.research_interests && (
                                    <div className="text-[11px] text-gray-400 mt-1 line-clamp-1 italic">
                                        Interests: {faculty.research_interests}
                                    </div>
                                )}
                            </div>
                            <span className="text-gray-300 group-hover:text-blue-400 font-bold">→</span>
                        </div>
                    ))}
                </div>
            )}
            
            {results.length === 0 && query.trim() !== '' && showSuggestions && (
                <div className="absolute w-full mt-2 bg-white rounded-xl shadow-2xl p-4 border border-gray-100 text-left text-gray-400 italic text-sm z-50">
                    No faculty match found.
                </div>
            )}
        </div>
    );
};
export default SearchBar;
