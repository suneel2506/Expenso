import React, { useState } from 'react';
import { X, KeyRound, User, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface JoinTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinedSuccess?: () => void;
}

export const JoinTripModal: React.FC<JoinTripModalProps> = ({
  isOpen,
  onClose,
  onJoinedSuccess,
}) => {
  const { joinEvent, currentUser } = useApp();

  const [code, setCode] = useState('');
  const [name, setName] = useState(currentUser.name || '');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();

    if (!cleanCode) {
      setError('Please enter the 6-character event code.');
      return;
    }
    if (!cleanName) {
      setError('Please enter your name.');
      return;
    }

    setIsJoining(true);
    try {
      const res = await joinEvent(cleanCode, cleanName);
      if (res.success && res.event) {
        setWelcomeMessage(`Welcome to ${res.event.name}, ${cleanName}! 🎉`);
        setTimeout(() => {
          if (onJoinedSuccess) onJoinedSuccess();
          onClose();
        }, 1500);
      } else {
        setError(res.error || 'Event not found with this code. Check with your event organizer!');
      }
    } catch (err: any) {
      console.error('Join error:', err);
      setError(err?.message || 'Failed to connect. Please check your internet connection.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto text-xs">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
              🔑
            </div>
            <h2 className="text-base font-extrabold text-slate-900">Join Event via Code</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {welcomeMessage ? (
            <div className="text-center py-6 space-y-3">
              <span className="text-5xl block animate-bounce">🎉</span>
              <h3 className="text-base font-extrabold text-slate-900">{welcomeMessage}</h3>
              <p className="text-xs text-slate-500">Redirecting to event dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  6-Character Event Code *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. X7K9P2"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-black tracking-widest text-slate-900 uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Ask your event finance manager or organizer for their code.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Your Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Eren, Priya, Arun"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isJoining}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Verifying & Connecting...</span>
                    </>
                  ) : (
                    <span>Join Event</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
