import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/core/theme/use-theme';

export function ThemeToggle() {
  const [theme, toggle] = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className="rounded-full border border-border p-2 text-fg-muted transition-colors hover:text-fg"
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
