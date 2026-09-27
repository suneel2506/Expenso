import React from 'react';
import {
  Layers,
  Users,
  PieChart,
  HandCoins,
  Clock,
  Building2,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Settings,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface MoreMenuViewProps {
  onSelectSubTab: (sub: any) => void;
}

export const MoreMenuView: React.FC<MoreMenuViewProps> = ({ onSelectSubTab }) => {
  const { activeEvent, resetToDemoEvents } = useApp();

  if (!activeEvent) return null;

  const menuItems = [
    { id: 'teams', label: 'Teams & Leads', icon: Layers, desc: 'Manage event teams & budgets', badge: `${activeEvent.teams?.length || 0}` },
    { id: 'members', label: 'Members & Roles', icon: Users, desc: 'View member roles & permissions', badge: `${activeEvent.members?.length || 0}` },
    { id: 'budget', label: 'Category Budgets', icon: PieChart, desc: 'Set budget limits & progress alerts' },
    { id: 'reimbursements', label: 'Reimbursements', icon: HandCoins, desc: 'Refund member personal pocket expenses' },
    { id: 'advances', label: 'Event Advances', icon: Clock, desc: 'Track advances issued & settlements' },
    { id: 'vendors', label: 'Vendor Contracts', icon: Building2, desc: 'Catering, sound, bus rentals & contracts' },
    { id: 'audit', label: 'Audit Trail Ledger', icon: ShieldCheck, desc: 'View financial operations audit log' },
    { id: 'closure', label: 'Reports & Event Closure', icon: FileText, desc: 'Print statement, CSV export & archive' },
  ];

  return (
    <div className="space-y-4 pb-20 sm:pb-8 animate-in fade-in">
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">More Modules</h1>
        <p className="text-xs text-slate-500">
          Advanced financial administration for {activeEvent.name}
        </p>
      </div>

      <div className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => onSelectSubTab(item.id)}
              className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-2xs flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-98"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-slate-900">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.2 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 block">{item.desc}</span>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
          );
        })}
      </div>

      {/* Demo Reset Helper Button */}
      <div className="pt-4 border-t border-slate-200">
        <button
          onClick={resetToDemoEvents}
          className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reload Demo Events (TECHNOVA 2026 & IV Pondicherry)</span>
        </button>
      </div>
    </div>
  );
};
