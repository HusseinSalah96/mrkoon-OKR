import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Plus, Target, Archive } from 'lucide-react';

interface Team { id: number; name: string; }
interface KpiGroup {
    id: number;
    name: string;
    weight: number;
    items: KpiItem[];
}
interface KpiItem {
    id: number;
    name: string;
    weight: number;
}

export const AdminKPIsPage = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
    const [kpiGroups, setKpiGroups] = useState<KpiGroup[]>([]);
    
    // Forms
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupWeight, setNewGroupWeight] = useState('');
    
    const [newItemName, setNewItemName] = useState('');
    const [newItemWeight, setNewItemWeight] = useState('');
    const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
    
    // Edit State
    const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
    const [editGroupName, setEditGroupName] = useState('');
    const [editGroupWeight, setEditGroupWeight] = useState('');

    const [editingItemId, setEditingItemId] = useState<number | null>(null);
    const [editItemName, setEditItemName] = useState('');
    const [editItemWeight, setEditItemWeight] = useState('');

    const [viewMode, setViewMode] = useState<'TEAMS' | 'MANAGERS'>('TEAMS');

    useEffect(() => {
        api.get('/teams').then(res => setTeams(res.data));
    }, []);

    useEffect(() => {
        if (viewMode === 'TEAMS') {
            if (selectedTeamId) {
                api.get(`/kpis/team/${selectedTeamId}`).then(res => setKpiGroups(res.data));
            } else {
                setKpiGroups([]);
            }
        } else {
            // Managers Mode
            api.get('/kpis/managers').then(res => setKpiGroups(res.data));
        }
    }, [selectedTeamId, viewMode]);

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = {
                name: newGroupName,
                weight: parseFloat(newGroupWeight),
            };

            if (viewMode === 'TEAMS') {
                if (!selectedTeamId) return;
                payload.teamId = selectedTeamId;
                payload.targetRole = 'EMPLOYEE';
            } else {
                payload.targetRole = 'MANAGER';
                // teamId omitted implies global
            }

            await api.post('/kpis/groups', payload);
            setNewGroupName('');
            setNewGroupWeight('');
            refreshData();
        } catch (error) { console.error(error); }
    };

    const refreshData = async () => {
        if (viewMode === 'TEAMS' && selectedTeamId) {
            const res = await api.get(`/kpis/team/${selectedTeamId}`);
            setKpiGroups(res.data);
        } else if (viewMode === 'MANAGERS') {
            const res = await api.get('/kpis/managers');
            setKpiGroups(res.data);
        }
    };

    const handleUpdateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingGroupId) return;
        try {
            await api.patch(`/kpis/groups/${editingGroupId}`, {
                name: editGroupName,
                weight: parseFloat(editGroupWeight)
            });
            setEditingGroupId(null);
            refreshData();
        } catch (error) { console.error(error); }
    };

    const handleUpdateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItemId) return;
        try {
            await api.patch(`/kpis/items/${editingItemId}`, {
                name: editItemName,
                weight: parseFloat(editItemWeight)
            });
            setEditingItemId(null);
            refreshData();
        } catch (error) { console.error(error); }
    };

    const startEditGroup = (group: KpiGroup) => {
        setEditingGroupId(group.id);
        setEditGroupName(group.name);
        setEditGroupWeight(group.weight.toString());
    };

    const startEditItem = (item: KpiItem) => {
        setEditingItemId(item.id);
        setEditItemName(item.name);
        setEditItemWeight(item.weight.toString());
    };

    const handleCreateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeGroupId) return;
        try {
            await api.post('/kpis/items', {
                name: newItemName,
                weight: parseFloat(newItemWeight),
                kpiGroupId: activeGroupId
            });
            setNewItemName('');
            setNewItemWeight('');
            setActiveGroupId(null);
             // Refresh
             refreshData();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">KPI Management</h2>
            
            {/* View Switching Tabs */}
            <div className="flex gap-4 border-b border-white/10 pb-4">
                <button 
                    onClick={() => setViewMode('TEAMS')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${viewMode === 'TEAMS' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    Team KPIs
                </button>
                <button 
                    onClick={() => setViewMode('MANAGERS')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${viewMode === 'MANAGERS' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    Manager KPIs (Global)
                </button>
            </div>

            {/* Team Selector (Only for TEAMS mode) */}
            {viewMode === 'TEAMS' && (
                <div className="flex items-center gap-4">
                    <label className="text-white">Select Team:</label>
                    <select 
                        className="rounded-lg bg-black/20 border border-white/10 p-3 text-white focus:border-blue-500 outline-none"
                        onChange={(e) => setSelectedTeamId(Number(e.target.value))}
                        value={selectedTeamId || ''}
                    >
                        <option value="">-- Select --</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
            )}

            {(selectedTeamId || viewMode === 'MANAGERS') && (
                <div className="space-y-8">
                    {/* Add Group Form */}
                    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                         <h3 className="mb-4 text-lg font-semibold text-white">
                             {viewMode === 'TEAMS' ? 'Add Team KPI Group' : 'Add Global Manager KPI Group'}
                         </h3>
                         <form onSubmit={handleCreateGroup} className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="text-sm text-gray-400">Group Name</label>
                                <input type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} required 
                                    className="w-full rounded-lg bg-black/20 border border-white/10 p-2 text-white" />
                            </div>
                            <div className="w-32">
                                <label className="text-sm text-gray-400">Weight (%)</label>
                                <input type="number" value={newGroupWeight} onChange={e => setNewGroupWeight(e.target.value)} required max="100"
                                    className="w-full rounded-lg bg-black/20 border border-white/10 p-2 text-white" />
                            </div>
                            <button type="submit" className="rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-500">
                                Add
                            </button>
                         </form>
                    </div>

                    {/* KPI Groups List */}
                    <div className="grid gap-6">
                        {kpiGroups.map(group => (
                            <div key={group.id} className="rounded-xl border border-white/10 bg-white/5 p-6">
                                {editingGroupId === group.id ? (
                                    <form onSubmit={handleUpdateGroup} className="flex gap-4 items-center mb-4">
                                        <input type="text" value={editGroupName} onChange={e => setEditGroupName(e.target.value)} className="flex-1 rounded-lg bg-black/40 border border-white/10 p-2 text-white" />
                                        <input type="number" value={editGroupWeight} onChange={e => setEditGroupWeight(e.target.value)} className="w-24 rounded-lg bg-black/40 border border-white/10 p-2 text-white" />
                                        <button type="submit" className="text-green-400 hover:text-green-300">Save</button>
                                        <button type="button" onClick={() => setEditingGroupId(null)} className="text-gray-400 hover:text-gray-300">Cancel</button>
                                    </form>
                                ) : (
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-3">
                                            <Archive className="text-purple-400 h-6 w-6"/>
                                            <h3 className="text-xl font-bold text-white">{group.name}</h3>
                                            <span className="rounded-full bg-purple-500/10 px-2 py-1 text-xs text-purple-400">
                                                Weight: {group.weight}%
                                            </span>
                                            <button onClick={() => startEditGroup(group)} className="text-xs text-gray-500 hover:text-white underline">Edit</button>
                                        </div>
                                        <button 
                                            onClick={() => setActiveGroupId(activeGroupId === group.id ? null : group.id)}
                                            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                        >
                                            <Plus className="h-4 w-4" /> Add Item
                                        </button>
                                    </div>
                                )}
                                
                                {activeGroupId === group.id && (
                                     <form onSubmit={handleCreateItem} className="mb-4 flex gap-4 items-end bg-black/20 p-4 rounded-lg">
                                        <div className="flex-1">
                                            <input type="text" placeholder="Item Name" value={newItemName} onChange={e => setNewItemName(e.target.value)} required 
                                                className="w-full rounded-lg bg-black/40 border border-white/10 p-2 text-white text-sm" />
                                        </div>
                                        <div className="w-24">
                                            <input type="number" placeholder="%" value={newItemWeight} onChange={e => setNewItemWeight(e.target.value)} required max="100"
                                                className="w-full rounded-lg bg-black/40 border border-white/10 p-2 text-white text-sm" />
                                        </div>
                                        <button type="submit" className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500">
                                            Save
                                        </button>
                                     </form>
                                )}

                                <div className="space-y-2">
                                    {group.items?.map(item => (
                                        <div key={item.id} className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                                            {editingItemId === item.id ? (
                                                <form onSubmit={handleUpdateItem} className="flex-1 flex gap-2 items-center">
                                                     <input type="text" value={editItemName} onChange={e => setEditItemName(e.target.value)} className="flex-1 rounded bg-black/40 border border-white/10 p-1 text-white text-sm" />
                                                     <input type="number" value={editItemWeight} onChange={e => setEditItemWeight(e.target.value)} className="w-16 rounded bg-black/40 border border-white/10 p-1 text-white text-sm" />
                                                     <button type="submit" className="text-xs text-green-400">Save</button>
                                                     <button type="button" onClick={() => setEditingItemId(null)} className="text-xs text-gray-400">Cancel</button>
                                                </form>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-2">
                                                        <Target className="h-4 w-4 text-gray-500" />
                                                        <span className="text-gray-300">{item.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs text-gray-500 font-mono bg-black/40 px-2 py-1 rounded">
                                                            {item.weight}%
                                                        </span>
                                                        <button onClick={() => startEditItem(item)} className="text-xs text-gray-500 hover:text-white">Edit</button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                    {(!group.items || group.items.length === 0) && (
                                        <p className="text-sm text-gray-500 italic">No KPI items yet.</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
