import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  X,
  Plus,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ChevronRight,
  Receipt,
  Building,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CATEGORY_CONFIG, formatINR } from '../utils/calculations';
import { Expense } from '../types';

interface ExpenseFeedViewProps {
  onAddExpenseClick: () => void;
}

export const ExpenseFeedView: React.FC<ExpenseFeedViewProps> = ({ onAddExpenseClick }) => {
  const { activeEvent, setSelectedExpense } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [showFilters, setShowFilters] = useState(false);

  if (!activeEvent) return null;

  // Filter and sort expenses
  const filteredExpenses = useMemo(() => {
    return activeEvent.expenses
      .filter((e) => {
        const matchesSearch =
          !search ||
          e.merchant.toLowerCase().includes(search.toLowerCase()) ||
          e.description.toLowerCase().includes(search.toLowerCase()) ||
          e.paidByMemberName.toLowerCase().includes(search.toLowerCase());

        const matchesCat = selectedCategory === 'all' || e.category === selectedCategory;
        const matchesTeam = selectedTeam === 'all' || e.teamId === selectedTeam || e.teamName === selectedTeam;
        const matchesStatus = selectedStatus === 'all' || e.approvalStatus === selectedStatus;
        const matchesSource = selectedSource === 'all' || e.paymentSource === selectedSource;

        return matchesSearch && matchesCat && matchesTeam && matchesStatus && matchesSource;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (sortBy === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (sortBy === 'highest') return b.amount - a.amount;
        if (sortBy === 'lowest') return a.amount - b.amount;
        return 0;
      });
  }, [activeEvent.expenses, search, selectedCategory, selectedTeam, selectedStatus, selectedSource, sortBy]);

  const totalFilteredAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-4 pb-20 sm:pb-8 animate-in fade-in">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Expenses Feed</h1>
          <p className="text-xs text-slate-500">
            {filteredExpenses.length} records · Total: <strong className="text-emerald-600 font-extrabold">{formatINR(totalFilteredAmount)}</strong>
          </p>
        </div>

        <button
          onClick={onAddExpenseClick}
          className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Expense</span>
        </button>
      </div>

      {/* Search & Filter Toggle Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search merchant, place, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`py-2.5 px-3.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
            showFilters || selectedCategory !== 'all' || selectedTeam !== 'all' || selectedStatus !== 'all'
              ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filters</span>
        </button>
      </div>

      {/* Expanded Filter Panel */}
      {showFilters && (
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3 text-xs animate-in fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Category Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              >
                <option value="all">All Categories</option>
                {Object.keys(CATEGORY_CONFIG).map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_CONFIG[c].emoji} {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Team Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Team</label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              >
                <option value="all">All Teams</option>
                {activeEvent.teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Approval Status Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="submitted">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Amount</option>
                <option value="lowest">Lowest Amount</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedTeam('all');
                setSelectedStatus('all');
                setSelectedSource('all');
                setSearch('');
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-800"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Expense Cards List */}
      {filteredExpenses.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-6 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
            🔍
          </div>
          <p className="text-sm font-bold text-slate-800">No matching expenses found</p>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Try adjusting your search terms or filters above.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredExpenses.map((exp) => (
            <div
              key={exp.id}
              onClick={() => setSelectedExpense(exp)}
              className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-2xs flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-98"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xl shrink-0 mt-0.5">
                  {CATEGORY_CONFIG[exp.category]?.emoji || '📦'}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-slate-900 truncate block">
                      {exp.merchant}
                    </span>
                    {exp.billImageUrl && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded-md font-bold shrink-0">
                        🧾 Receipt
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {exp.description || `${exp.category} expense`}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-slate-400">
                    <span>{exp.date}</span>
                    <span>·</span>
                    <span>Paid by <strong>{exp.paidByMemberName}</strong></span>
                    {exp.teamName && (
                      <>
                        <span>·</span>
                        <span className="bg-slate-100 px-1.5 py-0.2 rounded-md text-slate-600 font-semibold">
                          {exp.teamName}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-black text-sm text-slate-900 block tabular-nums">
                  {formatINR(exp.amount)}
                </span>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
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
                    : exp.approvalStatus === 'submitted'
                    ? 'Under Review'
                    : 'Rejected'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
