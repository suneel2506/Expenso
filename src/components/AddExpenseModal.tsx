import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Upload,
  Sparkles,
  Check,
  AlertCircle,
  Users,
  CreditCard,
  FileText,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  Info,
  Building,
  Wallet,
  Clock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CATEGORY_CONFIG, calculateEqualSplits, calculatePercentageSplits, formatINR, validateUnequalSplits } from '../utils/calculations';
import { ExpenseCategory, ExtractedOcrData, PaymentSource, SplitMethod } from '../types';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialExpense?: any; // For editing
}

type Step = 'input' | 'scanning' | 'verify' | 'split';

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, initialExpense }) => {
  const { activeEvent, currentUser, addExpense, updateExpense, broadcastChange } = useApp();

  const [method, setMethod] = useState<'upload' | 'manual'>('upload');
  const [currentStep, setCurrentStep] = useState<Step>('input');

  // Form states
  const [amount, setAmount] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [teamId, setTeamId] = useState<string>('');
  const [paymentSource, setPaymentSource] = useState<PaymentSource>('event_money');
  const [advanceId, setAdvanceId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [paidByMemberId, setPaidByMemberId] = useState<string>('');

  // Bill Image & AI State
  const [billImage, setBillImage] = useState<string | null>(null);
  const [scanStatusIndex, setScanStatusIndex] = useState(0);
  const [ocrData, setOcrData] = useState<ExtractedOcrData | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);

  // Participants & Splits
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal');
  const [customShares, setCustomShares] = useState<Record<string, string>>({});
  const [percentageShares, setPercentageShares] = useState<Record<string, string>>({});

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const scanStages = [
    'Scanning your bill...',
    'Reading merchant...',
    'Finding total amount...',
    'Checking date & taxes...',
    'Preparing expense...',
  ];

  // Initialize or reset form
  useEffect(() => {
    if (!isOpen || !activeEvent) return;

    if (initialExpense) {
      setMethod('manual');
      setCurrentStep('input');
      setAmount(initialExpense.amount.toString());
      setMerchant(initialExpense.merchant);
      setCategory(initialExpense.category);
      setTeamId(initialExpense.teamId || '');
      setPaymentSource(initialExpense.paymentSource || 'event_money');
      setAdvanceId(initialExpense.advanceId || '');
      setDate(initialExpense.date);
      setDescription(initialExpense.description);
      setNotes(initialExpense.notes || '');
      setPaidByMemberId(initialExpense.paidByMemberId);
      setBillImage(initialExpense.billImageUrl || null);
      setOcrData(initialExpense.ocrData || null);
      setSplitMethod(initialExpense.splitMethod || 'equal');

      const memberIds = initialExpense.splits?.map((s: any) => s.memberId) || [];
      setSelectedMemberIds(memberIds);

      const shares: Record<string, string> = {};
      const pcts: Record<string, string> = {};
      initialExpense.splits?.forEach((s: any) => {
        shares[s.memberId] = s.shareAmount.toString();
        if (s.percentage) pcts[s.memberId] = s.percentage.toString();
      });
      setCustomShares(shares);
      setPercentageShares(pcts);
    } else {
      setMethod('upload');
      setCurrentStep('input');
      setAmount('');
      setMerchant('');
      setCategory('Food');
      setTeamId(activeEvent.teams[0]?.id || '');
      setPaymentSource('event_money');
      setAdvanceId('');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setNotes('');
      setBillImage(null);
      setOcrData(null);
      setScanError(null);
      setSplitMethod('equal');

      const userMember = activeEvent.members.find((m) => m.userId === currentUser.id);
      const defaultPayerId = userMember ? userMember.id : activeEvent.members[0]?.id || '';
      setPaidByMemberId(defaultPayerId);

      const allIds = activeEvent.members.map((m) => m.id);
      setSelectedMemberIds(allIds);

      const evenPct = (100 / (allIds.length || 1)).toFixed(2);
      const initialPcts: Record<string, string> = {};
      allIds.forEach((id) => {
        initialPcts[id] = evenPct;
      });
      setPercentageShares(initialPcts);
    }
  }, [isOpen, initialExpense, activeEvent, currentUser]);

  if (!isOpen || !activeEvent) return null;

  // Helper to compress image client-side to ensure it stays well under Vercel's 4.5MB payload limit
  const compressImage = (file: File, maxWidth = 1400, quality = 0.82): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Handle image upload and trigger AI OCR scan
  const handleImageFile = async (file: File) => {
    if (!file) return;

    setScanError(null);
    setCurrentStep('scanning');
    setScanStatusIndex(0);

    const interval = setInterval(() => {
      setScanStatusIndex((prev) => (prev < scanStages.length - 1 ? prev + 1 : prev));
    }, 700);

    try {
      // Compress image client-side before sending to serverless endpoint
      const base64Data = await compressImage(file);
      setBillImage(base64Data);

      const response = await fetch('/api/scan-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: 'image/jpeg',
        }),
      });

      clearInterval(interval);

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const extracted = result.data;
          setOcrData(extracted);
          if (extracted.merchant && extracted.merchant !== 'Unknown Merchant' && extracted.merchant !== 'Scanned Bill') {
            setMerchant(extracted.merchant);
          }
          if (extracted.amount && extracted.amount > 0) {
            setAmount(extracted.amount.toString());
          }
          if (extracted.date) setDate(extracted.date);
          if (extracted.category && CATEGORY_CONFIG[extracted.category]) {
            setCategory(extracted.category as ExpenseCategory);
          }
          if (extracted.suggestedDescription) {
            setDescription(extracted.suggestedDescription);
          }

          setCurrentStep('verify');
          return;
        }
      }
      
      // If scanning did not return extracted fields, proceed gracefully with receipt attached
      setCurrentStep('input');
      setMethod('manual');
    } catch (err: any) {
      clearInterval(interval);
      console.warn('Scan request error, continuing to manual entry:', err);
      setCurrentStep('input');
      setMethod('manual');
    }
  };

  // Generate description using AI
  const handleGenerateAIDescription = async () => {
    if (!merchant && !amount) return;
    setIsGeneratingDesc(true);
    try {
      const res = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant,
          amount: parseFloat(amount) || 0,
          category,
          tripName: activeEvent.name,
          location: activeEvent.destination,
        }),
      });
      const data = await res.json();
      if (data.description) {
        setDescription(data.description);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const toggleMember = (memberId: string) => {
    setSelectedMemberIds((prev) => {
      if (prev.includes(memberId)) {
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  const selectAllMembers = () => {
    setSelectedMemberIds(activeEvent.members.map((m) => m.id));
  };

  const handleSave = async () => {
    setValidationError(null);
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setValidationError('Please enter a valid amount greater than ₹0.');
      return;
    }

    if (!merchant.trim()) {
      setValidationError('Please enter a merchant or place name.');
      return;
    }

    if (selectedMemberIds.length === 0) {
      setValidationError('Please select at least one participant.');
      return;
    }

    const payer = activeEvent.members.find((m) => m.id === paidByMemberId);
    if (!payer) {
      setValidationError('Please select who paid for this expense.');
      return;
    }

    const team = activeEvent.teams.find((t) => t.id === teamId);

    const participants = activeEvent.members.filter((m) => selectedMemberIds.includes(m.id));
    let splits: any[] = [];

    if (splitMethod === 'equal') {
      splits = calculateEqualSplits(parsedAmount, participants);
    } else if (splitMethod === 'unequal') {
      const customItems = participants.map((p) => ({
        shareAmount: parseFloat(customShares[p.id] || '0') || 0,
      }));
      const validation = validateUnequalSplits(parsedAmount, customItems);
      if (!validation.isValid) {
        setValidationError(
          `Sum of member shares (${formatINR(
            customItems.reduce((acc, c) => acc + c.shareAmount, 0)
          )}) does not match total expense amount (${formatINR(parsedAmount)}). Difference: ${formatINR(
            Math.abs(validation.diff)
          )}`
        );
        return;
      }

      splits = participants.map((p) => ({
        memberId: p.id,
        memberName: p.name,
        shareAmount: parseFloat(customShares[p.id] || '0') || 0,
      }));
    } else if (splitMethod === 'percentage') {
      const pctItems = participants.map((p) => ({
        member: p,
        percentage: parseFloat(percentageShares[p.id] || '0') || 0,
      }));
      const totalPct = pctItems.reduce((acc, c) => acc + c.percentage, 0);
      if (Math.abs(totalPct - 100) > 0.1) {
        setValidationError(`Total percentage must equal 100%. Current total: ${totalPct.toFixed(1)}%`);
        return;
      }
      splits = calculatePercentageSplits(parsedAmount, pctItems);
    }

    setIsSubmitting(true);
    try {
      const fallbackDesc = description.trim() || `${category} at ${merchant.trim()}`;

      if (initialExpense) {
        await updateExpense(initialExpense.id, {
          amount: parsedAmount,
          merchant: merchant.trim(),
          category,
          teamId: team?.id,
          teamName: team?.name,
          paymentSource,
          advanceId: paymentSource === 'advance' ? advanceId : undefined,
          date,
          description: fallbackDesc,
          notes: notes.trim() || undefined,
          paidByMemberId: payer.id,
          paidByMemberName: payer.name,
          splitMethod,
          splits,
          billImageUrl: billImage || undefined,
          ocrData: ocrData || undefined,
        });
      } else {
        await addExpense({
          eventId: activeEvent.id,
          amount: parsedAmount,
          merchant: merchant.trim(),
          category,
          teamId: team?.id,
          teamName: team?.name,
          paymentSource,
          advanceId: paymentSource === 'advance' ? advanceId : undefined,
          date,
          description: fallbackDesc,
          notes: notes.trim() || undefined,
          paidByMemberId: payer.id,
          paidByMemberName: payer.name,
          splitMethod,
          splits,
          billImageUrl: billImage || undefined,
          ocrData: ocrData || undefined,
          createdBy: currentUser.name,
        });
      }

      onClose();
    } catch (err: any) {
      console.error('Error saving expense:', err);
      setValidationError('Unable to save expense. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCount = selectedMemberIds.length;
  const currentEqualShare =
    parseFloat(amount) > 0 && selectedCount > 0 ? parseFloat(amount) / selectedCount : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xl">
              +
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                {initialExpense ? 'Edit Expense' : 'Add New Expense'}
              </h2>
              <p className="text-xs text-slate-500">
                {activeEvent.name} · {selectedCount} participants
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Method Selector Toggle */}
          {!initialExpense && currentStep === 'input' && (
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setMethod('upload')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  method === 'upload'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>Scan / Upload Bill</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod('manual')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  method === 'manual'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Manual Entry</span>
              </button>
            </div>
          )}

          {/* Error Banner */}
          {(scanError || validationError) && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{scanError || validationError}</span>
              </div>
            </div>
          )}

          {/* STEP 1: SCANNING ANIMATION */}
          {currentStep === 'scanning' && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-44 h-56 bg-slate-100 rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-md">
                {billImage && (
                  <img
                    src={billImage}
                    alt="Receipt preview"
                    className="w-full h-full object-cover opacity-70"
                  />
                )}
                <div className="absolute inset-x-0 h-1 bg-emerald-500 shadow-[0_0_12px_#10B981] animate-bounce" />
                <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2 text-sm font-bold text-emerald-700">
                  <Sparkles className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>{scanStages[scanStatusIndex]}</span>
                </div>
                <p className="text-xs text-slate-400">Extracting merchant, totals, GST & date...</p>
              </div>
            </div>
          )}

          {/* STEP 2: VERIFICATION STEP ("We found this") */}
          {currentStep === 'verify' && (
            <div className="space-y-4 bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                    We found this bill
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep('input')}
                  className="text-xs font-extrabold text-emerald-700 hover:text-emerald-900 underline"
                >
                  Edit details
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="bg-white p-3 rounded-xl border border-emerald-100">
                  <span className="text-slate-400 block text-[10px]">Merchant</span>
                  <span className="font-extrabold text-slate-900 text-xs truncate block">{merchant}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-100">
                  <span className="text-slate-400 block text-[10px]">Grand Total</span>
                  <span className="font-black text-emerald-600 text-sm block">
                    {formatINR(parseFloat(amount) || 0)}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-100">
                  <span className="text-slate-400 block text-[10px]">Date</span>
                  <span className="font-semibold text-slate-800 block">{date}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-100">
                  <span className="text-slate-400 block text-[10px]">Category</span>
                  <span className="font-semibold text-slate-800 block">
                    {CATEGORY_CONFIG[category]?.emoji} {category}
                  </span>
                </div>
              </div>

              {ocrData?.items && ocrData.items.length > 0 && (
                <div className="bg-white p-3 rounded-xl border border-emerald-100 text-xs text-slate-600">
                  <span className="font-bold block text-slate-800 mb-1">
                    Detected Items ({ocrData.items.length}):
                  </span>
                  <div className="space-y-0.5 max-h-24 overflow-y-auto">
                    {ocrData.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-[11px]">
                        <span>
                          {item.quantity ? `${item.quantity}x ` : ''}
                          {item.name}
                        </span>
                        <span className="font-mono text-slate-700">{formatINR(item.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep('split')}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Confirm Expense & Select Payer →</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 0: INPUT FORM */}
          {currentStep === 'input' && (
            <>
              {/* Photo Upload Dropzone */}
              {method === 'upload' && !billImage && (
                <div className="space-y-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleImageFile(e.target.files[0]);
                    }}
                  />
                  <input
                    type="file"
                    ref={cameraInputRef}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleImageFile(e.target.files[0]);
                    }}
                  />

                  <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-3xl p-6 text-center transition-colors bg-slate-50/60">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                      <Camera className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-extrabold text-slate-800 mb-1">
                      Snap or upload the bill receipt
                    </p>
                    <p className="text-xs text-slate-500 mb-4 max-w-xs mx-auto">
                      AI scans the grand total, merchant, date, and items automatically.
                    </p>

                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Take Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Choose File</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Amount Big Input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Amount Spent
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="any"
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums"
                    />
                  </div>
                </div>

                {/* Merchant / Place */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Merchant / Vendor / Place
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Annapoorna Caterers, ZoomCars, SoundPro"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Category & Team */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    >
                      {Object.keys(CATEGORY_CONFIG).map((catKey) => (
                        <option key={catKey} value={catKey}>
                          {CATEGORY_CONFIG[catKey].emoji} {CATEGORY_CONFIG[catKey].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Assign Team
                    </label>
                    <select
                      value={teamId}
                      onChange={(e) => setTeamId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    >
                      <option value="">General Event</option>
                      {activeEvent.teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Payment Source Selection */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Payment Source
                  </label>
                  <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setPaymentSource('event_money')}
                      className={`py-2 rounded-lg transition-colors ${
                        paymentSource === 'event_money'
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Event Money
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentSource('personal_money')}
                      className={`py-2 rounded-lg transition-colors ${
                        paymentSource === 'personal_money'
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Personal Pocket
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentSource('advance')}
                      className={`py-2 rounded-lg transition-colors ${
                        paymentSource === 'advance'
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Advance Received
                    </button>
                  </div>

                  {paymentSource === 'personal_money' && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-xl mt-1.5 border border-amber-200">
                      💡 Creates an automatic Reimbursement pending request for refund.
                    </p>
                  )}

                  {paymentSource === 'advance' && (
                    <div className="mt-2">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Select Advance</label>
                      <select
                        value={advanceId}
                        onChange={(e) => setAdvanceId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                      >
                        <option value="">Select Member Advance</option>
                        {activeEvent.advances.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.memberName} — ₹{a.amountReceived} ({a.purpose})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Date & AI Description */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Description
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateAIDescription}
                        disabled={isGeneratingDesc || !merchant}
                        className="text-[10px] font-extrabold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 disabled:opacity-40"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>AI Auto</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Stage backdrop flowers"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                {/* Attached Bill Image Preview */}
                {billImage && (
                  <div className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-2xl">
                    <img
                      src={billImage}
                      alt="Bill receipt"
                      className="w-12 h-12 object-cover rounded-xl border border-slate-300"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-slate-800 block truncate">
                        Receipt attached
                      </span>
                      <span className="text-[11px] text-emerald-600 block font-bold">
                        ✓ AI extracted
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBillImage(null)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-1"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Continue to Split button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const parsed = parseFloat(amount);
                    if (isNaN(parsed) || parsed <= 0) {
                      setValidationError('Please enter a valid amount.');
                      return;
                    }
                    if (!merchant.trim()) {
                      setValidationError('Please enter a merchant name.');
                      return;
                    }
                    setValidationError(null);
                    setCurrentStep('split');
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Continue to Payer & Split →</span>
                </button>
              </div>
            </>
          )}

          {/* STEP 3: PAYER & PARTICIPANTS SPLIT */}
          {currentStep === 'split' && (
            <div className="space-y-5">
              <button
                type="button"
                onClick={() => setCurrentStep('input')}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                ← Back to details
              </button>

              {/* Payer Selection */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                  Who paid this expense?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {activeEvent.members.map((member) => {
                    const isSelected = paidByMemberId === member.id;
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => setPaidByMemberId(member.id)}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 text-slate-900'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: member.color }}
                        >
                          {member.name.charAt(0)}
                        </div>
                        <span className="text-xs font-bold truncate flex-1">{member.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Split Mode Tabs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                    Split Mode
                  </label>
                  <span className="text-xs text-slate-500 font-bold">
                    Total: {formatINR(parseFloat(amount) || 0)}
                  </span>
                </div>
                <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setSplitMethod('equal')}
                    className={`py-1.5 rounded-lg transition-colors ${
                      splitMethod === 'equal'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Equal Split
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitMethod('unequal')}
                    className={`py-1.5 rounded-lg transition-colors ${
                      splitMethod === 'unequal'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Unequal (₹)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitMethod('percentage')}
                    className={`py-1.5 rounded-lg transition-colors ${
                      splitMethod === 'percentage'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Percentage (%)
                  </button>
                </div>
              </div>

              {/* Participants Selector & Shares */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                    Participants ({selectedCount}/{activeEvent.members.length})
                  </label>
                  <button
                    type="button"
                    onClick={selectAllMembers}
                    className="text-xs font-extrabold text-emerald-600 hover:text-emerald-700"
                  >
                    Select All
                  </button>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {activeEvent.members.map((member) => {
                    const isParticipating = selectedMemberIds.includes(member.id);

                    return (
                      <div
                        key={member.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                          isParticipating
                            ? 'bg-white border-slate-300 shadow-xs'
                            : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleMember(member.id)}
                          className="flex items-center gap-2.5 flex-1 text-left min-w-0"
                        >
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                              isParticipating
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'bg-white border-slate-300'
                            }`}
                          >
                            {isParticipating && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {member.name}
                          </span>
                        </button>

                        {isParticipating && (
                          <div className="shrink-0 flex items-center gap-1">
                            {splitMethod === 'equal' && (
                              <span className="text-xs font-black text-slate-800 tabular-nums">
                                {formatINR(currentEqualShare)}
                              </span>
                            )}

                            {splitMethod === 'unequal' && (
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                                  ₹
                                </span>
                                <input
                                  type="number"
                                  step="any"
                                  placeholder="0"
                                  value={customShares[member.id] || ''}
                                  onChange={(e) => {
                                    setCustomShares({
                                      ...customShares,
                                      [member.id]: e.target.value,
                                    });
                                  }}
                                  className="w-24 pl-5 pr-2 py-1 text-xs font-extrabold text-right bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 tabular-nums"
                                />
                              </div>
                            )}

                            {splitMethod === 'percentage' && (
                              <div className="relative">
                                <input
                                  type="number"
                                  step="any"
                                  placeholder="0"
                                  value={percentageShares[member.id] || ''}
                                  onChange={(e) => {
                                    setPercentageShares({
                                      ...percentageShares,
                                      [member.id]: e.target.value,
                                    });
                                  }}
                                  className="w-20 pl-2 pr-5 py-1 text-xs font-extrabold text-right bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 tabular-nums"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                                  %
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-extrabold text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
          >
            Cancel
          </button>

          {currentStep === 'split' ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSave}
              className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Expense</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                const parsed = parseFloat(amount);
                if (isNaN(parsed) || parsed <= 0) {
                  setValidationError('Please enter a valid amount.');
                  return;
                }
                if (!merchant.trim()) {
                  setValidationError('Please enter a merchant name.');
                  return;
                }
                setValidationError(null);
                setCurrentStep('split');
              }}
              className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
