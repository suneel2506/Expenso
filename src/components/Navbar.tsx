import React, { useState } from 'react';
import {
  ChevronDown,
  Plus,
  Users,
  Calendar,
  Check,
  Trash2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PWAInstallButton } from './PWAInstallButton';
import { EventModel } from '../types';

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
    deleteEvent,
  } = useApp();

  const [isEventMenuOpen, setIsEventMenuOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<EventModel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    setIsDeleting(true);
    try {
      await deleteEvent(eventToDelete.id);
      setEventToDelete(null);
      setIsEventMenuOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
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
                    className="absolute top-14 left-3 sm:left-28 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2.5 text-slate-100 text-xs z-50 animate-in fade-in"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-2 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Your Events ({events.length})</span>
                    </div>
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {events.map((evt) => {
                        const isSelected = evt.id === activeEventId;
                        return (
                          <div
                            key={evt.id}
                            className={`w-full p-2 rounded-xl flex items-center justify-between transition-all group ${
                              isSelected
                                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                : 'hover:bg-slate-800/80 text-slate-200'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setActiveEventId(evt.id);
                                setIsEventMenuOpen(false);
                              }}
                              className="min-w-0 flex-1 text-left pr-2"
                            >
                              <span className="block truncate font-bold text-xs">{evt.name}</span>
                              <span className="block text-[10px] text-slate-400 truncate">
                                Code: {evt.code} · {evt.status.toUpperCase()}
                              </span>
                            </button>

                            <div className="flex items-center gap-1 shrink-0">
                              {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                              <button
                                type="button"
                                title={`Delete ${evt.name}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEventToDelete(evt);
                                }}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-800 grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => {
                          setIsEventMenuOpen(false);
                          onCreateEventClick();
                        }}
                        className="py-2 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Event</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsEventMenuOpen(false);
                          onJoinEventClick();
                        }}
                        className="py-2 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1"
                      >
                        <Users className="w-3.5 h-3.5" />
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

      {/* Delete Event Confirmation Modal */}
      {eventToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 text-slate-900 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Delete Event Workspace?</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-slate-900 font-bold">"{eventToDelete.name}"</strong>?
              </p>
              <div className="mt-2.5 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>All associated expenses, bills, and budget data will be permanently wiped.</span>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setEventToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
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
    </>
  );
};
