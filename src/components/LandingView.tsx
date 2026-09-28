import React, { useState } from 'react';
import {
  KeyRound,
  Plus,
  Sparkles,
  Users,
  TrendingDown,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Camera,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PWAInstallButton } from './PWAInstallButton';
import { extractEventCode } from '../utils/firebase';

interface LandingViewProps {
  onCreateEventClick: () => void;
  onJoinSuccess?: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onCreateEventClick,
  onJoinSuccess,
}) => {
  const { joinEvent, resetToDemoEvents, currentUser } = useApp();

  const [activeAction, setActiveAction] = useState<'join' | 'create'>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('create') === 'true') return 'create';
    }
    return 'join';
  });

  const [code, setCode] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const urlCode = p.get('join') || p.get('code') || '';
      return extractEventCode(urlCode);
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

    const cleanCode = extractEventCode(code);
    const cleanName = userName.trim();

    if (!cleanCode) {
      setJoinError('Please enter the event code.');
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
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', window.location.pathname);
        }
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
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10 space-y-3">
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

        {/* Single Unified Action Card with Mobile-Friendly Switcher */}
        <div className="max-w-xl mx-auto w-full mb-12">
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-md relative overflow-hidden transition-all hover:border-slate-700/80">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Switcher Segmented Control */}
            <div className="relative z-10 flex p-1.5 bg-slate-950/80 border border-slate-800/80 rounded-2xl mb-6 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setActiveAction('join');
                  setJoinError(null);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeAction === 'join'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25 ring-1 ring-emerald-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
                aria-pressed={activeAction === 'join'}
              >
                <KeyRound className="w-4 h-4 shrink-0" />
                <span>Join Event</span>
                <span
                  className={`text-[10px] py-0.5 px-1.5 rounded-full font-mono font-semibold ml-1 ${
                    activeAction === 'join'
                      ? 'bg-slate-950/20 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Code
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveAction('create');
                  setJoinError(null);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeAction === 'create'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25 ring-1 ring-emerald-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
                aria-pressed={activeAction === 'create'}
              >
                <Plus className="w-4 h-4 stroke-[3] shrink-0" />
                <span>Create Event</span>
                <span
                  className={`text-[10px] py-0.5 px-1.5 rounded-full font-mono font-semibold ml-1 ${
                    activeAction === 'create'
                      ? 'bg-slate-950/20 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  New
                </span>
              </button>
            </div>

            {/* Tab 1: Join Event View */}
            {activeAction === 'join' && (
              <div className="relative z-10 flex flex-col justify-between animate-fadeIn">
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
                        Event Code or Invite Link *
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. X7K9P2 or paste invite link"
                          value={code}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (
                              val.includes('http') ||
                              val.includes('?') ||
                              val.includes('join') ||
                              val.includes('code') ||
                              val.length > 8
                            ) {
                              setCode(extractEventCode(val));
                            } else {
                              setCode(val.toUpperCase());
                            }
                          }}
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
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all mt-1 cursor-pointer"
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

                <div className="pt-4 mt-5 border-t border-slate-800/80 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span>💡</span>
                    <span>Ask your event manager or lead for their code.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveAction('create')}
                    className="text-emerald-400 hover:text-emerald-300 font-medium text-left sm:text-right underline decoration-emerald-500/40"
                  >
                    Need to create an event?
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Create Event View */}
            {activeAction === 'create' && (
              <div className="relative z-10 flex flex-col justify-between animate-fadeIn">
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
                    <div className="flex items-center gap-2.5 p-2.5 bg-slate-950/70 rounded-xl border border-slate-800/60">
                      <Camera className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>AI camera scanner extracts receipt items & GST automatically</span>
                    </div>
                    <div className="flex items-center gap-2.5 p-2.5 bg-slate-950/70 rounded-xl border border-slate-800/60">
                      <Users className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>Assign roles (Finance Leads, Team Leads, Members)</span>
                    </div>
                    <div className="flex items-center gap-2.5 p-2.5 bg-slate-950/70 rounded-xl border border-slate-800/60">
                      <TrendingDown className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Splitwise-style debt simplification for UPI settlements</span>
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={onCreateEventClick}
                    className="w-full py-3.5 px-5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Launch Event Setup Wizard</span>
                  </button>
                  <div className="pt-4 mt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Free & Unlimited Events</span>
                    <button
                      type="button"
                      onClick={() => setActiveAction('join')}
                      className="text-emerald-400 hover:text-emerald-300 font-medium underline decoration-emerald-500/40"
                    >
                      Already have an invite code?
                    </button>
                  </div>
                </div>
              </div>
            )}
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
