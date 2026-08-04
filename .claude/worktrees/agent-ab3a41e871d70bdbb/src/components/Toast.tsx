/** Toast — auto-dismissing slide-in notifications (Life OS canon, light skin) */
import React, { useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { useShellStore, type Toast as ToastType } from '../stores/shell.store';

const TOAST_DURATION = 5000;

const typeIcons: Record<ToastType['type'], typeof Info> = {
  info: Info, success: CheckCircle, warning: AlertTriangle, error: XCircle,
};

const typeColors: Record<ToastType['type'], string> = {
  info: 'text-blue-600',
  success: 'text-green-600',
  warning: 'text-amber-600',
  error: 'text-red-600',
};

export function ToastContainer() {
  const toasts = useShellStore(s => s.toasts);
  const dismissToast = useShellStore(s => s.dismissToast);

  return (
    <div className="fixed top-12 right-4 z-[4000] flex flex-col gap-2 pointer-events-none">
      {toasts.slice(-5).map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
      ))}
    </div>
  );
}

interface ToastItemProps { toast: ToastType; onDismiss: () => void; }

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const Icon = typeIcons[toast.type];

  return (
    <div className="pointer-events-auto relative flex items-start gap-3 p-4 pr-9 rounded-xl bg-white border border-[var(--panel-border)] shadow-[0_16px_40px_-16px_rgba(41,37,36,0.3)] w-80 animate-toast-in">
      <div className={`shrink-0 mt-0.5 ${typeColors[toast.type]}`}><Icon className="w-5 h-5" /></div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-stone-400 mb-1">{toast.source || 'Citadelle'}</div>
        <div className="text-sm font-medium text-stone-700 leading-relaxed">{toast.message}</div>
      </div>
      <button onClick={onDismiss} className="absolute top-3 right-3 p-1 rounded-md hover:bg-stone-100 text-stone-300 hover:text-stone-600 transition-all">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
