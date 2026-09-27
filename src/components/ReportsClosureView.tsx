import React, { useState } from 'react';
import { FileText, Download, Printer, Lock, CheckCircle2, Building, ShieldCheck, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateEventWallet, formatINR, CATEGORY_CONFIG } from '../utils/calculations';

export const ReportsClosureView: React.FC = () => {
  const { activeEvent, closeEvent, deleteEvent, setActiveTab, currentRole } = useApp();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!activeEvent) return null;

  const wallet = calculateEventWallet(activeEvent);

  const canManage = currentRole === 'finance_manager' || currentRole === 'event_admin' || currentRole === 'org_admin';

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Date', 'Merchant', 'Category', 'Team', 'Amount (INR)', 'Payment Source', 'Status', 'Paid By'];
    const rows = activeEvent.expenses.map((e) => [
      e.id,
      e.date,
      `"${e.merchant.replace(/"/g, '""')}"`,
      e.category,
      e.teamName || 'General',
      e.amount,
      e.paymentSource,
      e.approvalStatus,
      `"${e.paidByMemberName.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeEvent.name}_Expense_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmClose = async () => {
    if (window.confirm('Are you sure you want to perform official financial closure and archive this event?')) {
      await closeEvent();
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteEvent(activeEvent.id);
      setActiveTab('home');
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="space-y-5 pb-20 sm:pb-8 animate-in fade-in print:p-0 print:space-y-3">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Reports & Closure</h1>
          <p className="text-xs text-slate-500">
            Generate financial reports, print statements, and archive events
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="py-2 px-3 bg-white border border-slate-200 hover:bg-slate-50 font-bold text-xs rounded-xl flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print PDF</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Printable Statement Sheet */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-600 block uppercase tracking-wider">
              {activeEvent.orgName}
            </span>
            <h2 className="text-xl font-black text-slate-900">{activeEvent.name}</h2>
            <p className="text-xs text-slate-500">
              Dates: {activeEvent.startDate} to {activeEvent.endDate} · Location: {activeEvent.destination || 'India'}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-slate-400 block uppercase">Status</span>
            <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full inline-block mt-0.5">
              {activeEvent.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Financial Balance Summary Box */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Total Income</span>
            <span className="text-sm font-black text-emerald-600 tabular-nums">{formatINR(wallet.totalFunds)}</span>
          </div>
          <div>
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Total Spending</span>
            <span className="text-sm font-black text-rose-600 tabular-nums">{formatINR(wallet.spent)}</span>
          </div>
          <div>
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Committed</span>
            <span className="text-sm font-black text-amber-600 tabular-nums">{formatINR(wallet.committed)}</span>
          </div>
          <div>
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Final Balance</span>
            <span className="text-sm font-black text-slate-900 tabular-nums">{formatINR(wallet.available)}</span>
          </div>
        </div>

        {/* Expenses List Statement */}
        <div className="space-y-2">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
            Detailed Transaction Ledger ({activeEvent.expenses.length})
          </h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 text-[11px] font-bold">
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Merchant</th>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5">Paid By</th>
                  <th className="p-2.5 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeEvent.expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-medium text-slate-500">{exp.date}</td>
                    <td className="p-2.5 font-bold text-slate-900">{exp.merchant}</td>
                    <td className="p-2.5 text-slate-700">{exp.category}</td>
                    <td className="p-2.5 text-slate-700">{exp.paidByMemberName}</td>
                    <td className="p-2.5 text-right font-black text-slate-900 tabular-nums">
                      {formatINR(exp.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Financial Closure & Archiving Card */}
      {canManage && activeEvent.status !== 'completed' && (
        <div className="bg-amber-50 p-5 rounded-3xl border border-amber-200 space-y-3 print:hidden">
          <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
            <Lock className="w-5 h-5 text-amber-600" />
            <span>Event Financial Closure</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            Completing financial closure seals this event and archives it. The event remains viewable for reference and reporting, but no further expenses can be added.
          </p>
          <button
            onClick={handleConfirmClose}
            className="py-2.5 px-5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Perform Event Closure & Archive
          </button>
        </div>
      )}

      {/* Danger Zone: Permanently Delete Event */}
      <div className="bg-rose-50/70 p-5 rounded-3xl border border-rose-200 space-y-3 print:hidden">
        <div className="flex items-center gap-2 text-rose-900 font-extrabold text-sm">
          <Trash2 className="w-5 h-5 text-rose-600" />
          <span>Danger Zone: Delete Event</span>
        </div>
        <p className="text-xs text-rose-800 leading-relaxed">
          Permanently delete <strong>"{activeEvent.name}"</strong>. This will erase all recorded expenses, member records, and budget allocations. This action cannot be reversed.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="py-2.5 px-5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Permanently Delete Event</span>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 text-slate-900 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Permanently Delete Event?</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-900 font-bold">"{activeEvent.name}"</strong>? All associated expenses, receipts, and records will be deleted forever.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Event</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
