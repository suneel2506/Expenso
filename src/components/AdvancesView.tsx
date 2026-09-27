import React, { useState } from 'react';
import { Clock, Plus, CheckCircle2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../utils/calculations';

export const AdvancesView: React.FC = () => {
  const { activeEvent, addAdvance, settleAdvance, currentRole } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Settle Modal State
  const [settleAdvId, setSettleAdvId] = useState<string | null>(null);
  const [spentAmt, setSpentAmt] = useState('');
  const [returnedAmt, setReturnedAmt] = useState('');

  if (!activeEvent) return null;

  const advances = activeEvent.advances || [];
  const totalAdvances = advances.reduce((sum, a) => sum + a.amountReceived, 0);

  const canManage = currentRole === 'finance_manager' || currentRole === 'event_admin' || currentRole === 'org_admin';

  const handleIssueAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    const member = activeEvent.members.find((m) => m.id === memberId);

    if (!parsedAmount || parsedAmount <= 0 || !member) return;

    await addAdvance({
      eventId: activeEvent.id,
      memberId: member.id,
      memberName: member.name,
      teamId: member.teamId,
      teamName: member.teamName,
      amountReceived: parsedAmount,
      purpose: purpose.trim() || 'Event Advance',
      date,
    });

    setIsModalOpen(false);
    setAmount('');
    setPurpose('');
  };

  const handleConfirmSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleAdvId) return;

    await settleAdvance(settleAdvId, parseFloat(spentAmt) || 0, parseFloat(returnedAmt) || 0);
    setSettleAdvId(null);
  };

  return (
    <div className="space-y-4 pb-20 sm:pb-8 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Event Advances</h1>
          <p className="text-xs text-slate-500">
            Total Outstanding Advances: <strong className="text-sky-600 font-extrabold">{formatINR(totalAdvances)}</strong>
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => {
              setMemberId(activeEvent.members[0]?.id || '');
              setIsModalOpen(true);
            }}
            className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Advance</span>
          </button>
        )}
      </div>

      {advances.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-6 space-y-2 text-xs text-slate-500">
          No event advances issued yet. Tap + Issue Advance to distribute money to team leads.
        </div>
      ) : (
        <div className="space-y-3">
          {advances.map((adv) => (
            <div
              key={adv.id}
              className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-slate-900 text-xs block">{adv.memberName}</span>
                  <span className="text-[11px] text-slate-500 block">
                    {adv.purpose} {adv.teamName ? `· ${adv.teamName}` : ''}
                  </span>
                  <span className="text-[10px] text-slate-400 block">{adv.date}</span>
                </div>

                <div className="text-right">
                  <span className="font-black text-sm text-slate-900 block tabular-nums">
                    Received: {formatINR(adv.amountReceived)}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                      adv.status === 'settled'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {adv.status === 'settled' ? '✓ Settled' : 'Partially Settled / Outstanding'}
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-[11px]">
                <span>Spent: <strong className="text-slate-800">{formatINR(adv.amountSpent)}</strong></span>
                <span>Returned: <strong className="text-emerald-700">{formatINR(adv.returnedAmount)}</strong></span>
                <span>Remaining: <strong className="text-amber-700">{formatINR(Math.max(0, adv.amountReceived - adv.amountSpent - adv.returnedAmount))}</strong></span>
              </div>

              {canManage && adv.status !== 'settled' && (
                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => {
                      setSettleAdvId(adv.id);
                      setSpentAmt(adv.amountSpent.toString());
                      setReturnedAmt(adv.returnedAmount.toString());
                    }}
                    className="py-1 px-3 bg-slate-900 text-white font-bold text-[10px] rounded-lg"
                  >
                    Settle Advance
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Issue Advance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 text-xs animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Issue Event Advance</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueAdvance} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-500 mb-1">Select Member / Lead</label>
                <select
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                >
                  {activeEvent.members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Advance Amount (₹)</label>
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
                <label className="block font-bold text-slate-500 mb-1">Purpose / Notes</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stage decoration advance, bus fuel advance"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
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
                  Issue Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Advance Modal */}
      {settleAdvId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 text-xs animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Settle Member Advance</h3>
              <button onClick={() => setSettleAdvId(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSettle} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-500 mb-1">Total Amount Spent (₹)</label>
                <input
                  type="number"
                  required
                  value={spentAmt}
                  onChange={(e) => setSpentAmt(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Returned Cash to Treasury (₹)</label>
                <input
                  type="number"
                  required
                  value={returnedAmt}
                  onChange={(e) => setReturnedAmt(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSettleAdvId(null)}
                  className="py-2.5 px-4 bg-slate-100 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-emerald-600 text-white font-bold rounded-xl shadow-xs"
                >
                  Confirm Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
