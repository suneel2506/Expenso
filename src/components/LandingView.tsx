import React from 'react';
import { Plus, KeyRound, Sparkles, Receipt, CheckCircle, ArrowRight } from 'lucide-react';
import { formatINR } from '../utils/calculations';

interface LandingViewProps {
  onCreateTrip: () => void;
  onJoinTrip: () => void;
  onContinueDemo: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onCreateTrip,
  onJoinTrip,
  onContinueDemo,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden">
      {/* Background soft ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-emerald-500/20">
            E
          </div>
          <span className="text-xl font-extrabold tracking-tight">Expenso</span>
        </div>

        <button
          onClick={onContinueDemo}
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
        >
          <span>Open Pondicherry Demo</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 max-w-xl mx-auto my-auto text-center space-y-6 py-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Bill Scanning & Paise-Accurate Splitting</span>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Every expense.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
              One place.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto leading-relaxed">
            Track group expenses, scan receipts with AI, split costs accurately, and settle up without the spreadsheet headache.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onCreateTrip}
            className="w-full sm:w-auto px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-transform hover:scale-105"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create a Trip</span>
          </button>

          <button
            onClick={onJoinTrip}
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-2xl border border-slate-800 flex items-center justify-center gap-2 transition-colors"
          >
            <KeyRound className="w-4 h-4 text-emerald-400" />
            <span>Join a Trip</span>
          </button>
        </div>

        {/* Live Trip Animation Mockup Card */}
        <div className="pt-8 max-w-md mx-auto text-left">
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
              <span className="font-bold text-slate-300">College IV – Pondicherry</span>
              <span className="font-mono text-emerald-400">X7K9P2</span>
            </div>

            <div className="p-2.5 bg-slate-950/60 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <span className="text-base">🍕</span>
                <div>
                  <span className="font-semibold text-slate-200 block">Café des Arts</span>
                  <span className="text-[10px] text-slate-500">Paid by Eren · 4 split</span>
                </div>
              </div>
              <span className="font-bold text-emerald-400 font-mono">₹1,840</span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Arun owes Eren: <strong className="text-white">₹460</strong></span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Auto-split
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center text-xs text-slate-600">
        Built for college trips, IV trips, travel crews, and roommates.
      </div>
    </div>
  );
};
