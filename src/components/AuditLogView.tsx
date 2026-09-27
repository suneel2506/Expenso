import React from 'react';
import { ShieldCheck, Clock, User } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AuditLogView: React.FC = () => {
  const { activeEvent } = useApp();

  if (!activeEvent) return null;

  const logs = activeEvent.auditLogs || [];

  return (
    <div className="space-y-4 pb-20 sm:pb-8 animate-in fade-in">
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Audit Trail Log</h1>
        <p className="text-xs text-slate-500">
          Financial activity ledger recording actor, action, and timestamp
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-xs text-slate-500">
          No audit logs recorded yet for this event.
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900">{log.actorName}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                    {log.actorRole.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{log.timestamp}</span>
              </div>

              <p className="text-slate-700 font-medium">{log.details}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
