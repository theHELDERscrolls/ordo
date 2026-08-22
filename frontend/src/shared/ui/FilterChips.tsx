type Chip<T> = { label: string; value: T };

type FilterChipsProps<T> = {
  options: Chip<T>[];
  value: T;
  onChange: (value: T) => void;
};

/**
 * The row of pills a list is narrowed with. One is always active, "all" included,
 * so the filter never reads as off.
 *
 * Renders the buttons bare, without a container of its own: every caller lines
 * them up beside its other controls in a single wrapping row.
 */
export function FilterChips<T>({ options, value, onChange }: FilterChipsProps<T>) {
  return (
    <>
      {options.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={() => onChange(chip.value)}
          className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
            value === chip.value
              ? 'border-fg bg-fg text-bg'
              : 'border-border text-fg-muted hover:text-fg'
          }`}
        >
          {chip.label}
        </button>
      ))}
    </>
  );
}
