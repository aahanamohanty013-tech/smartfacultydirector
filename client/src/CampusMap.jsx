import React from 'react';
import { useNavigate } from 'react-router-dom';

const CampusMap = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen pt-24 px-4 pb-6 flex flex-col items-center">

            <div className="w-full max-w-5xl flex justify-between items-center mb-6 animate-fade-in-up">
                <h1 className="text-3xl font-bold text-white">Campus Map</h1>
                <button
                    onClick={() => navigate('/')}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition border border-white/10"
                >
                    Back to Home
                </button>
            </div>

            <div className="relative w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl border border-white/20 animate-fade-in-up delay-100 bg-white">
                <img
                    src="/assets/campus_map.png"
                    alt="Campus Map"
                    className="w-full h-auto object-contain"
                />

                {/* CSE Department Pin */}
                {/* Adjust top/left percentages to match the specific image layout */}
                <div
                    className="absolute group cursor-pointer"
                    style={{ top: '45%', right: '22%' }}
                >
                    <div className="relative">
                        <div className="text-4xl filter drop-shadow-lg animate-bounce">📍</div>
                        <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white/90 text-blue-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            CSE Department
                        </div>
                    </div>
                </div>

                {/* ECE Department Pin */}
                <div
                    className="absolute group cursor-pointer"
                    style={{ top: '48%', right: '42%' }}
                >
                    <div className="relative">
                        <div className="text-4xl filter drop-shadow-lg animate-bounce delay-150">📍</div>
                        <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white/90 text-blue-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            ECE Department
                        </div>
                    </div>
                </div>

                {/* Legend Overlay */}
                <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur rounded-lg p-3 shadow-lg border border-gray-100 max-w-xs">
                    <h3 className="text-sm font-bold text-gray-800 mb-1">Map Guide</h3>
                    <p className="text-xs text-gray-600">CSE & ECE Departments highlighted. Hover over pins for details.</p>
                </div>
            </div>
        </div>
    );
};

export default CampusMap;


