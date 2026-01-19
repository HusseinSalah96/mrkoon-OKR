import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../api/client';
import { Link } from 'react-router-dom';
import { User as UserIcon, Calendar, ArrowRight } from 'lucide-react';

interface Evaluation {
    id: number;
    quarter: string;
    year: number;
    createdAt: string;
    employee: {
        id: number;
        name: string;
        email: string;
    };
    finalScore?: number; // Depending on if we calculate it on flight or store it
}

export const ManagerEvaluationsPage = () => {
    const { user } = useAuthStore();
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchEvaluations = async () => {
            setLoading(true);
            try {
                // Determine logic to fetch scores
                const res = await api.get('/evaluations');
                // For now, list all. Might filter by manager's team in frontend or backend later.
                setEvaluations(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvaluations();
    }, []);

    // Helper to get score for an evaluation (since list might not have it computed)
    // For MVP we might not show score in list unless backend computes it.
    // We can fetch it individually or just link to profile.

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Evaluations History</h2>

            <div className="space-y-4">
                {evaluations.map(evalItem => (
                    <div key={evalItem.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                             <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                <UserIcon />
                             </div>
                             <div>
                                 <h3 className="text-lg font-bold text-white">{evalItem.employee.name}</h3>
                                 <div className="flex items-center gap-2 text-sm text-gray-400">
                                     <Calendar className="h-4 w-4" />
                                     <span>{evalItem.quarter} - {evalItem.year}</span>
                                     <span className="text-gray-600">•</span>
                                     <span>{new Date(evalItem.createdAt).toLocaleDateString()}</span>
                                 </div>
                             </div>
                        </div>

                        <Link 
                            to={`/${user?.role?.toLowerCase()}/users/${evalItem.employee.id}`} 
                            className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
                        >
                            View Details <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                ))}

                {evaluations.length === 0 && !loading && (
                    <div className="text-center text-gray-500 py-10">No evaluations found.</div>
                )}
            </div>
        </div>
    );
};
