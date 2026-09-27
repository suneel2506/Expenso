import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  ArrowUpRight,
  TrendingDown,
  Lock,
  HandCoins,
  Clock,
  Building,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  ChevronRight,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateEventWallet, formatINR } from '../utils/calculations';
import { IncomeCategory } from '../types';

interface MoneyOverviewViewProps {
  onOpenMoreSubTab: (sub: any) => void;
}

export const MoneyOverviewView: React.FC<MoneyOverviewViewProps> = ({ onOpenMoreSubTab }) => {
  const { activeEvent, addIncomeRecord, currentRole } = useApp();

  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [category, setCategory] = useState<IncomeCategory>('Sponsorship');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  if (!activeEvent) return null;

  const wallet = calculateEventWallet(activeEvent);

  const handleSaveIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0 || !source.trim()) return;

    await addIncomeRecord({
      eventId: activeEvent.id,
      amount: parsedAmount,
      source: source.trim(),
      category,
      date,
      description: description.trim() || `${category} from ${source.trim()}`,
      addedBy: activeEvent.members[0]?.name || 'Admin',
      status: 'received',
    });

    setIsAddIncomeOpen(false);
    setAmount('');
    setSource('');
    setDescription('');
  };

  return (
    <div className="space-y-5 pb-20 sm:pb-8 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Money Overview</h1>
          <p className="text-xs text-slate-500">Central event financial cashflow and commitments</p>
        </div>

        {(currentRole === 'finance_manager' || currentRole === 'event_admin' || currentRole === 'org_admin') && (
          <button
            onClick={() => setIsAddIncomeOpen(true)}
            className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Income</span>
          </button>
        )}
      </div>

      {/* Wallet Summary Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-5 shadow-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Net Event Liquidity
          </span>
          <span className="text-xs font-bold text-emerald-400">INR (₹)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5">
              Money In
            </span>
            <span className="text-base font-black text-emerald-400 tabular-nums">
              {formatINR(wallet.totalFunds)}
            </span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5">
              Money Out (Spent)
            </span>
            <span className="text-base font-black text-rose-400 tabular-nums">
              {formatINR(wallet.spent)}
            </span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5">
              Committed
            </span>
            <span className="text-base font-black text-amber-400 tabular-nums">
              {formatINR(wallet.committed)}
            </span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5">
              Available
            </span>
            <span className="text-base font-black text-emerald-400 tabular-nums">
              {formatINR(wallet.available)}
            </span>
          </div>
        </div>
      </div>

      {/* 3 Shortcut Cards for Financial Workflows */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Pending Reimbursements Card */}
        <div
          onClick={() => onOpenMoreSubTab('reimbursements')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <HandCoins className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">Pending Reimbursements</span>
            <span className="text-lg font-black text-slate-900 tabular-nums block">
              {formatINR(wallet.pendingReimbursements)}
            </span>
          </div>
          <p className="text-[10px] text-slate-400">
            Refund requests for member personal money spent
          </p>
        </div>

        {/* Outstanding Advances Card */}
        <div
          onClick={() => onOpenMoreSubTab('advances')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">Outstanding Advances</span>
            <span className="text-lg font-black text-slate-900 tabular-nums block">
              {formatINR(wallet.outstandingAdvances)}
            </span>
          </div>
          <p className="text-[10px] text-slate-400">
            Event funds issued to leads awaiting final settlement
          </p>
        </div>

        {/* Vendors & Contracts Card */}
        <div
          onClick={() => onOpenMoreSubTab('vendors')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">Vendor Contracts</span>
            <span className="text-lg font-black text-slate-900 tabular-nums block">
              {activeEvent.vendors?.length || 0} Contracts
            </span>
          </div>
          <p className="text-[10px] text-slate-400">
            External caterers, stage, sound, bus rentals
          </p>
        </div>
      </div>

      {/* Income Records List */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            Money In Records ({activeEvent.incomeRecords?.length || 0})
          </h2>
          {(currentRole === 'finance_manager' || currentRole === 'event_admin' || currentRole === 'org_admin') && (
            <button
              onClick={() => setIsAddIncomeOpen(true)}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              + Record Income
            </button>
          )}
        </div>

        {!activeEvent.incomeRecords || activeEvent.incomeRecords.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
            No income records added yet. Tap + Add Income above.
          </div>
        ) : (
          <div className="space-y-2">
            {activeEvent.incomeRecords.map((inc) => (
              <div
                key={inc.id}
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <span className="font-extrabold text-slate-900 block">{inc.source}</span>
                  <span className="text-[11px] text-slate-500 block">
                    {inc.category} · {inc.date} · Added by {inc.addedBy}
                  </span>
                  {inc.description && (
                    <span className="text-[10px] text-slate-400 block mt-0.5">{inc.description}</span>
                  )}
                </div>

                <div className="text-right">
                  <span className="font-black text-sm text-emerald-600 block tabular-nums">
                    +{formatINR(inc.amount)}
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full inline-block mt-0.5">
                    ✓ Received
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Income Modal */}
      {isAddIncomeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Add Money In (Income)</h3>
              <button onClick={() => setIsAddIncomeOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIncome} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-500 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Source Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TCS Title Sponsor, College Treasury"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as IncomeCategory)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="College Funding">College Funding</option>
                    <option value="Sponsorship">Sponsorship</option>
                    <option value="Registration Fees">Registration Fees</option>
                    <option value="Ticket Sales">Ticket Sales</option>
                    <option value="Donations">Donations</option>
                    <option value="Department Contribution">Department Contribution</option>
                    <option value="Stall Fees">Stall Fees</option>
                    <option value="Other">Other Income</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Description / Proof Note</label>
                <input
                  type="text"
                  placeholder="e.g. Cheque cleared from Bank"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddIncomeOpen(false)}
                  className="py-2.5 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Income
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
