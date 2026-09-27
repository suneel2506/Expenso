import React, { useState } from 'react';
import { PieChart, Plus, AlertTriangle, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CATEGORY_CONFIG, formatINR, getBudgetHealthStatus } from '../utils/calculations';

export const BudgetView: React.FC = () => {
  const { activeEvent, updateCategoryBudget, currentRole } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState('Food');
  const [allocated, setAllocated] = useState('');
  const [teamId, setTeamId] = useState('');
  const [warningConfirmed, setWarningConfirmed] = useState(false);

  if (!activeEvent) return null;

  const categorySpentMap: Record<string, number> = {};
  activeEvent.expenses.forEach((e) => {
    if (e.approvalStatus === 'approved' || e.approvalStatus === 'paid') {
      categorySpentMap[e.category] = (categorySpentMap[e.category] || 0) + e.amount;
    }
  });

  const parsedAllocated = parseFloat(allocated) || 0;
  const currentCategorySpent = categorySpentMap[selectedCat] || 0;
  const isBudgetLowerThanSpent = parsedAllocated > 0 && parsedAllocated < currentCategorySpent;

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(allocated);
    if (isNaN(parsed) || parsed < 0) return;

    if (isBudgetLowerThanSpent && !warningConfirmed) {
      alert(`This category already has ${formatINR(currentCategorySpent)} in expenses. Reducing its budget below this amount will mark it as over budget. Please check the confirmation box to proceed.`);
      return;
    }

    await updateCategoryBudget(selectedCat, parsed, teamId || undefined);
    setIsModalOpen(false);
    setAllocated('');
    setWarningConfirmed(false);
  };

  const totalAllocated = (activeEvent.budgets || []).reduce((sum, b) => sum + b.allocatedAmount, 0);
  const totalSpent = Object.values(categorySpentMap).reduce((sum, s) => sum + s, 0);

  return (
    <div className="space-y-4 pb-20 sm:pb-8 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Budget Management</h1>
          <p className="text-xs text-slate-500">
            Total Budget: <strong className="text-slate-900 font-extrabold">{formatINR(totalAllocated)}</strong> · Total Spent: <strong className="text-rose-600 font-extrabold">{formatINR(totalSpent)}</strong>
          </p>
        </div>

        {(currentRole === 'finance_manager' || currentRole === 'event_admin' || currentRole === 'org_admin') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Set Budget</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        {(activeEvent.budgets && activeEvent.budgets.length > 0 ? activeEvent.budgets : []).map((bgt) => {
          const spent = categorySpentMap[bgt.category] || 0;
          const health = getBudgetHealthStatus(spent, bgt.allocatedAmount);

          return (
            <div key={bgt.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-lg">
                    {CATEGORY_CONFIG[bgt.category]?.emoji || '📦'}
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 block">{bgt.category}</span>
                    {bgt.teamName && (
                      <span className="text-[10px] text-slate-500 font-medium">Team: {bgt.teamName}</span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-slate-900 font-black block tabular-nums">
                    {formatINR(spent)} / {formatINR(bgt.allocatedAmount)}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border inline-block mt-0.5 ${health.badgeColor}`}>
                    {health.label}
                  </span>
                </div>
              </div>

              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${health.barColor}`}
                  style={{ width: `${Math.min(100, health.percent)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Set Category Budget</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-500 mb-1">Category</label>
                <select
                  value={selectedCat}
                  onChange={(e) => setSelectedCat(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  {Object.keys(CATEGORY_CONFIG).map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_CONFIG[c].emoji} {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Allocated Budget (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="0"
                  value={allocated}
                  onChange={(e) => setAllocated(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Assign to Team (Optional)</label>
                <select
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  <option value="">All Event Teams</option>
                  {activeEvent.teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {isBudgetLowerThanSpent && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 space-y-2">
                  <p className="text-[11px] font-bold leading-tight">
                    ⚠️ This category already has <strong className="text-amber-950 font-black">{formatINR(currentCategorySpent)}</strong> in expenses. Reducing its budget below this amount will mark it as over budget.
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={warningConfirmed}
                      onChange={(e) => setWarningConfirmed(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                    />
                    <span className="text-[11px] font-extrabold text-amber-950">
                      I understand and confirm this budget change
                    </span>
                  </label>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-emerald-600 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
