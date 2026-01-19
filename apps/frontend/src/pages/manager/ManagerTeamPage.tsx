import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface User { id: number; name: string; email: string; role: string; }
interface Team { id: number; name: string; members: User[] }

export const ManagerTeamPage = () => {
    const { user } = useAuthStore();
    const [team, setTeam] = useState<Team | null>(null);
    const [stats, setStats] = useState<{ overallScore: number, memberCount: number, evaluatedCount: number } | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Need to find which team this manager manages. 
        // For MVP, fetch all teams and find where managerId matches.
        // Ideally backend provides /manager/me or similar.
        // Or users/me includes managedTeams.
        const fetchTeam = async () => {
            setLoading(true);
            try {
                // Assuming we can get user details or team list
                // Let's rely on getting all teams and filtering for now (Inefficient but simple for demo)
                const res = await api.get('/teams');
                // The user object from login might not have ID as number, let's parse
                const userId = parseInt(user?.id as any);
                const myTeam = res.data.find((t: any) => t.managerId === userId);
                setTeam(myTeam);

                if (myTeam) {
                    const statsRes = await api.get(`/evaluations/team/${myTeam.id}/stats`);
                    setStats(statsRes.data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchTeam();
    }, [user]);

    if(loading) return <div>Loading team...</div>;
    if(!team) return <div>No team found managed by you.</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-3xl font-bold text-white">My Team: {team.name}</h2>
                {stats && (
                    <div className="flex items-center gap-4 rounded-xl bg-white/5 border border-white/10 px-6 py-3">
                         <span className="text-sm text-gray-400">Overall Performance</span>
                         <span className={`text-2xl font-bold ${
                             stats.overallScore >= 90 ? 'text-green-400' :
                             stats.overallScore >= 70 ? 'text-blue-400' :
                             stats.overallScore >= 50 ? 'text-yellow-400' : 'text-red-400'
                         }`}>
                             {stats.overallScore.toFixed(1)}%
                         </span>
                    </div>
                )}
            </div>

            <div className="grid gap-6">
                {team.members.map(member => (
                    <div key={member.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:bg-white/10">
                         <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-blue-400 font-bold text-lg">
                                {member.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">{member.name}</h3>
                                <p className="text-sm text-gray-500">{member.email}</p>
                            </div>
                         </div>
                         
                         <div className="flex gap-4">
                            {parseInt(user?.id as any) !== member.id && (
                                <Link 
                                    to={`/manager/evaluate/${member.id}?teamId=${team.id}`}
                                    className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    Evaluate
                                </Link>
                            )}
                         </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
