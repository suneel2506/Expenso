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
import { LandingView } from './components/LandingView';
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

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const joinCode = params.get('join') || params.get('code');
      if (joinCode) {
        setIsJoinEventOpen(true);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 font-sans antialiased">
      {(!activeEvent || events.length === 0) ? (
        <LandingView
          onCreateEventClick={() => setIsCreateEventOpen(true)}
          onJoinSuccess={() => setIsJoinEventOpen(false)}
        />
      ) : (
        <>
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
        </>
      )}

      {/* Global Modals (Mounted Once and Kept Persistent) */}
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
