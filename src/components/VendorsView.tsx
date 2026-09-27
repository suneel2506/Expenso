import React, { useState } from 'react';
import { Building, Plus, CheckCircle2, DollarSign, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../utils/calculations';

export const VendorsView: React.FC = () => {
  const { activeEvent, addVendor, recordVendorPayment, currentRole } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [category, setCategory] = useState('Transport');
  const [totalContract, setTotalContract] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Payment Modal
  const [payVendorId, setPayVendorId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');

  if (!activeEvent) return null;

  const vendors = activeEvent.vendors || [];
  const totalContracts = vendors.reduce((sum, v) => sum + v.totalContract, 0);
  const totalPending = vendors.reduce((sum, v) => sum + v.pendingAmount, 0);

  const canManage = currentRole === 'finance_manager' || currentRole === 'event_admin' || currentRole === 'org_admin';

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseFloat(totalContract);
    if (!name.trim() || !parsedAmt) return;

    await addVendor({
      eventId: activeEvent.id,
      name: name.trim(),
      contact: contact.trim() || 'N/A',
      category,
      totalContract: parsedAmt,
      dueDate,
      notes: notes.trim() || undefined,
    });

    setIsModalOpen(false);
    setName('');
    setContact('');
    setTotalContract('');
    setNotes('');
  };

  const handleConfirmPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payVendorId) return;
    const pAmt = parseFloat(payAmount);
    if (!pAmt || pAmt <= 0) return;

    await recordVendorPayment(payVendorId, pAmt);
    setPayVendorId(null);
    setPayAmount('');
  };

  return (
    <div className="space-y-4 pb-20 sm:pb-8 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Vendor Contracts</h1>
          <p className="text-xs text-slate-500">
            Total Contracts: <strong className="text-slate-900 font-extrabold">{formatINR(totalContracts)}</strong> · Pending: <strong className="text-amber-600 font-extrabold">{formatINR(totalPending)}</strong>
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vendor</span>
          </button>
        )}
      </div>

      {vendors.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-xs text-slate-500">
          No external vendor contracts added yet.
        </div>
      ) : (
        <div className="space-y-3">
          {vendors.map((v) => (
            <div key={v.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-slate-900 text-sm block">{v.name}</span>
                  <span className="text-[11px] text-slate-500 block">
                    Contact: {v.contact} · {v.category}
                  </span>
                  {v.notes && <span className="text-[10px] text-slate-400 block mt-0.5">{v.notes}</span>}
                </div>

                <div className="text-right">
                  <span className="font-black text-sm text-slate-900 block tabular-nums">
                    Contract: {formatINR(v.totalContract)}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                      v.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : v.status === 'partial'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {v.status === 'paid' ? '✓ Fully Paid' : v.status === 'partial' ? 'Partially Paid' : 'Unpaid'}
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-[11px]">
                <span>Paid: <strong className="text-emerald-700">{formatINR(v.paidAmount)}</strong></span>
                <span>Pending Due: <strong className="text-rose-600">{formatINR(v.pendingAmount)}</strong></span>
                <span>Due Date: <strong>{v.dueDate}</strong></span>
              </div>

              {canManage && v.pendingAmount > 0 && (
                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => {
                      setPayVendorId(v.id);
                      setPayAmount(v.pendingAmount.toString());
                    }}
                    className="py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg"
                  >
                    Record Payment
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Vendor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 text-xs animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Add Vendor Contract</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVendor} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-500 mb-1">Vendor / Agency Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ABC Travels, SoundPro Systems"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Contact Phone / Email</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="Transport">Transport</option>
                    <option value="Food & Catering">Catering</option>
                    <option value="Decoration">Stage & Decor</option>
                    <option value="Technical">Sound & Lighting</option>
                    <option value="Accommodation">Accommodation</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 mb-1">Total Contract (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={totalContract}
                    onChange={(e) => setTotalContract(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Payment Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Notes / Terms</label>
                <input
                  type="text"
                  placeholder="e.g. 50% advance paid, 50% on completion"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
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
                  Save Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {payVendorId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 text-xs animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Record Vendor Payment</h3>
              <button onClick={() => setPayVendorId(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPay} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-500 mb-1">Payment Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayVendorId(null)}
                  className="py-2.5 px-4 bg-slate-100 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-emerald-600 text-white font-bold rounded-xl shadow-xs"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
