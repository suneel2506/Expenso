import React from 'react';
import { Home, Receipt, Plus, Wallet, MoreHorizontal, Layers, Users, PieChart, RefreshCw, HandCoins, Building2, FileText, CheckCircle2, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, setIsAddExpenseOpen, moreSubTab, setMoreSubTab, activeEvent } = useApp();

  const pendingApprovals = (activeEvent?.expenses || []).filter(
    (e) => e.approvalStatus === 'submitted' || e.approvalStatus === 'under_review'
  ).length;

  const pendingReimbursements = (activeEvent?.reimbursements || []).filter(
    (r) => r.status === 'pending'
  ).length;

  const totalBadge = pendingApprovals + pendingReimbursements;

  return (
    <>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900 border-t border-slate-800 text-slate-400 px-2 py-1 flex items-center justify-around shadow-2xl backdrop-blur-lg bg-slate-900/95">
        {/* Home Tab */}
        <button
          onClick={() => {
            setActiveTab('home');
            setMoreSubTab(null);
          }}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 rounded-xl transition-all ${
            activeTab === 'home' ? 'text-emerald-400 font-bold' : 'hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        {/* Expenses Feed Tab */}
        <button
          onClick={() => {
            setActiveTab('expenses');
            setMoreSubTab(null);
          }}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 rounded-xl transition-all relative ${
            activeTab === 'expenses' ? 'text-emerald-400 font-bold' : 'hover:text-slate-200'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Expenses</span>
          {pendingApprovals > 0 && (
            <span className="absolute top-1 right-2.5 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
          )}
        </button>

        {/* Prominent Center Floating + Add Expense Button */}
        <div className="relative -top-4">
          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-90 transition-transform font-black border-4 border-slate-900"
            aria-label="Add Expense"
          >
            <Plus className="w-7 h-7 text-slate-950 stroke-[3]" />
          </button>
        </div>

        {/* Money Overview Tab */}
        <button
          onClick={() => {
            setActiveTab('money');
            setMoreSubTab(null);
          }}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 rounded-xl transition-all relative ${
            activeTab === 'money' ? 'text-emerald-400 font-bold' : 'hover:text-slate-200'
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Money</span>
          {pendingReimbursements > 0 && (
            <span className="absolute top-1 right-2.5 w-2 h-2 bg-amber-400 rounded-full" />
          )}
        </button>

        {/* More Tab */}
        <button
          onClick={() => {
            setActiveTab('more');
          }}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 rounded-xl transition-all relative ${
            activeTab === 'more' ? 'text-emerald-400 font-bold' : 'hover:text-slate-200'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">More</span>
          {totalBadge > 0 && (
            <span className="absolute top-1 right-2 min-w-4 h-4 px-1 bg-emerald-500 text-slate-950 font-black text-[9px] rounded-full flex items-center justify-center">
              {totalBadge}
            </span>
          )}
        </button>
      </nav>
    </>
  );
};
