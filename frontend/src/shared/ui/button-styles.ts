export type ButtonVariant = 'primary' | 'secondary';

const base =
  'inline-flex items-center justify-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50';

const variants: Record<ButtonVariant, string> = {
  // Primary carries the accent — the one loud element per view. Secondary is a
  // quiet outlined button for cancel/back actions.
  primary: 'bg-accent text-accent-fg hover:opacity-90',
  secondary: 'border border-border bg-surface text-fg hover:border-fg',
};

// Shared button classes, so a react-router <Link> that should look like a button
// reuses the exact styling without duplicating it.
export function buttonClasses(variant: ButtonVariant = 'primary'): string {
  return `${base} ${variants[variant]}`;
}
