import React from 'react';
import { X, Download, Printer, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../utils/calculations';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { activeEvent } = useApp();

  if (!isOpen || !activeEvent) return null;

  const handleExportCSV = () => {
    const headers = ['ID', 'Date', 'Merchant', 'Category', 'Amount (INR)', 'Paid By', 'Status'];
    const rows = activeEvent.expenses.map((e) => [
      e.id,
      e.date,
      `"${e.merchant.replace(/"/g, '""')}"`,
      e.category,
      e.amount,
      `"${e.paidByMemberName.replace(/"/g, '""')}"`,
      e.approvalStatus,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeEvent.name}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 border border-slate-200 text-xs animate-in fade-in">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-slate-900 text-base">Export Event Statement</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleExportCSV}
            className="w-full p-3 bg-slate-900 text-white font-bold rounded-xl flex items-center justify-between hover:bg-slate-800"
          >
            <span>Download CSV Spreadsheet</span>
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handlePrint}
            className="w-full p-3 bg-slate-100 text-slate-800 font-bold rounded-xl flex items-center justify-between hover:bg-slate-200"
          >
            <span>Print Formatted PDF</span>
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
