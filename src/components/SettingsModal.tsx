import React from 'react';
import { X, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { activeEvent, deleteEvent, resetToDemoEvents, clearAllData, events } = useApp();

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (activeEvent && window.confirm(`Are you sure you want to delete the event "${activeEvent.name}"?`)) {
      await deleteEvent(activeEvent.id);
      onClose();
    }
  };

  const handleClearAll = async () => {
    if (window.confirm("Are you sure you want to clear all data and start fresh? All sample events and expenses will be removed.")) {
      await clearAllData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 border border-slate-200 text-xs animate-in fade-in">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-slate-900 text-base">Event Settings</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {activeEvent && (
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <span className="font-bold text-slate-900 block">{activeEvent.name}</span>
              <span className="text-slate-500 block">Event Code: <strong className="font-mono">{activeEvent.code}</strong></span>
              <span className="text-slate-500 block">Organization: {activeEvent.orgName}</span>
            </div>
          )}

          <button
            onClick={handleClearAll}
            className="w-full p-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All Data & Start Fresh</span>
          </button>

          <button
            onClick={resetToDemoEvents}
            className="w-full p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Load Sample Demo Data</span>
          </button>

          {activeEvent && events.length > 0 && (
            <button
              onClick={handleDelete}
              className="w-full p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl flex items-center justify-center gap-2 border border-rose-200 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Current Event</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
