import React, { useState } from 'react';
import {
  ChevronDown,
  Plus,
  Users,
  Calendar,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  onCreateEventClick: () => void;
  onJoinEventClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onCreateEventClick, onJoinEventClick }) => {
  const {
    events,
    activeEvent,
    activeEventId,
    setActiveEventId,
    setIsAddExpenseOpen,
  } = useApp();

  const [isEventMenuOpen, setIsEventMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-sm">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2">
        {/* Left: Brand & Event Selector */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <img
              src="/logo.png"
              alt="Expenso Logo"
              className="w-8 h-8 rounded-xl object-contain shadow-xs border border-slate-700/50"
            />
            <div className="hidden sm:block">
              <span className="font-extrabold text-base tracking-tight text-white block leading-none">
                Expenso
              </span>
              <span className="text-[10px] font-medium text-emerald-400 block tracking-wide uppercase">
                Events & IV
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-800 hidden sm:block shrink-0" />

          {/* Event Switcher Dropdown */}
          <div className="relative min-w-0">
            <button
              onClick={() => setIsEventMenuOpen(!isEventMenuOpen)}
              className="flex items-center gap-1.5 py-1 px-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-100 transition-all max-w-[200px] sm:max-w-[260px] truncate"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{activeEvent ? activeEvent.name : 'Select Event'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {isEventMenuOpen && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsEventMenuOpen(false)}
              >
                <div
                  className="absolute top-14 left-3 sm:left-28 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 text-slate-100 text-xs z-50 animate-in fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-2 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Your Events
                  </div>
                  <div className="space-y-1 max-h-56 overflow-y-auto">
                    {events.map((evt) => {
                      const isSelected = evt.id === activeEventId;
                      return (
                        <button
                          key={evt.id}
                          onClick={() => {
                            setActiveEventId(evt.id);
                            setIsEventMenuOpen(false);
                          }}
                          className={`w-full text-left p-2 rounded-xl flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold'
                              : 'hover:bg-slate-800 text-slate-200'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <span className="block truncate font-medium">{evt.name}</span>
                            <span className="block text-[10px] text-slate-400 truncate">
                              Code: {evt.code} · {evt.status.toUpperCase()}
                            </span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800 grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => {
                        setIsEventMenuOpen(false);
                        onCreateEventClick();
                      }}
                      className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-[11px] flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Create Event</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsEventMenuOpen(false);
                        onJoinEventClick();
                      }}
                      className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-semibold text-[11px] flex items-center justify-center gap-1"
                    >
                      <Users className="w-3 h-3" />
                      <span>Join Code</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Controls: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* PWA Install */}
          <PWAInstallButton variant="compact" />

          {/* Quick Add Expense button (Desktop) */}
          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="hidden sm:flex items-center gap-1.5 py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>
    </header>
  );
};
