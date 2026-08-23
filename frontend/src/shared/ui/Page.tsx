import type { ReactNode } from 'react';

// One width per shape of content, rather than a number per screen: a form is read
// in a short line, a table of seven columns needs every pixel, and the panel sits
// between the two.
const widths = {
  narrow: 'max-w-2xl',
  medium: 'max-w-5xl',
  wide: 'max-w-6xl',
} as const;

type PageProps = {
  width?: keyof typeof widths;
  children: ReactNode;
};

/**
 * The frame every screen sits in. The gutter and the vertical rhythm are the
 * `--spacing-page-*` tokens, applied here and nowhere else, so no screen restates
 * a raw padding and the app's margins are changed in one place.
 */
export function Page({ width = 'wide', children }: PageProps) {
  return <div className={`mx-auto ${widths[width]} px-page-x py-page-y`}>{children}</div>;
}

type PageHeaderProps = {
  title: string;
  description?: string;
  /** The screen's own actions, laid out at the end of the header. */
  children?: ReactNode;
};

/**
 * A screen's title, its one-line description and its actions. The row wraps rather
 * than overflows: on the narrowest phones a title and three icon buttons run out of
 * line, and the actions drop below instead of being pushed off screen.
 */
export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-fg-muted transition-colors">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{children}</div>
      )}
    </div>
  );
}
