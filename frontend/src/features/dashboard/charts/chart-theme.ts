/**
 * Chart chrome shared by both panel charts, so they read as one system.
 *
 * Every colour is a raw theme token rather than a Tailwind utility: Recharts renders
 * SVG attributes, and pointing them at the same variables the rest of the app uses
 * means the light/dark toggle repaints the charts with no second palette to keep in
 * sync. No categorical hue scale appears here because both charts are single-series:
 * with one series there is no identity to encode, so bar length and curve height
 * carry the meaning and colour carries none. Amber and the accent stay reserved for
 * stock status, where they already mean something.
 */

export const axisTick = { fill: 'var(--fg-muted)', fontSize: 11 };

/** Hairline, solid, one step off the surface, so it sits behind the data. */
export const gridStroke = 'var(--border)';

export const tooltipCursor = { fill: 'var(--surface-2)' };

/** Recharts styles its tooltip wrapper inline, so this has to be a style object. */
export const tooltipStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '8px 10px',
  fontSize: 12,
  color: 'var(--fg)',
  boxShadow: 'none',
};
