import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { dogBreedsData } from "../data/dogBreedsData";
import { ChevronLeft, ChevronRight } from "lucide-react";

function DogBreeds({ user, setUser }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('dogbreeds');
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const cardsPerPage = 12;


    // Get data from imported file
    const allDogBreeds = dogBreedsData;

    // Filter dog breeds based on search query
    const filteredDogBreeds = allDogBreeds.filter(breed => 
        breed.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        breed.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calculate pagination with filtered results
    const totalPages = Math.ceil(filteredDogBreeds.length / cardsPerPage);
    const indexOfLastCard = currentPage * cardsPerPage;
    const indexOfFirstCard = indexOfLastCard - cardsPerPage;
    const currentCards = filteredDogBreeds.slice(indexOfFirstCard, indexOfLastCard);

    // Reset to page 1 when search query changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    // Pagination handlers
    const goToNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    const goToPreviousPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const goToPage = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

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
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-slate-800">Dog Breeds</h1>
                        <p className="text-slate-600 mt-2">
                            {searchQuery ? (
                                <>
                                    Found {filteredDogBreeds.length} breed{filteredDogBreeds.length !== 1 ? 's' : ''} matching "{searchQuery}"
                                    {filteredDogBreeds.length > 0 && ` (showing ${indexOfFirstCard + 1}-${Math.min(indexOfLastCard, filteredDogBreeds.length)})`}
                                </>
                            ) : (
                                <>
                                    Showing {indexOfFirstCard + 1}-{Math.min(indexOfLastCard, allDogBreeds.length)} of {allDogBreeds.length} breeds
                                </>
                            )}
                        </p>
                    </div>

                    {/* Cards Grid */}
                    {currentCards.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                            {currentCards.map((breed) => (
                                <div 
                                    key={breed.id}
                                    className="bg-white p-5 text-center rounded-lg border border-gray-300 shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                                >
                                    <img 
                                        className="w-full h-48 object-cover rounded-md mb-3" 
                                        src={breed.image} 
                                        alt={breed.name}
                                    />
                                    <h2 className="text-lg font-semibold text-slate-800 mb-2">{breed.name}</h2>
                                    <p className="text-slate-600 text-sm">{breed.description}</p>
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
                            <h3 className="text-xl font-semibold text-slate-700 mb-2">No breeds found</h3>
                            <p className="text-slate-500">Try searching with a different keyword</p>
                        </div>
                    )}

                    {/* Pagination Controls - Only show if there are results */}
                    {currentCards.length > 0 && totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pb-6">
                            {/* Previous Button */}
                            <button
                                onClick={goToPreviousPage}
                                disabled={currentPage === 1}
                                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
                                    currentPage === 1
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-slate-700 border border-gray-300 hover:bg-slate-50'
                                }`}
                            >
                                <ChevronLeft className="w-5 h-5 mr-1" />
                                Previous
                            </button>

                            {/* Page Numbers */}
                            <div className="flex gap-2">
                                {[...Array(totalPages)].map((_, index) => {
                                    const pageNumber = index + 1;
                                    // Show first page, last page, current page, and pages around current
                                    if (
                                        pageNumber === 1 ||
                                        pageNumber === totalPages ||
                                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                                    ) {
                                        return (
                                            <button
                                                key={pageNumber}
                                                onClick={() => goToPage(pageNumber)}
                                                className={`w-10 h-10 rounded-lg font-medium transition-all ${
                                                    currentPage === pageNumber
                                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                                        : 'bg-white text-slate-700 border border-gray-300 hover:bg-slate-50'
                                }`}
                                            >
                                                {pageNumber}
                                            </button>
                                        );
                                    } else if (
                                        pageNumber === currentPage - 2 ||
                                        pageNumber === currentPage + 2
                                    ) {
                                        return <span key={pageNumber} className="px-2 text-slate-400">...</span>;
                                    }
                                    return null;
                                })}
                            </div>

                            {/* Next Button */}
                            <button
                                onClick={goToNextPage}
                                disabled={currentPage === totalPages}
                                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
                                    currentPage === totalPages
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-slate-700 border border-gray-300 hover:bg-slate-50'
                                }`}
                            >
                                Next
                                <ChevronRight className="w-5 h-5 ml-1" />
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default DogBreeds;