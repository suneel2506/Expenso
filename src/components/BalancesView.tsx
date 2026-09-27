import React, { useState } from 'react';
import {
  Wallet,
  ArrowRight,
  Check,
  CheckCircle2,
  Sparkles,
  Users,
  HandCoins,
  RefreshCw,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateMemberBalances, formatINR, simplifyDebts } from '../utils/calculations';
import { SimplifiedDebt } from '../types';

export const BalancesView: React.FC = () => {
  const { activeEvent, recordSettlement } = useApp();

  const [selectedDebt, setSelectedDebt] = useState<SimplifiedDebt | null>(null);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!activeEvent) return null;

  const memberBalances = calculateMemberBalances(
    activeEvent.members,
    activeEvent.expenses,
    activeEvent.settlements || []
  );

  const simplifiedTransfers = simplifyDebts(memberBalances);

  const handleSettleDebt = async () => {
    if (!selectedDebt) return;

    setIsSubmitting(true);
    try {
      const now = new Date();
      await recordSettlement({
        eventId: activeEvent.id,
        fromMemberId: selectedDebt.fromMemberId,
        fromMemberName: selectedDebt.fromMemberName,
        toMemberId: selectedDebt.toMemberId,
        toMemberName: selectedDebt.toMemberName,
        amount: selectedDebt.amount,
        date: now.toISOString().split('T')[0],
        note: note.trim() || `Settled debt of ${formatINR(selectedDebt.amount)}`,
      });

      setSelectedDebt(null);
      setNote('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 pb-20 sm:pb-8 animate-in fade-in">
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Balances & Settlements</h1>
        <p className="text-xs text-slate-500">
          Smart debt simplification for IV trips & group activity expenses
        </p>
      </div>

      {/* Simplified Debts Transfer Cards */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Simplified Debt Transfers ({simplifiedTransfers.length})
            </h2>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Min Cash-Flow Algorithm</span>
        </div>

        {simplifiedTransfers.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto font-black text-lg">
              🎉
            </div>
            <p className="text-sm font-extrabold text-slate-800">Everyone is all settled up!</p>
            <p className="text-xs text-slate-500">No pending debt payments among members.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {simplifiedTransfers.map((debt) => (
              <div
                key={debt.id}
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-extrabold text-slate-900 truncate">{debt.fromMemberName}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-extrabold text-slate-900 truncate">{debt.toMemberName}</span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-black text-sm text-slate-900 tabular-nums">
                    {formatINR(debt.amount)}
                  </span>

                  <button
                    onClick={() => setSelectedDebt(debt)}
                    className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    Settle
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Member Net Balances Breakdown */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
          Member Net Balances ({memberBalances.length})
        </h2>

        <div className="space-y-2">
          {memberBalances.map((b) => (
            <div
              key={b.memberId}
              className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-extrabold shrink-0"
                  style={{ backgroundColor: b.color }}
                >
                  {b.memberName.charAt(0)}
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 block">{b.memberName}</span>
                  <span className="text-[10px] text-slate-400 block">
                    Paid: {formatINR(b.totalPaid)} · Share: {formatINR(b.totalShare)}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`font-black text-xs block tabular-nums ${
                    b.status === 'receives'
                      ? 'text-emerald-600'
                      : b.status === 'owes'
                      ? 'text-rose-600'
                      : 'text-slate-500'
                  }`}
                >
                  {b.status === 'receives'
                    ? `Receives ${formatINR(b.netBalance)}`
                    : b.status === 'owes'
                    ? `Owes ${formatINR(Math.abs(b.netBalance))}`
                    : 'Settled ✓'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settle Debt Confirmation Modal */}
      {selectedDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 text-xs animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Record Settlement Payment</h3>
              <button onClick={() => setSelectedDebt(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1.5 text-center">
              <span className="text-xs text-slate-600 block">
                <strong>{selectedDebt.fromMemberName}</strong> is paying <strong>{selectedDebt.toMemberName}</strong>
              </span>
              <span className="text-2xl font-black text-emerald-700 block">
                {formatINR(selectedDebt.amount)}
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-500 mb-1">Payment Method / Note (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Paid via GPay / PhonePe / Cash"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedDebt(null)}
                className="py-2.5 px-4 bg-slate-100 font-bold rounded-xl text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSettleDebt}
                className="py-2.5 px-5 bg-emerald-600 text-white font-bold rounded-xl shadow-xs"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
