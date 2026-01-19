import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { TrendingUp, AlertCircle } from 'lucide-react';

interface KPIScore {
    id: number;
    name: string;
    weight: number;
    score: number;
}

interface KPIGroup {
    id: number;
    name: string;
    weight: number;
    items: KPIScore[];
}

export const ManagerDashboard = () => {
    const { user } = useAuthStore();
    const [stats, setStats] = useState({ totalEmployees: 0, pendingEvaluations: 0, totalTeams: 0 });
    const [myKpis, setMyKpis] = useState<{ finalScore: number, groups: KPIGroup[] } | null>(null);

    useEffect(() => {
        // Fetch Dashboard Stats (scoped by backend)
        api.get('/dashboard').then(res => {
            if (res.data && res.data.stats) {
                setStats(res.data.stats);
            }
        }).catch(console.error);

        // Fetch My Performance
        if (user?.id) {
            api.get(`/evaluations/user/${user.id}`).then(res => {
                if (res.data && (res.data.evaluation || res.data.groups)) {
                    setMyKpis({
                        finalScore: res.data.finalScore,
                        groups: res.data.groups
                    });
                }
            }).catch(console.error);
        }
    }, [user?.id]);

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-500 bg-green-500/10 border-green-500/20';
        if (score >= 70) return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
        if (score >= 50) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
        return 'text-red-500 bg-red-500/10 border-red-500/20';
    };

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white">Manager Dashboard</h2>
            
             <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {[
                    { label: 'My Team Members', value: stats.totalEmployees.toString(), color: 'from-green-500 to-emerald-500', link: '/manager/team' },
                    { label: 'Pending Evaluations', value: stats.pendingEvaluations.toString(), color: 'from-orange-500 to-red-500', link: '/manager/evaluations' },
                    { label: 'My Performance', value: myKpis ? `${myKpis.finalScore}%` : 'N/A', color: 'from-blue-500 to-indigo-500', link: user ? `/manager/users/${user.id}` : '#' },
                ].map((stat) => (
                    <Link to={stat.link} key={stat.label} className="relative block overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-transform hover:scale-[1.02] active:scale-[0.98]">
                        <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br ${stat.color} opacity-20 blur-xl`} />
                        <h3 className="text-sm font-medium text-gray-400">{stat.label}</h3>
                        <p className="mt-2 text-3xl font-bold text-white">{stat.value}</p>
                    </Link>
                ))}
            </div>

            {/* My KPI Breakdown */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-400" />
                    <h3 className="text-xl font-bold text-white">My Performance Breakdown</h3>
                </div>

                {myKpis ? (
                    <div className="grid gap-6 md:grid-cols-2">
                        {myKpis.groups.map(group => (
                            <div key={group.id} className="rounded-xl border border-white/10 bg-white/5 p-5">
                                <div className="mb-4 flex justify-between items-center">
                                    <h4 className="font-semibold text-white">{group.name}</h4>
                                    <span className="text-xs text-gray-500 bg-black/40 px-2 py-1 rounded">Weight: {group.weight}%</span>
                                </div>
                                <div className="space-y-3">
                                    {group.items.map(item => (
                                        <div key={item.id} className="flex justify-between items-center text-sm">
                                            <span className="text-gray-300">{item.name}</span>
                                            <span className={`px-2 py-0.5 rounded font-mono font-bold ${getScoreColor(item.score)}`}>
                                                {item.score}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-gray-400">
                        <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                        <p>No performance data available yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
