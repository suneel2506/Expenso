import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ variant?: 'compact' | 'full' }> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 font-semibold transition-all shadow-xs ${
          variant === 'full'
            ? 'w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs justify-center'
            : 'py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px]'
        }`}
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 font-semibold transition-all border ${
            variant === 'full'
              ? 'w-full py-2.5 px-4 bg-slate-900 text-white border-slate-800 rounded-xl text-xs justify-center'
              : 'py-1.5 px-2.5 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 rounded-lg text-[11px]'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
          <span>Install App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 text-slate-900 animate-in fade-in">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    📱
                  </div>
                  <h3 className="text-sm font-bold">Install Expenso on iOS</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
                <span>1. Tap the <strong>Share button</strong> in your Safari browser bar.</span>
                <br />
                <span>2. Scroll down and tap <strong>Add to Home Screen</strong>.</span>
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-800 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
