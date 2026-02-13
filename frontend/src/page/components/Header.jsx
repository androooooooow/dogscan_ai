import React, { useState, useCallback } from "react";
import { 
    Bell, Search, Menu, X, ChevronDown, 
    Settings, LogOut
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

function Truncate(){
    
}
function Header({ sidebarOpen, setSidebarOpen, searchQuery, setSearchQuery, user, setUser }) {
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notifications] = useState(3);
    const navigate = useNavigate();

    const handleLogout = useCallback(async () => {
        console.log("Logging out...");
        try {
            await api.post("/api/auth/logout");
            setUser(null);
            navigate("/signin");
        } catch (err) {
            console.error("Logout error:", err);
            // Even if logout fails on backend, clear user on frontend
            setUser(null);
            navigate("/signin");
        }
    }, [setUser, navigate]);

    const userEmail = user?.email || "guest@example.com";
    const userName = user?.name || "Guest User";
    const userInitials = userName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || "GU";

    // Handle search input change
    const handleSearchChange = (e) => {
        if (setSearchQuery) {
            setSearchQuery(e.target.value);
        }
    };

    // Clear search
    const handleClearSearch = () => {
        if (setSearchQuery) {
            setSearchQuery("");
        }
    };

    return (
        <header className="bg-white px-6 py-4 shadow-sm">
            <div className="flex items-center justify-between">
                {/* Left: Menu Toggle & App Title */}
                <div className="flex items-center space-x-6">
                    <button 
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        {sidebarOpen ? (
                            <X className="w-5 h-5 text-slate-700" />
                        ) : (
                            <Menu className="w-5 h-5 text-slate-700" />
                        )}
                    </button>
                    
                    {/* App Title */}
                    <div className="hidden md:block">
                        <h1 className="text-lg font-bold text-slate-700"></h1>
                    </div>
                </div>

                {/* Center: Search Bar */}
                <div className="flex-1 max-w-2xl mx-8">
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text"
                            placeholder="Search dog breeds..."
                            value={searchQuery || ""}
                            onChange={handleSearchChange}
                            className="pl-10 pr-10 py-2.5 w-full bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder-slate-500 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={handleClearSearch}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Right: Notifications & User Profile */}
                <div className="flex items-center space-x-4">
                    {/* Notification Bell */}
                    <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
                        <Bell className="w-5 h-5 text-slate-600" />
                        {notifications > 0 && (
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        )}
                    </button>
                    
                    <div className="h-6 w-px bg-slate-200"></div>

                    {/* User Menu */}
                    <div className="relative">
                        <button 
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            className="flex items-center space-x-3 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <div className="hidden sm:flex flex-col items-end">
                                <p className="text-sm font-medium text-slate-800">{userName}</p>
                                <p className="text-xs text-slate-500">{userEmail}</p>
                            </div>
                            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm">
                                {userInitials}
                            </div>
                            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {userMenuOpen && (
                            <>
                                {/* Overlay to close menu when clicking outside */}
                                <div 
                                    className="fixed inset-0 z-40"
                                    onClick={() => setUserMenuOpen(false)}
                                />
                                
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                                    <div className="px-4 py-3 mb-1 border-b border-slate-100">
                                        <p className="text-sm font-medium text-slate-800">{userName}</p>
                                        <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                                    </div>
                                    
                                    <button className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition-colors">
                                        <Settings className="w-4 h-4" />
                                        <span>Account Settings</span>
                                    </button>
                                    
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors border-t border-slate-100 mt-1"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;