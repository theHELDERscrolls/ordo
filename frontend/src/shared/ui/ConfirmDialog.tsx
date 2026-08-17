import { useEffect } from 'react';

import { buttonClasses } from './button-styles';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * A dependency-free confirmation modal. Closes on Escape or a backdrop click, locks
 * background scroll while open, and focuses Cancel by default, which is the safe
 * choice for a destructive action. A destructive confirm uses a fixed red rather
 * than the tenant accent, so danger reads the same for every business.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} aria-hidden />
      <div className="relative w-full max-w-sm rounded-lg border border-border bg-bg p-6 shadow-xl">
        <h2 id="confirm-dialog-title" className="font-display text-lg font-semibold tracking-tight">
          {title}
        </h2>
        {message && <p className="mt-2 text-sm text-fg-muted">{message}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" autoFocus onClick={onCancel} className={buttonClasses('secondary')}>
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={
              destructive
                ? 'inline-flex items-center justify-center rounded-md bg-red-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700'
                : buttonClasses('primary')
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
