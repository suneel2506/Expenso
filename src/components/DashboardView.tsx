import React, { useState } from 'react';
import {
  Wallet,
  TrendingDown,
  Lock,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Building,
  AlertTriangle,
  ChevronRight,
  Clock,
  CheckCircle2,
  FileCheck2,
  Users,
  PieChart,
  HandCoins,
  Copy,
  Check,
  Share2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateEventWallet, formatINR, getBudgetHealthStatus, CATEGORY_CONFIG } from '../utils/calculations';
import { AnimatedCounter } from './AnimatedCounter';

interface DashboardViewProps {
  onAddExpenseClick: () => void;
  onViewAllExpenses: () => void;
  onOpenMoreSubTab: (sub: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onAddExpenseClick,
  onViewAllExpenses,
  onOpenMoreSubTab,
}) => {
  const { activeEvent, currentRole, setSelectedExpense } = useApp();
  const [copiedCode, setCopiedCode] = useState(false);

  if (!activeEvent) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(activeEvent.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleShareInvite = async () => {
    const inviteUrl = `${window.location.origin}/?join=${activeEvent.code}`;
    const shareText = `Join "${activeEvent.name}" on Expenso using event code: ${activeEvent.code}\n${inviteUrl}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${activeEvent.name} on Expenso`,
          text: shareText,
          url: inviteUrl,
        });
        return;
      } catch {
        // user cancelled or share failed
      }
    }
    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // ignore
    }
  };

  const wallet = calculateEventWallet(activeEvent);

  // Compute category spent vs allocated
  const categorySpentMap: Record<string, number> = {};
  activeEvent.expenses.forEach((e) => {
    if (e.approvalStatus === 'approved' || e.approvalStatus === 'paid') {
      categorySpentMap[e.category] = (categorySpentMap[e.category] || 0) + e.amount;
    }
  });

  const recentExpenses = activeEvent.expenses.slice(0, 5);

  return (
    <div className="space-y-5 pb-20 sm:pb-8 animate-in fade-in">
      {/* 1. Mobile Event Wallet Header Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Background glow circle */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold uppercase tracking-wider">
              <Building className="w-3.5 h-3.5" />
              <span>{activeEvent.orgName}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
              {activeEvent.name}
            </h1>
          </div>
          <div className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-extrabold text-[11px] rounded-full">
            {activeEvent.status.toUpperCase()}
          </div>
        </div>

        {/* Big Available Funds Header */}
        <div className="mb-4 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 backdrop-blur-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <span>💰</span> Available Cash Funds
            </span>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              Cash Received - Spent
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-emerald-400 tabular-nums">
            <AnimatedCounter value={wallet.availableCash} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-700/60 pt-2 flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <span>Event Code:</span>
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-700/80 hover:bg-slate-700 text-emerald-400 font-mono font-bold uppercase transition-colors"
                title="Click to copy event code"
              >
                <span>{activeEvent.code}</span>
                {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 opacity-60" />}
              </button>
              <button
                onClick={handleShareInvite}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 font-medium transition-colors"
                title="Share invite link"
              >
                <Share2 className="w-3 h-3" />
                <span>Share</span>
              </button>
            </div>
            <span>{activeEvent.startDate} to {activeEvent.endDate}</span>
          </div>
        </div>

        {/* 4-Card Financial Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
          <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/40">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider mb-0.5 flex items-center justify-center gap-1">
              <span>📊</span> Budget
            </span>
            <span className="text-xs sm:text-sm font-black text-white tabular-nums block">
              {formatINR(wallet.totalBudget)}
            </span>
          </div>

          <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/40">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider mb-0.5 flex items-center justify-center gap-1">
              <span>💸</span> Spent
            </span>
            <span className="text-xs sm:text-sm font-black text-rose-400 tabular-nums block">
              {formatINR(wallet.spent)}
            </span>
          </div>

          <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/40">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider mb-0.5 flex items-center justify-center gap-1">
              <span>📌</span> Unfunded
            </span>
            <span className="text-xs sm:text-sm font-black text-amber-400 tabular-nums block">
              {formatINR(wallet.unfundedBudget)}
            </span>
          </div>

          <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/40">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider mb-0.5 flex items-center justify-center gap-1">
              <span>🛡️</span> Rem. Budget
            </span>
            <span className="text-xs sm:text-sm font-black text-sky-400 tabular-nums block">
              {formatINR(wallet.remainingBudget)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Action Banners / Quick Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={onAddExpenseClick}
          className="p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-xs font-bold text-xs flex items-center gap-2 transition-transform active:scale-95"
        >
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold">
            +
          </div>
          <div className="text-left">
            <span className="block font-black leading-tight">+ Add Expense</span>
            <span className="text-[10px] opacity-80 block font-normal">Scan or type</span>
          </div>
        </button>

        <button
          onClick={() => onOpenMoreSubTab('reimbursements')}
          className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl shadow-xs font-bold text-xs flex items-center justify-between transition-transform active:scale-95"
        >
          <div>
            <span className="text-[11px] text-slate-500 font-semibold block">Reimbursements</span>
            <span className="text-xs font-black text-slate-900 block">
              {formatINR(wallet.pendingReimbursements)}
            </span>
          </div>
          <HandCoins className="w-5 h-5 text-emerald-600 shrink-0" />
        </button>

        <button
          onClick={() => onOpenMoreSubTab('advances')}
          className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl shadow-xs font-bold text-xs flex items-center justify-between transition-transform active:scale-95"
        >
          <div>
            <span className="text-[11px] text-slate-500 font-semibold block">Advances</span>
            <span className="text-xs font-black text-slate-900 block">
              {formatINR(wallet.outstandingAdvances)}
            </span>
          </div>
          <Clock className="w-5 h-5 text-sky-600 shrink-0" />
        </button>

        <button
          onClick={() => onOpenMoreSubTab('budget')}
          className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl shadow-xs font-bold text-xs flex items-center justify-between transition-transform active:scale-95"
        >
          <div>
            <span className="text-[11px] text-slate-500 font-semibold block">Budgets</span>
            <span className="text-xs font-black text-slate-900 block">
              {activeEvent.budgets?.length || 0} Categories
            </span>
          </div>
          <PieChart className="w-5 h-5 text-purple-600 shrink-0" />
        </button>
      </div>

      {/* 3. Budget Health Section */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-600" />
            <span>Budget Health</span>
          </h2>
          <button
            onClick={() => onOpenMoreSubTab('budget')}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
          >
            <span>Manage All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {(activeEvent.budgets && activeEvent.budgets.length > 0 ? activeEvent.budgets : [
            { category: 'Food', allocatedAmount: 70000 },
            { category: 'Transport', allocatedAmount: 40000 },
            { category: 'Decoration', allocatedAmount: 25000 },
          ]).map((bgt) => {
            const spent = categorySpentMap[bgt.category] || 0;
            const health = getBudgetHealthStatus(spent, bgt.allocatedAmount);

            return (
              <div key={bgt.category} className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-1.5">
                    <span>{CATEGORY_CONFIG[bgt.category]?.emoji || '📦'}</span>
                    <span className="text-slate-900">{bgt.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-semibold">
                      {formatINR(spent)} / {formatINR(bgt.allocatedAmount)}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full border ${health.badgeColor}`}>
                      {health.percent}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${health.barColor}`}
                    style={{ width: `${Math.min(100, health.percent)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Recent Expenses Cards Feed */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>Recent Expenses</span>
          </h2>
          <button
            onClick={onViewAllExpenses}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
          >
            <span>View Feed ({activeEvent.expenses.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentExpenses.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
            <p className="text-xs font-bold text-slate-600">No expenses recorded yet</p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Tap + Add Expense to scan a bill or enter expenses for your event.
            </p>
            <button
              onClick={onAddExpenseClick}
              className="py-2 px-4 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              + Add Expense
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentExpenses.map((exp) => (
              <div
                key={exp.id}
                onClick={() => setSelectedExpense(exp)}
                className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-98"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-lg shrink-0">
                    {CATEGORY_CONFIG[exp.category]?.emoji || '📦'}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-slate-900 truncate block">
                      {exp.merchant}
                    </span>
                    <span className="text-[11px] text-slate-500 block truncate">
                      {exp.category} · Paid by {exp.paidByMemberName}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-extrabold text-xs text-slate-900 block tabular-nums">
                    {formatINR(exp.amount)}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md inline-block ${
                      exp.approvalStatus === 'approved' || exp.approvalStatus === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : exp.approvalStatus === 'submitted'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {exp.approvalStatus === 'approved'
                      ? '✓ Approved'
                      : exp.approvalStatus === 'paid'
                      ? '✓ Paid'
                      : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
