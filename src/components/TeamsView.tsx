import React, { useState } from 'react';
import { Layers, Plus, Users, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../utils/calculations';

export const TeamsView: React.FC = () => {
  const { activeEvent, addTeam, currentRole } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [budget, setBudget] = useState('');
  const [leadMemberId, setLeadMemberId] = useState('');

  if (!activeEvent) return null;

  const canManage = currentRole === 'finance_manager' || currentRole === 'event_admin' || currentRole === 'org_admin';

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    await addTeam(teamName.trim(), parseFloat(budget) || 0, leadMemberId || undefined);
    setIsModalOpen(false);
    setTeamName('');
    setBudget('');
  };

  return (
    <div className="space-y-4 pb-20 sm:pb-8 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Event Teams</h1>
          <p className="text-xs text-slate-500">
            {activeEvent.teams.length} Teams registered for {activeEvent.name}
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Team</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {activeEvent.teams.map((t) => {
          const teamExpenses = activeEvent.expenses.filter(
            (e) => (e.teamId === t.id || e.teamName === t.name) && (e.approvalStatus === 'approved' || e.approvalStatus === 'paid')
          );
          const totalSpent = teamExpenses.reduce((sum, e) => sum + e.amount, 0);

          return (
            <div key={t.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-slate-900 text-sm block">{t.name}</span>
                  {t.leadMemberName && (
                    <span className="text-[11px] text-slate-500 block">Lead: {t.leadMemberName}</span>
                  )}
                </div>

                <span className="font-black text-xs text-slate-900 bg-slate-100 px-2.5 py-1 rounded-xl">
                  Budget: {formatINR(t.budget)}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                <span>Spent: <strong className="text-rose-600 font-bold">{formatINR(totalSpent)}</strong></span>
                <span>Remaining: <strong className="text-emerald-600 font-bold">{formatINR(Math.max(0, t.budget - totalSpent))}</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 text-xs animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Create Event Team</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-500 mb-1">Team Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stage & Decoration, Hospitality"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Assigned Budget (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="0"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Assign Team Lead</label>
                <select
                  value={leadMemberId}
                  onChange={(e) => setLeadMemberId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="">Select Team Lead (Optional)</option>
                  {activeEvent.members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role.replace('_', ' ')})
                    </option>
                  ))}
                </select>
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
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
