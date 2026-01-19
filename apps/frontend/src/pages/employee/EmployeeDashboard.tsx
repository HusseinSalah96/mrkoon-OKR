import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../api/client';
import { Target, MessageSquare, Calendar, Loader2 } from 'lucide-react';

export const EmployeeDashboard = () => {
    const { user } = useAuthStore();
    const [evaluationData, setEvaluationData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedQuarter, setSelectedQuarter] = useState('Q1'); // Default or could compute current Q

    useEffect(() => {
        const fetchEvaluation = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const period = `${selectedYear}-${selectedQuarter}`;
                const res = await api.get(`/evaluations/user/${user.id}?periods=${period}`);
                setEvaluationData(res.data);
            } catch (error) {
                console.error("Failed to fetch evaluation", error);
                setEvaluationData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchEvaluation();
    }, [user, selectedYear, selectedQuarter]);

    if (loading) {
        return <div className="p-8 text-white flex gap-2 items-center justify-center"><Loader2 className="animate-spin"/> Loading your dashboard...</div>;
    }

    // Heuristics for performance band
    const getPerformanceBand = (score: number) => {
        if (score >= 90) return { label: 'Excellent', color: 'text-main', bg: 'from-main to-emerald-600' };
        if (score >= 75) return { label: 'Good', color: 'text-brand-blue', bg: 'from-brand-blue to-indigo-600' };
        if (score >= 50) return { label: 'Average', color: 'text-brand-orange', bg: 'from-brand-orange to-orange-500' };
        return { label: 'Needs Improvement', color: 'text-error', bg: 'from-error to-pink-600' };
    };

    const finalScore = evaluationData?.finalScore || 0;
    const band = getPerformanceBand(finalScore);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-3xl font-bold text-white">My Dashboard</h2>
                
                {/* Filters */}
                <div className="flex gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
                    <div className="relative">
                        <select 
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="bg-transparent text-white text-sm py-1 pl-2 pr-6 rounded focus:bg-white/10 outline-none appearance-none cursor-pointer"
                        >
                            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y} className="text-black">{y}</option>)}
                        </select>
                        <Calendar className="absolute right-1 top-1.5 h-3 w-3 text-gray-400 pointer-events-none"/>
                    </div>
                    <div className="w-px bg-white/10"></div>
                    <div className="relative">
                        <select 
                            value={selectedQuarter}
                            onChange={(e) => setSelectedQuarter(e.target.value)}
                            className="bg-transparent text-white text-sm py-1 pl-2 pr-6 rounded focus:bg-white/10 outline-none appearance-none cursor-pointer"
                        >
                            {['Q1', 'Q2', 'Q3', 'Q4'].map(q => <option key={q} value={q} className="text-black">{q}</option>)}
                        </select>
                         <Calendar className="absolute right-1 top-1.5 h-3 w-3 text-gray-400 pointer-events-none"/>
                    </div>
                </div>
            </div>
            
            {!evaluationData || !evaluationData.evaluation ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/5 mb-4">
                        <Target className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No Evaluation Found</h3>
                    <p className="text-gray-400">There is no submitted evaluation for <span className="text-white font-medium">{selectedQuarter} {selectedYear}</span> yet.</p>
                </div>
            ) : (
                <>
                    {/* Overall Score Card */}
                    <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center py-10 relative overflow-hidden group">
                        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${band.bg}`}></div>
                        <div className={`inline-flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br ${band.bg} shadow-2xl shadow-black/50 mb-6 ring-4 ring-white/10  transition-transform group-hover:scale-105`}>
                            <div className="text-center">
                                <span className="text-5xl font-bold text-white drop-shadow-md">{finalScore}%</span>
                                <p className="text-xs text-white/80 mt-1 uppercase tracking-wide">Final Score</p>
                            </div>
                        </div>
                        <h3 className={`text-3xl font-bold ${band.color} mb-2`}>{band.label} Performance</h3>
                        <p className="text-gray-400">Based on your evaluation for {selectedQuarter} {selectedYear}</p>
                    </div>

                    {/* KPI Breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Column: KPI Groups & Items */}
                        <div className="lg:col-span-2 space-y-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Target className="h-5 w-5 text-main" />
                                KPI Breakdown
                            </h3>
                            
                            {evaluationData.groups.map((group: any) => (
                                <div key={group.id} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                                    <div className="bg-white/5 px-6 py-4 flex justify-between items-center border-b border-white/5">
                                        <div>
                                            <h4 className="text-lg font-bold text-white">{group.name}</h4>
                                            <span className="text-xs text-gray-500">Group Weight: {group.weight}%</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xl font-bold text-main">{evaluationData.groupScores[group.id]?.score || 0}%</span>
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        {group.items.map((item: any) => (
                                            <div key={item.id} className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-200">{item.name}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">Weight: {item.weight}%</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full bg-gradient-to-r ${getPerformanceBand(item.score).bg}`} 
                                                            style={{ width: `${item.score}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-sm font-bold w-8 text-right ${getPerformanceBand(item.score).color}`}>{item.score}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Side Column: Comments */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-brand-yellow" />
                                Manager Feedback
                            </h3>
                            
                            <div className="space-y-4">
                                {evaluationData.groups.map((group: any) => group.comment && (
                                    <div key={group.id} className="rounded-xl border border-white/10 bg-white/5 p-5 relative">
                                        <div className="absolute -left-px top-6 bottom-6 w-1 bg-brand-yellow rounded-r-full"></div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{group.name}</p>
                                        <p className="text-gray-300 text-sm leading-relaxed italic">"{group.comment}"</p>
                                    </div>
                                ))}
                                
                                {evaluationData.groups.every((g: any) => !g.comment) && (
                                    <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-gray-500 text-sm">
                                        No comments provided for this evaluation period.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
