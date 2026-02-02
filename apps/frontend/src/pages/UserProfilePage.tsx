import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getAssetsUrl } from '../api/client';
import { Layers, BarChart3, Mail, Briefcase, Camera } from 'lucide-react';

interface KPIItem {
    id: number;
    name: string;
    weight: number;
    score: number;
}

interface KPIGroup {
    id: number;
    name: string;
    weight: number;
    items: KPIItem[];
    comment?: string;
}

interface UserProfile {
    id: number;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    team: { name: string } | null;
}

export const UserProfilePage = () => {
    const { userId } = useParams();
    const { user: currentUser } = useAuthStore();
    const [user, setUser] = useState<UserProfile | null>(null);

    const [kpiData, setKpiData] = useState<{
        finalScore: number,
        groups: KPIGroup[],
        availablePeriods?: string[]
    } | null>(null);
    const [loading, setLoading] = useState(false);
    
    // Filter State
    const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
    const [availableOptions, setAvailableOptions] = useState<string[]>([]);

    useEffect(() => {
        const fetchUser = async () => {
            if (!userId) return;
            try {
                const userRes = await api.get(`/users/${userId}`);
                setUser(userRes.data);
            } catch (error) { console.error(error); }
        };
        fetchUser();
    }, [userId]);

    useEffect(() => {
        const fetchEvaluation = async () => {
            if (!userId) return;
            setLoading(true);
            try {
                const params = selectedPeriods.length > 0 ? { periods: selectedPeriods.join(',') } : {};
                const evalRes = await api.get(`/evaluations/user/${userId}`, { params });
                
                if (evalRes.data && (evalRes.data.evaluation || evalRes.data.groups)) {
                    setKpiData({
                        finalScore: evalRes.data.finalScore,
                        groups: evalRes.data.groups,
                        availablePeriods: evalRes.data.availablePeriods
                    });
                    
                    if (evalRes.data.availablePeriods) {
                        setAvailableOptions(evalRes.data.availablePeriods);
                    }
                } else {
                    setKpiData(null);
                }
            } catch (error) {
                console.error(error);
                setKpiData(null); 
            } finally {
                setLoading(false);
            }
        };
        fetchEvaluation();
    }, [userId, selectedPeriods]);

    const togglePeriod = (period: string) => {
        if (selectedPeriods.includes(period)) {
            setSelectedPeriods(selectedPeriods.filter(p => p !== period));
        } else {
            setSelectedPeriods([...selectedPeriods, period]);
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-400">Loading profile...</div>;
    if (!user) return <div className="p-10 text-center text-gray-400">User not found</div>;

    const getScoreStyles = (score: number) => {
        if (score >= 90) return { text: 'text-green-400', bg: 'bg-green-400' };
        if (score >= 70) return { text: 'text-blue-400', bg: 'bg-blue-400' };
        if (score >= 50) return { text: 'text-yellow-400', bg: 'bg-yellow-400' };
        return { text: 'text-red-400', bg: 'bg-red-400' };
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !user) return;
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post(`/users/${user.id}/avatar`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUser(prev => prev ? { ...prev, avatar: res.data.avatarUrl } : null);
        } catch (error) {
            console.error(error);
            alert('Failed to upload avatar');
        }
    };
    
    // Check perm
    const canEdit = currentUser && user && (currentUser.role === 'ADMIN' || currentUser.id === user.id);

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Header / User Info */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-8 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl font-bold text-white shadow-xl overflow-hidden">
                                {user?.avatar ? (
                                    <img src={getAssetsUrl(user.avatar)} alt={user.name} className="h-full w-full object-cover" />
                                ) : (
                                    user?.name.charAt(0)
                                )}
                            </div>
                            {canEdit && (
                                <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                                    <Camera className="h-8 w-8 text-white" />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                                </label>
                            )}
                        </div>
                        <div className="text-center md:text-left">
                            <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                            <div className="mt-2 space-y-1 text-gray-400">
                                <div className="flex items-center gap-2 justify-center md:justify-start">
                                    <Mail className="h-4 w-4" /> {user.email}
                                </div>
                                <div className="flex items-center gap-2 justify-center md:justify-start">
                                    <Briefcase className="h-4 w-4" /> {user.team?.name || 'No Team'} ({user.role})
                                </div>
                            </div>
                        </div>
                    </div>

                    {kpiData && (
                        <div className="relative flex flex-col items-center justify-center rounded-xl bg-black/20 p-6 min-w-[150px]">
                            <span className="text-sm font-medium text-gray-400">Performance Score</span>
                            <span className={`text-4xl font-black ${getScoreStyles(kpiData.finalScore).text}`}>
                                {kpiData.finalScore.toFixed(1)}%
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Period Filter */}
            {availableOptions.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4">
                    <span className="text-sm font-medium text-gray-400 mr-2">Filter Periods:</span>
                    <button
                        onClick={() => setSelectedPeriods([])}
                        className={`px-3 py-1 text-sm rounded-full transition-colors border ${
                            selectedPeriods.length === 0 
                            ? 'bg-blue-500/20 border-blue-500 text-blue-400' 
                            : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/10'
                        }`}
                    >
                        All History
                    </button>
                    {availableOptions.map(period => (
                        <button
                            key={period}
                            onClick={() => togglePeriod(period)}
                            className={`px-3 py-1 text-sm rounded-full transition-colors border ${
                                selectedPeriods.includes(period)
                                ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                                : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/10'
                            }`}
                        >
                            {period}
                        </button>
                    ))}
                </div>
            )}

            {/* KPI Details */}
            {kpiData ? (
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-xl font-bold text-white">
                        <Layers className="h-6 w-6 text-purple-400" />
                        <h2>KPI Performance Breakdown</h2>
                    </div>

                    <div className="grid gap-6">
                        {kpiData.groups.map(group => (
                            <div key={group.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
                                <div className="bg-white/5 px-6 py-4 flex justify-between items-center">
                                    <h3 className="font-bold text-white text-lg">{group.name}</h3>
                                    <span className="text-xs font-medium px-2 py-1 rounded bg-white/10 text-gray-400">Weight: {group.weight}%</span>
                                </div>
                                {group.comment && (
                                    <div className="px-6 py-3 bg-black/20 border-b border-white/5">
                                        <p className="text-sm text-gray-300 italic">
                                            <span className="font-semibold text-blue-400 not-italic">Manager Note:</span> {group.comment}
                                        </p>
                                    </div>
                                )}
                                <div className="p-6 grid gap-4">
                                    {group.items.map(item => {
                                        const styles = getScoreStyles(item.score);
                                        return (
                                            <div key={item.id} className="flex items-center justify-between rounded-lg bg-black/20 p-4">
                                                <div>
                                                    <p className="font-medium text-white">{item.name}</p>
                                                    <p className="text-xs text-gray-500">Weight: {item.weight}%</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                                                        <div className={`h-full ${styles.bg}`} style={{ width: `${item.score}%` }}></div>
                                                    </div>
                                                    <span className={`font-bold ${styles.text}`}>{item.score}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
                    <BarChart3 className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Evaluation Data</h3>
                    <p className="text-gray-400">This user has not been evaluated yet for the current period.</p>
                </div>
            )}
        </div>
    );
};
