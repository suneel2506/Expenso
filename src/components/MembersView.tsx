import React, { useState } from 'react';
import { Users, Plus, ShieldCheck, Trash2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';

export const MembersView: React.FC = () => {
  const { activeEvent, addMember, removeMember, currentRole } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('member');
  const [teamId, setTeamId] = useState('');

  if (!activeEvent) return null;

  const canManage = currentRole === 'finance_manager' || currentRole === 'event_admin' || currentRole === 'org_admin';

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await addMember(name.trim(), email.trim() || undefined, role, teamId || undefined);
    setIsModalOpen(false);
    setName('');
    setEmail('');
  };

  const handleRemove = async (memberId: string) => {
    const res = await removeMember(memberId);
    if (!res.success) {
      alert(res.error);
    }
  };

  return (
    <div className="space-y-4 pb-20 sm:pb-8 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Event Members</h1>
          <p className="text-xs text-slate-500">
            {activeEvent.members.length} Members registered for {activeEvent.name}
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {activeEvent.members.map((m) => (
          <div
            key={m.id}
            className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0"
                style={{ backgroundColor: m.color }}
              >
                {m.name.charAt(0)}
              </div>

              <div>
                <span className="font-extrabold text-slate-900 block">{m.name}</span>
                <span className="text-[10px] text-slate-400 block">
                  {m.email || 'Member'} {m.teamName ? `· Team: ${m.teamName}` : ''}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full uppercase">
                {m.role.replace('_', ' ')}
              </span>

              {canManage && activeEvent.members.length > 1 && (
                <button
                  onClick={() => handleRemove(m.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Remove Member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 text-xs animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Add Event Member</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-500 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="rahul@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="member">Member</option>
                    <option value="team_lead">Team Lead</option>
                    <option value="finance_manager">Finance Manager</option>
                    <option value="event_admin">Event Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 mb-1">Assign Team</label>
                  <select
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="">No Specific Team</option>
                    {activeEvent.teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 bg-slate-100 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-emerald-600 text-white font-bold rounded-xl shadow-xs"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
