import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Receipt,
  User,
  Building,
  Calendar,
  Layers,
  ShieldCheck,
  Trash2,
  Edit2,
  FileText,
  DollarSign,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CATEGORY_CONFIG, canRoleApproveExpense, formatINR } from '../utils/calculations';
import { Expense } from '../types';

interface ExpenseDetailModalProps {
  expense: Expense | null;
  onClose: () => void;
}

export const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({ expense, onClose }) => {
  const { activeEvent, currentRole, approveExpense, rejectExpense, markExpensePaid, deleteExpense } = useApp();

  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectReason] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!expense || !activeEvent) return null;

  const canApprove = canRoleApproveExpense(currentRole, expense.amount);
  const isPending = expense.approvalStatus === 'submitted' || expense.approvalStatus === 'under_review';

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await approveExpense(expense.id, approvalNotes);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setIsProcessing(true);
    try {
      await rejectExpense(expense.id, rejectReason);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkPaid = async () => {
    setIsProcessing(true);
    try {
      await markExpensePaid(expense.id);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this expense record?')) {
      await deleteExpense(expense.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col animate-in fade-in">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xl shrink-0">
              {CATEGORY_CONFIG[expense.category]?.emoji || '📦'}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                {expense.merchant}
              </h2>
              <span className="text-xs text-slate-500 block">
                {expense.category} · {expense.date}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Big Amount Card & Approval Status */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                Total Amount
              </span>
              <span className="text-2xl font-black text-emerald-400 tabular-nums">
                {formatINR(expense.amount)}
              </span>
            </div>

            <div className="text-right">
              <span
                className={`text-xs font-black px-3 py-1 rounded-full inline-block ${
                  expense.approvalStatus === 'approved' || expense.approvalStatus === 'paid'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : expense.approvalStatus === 'submitted'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {expense.approvalStatus === 'approved'
                  ? '✓ Approved'
                  : expense.approvalStatus === 'paid'
                  ? '✓ Paid'
                  : expense.approvalStatus === 'submitted'
                  ? 'Under Review'
                  : 'Rejected'}
              </span>
              {expense.approvalThresholdNote && (
                <span className="text-[10px] text-slate-400 block mt-1">
                  {expense.approvalThresholdNote}
                </span>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Paid By</span>
              <span className="font-extrabold text-slate-900 block">{expense.paidByMemberName}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Source</span>
              <span className="font-extrabold text-slate-900 block capitalize">
                {expense.paymentSource.replace('_', ' ')}
              </span>
            </div>

            {expense.teamName && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Team</span>
                <span className="font-extrabold text-slate-900 block">{expense.teamName}</span>
              </div>
            )}

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Created By</span>
              <span className="font-extrabold text-slate-900 block">{expense.createdBy}</span>
            </div>
          </div>

          {/* Description & Notes */}
          {expense.description && (
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-500 block uppercase tracking-wider text-[10px] mb-1">
                Description
              </span>
              <p className="text-slate-800 font-medium leading-relaxed">{expense.description}</p>
              {expense.notes && (
                <p className="text-slate-500 mt-1 italic text-[11px]">Note: {expense.notes}</p>
              )}
            </div>
          )}

          {/* Original Receipt Photo if attached */}
          {expense.billImageUrl && (
            <div className="space-y-2">
              <span className="text-xs font-extrabold text-slate-900 block">Original Bill Receipt</span>
              <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-56 bg-slate-900">
                <img
                  src={expense.billImageUrl}
                  alt="Bill receipt"
                  className="w-full h-full object-contain mx-auto"
                />
              </div>
            </div>
          )}

          {/* OCR Extracted Items Breakdown */}
          {expense.ocrData?.items && expense.ocrData.items.length > 0 && (
            <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200 text-xs space-y-1.5">
              <span className="font-bold text-emerald-800 uppercase tracking-wider text-[10px] block">
                AI Extracted Line Items ({expense.ocrData.items.length})
              </span>
              {expense.ocrData.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-slate-700 text-[11px]">
                  <span>
                    {item.quantity ? `${item.quantity}x ` : ''}
                    {item.name}
                  </span>
                  <span className="font-mono font-bold">{formatINR(item.price)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Splits Breakdown */}
          {expense.splits && expense.splits.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-extrabold text-slate-900 block">
                Participants Split ({expense.splits.length})
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {expense.splits.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <span className="font-semibold text-slate-800">{s.memberName}</span>
                    <span className="font-extrabold text-slate-900 tabular-nums">
                      {formatINR(s.shareAmount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approver Action Panel for Authorized Roles */}
          {isPending && canApprove && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-300 space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Approval Actions ({currentRole.replace('_', ' ').toUpperCase()})</span>
              </div>

              {!showRejectInput ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Expense</span>
                  </button>
                  <button
                    onClick={() => setShowRejectReason(true)}
                    className="py-2.5 px-4 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs rounded-xl flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Reason for rejection..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full p-2 bg-white border border-rose-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleReject}
                      disabled={isProcessing || !rejectReason.trim()}
                      className="py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex-1"
                    >
                      Confirm Rejection
                    </button>
                    <button
                      onClick={() => setShowRejectReason(false)}
                      className="py-2 px-3 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mark Paid action for approved expenses */}
          {expense.approvalStatus === 'approved' && (currentRole === 'finance_manager' || currentRole === 'event_admin' || currentRole === 'org_admin') && (
            <button
              onClick={handleMarkPaid}
              disabled={isProcessing}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl shadow-xs flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Mark as Fully Paid / Disbursed</span>
            </button>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
          <button
            onClick={handleDelete}
            className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Record</span>
          </button>
          <button
            onClick={onClose}
            className="py-2 px-5 bg-slate-200 hover:bg-slate-300 font-bold text-slate-800 text-xs rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
