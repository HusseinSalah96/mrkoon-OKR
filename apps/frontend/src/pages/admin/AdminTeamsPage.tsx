import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Plus, Users as UsersIcon, Briefcase } from 'lucide-react';

interface Team {
    id: number;
    name: string;
    manager?: { id: number, name: string };
    members: { id: number }[];
}

export const AdminTeamsPage = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [newTeamName, setNewTeamName] = useState('');
    const [loading, setLoading] = useState(false);

    const [users, setUsers] = useState<{id: number, name: string, role: string}[]>([]);

    const fetchTeams = async () => {
        try {
            const [teamsRes, usersRes] = await Promise.all([
                api.get('/teams'),
                api.get('/users')
            ]);
            setTeams(teamsRes.data);
            setUsers(usersRes.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAssignManager = async (teamId: number, managerId: string) => {
        try {
            await api.post(`/teams/${teamId}`, { managerId: parseInt(managerId) });
            fetchTeams();
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchTeams();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTeamName) return;
        setLoading(true);
        try {
            await api.post('/teams', { name: newTeamName });
            setNewTeamName('');
            fetchTeams();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const managers = users.filter(u => u.role === 'MANAGER');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white">Teams Management</h2>
                    <p className="text-gray-400">Create and manage your organization's teams</p>
                </div>
            </div>

            {/* Create Team Form */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <form onSubmit={handleCreate} className="flex gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Team Name (e.g. Engineering)"
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                            className="w-full rounded-lg bg-black/20 border border-white/10 p-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !newTeamName}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                    >
                        <Plus className="h-5 w-5" />
                        Create Team
                    </button>
                </form>
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {teams.map((team) => (
                    <div key={team.id} className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:bg-white/10">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="rounded-lg bg-blue-500/10 p-3 text-blue-400">
                                <Briefcase className="h-6 w-6" />
                            </div>
                            <span className="text-xs font-medium text-gray-500">ID: {team.id}</span>
                        </div>
                        <h3 className="text-xl font-bold text-white">{team.name}</h3>
                        
                        <TeamStatsBadge teamId={team.id} />

                        <div className="mt-4 space-y-2 border-t border-white/5 pt-4">
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <UsersIcon className="h-4 w-4" />
                                <span>{team.members?.length || 0} Members</span>
                            </div>
                            <div className="text-sm text-gray-400">
                                <span className="block mb-1 text-gray-500">Manager:</span>
                                <select 
                                    className="w-full rounded bg-black/20 border border-white/10 p-2 text-white text-sm outline-none focus:border-blue-500"
                                    value={team.manager?.id || ''}
                                    onChange={(e) => handleAssignManager(team.id, e.target.value)}
                                >
                                    <option value="">Unassigned</option>
                                    {managers.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TeamStatsBadge = ({ teamId }: { teamId: number }) => {
    const [stats, setStats] = useState<{ overallScore: number } | null>(null);

    useEffect(() => {
        api.get(`/evaluations/team/${teamId}/stats`)
           .then(res => setStats(res.data))
           .catch(err => console.error(err));
    }, [teamId]);

    if (!stats) return null;

    return (
        <div className={`mt-3 flex items-center justify-between rounded-lg px-3 py-2 bg-black/20 border border-white/5`}>
            <span className="text-sm font-medium text-gray-400">Overall Score</span>
            <span className={`text-lg font-bold ${
                 stats.overallScore >= 90 ? 'text-green-400' :
                 stats.overallScore >= 70 ? 'text-blue-400' :
                 stats.overallScore >= 50 ? 'text-yellow-400' : 'text-red-400'
             }`}>
                 {stats.overallScore.toFixed(1)}%
            </span>
        </div>
    );
};
