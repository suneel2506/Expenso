import React, { useState, useMemo } from 'react';
import {
  X,
  Calendar,
  MapPin,
  Check,
  Copy,
  ChevronRight,
  ChevronLeft,
  PieChart,
  Plus,
  Trash2,
  DollarSign,
  AlertCircle,
  Sparkles,
  Info,
  CheckCircle2,
  Building,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { formatINR, CATEGORY_CONFIG } from '../utils/calculations';
import { IncomeCategory } from '../types';

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTripCreated?: () => void;
}

interface CategoryBudgetItem {
  id: string;
  category: string;
  amount: number | string;
}

interface FundingSourceItem {
  id: string;
  sourceName: string;
  category: IncomeCategory;
  amount: number | string;
  date: string;
  description: string;
}

const EVENT_TYPES = [
  'IV Trip',
  'Symposium',
  'Cultural Event',
  'Sports Event',
  'College Fest',
  'Workshop',
  'Club Event',
  'Department Event',
  'Other',
];

const DEFAULT_CATEGORY_OPTIONS = [
  'Food',
  'Transport',
  'Accommodation',
  'Activities',
  'Decoration',
  'Technical',
  'Marketing',
  'Hospitality',
  'Prizes',
  'Emergency',
  'Other',
];

const FUNDING_SOURCE_PRESETS: IncomeCategory[] = [
  'College Funding',
  'Sponsorship',
  'Registration Fees',
  'Department Contribution',
  'Ticket Sales',
  'Donations',
  'Stall Fees',
  'Other',
];

export const CreateTripModal: React.FC<CreateTripModalProps> = ({
  isOpen,
  onClose,
  onTripCreated,
}) => {
  const { createEvent } = useApp();

  // Wizard Step State: 1 | 2 | 3 | 4 (Success)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Event Details
  const [name, setName] = useState('');
  const [eventType, setEventType] = useState('IV Trip');
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [destination, setDestination] = useState('');
  const [description, setDescription] = useState('');

  // Step 2: Budget & Funding
  const [totalBudgetInput, setTotalBudgetInput] = useState<string>('250000');
  const [allocationMode, setAllocationMode] = useState<'overall' | 'category'>(
    'category'
  );

  // Initial Default Categories
  const [categories, setCategories] = useState<CategoryBudgetItem[]>([
    { id: 'cat-1', category: 'Food', amount: 70000 },
    { id: 'cat-2', category: 'Transport', amount: 40000 },
    { id: 'cat-3', category: 'Accommodation', amount: 50000 },
    { id: 'cat-4', category: 'Activities', amount: 30000 },
    { id: 'cat-5', category: 'Emergency', amount: 30000 },
  ]);

  // Initial Funding Sources
  const [fundingSources, setFundingSources] = useState<FundingSourceItem[]>([
    {
      id: 'fs-1',
      sourceName: 'College Funding',
      category: 'College Funding',
      amount: 100000,
      date: new Date().toISOString().split('T')[0],
      description: 'Department approved grant',
    },
    {
      id: 'fs-2',
      sourceName: 'Sponsor',
      category: 'Sponsorship',
      amount: 50000,
      date: new Date().toISOString().split('T')[0],
      description: 'Title sponsor commitment',
    },
  ]);

  // Success State
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Numerical Parse Helpers
  const totalBudget = Math.max(0, parseFloat(totalBudgetInput) || 0);

  const totalAllocated = useMemo(() => {
    if (allocationMode === 'overall') return totalBudget;
    return categories.reduce((sum, item) => {
      const val = typeof item.amount === 'number' ? item.amount : parseFloat(item.amount) || 0;
      return sum + Math.max(0, val);
    }, 0);
  }, [categories, allocationMode, totalBudget]);

  const unallocatedBudget = totalBudget - totalAllocated;

  const totalFunding = useMemo(() => {
    return fundingSources.reduce((sum, item) => {
      const val = typeof item.amount === 'number' ? item.amount : parseFloat(item.amount) || 0;
      return sum + Math.max(0, val);
    }, 0);
  }, [fundingSources]);

  const unfundedBudget = Math.max(0, totalBudget - totalFunding);

  if (!isOpen) return null;

  // Validations per step
  const validateStep1 = () => {
    setError(null);
    if (!name.trim()) {
      setError('Please enter an event name.');
      return false;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('End date cannot be before start date.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    setError(null);
    if (totalBudget <= 0) {
      setError('Total budget must be greater than ₹0.');
      return false;
    }
    if (allocationMode === 'category' && totalAllocated > totalBudget) {
      setError(
        `Allocated budget exceeds total budget by ${formatINR(
          totalAllocated - totalBudget
        )}. Please adjust your category budgets.`
      );
      return false;
    }
    return true;
  };

  // Step Navigation
  const handleNextFromStep1 = () => {
    if (validateStep1()) setStep(2);
  };

  const handleNextFromStep2 = () => {
    if (validateStep2()) setStep(3);
  };

  // Submit Event Creation
  const handleCreateEvent = async () => {
    setError(null);
    if (!validateStep1() || !validateStep2()) return;

    setIsSubmitting(true);
    try {
      const formattedCategories =
        allocationMode === 'category'
          ? categories.map((c) => ({
              category: c.category,
              allocatedAmount:
                typeof c.amount === 'number'
                  ? c.amount
                  : parseFloat(c.amount) || 0,
            }))
          : [{ category: 'General Budget', allocatedAmount: totalBudget }];

      const formattedFundingSources = fundingSources.map((fs) => ({
        sourceName: fs.sourceName || fs.category,
        category: fs.category,
        amount:
          typeof fs.amount === 'number'
            ? fs.amount
            : parseFloat(fs.amount) || 0,
        date: fs.date || startDate,
        description: fs.description || 'Initial Funding',
      }));

      const newEvent = await createEvent({
        name,
        eventType,
        startDate,
        endDate,
        destination,
        description,
        totalBudget,
        budgetAllocationMode: allocationMode,
        categoryBudgets: formattedCategories,
        initialFunding: totalFunding,
        fundingSources: formattedFundingSources,
      });

      setCreatedCode(newEvent.code);
      setStep(4);
      if (onTripCreated) onTripCreated();
    } catch (err: any) {
      setError(err?.message || 'Failed to create event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Category Handlers
  const handleAddCategory = () => {
    const existing = new Set(categories.map((c) => c.category));
    const nextAvail = DEFAULT_CATEGORY_OPTIONS.find((c) => !existing.has(c)) || 'Other';
    setCategories([
      ...categories,
      { id: `cat-${Date.now()}`, category: nextAvail, amount: '' },
    ]);
  };

  const handleUpdateCategory = (
    id: string,
    field: 'category' | 'amount',
    value: any
  ) => {
    setCategories(
      categories.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(categories.filter((c) => c.id !== id));
  };

  // Funding Source Handlers
  const handleAddFundingSource = () => {
    setFundingSources([
      ...fundingSources,
      {
        id: `fs-${Date.now()}`,
        sourceName: 'Sponsorship',
        category: 'Sponsorship',
        amount: '',
        date: startDate,
        description: '',
      },
    ]);
  };

  const handleUpdateFundingSource = (
    id: string,
    field: keyof FundingSourceItem,
    value: any
  ) => {
    setFundingSources(
      fundingSources.map((fs) => {
        if (fs.id === id) {
          const updated = { ...fs, [field]: value };
          if (field === 'category' && (!fs.sourceName || FUNDING_SOURCE_PRESETS.includes(fs.sourceName as any))) {
            updated.sourceName = value;
          }
          return updated;
        }
        return fs;
      })
    );
  };

  const handleDeleteFundingSource = (id: string) => {
    setFundingSources(fundingSources.filter((fs) => fs.id !== id));
  };

  const handleCopyCode = () => {
    if (!createdCode) return;
    navigator.clipboard.writeText(createdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setStep(1);
    setName('');
    setDestination('');
    setDescription('');
    setCreatedCode(null);
    setCopied(false);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto text-xs flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
              ✨
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-white">
                {step === 4 ? 'Event Workspace Ready 🎉' : 'Create New Event'}
              </h2>
              <p className="text-[10px] text-slate-400">
                {step === 1 && 'Step 1 of 3 · Event Details'}
                {step === 2 && 'Step 2 of 3 · Budget & Initial Funding'}
                {step === 3 && 'Step 3 of 3 · Final Review'}
                {step === 4 && 'Sharing code & workspace details'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Progress Indicator (Steps 1 to 3) */}
        {step < 4 && (
          <div className="px-5 py-3 bg-slate-100/80 border-b border-slate-200 shrink-0">
            <div className="flex items-center justify-between max-w-xs mx-auto">
              {/* Step 1 Pill */}
              <button
                onClick={() => setStep(1)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                  step === 1
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200'
                }`}
              >
                {step > 1 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <span>1. Details</span>}
              </button>

              <div className={`h-0.5 flex-1 mx-2 transition-colors ${step >= 2 ? 'bg-emerald-500' : 'bg-slate-300'}`} />

              {/* Step 2 Pill */}
              <button
                onClick={() => {
                  if (validateStep1()) setStep(2);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                  step === 2
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : step > 2
                    ? 'bg-white text-slate-600'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {step > 2 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <span>2. Budget</span>}
              </button>

              <div className={`h-0.5 flex-1 mx-2 transition-colors ${step >= 3 ? 'bg-emerald-500' : 'bg-slate-300'}`} />

              {/* Step 3 Pill */}
              <button
                onClick={() => {
                  if (validateStep1() && validateStep2()) setStep(3);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                  step === 3
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                <span>3. Review</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mx-5 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-2 shrink-0 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Step Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <AnimatePresence mode="wait">
            {/* STEP 1: EVENT DETAILS */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-emerald-600" />
                    <span>Event Information</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Basic trip or fest details visible to all members and organizers.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. College IV 2026, TECHNOVA Fest"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Event Type
                    </label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {EVENT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Location / Venue
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ooty, Chennai Campus"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Description / Scope
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. 4-day industrial visit covering manufacturing plants, food, & stays."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 2: BUDGET & FUNDING */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                {/* Title & Subtitle */}
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-0.5">
                  <h3 className="text-sm font-extrabold text-emerald-900">
                    Set Up Event Budget
                  </h3>
                  <p className="text-[11px] text-emerald-700">
                    Set your spending limit and track every rupee from the beginning.
                  </p>
                </div>

                {/* 1. Total Event Budget Input */}
                <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md space-y-2">
                  <label className="block text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                    Total Event Budget *
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-2xl font-black text-emerald-400 pointer-events-none">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="250000"
                      value={totalBudgetInput}
                      onChange={(e) => setTotalBudgetInput(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-2xl font-black text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 tabular-nums"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                    <span>Formatted Display:</span>
                    <strong className="text-emerald-400 font-extrabold text-xs">
                      {formatINR(totalBudget)}
                    </strong>
                  </div>
                </div>

                {/* 2. Budget Allocation Mode */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800">
                    How do you want to manage your budget?
                  </label>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setAllocationMode('category')}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        allocationMode === 'category'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-1 ring-emerald-500 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="font-extrabold block text-xs">
                        Category Budget
                      </span>
                      <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                        Divide budget across Food, Transport, etc.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAllocationMode('overall')}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        allocationMode === 'overall'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-1 ring-emerald-500 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="font-extrabold block text-xs">
                        Overall Budget
                      </span>
                      <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                        Use entire budget as one single pool.
                      </span>
                    </button>
                  </div>
                </div>

                {/* 3. Category Allocation Editor (if Category mode selected) */}
                {allocationMode === 'category' && (
                  <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                        <PieChart className="w-4 h-4 text-emerald-600" />
                        <span>Budget Categories</span>
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-2xs flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Category</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {categories.map((catItem) => (
                        <div
                          key={catItem.id}
                          className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs"
                        >
                          {/* Category Dropdown */}
                          <select
                            value={catItem.category}
                            onChange={(e) =>
                              handleUpdateCategory(
                                catItem.id,
                                'category',
                                e.target.value
                              )
                            }
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-xs text-slate-900"
                          >
                            {DEFAULT_CATEGORY_OPTIONS.map((c) => (
                              <option key={c} value={c}>
                                {CATEGORY_CONFIG[c]?.emoji || '📦'} {c}
                              </option>
                            ))}
                          </select>

                          {/* Category Amount Input */}
                          <div className="relative w-28 sm:w-36">
                            <span className="absolute left-2.5 top-2 text-slate-400 font-bold">
                              ₹
                            </span>
                            <input
                              type="number"
                              placeholder="0"
                              value={catItem.amount}
                              onChange={(e) =>
                                handleUpdateCategory(
                                  catItem.id,
                                  'amount',
                                  e.target.value
                                )
                              }
                              className="w-full pl-6 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-extrabold text-xs text-slate-900 text-right tabular-nums focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>

                          {/* Delete Category Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(catItem.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Live Budget Calculation Progress Bar */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-700">
                        <span>Total: {formatINR(totalBudget)}</span>
                        <span>Allocated: {formatINR(totalAllocated)}</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            totalAllocated > totalBudget
                              ? 'bg-rose-500'
                              : totalAllocated === totalBudget
                              ? 'bg-emerald-500'
                              : 'bg-amber-500'
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              (totalAllocated / (totalBudget || 1)) * 100
                            )}%`,
                          }}
                        />
                      </div>

                      {/* Live Status Pill */}
                      <div>
                        {totalAllocated < totalBudget && (
                          <div className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                            <span>🟡</span>
                            <span>
                              {formatINR(unallocatedBudget)} still unallocated
                            </span>
                          </div>
                        )}
                        {totalAllocated === totalBudget && (
                          <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                            <span>🟢</span>
                            <span>Budget fully allocated</span>
                          </div>
                        )}
                        {totalAllocated > totalBudget && (
                          <div className="text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                            <span>🔴</span>
                            <span>
                              Allocated budget exceeds total budget by{' '}
                              {formatINR(totalAllocated - totalBudget)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Initial Funding Section */}
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <div className="p-3 bg-sky-50 border border-sky-100 rounded-2xl space-y-1">
                    <h4 className="font-extrabold text-xs text-sky-900 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-sky-600" />
                      <span>Initial Funding</span>
                    </h4>
                    <p className="text-[11px] text-sky-800 italic">
                      “Budget is the amount you plan to spend. Funding is the money currently available.”
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">
                        Funding Sources (Optional)
                      </label>
                      <button
                        type="button"
                        onClick={handleAddFundingSource}
                        className="py-1 px-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Funding Source</span>
                      </button>
                    </div>

                    {fundingSources.map((fs) => (
                      <div
                        key={fs.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                              Source Category
                            </label>
                            <select
                              value={fs.category}
                              onChange={(e) =>
                                handleUpdateFundingSource(
                                  fs.id,
                                  'category',
                                  e.target.value
                                )
                              }
                              className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-xs text-slate-900"
                            >
                              {FUNDING_SOURCE_PRESETS.map((p) => (
                                <option key={p} value={p}>
                                  {p}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                              Amount (₹)
                            </label>
                            <input
                              type="number"
                              placeholder="0"
                              value={fs.amount}
                              onChange={(e) =>
                                handleUpdateFundingSource(
                                  fs.id,
                                  'amount',
                                  e.target.value
                                )
                              }
                              className="w-full bg-white border border-slate-200 rounded-xl p-2 font-black text-xs text-slate-900 tabular-nums text-right"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Description (e.g. Title Sponsor)"
                            value={fs.description}
                            onChange={(e) =>
                              handleUpdateFundingSource(
                                fs.id,
                                'description',
                                e.target.value
                              )
                            }
                            className="flex-1 bg-white border border-slate-200 rounded-xl p-2 text-xs font-medium text-slate-800"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteFundingSource(fs.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Funding Summary Box */}
                  <div className="p-3 bg-slate-900 text-white rounded-2xl grid grid-cols-3 gap-2 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                        Total Budget
                      </span>
                      <strong className="text-xs font-extrabold text-white block tabular-nums">
                        {formatINR(totalBudget)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                        Initial Funding
                      </span>
                      <strong className="text-xs font-extrabold text-emerald-400 block tabular-nums">
                        {formatINR(totalFunding)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                        Unfunded
                      </span>
                      <strong className="text-xs font-extrabold text-amber-400 block tabular-nums">
                        {formatINR(unfundedBudget)}
                      </strong>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: REVIEW & CREATE */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                      Review Event
                    </span>
                    <h3 className="text-base font-black text-slate-900">
                      {name}
                    </h3>
                    <p className="text-xs text-slate-600">
                      📍 {destination || 'Venue to be assigned'} · 📅 {startDate} to {endDate}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-600 text-white font-extrabold text-[11px] rounded-full">
                    {eventType}
                  </span>
                </div>

                {/* Total Budget Card */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    TOTAL BUDGET
                  </span>
                  <div className="text-2xl font-black text-emerald-400 tabular-nums">
                    {formatINR(totalBudget)}
                  </div>
                  <span className="text-[11px] text-slate-400 block">
                    Allocation Mode: <strong className="text-slate-200 capitalize">{allocationMode}</strong>
                  </span>
                </div>

                {/* Budget Allocation Breakdown */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    BUDGET ALLOCATION BREAKDOWN
                  </span>
                  {allocationMode === 'category' ? (
                    <div className="space-y-1.5 divide-y divide-slate-100">
                      {categories.map((c) => (
                        <div
                          key={c.id}
                          className="pt-1.5 flex items-center justify-between text-xs font-bold"
                        >
                          <span className="text-slate-800">
                            {CATEGORY_CONFIG[c.category]?.emoji || '📦'} {c.category}
                          </span>
                          <span className="text-slate-900 tabular-nums">
                            {formatINR(
                              typeof c.amount === 'number'
                                ? c.amount
                                : parseFloat(c.amount) || 0
                            )}
                          </span>
                        </div>
                      ))}
                      <div className="pt-2 flex items-center justify-between text-xs font-extrabold text-slate-900 border-t border-slate-200">
                        <span>Total Allocated</span>
                        <span>{formatINR(totalAllocated)}</span>
                      </div>
                      {unallocatedBudget > 0 && (
                        <div className="flex items-center justify-between text-xs font-bold text-amber-700 pt-1">
                          <span>Unallocated Budget</span>
                          <span>{formatINR(unallocatedBudget)}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-slate-700">
                      Overall budget pool set to {formatINR(totalBudget)}.
                    </p>
                  )}
                </div>

                {/* Initial Funding Breakdown */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    INITIAL FUNDING SOURCES
                  </span>
                  {fundingSources.length > 0 ? (
                    <div className="space-y-1.5 divide-y divide-slate-100">
                      {fundingSources.map((fs) => (
                        <div
                          key={fs.id}
                          className="pt-1.5 flex items-center justify-between text-xs font-bold"
                        >
                          <span className="text-slate-800">
                            {fs.sourceName || fs.category}
                          </span>
                          <span className="text-emerald-700 tabular-nums">
                            {formatINR(
                              typeof fs.amount === 'number'
                                ? fs.amount
                                : parseFloat(fs.amount) || 0
                            )}
                          </span>
                        </div>
                      ))}
                      <div className="pt-2 flex items-center justify-between text-xs font-extrabold text-slate-900 border-t border-slate-200">
                        <span>Total Received</span>
                        <span className="text-emerald-700">{formatINR(totalFunding)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-600 pt-1">
                        <span>Unfunded Budget</span>
                        <span className="text-amber-600">{formatINR(unfundedBudget)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs font-medium text-slate-500">
                      No initial funding added yet (Funding: ₹0).
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 4: SUCCESS ANIMATED TRANSITION */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center space-y-5 py-3"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl shadow-xs">
                  ✓
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900">{name}</h3>
                  <p className="text-xs font-bold text-emerald-700">
                    Your financial workspace is ready.
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    Share this 6-character event code so team leads & members can join immediately.
                  </p>
                </div>

                {/* Event Code Display */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest">
                      Event Code
                    </span>
                    <span className="font-mono text-2xl font-black text-emerald-400 tracking-widest block">
                      {createdCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors"
                >
                  Go to Event Dashboard →
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sticky Bottom Action Navigation Bar (Steps 1 to 3) */}
        {step < 4 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((step - 1) as any)}
                className="py-2.5 px-4 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold rounded-xl flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClose}
                className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
            )}

            {step === 1 && (
              <button
                type="button"
                onClick={handleNextFromStep1}
                className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-xs flex items-center gap-1 transition-colors ml-auto"
              >
                <span>Next →</span>
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={handleNextFromStep2}
                className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-xs flex items-center gap-1 transition-colors ml-auto"
              >
                <span>Next →</span>
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCreateEvent}
                className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-colors ml-auto"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Event...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Create Event</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
