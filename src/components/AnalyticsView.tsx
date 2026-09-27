import React from 'react';
import { PieChart, TrendingUp, Users, Award, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CATEGORY_CONFIG, formatINR } from '../utils/calculations';

export const AnalyticsView: React.FC = () => {
  const { activeEvent } = useApp();

  if (!activeEvent) return null;

  const totalSpent = activeEvent.expenses.reduce((acc: number, curr) => acc + curr.amount, 0);

  // Group by category
  const categoryTotals: Record<string, number> = {};
  activeEvent.expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4 pb-20 sm:pb-8 animate-in fade-in">
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Financial Analytics</h1>
        <p className="text-xs text-slate-500">
          Spending breakdowns and category consumption analytics
        </p>
      </div>

      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs">
        <h2 className="font-extrabold text-slate-900 uppercase tracking-wider text-xs">
          Category Distribution (Total: {formatINR(totalSpent)})
        </h2>

        <div className="space-y-3">
          {sortedCategories.map(([cat, amt]) => {
            const pct = totalSpent > 0 ? Math.round((amt / totalSpent) * 100) : 0;
            return (
              <div key={cat} className="space-y-1">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>
                    {CATEGORY_CONFIG[cat]?.emoji || '📦'} {cat}
                  </span>
                  <span>
                    {formatINR(amt)} ({pct}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
