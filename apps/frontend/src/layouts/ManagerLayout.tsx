import { getAssetsUrl } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, UserCheck, LogOut } from 'lucide-react';
import { clsx } from 'clsx';

export const ManagerLayout = () => {
    const { logout, user } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/manager/dashboard' },
        { label: 'My Team', icon: Users, path: '/manager/team' },
        { label: 'Evaluations', icon: UserCheck, path: '/manager/evaluations' },
    ];

    return (
    <div className="flex h-screen bg-secondary text-white">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/10 bg-gray-900/50 backdrop-blur-xl p-4 flex flex-col">
                <div className="mb-8 flex items-center gap-3">
                    <img src="/logo.png" alt="MRKOON" className="h-12 object-contain rounded-md" />
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">MRKOON OKR</h1>
                </div>

                <nav className="flex-1 space-y-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                    isActive 
                                        ? "bg-main/10 text-main" 
                                        : "text-text-secondary hover:bg-main/10 hover:text-main"
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto border-t border-white/5 pt-4">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        {user?.avatar ? (
                             <img 
                                src={getAssetsUrl(user.avatar)} 
                                alt={user.name} 
                                className="h-10 w-10 rounded-full object-cover border border-white/10"
                            />
                        ) : (
                            <div className="h-10 w-10 rounded-full bg-main/20 flex items-center justify-center text-main font-bold border border-white/10">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                        )}
                        <div className="overflow-hidden">
                             <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                             <p className="text-xs text-text-secondary truncate">{user?.role}</p>
                        </div>
                    </div>
                    
                    <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors">
                        <LogOut className="h-5 w-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-black/20 p-8">
                <Outlet />
            </main>
        </div>
    );
};
