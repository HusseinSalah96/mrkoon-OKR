import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Save, Loader2 } from 'lucide-react';

interface KpiGroup {
    id: number;
    name: string;
    items: KpiItem[];
}
interface KpiItem {
    id: number;
    name: string;
    weight: number;
}

export const ManagerEvaluationPage = () => {
    const { user } = useAuthStore();
    const { userId } = useParams();
    const [searchParams] = useSearchParams();
    const teamId = searchParams.get('teamId');
    const navigate = useNavigate();

    const [groups, setGroups] = useState<KpiGroup[]>([]);
    const [scores, setScores] = useState<Record<number, number>>({}); // kpiItemId -> score
    const [groupComments, setGroupComments] = useState<Record<number, string>>({}); // kpiGroupId -> comment
    const [loading, setLoading] = useState(false);
    
    // New State for Period
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedQuarter, setSelectedQuarter] = useState('Q1');

    const [targetUser, setTargetUser] = useState<any>(null);

    useEffect(() => {
        if (userId) {
            api.get(`/users/${userId}`).then(res => {
                setTargetUser(res.data);
                // Fetch KPIs based on Role
                if (res.data.role === 'MANAGER') {
                    api.get('/kpis/managers').then(kpiRes => setGroups(kpiRes.data));
                } else {
                    // Employee: use teamId from params OR user's team
                    const tid = teamId || res.data.team?.id;
                    if (tid) {
                        api.get(`/kpis/team/${tid}`).then(kpiRes => setGroups(kpiRes.data));
                    }
                }
            });
        }
    }, [userId, teamId]);

    // Fetch existing evaluation to pre-fill
    useEffect(() => {
        const fetchExisting = async () => {
            if (!userId) return;
            try {
                // We use the periods endpoint logic but specific single period
                const period = `${selectedYear}-${selectedQuarter}`;
                const res = await api.get(`/evaluations/user/${userId}?periods=${period}`);
                
                if (res.data && res.data.groups) {
                    const existingScores: Record<number, number> = {};
                    const existingComments: Record<number, string> = {};

                    res.data.groups.forEach((g: any) => {
                        g.items.forEach((i: any) => {
                            existingScores[i.id] = i.score;
                        });
                        if (g.comment) {
                            existingComments[g.id] = g.comment;
                        }
                    });

                    setScores(existingScores);
                    setGroupComments(existingComments);
                } else {
                    // Reset if no existing evaluation found for this period
                    setScores({});
                    setGroupComments({});
                }
            } catch (error) {
                console.error("Failed to fetch existing evaluation", error);
            }
        };
        fetchExisting();
    }, [userId, selectedYear, selectedQuarter]);

    const handleScoreChange = (itemId: number, val: string) => {
        setScores(prev => ({ ...prev, [itemId]: parseFloat(val) || 0 }));
    };

    const handleCommentChange = (groupId: number, val: string) => {
        setGroupComments(prev => ({ ...prev, [groupId]: val }));
    };

    const handleSubmit = async () => {
        if (!userId || !user) return;
        setLoading(true);
        try {
            // 1. Create Evaluation
            const evalRes = await api.post('/evaluations', {
                employeeId: parseInt(userId),
                quarter: selectedQuarter,
                year: selectedYear
            });
            
            const evaluationId = evalRes.data.id;

            // 2. Submit scores & comments
            const items = Object.entries(scores).map(([kpiItemId, score]) => ({
                kpiItemId: parseInt(kpiItemId),
                score
            }));

            const comments = Object.entries(groupComments).map(([kpiGroupId, comment]) => ({
                kpiGroupId: parseInt(kpiGroupId),
                comment
            }));
            
            await api.post(`/evaluations/${evaluationId}/scores`, { items, comments });
            
            alert('Evaluation submitted successfully!');
            if (user?.role === 'ADMIN') {
                navigate('/admin/users');
            } else {
                navigate('/manager/team');
            }
        } catch (error) {
            console.error(error);
            alert('Error submitting evaluation');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">
                {targetUser ? `Evaluate ${targetUser.name}` : 'Perform Evaluation'}
            </h2>
            
            <div className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-4">
                <h3 className="text-xl font-bold text-white">Evaluation Period</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Year</label>
                        <select 
                            className="w-full rounded-lg bg-black/40 border border-white/10 p-2 text-white"
                            value={selectedYear}
                            onChange={e => setSelectedYear(parseInt(e.target.value))}
                        >
                            {[2023, 2024, 2025, 2026].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Quarter</label>
                        <select 
                            className="w-full rounded-lg bg-black/40 border border-white/10 p-2 text-white"
                            value={selectedQuarter}
                            onChange={e => setSelectedQuarter(e.target.value)}
                        >
                            {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
                                <option key={q} value={q}>{q}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                {groups.map(group => (
                    <div key={group.id} className="rounded-xl border border-white/10 bg-white/5 p-6">
                        <h3 className="mb-4 text-xl font-bold text-white">{group.name}</h3>
                        <div className="space-y-4">
                            {group.items.map(item => (
                                <div key={item.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-black/20 p-4 rounded-lg">
                                    <div>
                                        <p className="font-medium text-white">{item.name}</p>
                                        <p className="text-sm text-gray-500">Weight: {item.weight}%</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-400 mb-1 block">Score (0-100)</label>
                                        <input 
                                            type="number" 
                                            min="0" 
                                            max="100" 
                                            className="w-full rounded-lg bg-black/40 border border-white/10 p-2 text-white"
                                            value={scores[item.id] || ''}
                                            onChange={e => handleScoreChange(item.id, e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <label className="text-sm font-medium text-gray-400 mb-2 block">Group Comment / Notes</label>
                            <textarea
                                className="w-full rounded-lg bg-black/40 border border-white/10 p-3 text-white h-24 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Add notes explaining the score for this group..."
                                value={groupComments[group.id] || ''}
                                onChange={e => handleCommentChange(group.id, e.target.value)}
                            />
                        </div>
                    </div>
                ))}

                <button 
                    onClick={handleSubmit} 
                    disabled={loading}
                    className="w-full flex justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 p-4 font-bold text-white shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99]"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Save />}
                    {Object.keys(scores).length > 0 ? 'Update Evaluation' : 'Submit Evaluation'}
                </button>
            </div>
        </div>
    );
};
