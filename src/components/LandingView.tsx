import React, { useState } from 'react';
import {
  KeyRound,
  Plus,
  Sparkles,
  Receipt,
  Users,
  ShieldCheck,
  TrendingDown,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Building,
  Plane,
  Camera,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PWAInstallButton } from './PWAInstallButton';

interface LandingViewProps {
  onCreateEventClick: () => void;
  onJoinSuccess?: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onCreateEventClick,
  onJoinSuccess,
}) => {
  const { joinEvent, resetToDemoEvents, currentUser } = useApp();

  const [code, setCode] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return (p.get('join') || p.get('code') || '').toUpperCase();
    }
    return '';
  });
  const [userName, setUserName] = useState(currentUser.name || '');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

  const handleInlineJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);

    const cleanCode = code.trim().toUpperCase();
    const cleanName = userName.trim();

    if (!cleanCode) {
      setJoinError('Please enter the 6-character event code.');
      return;
    }
    if (!cleanName) {
      setJoinError('Please enter your name.');
      return;
    }

    setIsJoining(true);
    try {
      const res = await joinEvent(cleanCode, cleanName);
      if (res.success && res.event) {
        setJoinSuccess(`Joined ${res.event.name}! Loading dashboard...`);
        setTimeout(() => {
          if (onJoinSuccess) onJoinSuccess();
        }, 1200);
      } else {
        setJoinError(res.error || 'Event not found with this code. Check with your event organizer!');
      }
    } catch (err: any) {
      setJoinError(err?.message || 'Failed to connect. Please check your network connection.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950">
      {/* Background Soft Mesh Ambient Lights */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      {/* Top Navbar */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Expenso Logo"
              className="w-9 h-9 rounded-xl object-contain shadow-md shadow-emerald-500/20 border border-slate-800"
            />
            <div>
              <div className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                <span>Expenso</span>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Cloud Sync
                </span>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:block">
                Events & Group Expenses Simplified
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <PWAInstallButton variant="compact" />
            <button
              onClick={resetToDemoEvents}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
              title="Quickly test with sample college fest & IV trip data"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Explore Demo</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero & Action Center */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 w-full flex-1 flex flex-col justify-center">
        {/* Hero Title */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-emerald-400 text-xs font-medium tracking-wide shadow-sm">
            <span>✨</span>
            <span>Campus IV Trips · Department Fests · Travel Crews</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Manage Every Rupee From <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              Budget to Final Report
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            Real-time cross-device sync, Splitwise-style individual balances, Gemini AI receipt scanning, and audit-ready accounts for students and organizers.
          </p>
        </div>

        {/* Dual Primary Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-4xl mx-auto w-full mb-12">
          {/* Card 1: Join Event Directly via Code */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-md flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/20">
                  <KeyRound className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Instant Connect
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-extrabold text-white mb-1.5">
                Join Event via 6-Character Code
              </h2>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                Got a code from your college organizer or trip lead? Enter it below to join and sync live with your batchmates.
              </p>

              {joinError && (
                <div className="p-3 mb-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{joinError}</span>
                </div>
              )}

              {joinSuccess && (
                <div className="p-3 mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{joinSuccess}</span>
                </div>
              )}

              <form onSubmit={handleInlineJoin} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    6-Character Event Code *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="e.g. 2YK4TY"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm font-mono font-black tracking-widest text-emerald-400 uppercase placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sunil, Priya, Arun"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isJoining}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all mt-1"
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Verifying & Connecting...</span>
                    </>
                  ) : (
                    <>
                      <span>Join Event</span>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center gap-1.5">
              <span>💡</span>
              <span>Ask your event finance manager or organizer for their code.</span>
            </div>
          </div>

          {/* Card 2: Create a New Event */}
          <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-md flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-emerald-500/30">
                  <Plus className="w-5 h-5 stroke-[3]" />
                </div>
                <span className="text-[11px] font-semibold text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700/60">
                  For Organizers & Leads
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-extrabold text-white mb-1.5">
                Create a New Event or Trip
              </h2>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                Set up a planned budget, generate a shareable 6-character code, configure category allowances, and invite batchmates.
              </p>

              {/* Highlights List */}
              <div className="space-y-2.5 mb-6 text-xs text-slate-300">
                <div className="flex items-center gap-2.5 p-2 bg-slate-950/60 rounded-xl border border-slate-800/60">
                  <Camera className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>AI camera scanner extracts receipt items & GST automatically</span>
                </div>
                <div className="flex items-center gap-2.5 p-2 bg-slate-950/60 rounded-xl border border-slate-800/60">
                  <Users className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Assign roles (Finance Leads, Team Leads, Members)</span>
                </div>
                <div className="flex items-center gap-2.5 p-2 bg-slate-950/60 rounded-xl border border-slate-800/60">
                  <TrendingDown className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Splitwise-style debt simplification for UPI settlements</span>
                </div>
              </div>
            </div>

            <div>
              <button
                onClick={onCreateEventClick}
                className="w-full py-3 px-5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create New Event</span>
              </button>
              <div className="pt-4 mt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Free & Unlimited Events</span>
                <span className="text-emerald-400 font-medium">No account required</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Demo Pre-load Strip */}
        <div className="max-w-4xl mx-auto w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-sm shrink-0">
                ✨
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-200">
                  Want to explore before creating your own?
                </h3>
                <p className="text-[11px] text-slate-400">
                  Try the pre-loaded Pondicherry IV Trip or Tech Fest with full demo balances and expenses.
                </p>
              </div>
            </div>

            <button
              onClick={resetToDemoEvents}
              className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-slate-700 shrink-0"
            >
              <span>Load Interactive Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4 Feature Capability Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto w-full">
          <div className="p-3.5 bg-slate-900/40 border border-slate-800/60 rounded-2xl">
            <span className="text-lg block mb-1">🧾</span>
            <h4 className="text-xs font-bold text-slate-200 mb-0.5">AI Bill Parser</h4>
            <p className="text-[11px] text-slate-400 leading-snug">
              Snap receipts to extract amounts, vendors, and items with Gemini.
            </p>
          </div>

          <div className="p-3.5 bg-slate-900/40 border border-slate-800/60 rounded-2xl">
            <span className="text-lg block mb-1">⚡</span>
            <h4 className="text-xs font-bold text-slate-200 mb-0.5">Live Cloud Sync</h4>
            <p className="text-[11px] text-slate-400 leading-snug">
              Firestore updates replicate in milliseconds across all devices.
            </p>
          </div>

          <div className="p-3.5 bg-slate-900/40 border border-slate-800/60 rounded-2xl">
            <span className="text-lg block mb-1">⚖️</span>
            <h4 className="text-xs font-bold text-slate-200 mb-0.5">Min-Cash Settle</h4>
            <p className="text-[11px] text-slate-400 leading-snug">
              Smart algorithm simplifies 40 messy debts into minimum transfers.
            </p>
          </div>

          <div className="p-3.5 bg-slate-900/40 border border-slate-800/60 rounded-2xl">
            <span className="text-lg block mb-1">🛡️</span>
            <h4 className="text-xs font-bold text-slate-200 mb-0.5">Audit Ready</h4>
            <p className="text-[11px] text-slate-400 leading-snug">
              Full timestamped audit trail with exportable PDF and Excel reports.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Expenso · College IV & Event Financial Management</span>
          <span className="text-slate-600">Built for college batches, cultural fests, and student clubs</span>
        </div>
      </footer>
    </div>
  );
};
