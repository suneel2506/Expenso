import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { ExpenseFeedView } from './components/ExpenseFeedView';
import { MoneyOverviewView } from './components/MoneyOverviewView';
import { BalancesView } from './components/BalancesView';
import { BudgetView } from './components/BudgetView';
import { ReimbursementsView } from './components/ReimbursementsView';
import { AdvancesView } from './components/AdvancesView';
import { TeamsView } from './components/TeamsView';
import { MembersView } from './components/MembersView';
import { VendorsView } from './components/VendorsView';
import { AuditLogView } from './components/AuditLogView';
import { ReportsClosureView } from './components/ReportsClosureView';
import { MoreMenuView } from './components/MoreMenuView';
import { AddExpenseModal } from './components/AddExpenseModal';
import { ExpenseDetailModal } from './components/ExpenseDetailModal';
import { CreateTripModal } from './components/CreateTripModal';
import { JoinTripModal } from './components/JoinTripModal';
import { OfflineBanner } from './components/OfflineBanner';
import { Expense } from './types';
import { ArrowLeft } from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    activeEvent,
    activeTab,
    setActiveTab,
    moreSubTab,
    setMoreSubTab,
    isAddExpenseOpen,
    setIsAddExpenseOpen,
    selectedExpense,
    setSelectedExpense,
    events,
  } = useApp();

  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [isJoinEventOpen, setIsJoinEventOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  if (!activeEvent || events.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-3xl flex items-center justify-center font-black text-2xl mb-4">
          E
        </div>
        <h1 className="text-2xl font-black mb-2">Welcome to Expenso</h1>
        <p className="text-xs text-slate-400 max-w-xs mb-6">
          Events & IV Expense Management Platform. Track every rupee from budget to final report.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setIsCreateEventOpen(true)}
            className="py-3 px-5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-lg"
          >
            Create Event
          </button>
          <button
            onClick={() => setIsJoinEventOpen(true)}
            className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700"
          >
            Join Event
          </button>
        </div>

        <CreateTripModal isOpen={isCreateEventOpen} onClose={() => setIsCreateEventOpen(false)} />
        <JoinTripModal isOpen={isJoinEventOpen} onClose={() => setIsJoinEventOpen(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 font-sans antialiased">
      {/* Offline Connectivity Banner */}
      <OfflineBanner />

      {/* Top Navbar */}
      <Navbar
        onCreateEventClick={() => setIsCreateEventOpen(true)}
        onJoinEventClick={() => setIsJoinEventOpen(true)}
      />

      {/* Main View Container */}
      <main className="min-h-screen px-3 sm:px-6 py-4 max-w-4xl mx-auto">
        {/* Sub-navigation back button when deep inside More subtabs */}
        {activeTab === 'more' && moreSubTab !== null && (
          <div className="mb-3">
            <button
              onClick={() => setMoreSubTab(null)}
              className="py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to More Modules</span>
            </button>
          </div>
        )}

        {/* Tab Routing */}
        {activeTab === 'home' && (
          <DashboardView
            onAddExpenseClick={() => {
              setEditingExpense(null);
              setIsAddExpenseOpen(true);
            }}
            onViewAllExpenses={() => setActiveTab('expenses')}
            onOpenMoreSubTab={(sub) => {
              setActiveTab('more');
              setMoreSubTab(sub);
            }}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpenseFeedView
            onAddExpenseClick={() => {
              setEditingExpense(null);
              setIsAddExpenseOpen(true);
            }}
          />
        )}

        {activeTab === 'money' && (
          <MoneyOverviewView
            onOpenMoreSubTab={(sub) => {
              setActiveTab('more');
              setMoreSubTab(sub);
            }}
          />
        )}

        {activeTab === 'balances' && <BalancesView />}

        {activeTab === 'more' && (
          <>
            {moreSubTab === null && (
              <MoreMenuView
                onSelectSubTab={(sub) => {
                  if (sub === 'balances') {
                    setActiveTab('balances');
                  } else {
                    setMoreSubTab(sub);
                  }
                }}
              />
            )}
            {moreSubTab === 'teams' && <TeamsView />}
            {moreSubTab === 'members' && <MembersView />}
            {moreSubTab === 'budget' && <BudgetView />}
            {moreSubTab === 'reimbursements' && <ReimbursementsView />}
            {moreSubTab === 'advances' && <AdvancesView />}
            {moreSubTab === 'vendors' && <VendorsView />}
            {moreSubTab === 'audit' && <AuditLogView />}
            {moreSubTab === 'closure' && <ReportsClosureView />}
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Modals */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setEditingExpense(null);
        }}
        initialExpense={editingExpense}
      />

      {selectedExpense && (
        <ExpenseDetailModal
          expense={selectedExpense}
          onClose={() => setSelectedExpense(null)}
        />
      )}

      <CreateTripModal
        isOpen={isCreateEventOpen}
        onClose={() => setIsCreateEventOpen(false)}
      />

      <JoinTripModal
        isOpen={isJoinEventOpen}
        onClose={() => setIsJoinEventOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
