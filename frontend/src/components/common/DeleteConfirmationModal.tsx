import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

export interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  itemDetails?: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isDeleting?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  title = 'Confirm Deletion',
  message,
  itemDetails,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isDeleting: externalIsDeleting,
  error: externalError,
  onClose,
  onConfirm
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const loading = externalIsDeleting !== undefined ? externalIsDeleting : internalLoading;
  const error = externalError !== undefined ? externalError : internalError;

  const handleConfirm = async () => {
    if (loading) return; // Prevent duplicate clicks
    setInternalError(null);
    try {
      setInternalLoading(true);
      await onConfirm();
    } catch (err: any) {
      setInternalError(err.message || 'Failed to complete delete operation');
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-500 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold font-['Oswald'] tracking-wide text-white uppercase">
                {title}
              </h3>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                Confirm Permanent Action
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 font-mono flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3 mb-6 text-xs text-slate-300">
          <p className="leading-relaxed">{message}</p>
          {itemDetails && (
            <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl font-mono text-amber-400 text-[11px] break-all">
              {itemDetails}
            </div>
          )}
          <p className="text-[11px] text-slate-500 font-mono">
            ⚠️ This action cannot be reversed. The record will be permanently deleted from the database.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-mono font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-rose-600/20 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>{confirmLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
