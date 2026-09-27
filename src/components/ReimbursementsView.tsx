import React from 'react';
import { HandCoins, CheckCircle2, Clock, Check, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../utils/calculations';

export const ReimbursementsView: React.FC = () => {
  const { activeEvent, approveReimbursement, markReimbursementPaid, currentRole } = useApp();

  if (!activeEvent) return null;

  const reimbursements = activeEvent.reimbursements || [];
  const pendingTotal = reimbursements.filter((r) => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0);
  const paidTotal = reimbursements.filter((r) => r.status === 'paid').reduce((sum, r) => sum + r.amount, 0);

  const canManage = currentRole === 'finance_manager' || currentRole === 'event_admin' || currentRole === 'org_admin';

  return (
    <div className="space-y-4 pb-20 sm:pb-8 animate-in fade-in">
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Reimbursements</h1>
        <p className="text-xs text-slate-500">
          Pending: <strong className="text-amber-600 font-extrabold">{formatINR(pendingTotal)}</strong> · Paid: <strong className="text-emerald-600 font-extrabold">{formatINR(paidTotal)}</strong>
        </p>
      </div>

      {reimbursements.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-6 space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-xl font-black">
            🎉
          </div>
          <p className="text-sm font-bold text-slate-800">You're all settled!</p>
          <p className="text-xs text-slate-500">No member personal money reimbursement requests pending.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {reimbursements.map((rem) => (
            <div
              key={rem.id}
              className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs flex items-center justify-between gap-3 text-xs"
            >
              <div>
                <span className="font-extrabold text-slate-900 text-xs block">{rem.memberName}</span>
                <span className="text-[11px] text-slate-500 block">{rem.notes || 'Out-of-pocket expense'}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{rem.date}</span>
              </div>

              <div className="text-right space-y-1">
                <span className="font-black text-sm text-slate-900 block tabular-nums">
                  {formatINR(rem.amount)}
                </span>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                    rem.status === 'paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : rem.status === 'approved'
                      ? 'bg-sky-100 text-sky-800'
                      : rem.status === 'pending'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {rem.status === 'paid'
                    ? '✓ Paid / Refunded'
                    : rem.status === 'approved'
                    ? '✓ Approved'
                    : rem.status === 'pending'
                    ? 'Pending Review'
                    : 'Rejected'}
                </span>

                {canManage && rem.status === 'pending' && (
                  <button
                    onClick={() => approveReimbursement(rem.id)}
                    className="block mt-1 py-1 px-2.5 bg-emerald-600 text-white font-bold text-[10px] rounded-lg ml-auto"
                  >
                    Approve Request
                  </button>
                )}

                {canManage && rem.status === 'approved' && (
                  <button
                    onClick={() => markReimbursementPaid(rem.id)}
                    className="block mt-1 py-1 px-2.5 bg-slate-900 text-white font-bold text-[10px] rounded-lg ml-auto"
                  >
                    Mark Paid / Disbursed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
