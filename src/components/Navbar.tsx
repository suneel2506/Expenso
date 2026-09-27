import React, { useState } from 'react';
import {
  Sparkles,
  ChevronDown,
  Plus,
  LogOut,
  Users,
  ShieldCheck,
  Building,
  Calendar,
  Check,
  Download,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  onCreateEventClick: () => void;
  onJoinEventClick: () => void;
}

const ROLE_LABELS: Record<UserRole, { label: string; bg: string; text: string }> = {
  org_admin: { label: 'Org Admin', bg: 'bg-purple-100', text: 'text-purple-700' },
  event_admin: { label: 'Event Admin', bg: 'bg-rose-100', text: 'text-rose-700' },
  finance_manager: { label: 'Finance Manager', bg: 'bg-emerald-100', text: 'text-emerald-800' },
  team_lead: { label: 'Team Lead', bg: 'bg-sky-100', text: 'text-sky-800' },
  member: { label: 'Member', bg: 'bg-slate-100', text: 'text-slate-700' },
  viewer: { label: 'Viewer (Read-Only)', bg: 'bg-amber-100', text: 'text-amber-800' },
};

export const Navbar: React.FC<NavbarProps> = ({ onCreateEventClick, onJoinEventClick }) => {
  const {
    events,
    activeEvent,
    activeEventId,
    setActiveEventId,
    currentUser,
    currentRole,
    setCurrentRole,
    setIsAddExpenseOpen,
    isOnline,
    isSyncing,
  } = useApp();

  const [isEventMenuOpen, setIsEventMenuOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-sm">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2">
        {/* Left: Brand & Event Selector */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-lg flex items-center justify-center shadow-xs">
              E
            </div>
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

        {/* Right Controls: Role Switcher & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* PWA Install */}
          <PWAInstallButton variant="compact" />

          {/* Role Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
              className={`flex items-center gap-1 py-1 px-2.5 rounded-lg text-[11px] font-bold transition-all ${
                ROLE_LABELS[currentRole].bg
              } ${ROLE_LABELS[currentRole].text}`}
              title="Click to switch role and test permissions"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{ROLE_LABELS[currentRole].label}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {isRoleMenuOpen && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsRoleMenuOpen(false)}
              >
                <div
                  className="absolute top-14 right-3 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 text-slate-100 text-xs z-50 animate-in fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Switch Role (Permission Test)</span>
                  </div>
                  <div className="space-y-1">
                    {(Object.keys(ROLE_LABELS) as UserRole[]).map((rKey) => {
                      const isSelected = currentRole === rKey;
                      return (
                        <button
                          key={rKey}
                          onClick={() => {
                            setCurrentRole(rKey);
                            setIsRoleMenuOpen(false);
                          }}
                          className={`w-full text-left p-2 rounded-xl flex items-center justify-between transition-colors ${
                            isSelected ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${ROLE_LABELS[rKey].bg}`} />
                            <span>{ROLE_LABELS[rKey].label}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

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
