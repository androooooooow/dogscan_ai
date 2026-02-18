import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { dogSkinDiseaseData } from '../data/dogSkinDiseaseData';

function DogSkinDisease({ user, setUser }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('dogskindisease');
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDisease, setSelectedDisease] = useState(null);

    const allDogSkinDiseases = dogSkinDiseaseData;

    const currentCards = allDogSkinDiseases.filter(disease =>
        disease.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        disease.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-screen bg-slate-50">
            <Sidebar
                sidebarOpen={sidebarOpen}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    user={user}
                    setUser={setUser}
                />

                <main className="flex-1 overflow-auto p-6">
                    {/* Page Title */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-slate-800">Dog Skin Diseases</h1>
                        <p className="text-slate-600 mt-2">
                            {searchQuery
                                ? `Found ${currentCards.length} disease${currentCards.length !== 1 ? 's' : ''} matching "${searchQuery}"`
                                : `Showing all ${allDogSkinDiseases.length} diseases`
                            }
                        </p>
                    </div>

                    {/* Cards Grid */}
                    {currentCards.length > 0 ? (
                        <div className="grid grid-cols-3 gap-4">
                            {currentCards.map((disease) => (
                                <div
                                    key={disease.id}
                                    onClick={() => setSelectedDisease(disease)}
                                    className="bg-white text-center rounded-lg border border-gray-300 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden"
                                >
                                    <img
                                        className="w-full h-48 object-cover"
                                        src={disease.image}
                                        alt={disease.name}
                                    />
                                    <div className="p-4">
                                        <h2 className="text-lg font-semibold text-slate-800 mb-2">{disease.name}</h2>
                                        <p className="text-slate-500 text-sm line-clamp-3">{disease.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="text-slate-400 mb-4">
                                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-slate-700 mb-2">No diseases found</h3>
                            <p className="text-slate-500">Try searching with a different keyword</p>
                        </div>
                    )}
                </main>
            </div>

            {/* Modal */}
            {selectedDisease && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedDisease(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <img
                            src={selectedDisease.image}
                            alt={selectedDisease.name}
                            className="w-full h-56 object-cover"
                        />
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-slate-800 mb-3">{selectedDisease.name}</h2>

                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-1">Description</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">{selectedDisease.description}</p>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-1">Treatment</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">{selectedDisease.treatment}</p>
                            </div>

                            <button
                                onClick={() => setSelectedDisease(null)}
                                className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:opacity-90 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DogSkinDisease;