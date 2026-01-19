import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { LogIn, FileText, Target, UserPlus, UserMinus } from 'lucide-react';

interface DashboardStats {
    stats: {
        totalTeams: number;
        totalEmployees: number;
        pendingEvaluations: number;
    };
    recentActivity: {
        type: string;
        date: string;
        title: string;
        description: string;
        user: string;
    }[];
}

export const AdminDashboard = () => {
    const [data, setData] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await api.get('/dashboard');
                setData(res.data);
            } catch (error) {
                console.error('Failed to fetch dashboard stats', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    if (loading) {
        return <div className="p-6 text-white">Loading dashboard...</div>;
    }

    const stats = [
        { label: 'Total Teams', value: data?.stats.totalTeams ?? 0, color: 'from-blue-500 to-cyan-500', link: '/admin/teams' },
        { label: 'Total Employees', value: data?.stats.totalEmployees ?? 0, color: 'from-purple-500 to-pink-500', link: '/admin/users' },
        { label: 'Pending Evaluations', value: data?.stats.pendingEvaluations ?? 0, color: 'from-orange-500 to-red-500', link: '#' },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Dashboard</h2>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {stats.map((stat) => (
                    <Link to={stat.link} key={stat.label} className="relative block overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-transform hover:scale-[1.02] active:scale-[0.98]">
                        <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br ${stat.color} opacity-20 blur-xl`} />
                        <h3 className="text-sm font-medium text-gray-400">{stat.label}</h3>
                        <p className="mt-2 text-3xl font-bold text-white">{stat.value}</p>
                    </Link>
                ))}
            </div>
            
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                <div className="space-y-4">
                    {data?.recentActivity.length === 0 ? (
                        <p className="text-gray-400">No recent activity.</p>
                    ) : (
                        data?.recentActivity.map((activity, index) => {
                            let Icon = FileText;
                            let colorClass = 'bg-blue-500/20 text-blue-400';

                            if (activity.type === 'LOGIN') {
                                Icon = LogIn;
                                colorClass = 'bg-green-500/20 text-green-400';
                            } else if (activity.type.includes('KPI')) {
                                Icon = Target;
                                colorClass = 'bg-purple-500/20 text-purple-400';
                            } else if (activity.type === 'USER_CREATED' || activity.type === 'USER_JOINED') {
                                Icon = UserPlus;
                                colorClass = 'bg-teal-500/20 text-teal-400';
                            } else if (activity.type === 'USER_DELETED') {
                                Icon = UserMinus;
                                colorClass = 'bg-red-500/20 text-red-400';
                            } else if (activity.type === 'EVALUATION_UPDATED') {
                                Icon = FileText;
                                colorClass = 'bg-orange-500/20 text-orange-400';
                            }

                            return (
                                <div key={index} className="flex items-center gap-4 rounded-lg bg-white/5 p-3">
                                    <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${colorClass}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-sm font-medium text-white truncate">{activity.title}</h4>
                                            <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                                                {new Date(activity.date).toLocaleDateString()} {new Date(activity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-400 truncate">{activity.description}</p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
