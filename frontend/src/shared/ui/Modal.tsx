import { useEffect, useRef, useState, type ReactNode } from 'react';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  /** Id of the element that names the dialog, read out on open. */
  labelledBy: string;
  /** Width of the panel from `sm` up; on a phone it is always full width. */
  className?: string;
  children: ReactNode;
};

/**
 * The app's modal, on the native `<dialog>`. `showModal()` already gives us the
 * focus trap, Escape, the top layer and an inert, unscrollable background, so none
 * of it is reimplemented here. The panel slides in on `translate`; closing is
 * immediate, as it is for any other panel.
 */
export function Modal({
  open,
  onClose,
  labelledBy,
  className = 'sm:max-w-md',
  children,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const downOnBackdrop = useRef(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!open) return;
    // The browser returns focus to the opener when a dialog closes, but not when
    // React unmounts one, which is what a backdrop or close-button click does here.
    const opener = document.activeElement as HTMLElement | null;
    // Guarded, because StrictMode runs this effect twice on mount and `showModal()`
    // throws on a dialog that is already open.
    if (ref.current && !ref.current.open) ref.current.showModal();
    // A frame after the panel is painted at rest, so the class swap transitions
    // instead of landing in the same paint.
    const frame = requestAnimationFrame(() => setShown(true));
    return () => {
      cancelAnimationFrame(frame);
      setShown(false);
      opener?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onClose={onClose}
      // The dialog itself is the full-screen backdrop, so a click lands on it only
      // outside the panel. Its `::backdrop` is cleared to keep the UA tint out.
      // Both ends of the click have to land there: a text selection dragged out of
      // the panel and released over the backdrop is not a dismissal.
      onMouseDown={(e) => {
        downOnBackdrop.current = e.target === ref.current;
      }}
      onClick={(e) => {
        if (e.target === ref.current && downOnBackdrop.current) onClose();
      }}
      // `dvh` rather than `vh`: on a phone `vh` measures the viewport with the URL
      // bar ignored, which would push the panel's base below the visible area and
      // clip it as it rises.
      className="fixed top-0 left-0 m-0 h-dvh w-full max-h-none max-w-none items-end justify-center bg-black/40 p-0 backdrop-blur-sm backdrop:bg-transparent open:flex sm:items-center sm:p-4"
    >
      {/* `text-fg` is not decoration: the UA gives `dialog` a fixed `color: CanvasText`,
          which cuts the inheritance from the body and paints anything without a colour
          class black, dark theme included. */}
      <div
        className={`scrollbar-slim max-h-[85dvh] w-full overflow-y-auto rounded-t-2xl border border-border bg-bg p-5 text-fg shadow-xl transition-all duration-200 sm:rounded-lg sm:p-6 ${shown ? 'translate-y-0' : 'translate-y-full'} ${className}`}
      >
        {children}
      </div>
    </dialog>
  );
}
