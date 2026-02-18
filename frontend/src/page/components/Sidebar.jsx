import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Dog, Scan, Users, History, MessageSquare  } from 'lucide-react';

function Sidebar({ sidebarOpen }) {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { id: 'community', label: 'Community', icon: Users, path: '/community' },


        { id: 'dogbreeds', label: 'Dog Breeds', icon: Dog, path: '/dogbreeds' },
        { id: 'dogskindisease', label: 'Dog Skin Disease', icon: Dog, path: '/dogskindisease' },

        { id: 'dogscanner', label: 'Dog Scanner', icon: Scan, path: '/dogscanner' },
        { id: 'history', label: 'History', icon: History, path: '/history' },
        { id: 'feedback', label: 'Feedback', icon: MessageSquare, path: '/feedback' },
        
       
    ];

    const currentPath = location.pathname;

    return (
        <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col`}>
            <div className="p-6 border-b border-slate-200">
                {sidebarOpen ? (
                    <h1 className="text-xl font-bold text-slate-800">DOGSCAN<span className='text-blue-600'>AI</span></h1>
                ) : (
                    <div className="text-xl font-bold text-slate-800 text-center">DS</div>
                )}
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPath === item.path;

                    return (
                        <button
                            key={item.id}
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center ${sidebarOpen ? 'px-4' : 'justify-center'} py-3 rounded-lg transition-all ${
                                isActive
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <Icon className={`w-5 h-5 ${sidebarOpen ? 'mr-3' : ''}`} />
                            {sidebarOpen && <span className="font-medium">{item.label}</span>}
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
}

export default Sidebar;
