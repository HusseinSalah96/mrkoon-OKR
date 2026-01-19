import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Plus, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface User {
    id: number;
    email: string;
    name: string;
    role: string;
    avatar?: string;
    team?: { id: number; name: string };
}

interface Team {
    id: number;
    name: string;
}

export const AdminUsersPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [selectedTeamFilter, setSelectedTeamFilter] = useState('');

    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('EMPLOYEE');
    const [teamId, setTeamId] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, teamsRes] = await Promise.all([
                api.get('/users'),
                api.get('/teams')
            ]);
            setUsers(usersRes.data);
            setTeams(teamsRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const [editingUserId, setEditingUserId] = useState<number | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateLoading(true);
        try {
            const data = {
                name,
                email,
                password,
                role: role.toUpperCase(),
                teamId: teamId ? parseInt(teamId) : undefined
            };

            if (editingUserId) {
                await api.patch(`/users/${editingUserId}`, data);
            } else {
                await api.post('/users', data);
            }

            resetForm();
            fetchData();
        } catch (error) {
            console.error(error);
            alert(`Failed to ${editingUserId ? 'update' : 'create'} user`);
        } finally {
            setCreateLoading(false);
        }
    };

    const handleEdit = (user: User) => {
        setEditingUserId(user.id);
        setName(user.name);
        setEmail(user.email);
        setRole(user.role);
        setTeamId(user.team?.id ? user.team.id.toString() : ''); // We lack team ID in listing, might need to rely on name or fetch details?
        // Actually, user listing usually includes nested team object, but maybe not ID if type doesn't say so?
        // Let's assume User interface has what we need or correct it. 
        // Checking interface: team?: { name: string } - oh, just name. We need ID.
        // Let's find team by name if possible, or better, update backend/frontend fetching to include team ID.
        // For now, let's try to map name to ID from 'teams' list.
        if (user.team && user.team.name) {
             const t = teams.find(t => t.name === user.team?.name);
             if (t) setTeamId(t.id.toString());
        } else {
            setTeamId('');
        }
    };

    const cancelEdit = () => {
        resetForm();
    };

    const resetForm = () => {
        setName('');
        setEmail('');
        setPassword('');
        setRole('EMPLOYEE');
        setTeamId('');
        setEditingUserId(null);
    };

    const handleDelete = async (user: User) => {
        if (!confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) return;

        try {
            await api.delete(`/users/${user.id}`);
            // If success
            fetchData();
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to delete user');
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editingUserId || !e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post(`/users/${editingUserId}/avatar`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchData(); // Refresh to show new avatar
        } catch (error) {
            console.error(error);
            alert('Failed to upload avatar');
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Users Management</h2>

            {/* Create/Edit User Form */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <h3 className="mb-4 text-lg font-semibold text-white">{editingUserId ? 'Edit User' : 'Add New User'}</h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 items-end">
                    
                    {/* Avatar Upload for Edit Mode */}
                    {editingUserId && (
                        <div className="flex items-center gap-4 mb-2">
                             <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold overflow-hidden">
                                {users.find(u => u.id === editingUserId)?.avatar ? (
                                    <img src={`http://localhost:3000${users.find(u => u.id === editingUserId)?.avatar}`} alt="Avatar" className="h-full w-full object-cover" />
                                ) : (
                                    name.charAt(0)
                                )}
                             </div>
                             <div>
                                 <label className="block text-xs text-gray-400 mb-1">Update Avatar</label>
                                 <input type="file" className="text-xs text-gray-400" accept="image/*" onChange={handleAvatarUpload} />
                             </div>
                        </div>
                    )}

                    <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} required 
                        className="w-full rounded-lg bg-black/20 border border-white/10 p-3 text-white focus:border-blue-500 outline-none" />
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required 
                        className="w-full rounded-lg bg-black/20 border border-white/10 p-3 text-white focus:border-blue-500 outline-none" />
                    <input type="password" placeholder={editingUserId ? "Password (leave blank to keep current)" : "Password"} value={password} onChange={e => setPassword(e.target.value)} required={!editingUserId}
                        className="w-full rounded-lg bg-black/20 border border-white/10 p-3 text-white focus:border-blue-500 outline-none" />
                    
                    <select value={role} onChange={e => setRole(e.target.value)} 
                        className="w-full rounded-lg bg-black/20 border border-white/10 p-3 text-white focus:border-blue-500 outline-none appearance-none">
                        <option value="EMPLOYEE">Employee</option>
                        <option value="MANAGER">Manager</option>
                        <option value="ADMIN">Admin</option>
                    </select>

                   <select value={teamId} onChange={e => setTeamId(e.target.value)} 
                        className="w-full rounded-lg bg-black/20 border border-white/10 p-3 text-white focus:border-blue-500 outline-none appearance-none">
                        <option value="">No Team</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>

                    <div className="flex gap-2">
                        <button type="submit" disabled={createLoading} 
                            className="flex-1 flex justify-center items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
                            {createLoading ? <Loader2 className="animate-spin h-5 w-5" /> : <>{editingUserId ? 'Update' : <><Plus className="h-5 w-5" /> Add User</>}</>}
                        </button>
                        {editingUserId && (
                            <button type="button" onClick={cancelEdit}
                                className="px-4 py-3 rounded-lg bg-white/10 text-white hover:bg-white/20">
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Filter and Table Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">All Users</h3>
                    
                    {/* Team Filter */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-400">Filter by Team:</label>
                        <select 
                            value={selectedTeamFilter} 
                            onChange={(e) => setSelectedTeamFilter(e.target.value)}
                            className="bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="">All Teams</option>
                            {teams.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
                    <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-white/5 text-xs uppercase text-gray-300">
                        <tr>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Team</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {users.filter(u => !selectedTeamFilter || u.team?.id?.toString() === selectedTeamFilter).map((user) => (
                            <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                                            {user.avatar ? (
                                                <img src={`http://localhost:3000${user.avatar}`} alt={user.name} className="h-full w-full object-cover" />
                                            ) : (
                                                user.name.charAt(0)
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-white font-medium">{user.name}</span>
                                            <span className="text-xs">{user.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={clsx(
                                        "inline-flex rounded-full px-2 py-1 text-xs font-semibold",
                                        user.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400' :
                                        user.role === 'MANAGER' ? 'bg-yellow-500/10 text-yellow-400' :
                                        'bg-blue-500/10 text-blue-400'
                                    )}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-medium text-white">
                                    {user.team?.name || '-'}
                                </td>
                                <td className="px-6 py-4">
                                    <Link to={`/admin/users/${user.id}`} className="text-blue-400 hover:text-blue-300 mr-4">View Profile</Link>
                                    {user.role === 'MANAGER' && (
                                        <Link to={`/admin/evaluate/${user.id}`} className="text-purple-400 hover:text-purple-300 mr-4">Evaluate</Link>
                                    )}
                                    <button onClick={() => handleEdit(user)} className="text-gray-400 hover:text-white mr-4">Edit</button>
                                    {user.role !== 'ADMIN' && (
                                        <button onClick={() => handleDelete(user)} className="text-red-400 hover:text-red-300">Delete</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {users.filter(u => !selectedTeamFilter || u.team?.id?.toString() === selectedTeamFilter).length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                    No users found matching the selected filter.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                {loading && <div className="p-8 text-center">Loading users...</div>}
                </div>
            </div>
        </div>
    );
};
