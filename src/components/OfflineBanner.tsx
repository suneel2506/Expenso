import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const OfflineBanner: React.FC = () => {
  const { isOnline, isSyncing } = useApp();

  if (isOnline && !isSyncing) return null;

  return (
    <div
      className={`fixed top-0 inset-x-0 z-50 px-4 py-2 text-xs font-medium flex items-center justify-center gap-2 transition-all ${
        !isOnline
          ? 'bg-amber-500 text-amber-950'
          : 'bg-emerald-600 text-white'
      }`}
    >
      {!isOnline ? (
        <>
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>You are offline. Trip changes are safely saved on your device and will sync automatically.</span>
        </>
      ) : (
        <>
          <RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin" />
          <span>Syncing with your crew...</span>
        </>
      )}
    </div>
  );
};
