import { Modal } from './Modal';
import { buttonClasses } from './button-styles';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** Locks both buttons while the confirmed action is in flight. */
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * A confirmation modal. Focuses Cancel by default, which is the safe choice for a
 * destructive action, and a destructive confirm uses a fixed red rather than the
 * tenant accent, so danger reads the same for every business. See {@link Modal} for
 * the dismissal behaviour.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      labelledBy="confirm-dialog-title"
      className="sm:max-w-sm"
    >
      <h2
        id="confirm-dialog-title"
        className="font-display text-lg font-semibold tracking-tight"
      >
        {title}
      </h2>
      {message && <p className="mt-2 text-sm text-fg-muted">{message}</p>}
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          autoFocus
          disabled={busy}
          onClick={onCancel}
          className={buttonClasses('secondary')}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onConfirm}
          className={
            destructive
              ? 'inline-flex items-center justify-center rounded-md bg-red-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50'
              : buttonClasses('primary')
          }
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
