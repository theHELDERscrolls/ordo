import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type RowLinkProps = {
  to: string;
  active: boolean;
  as?: 'span' | 'div';
  className?: string;
  title?: string;
  children: ReactNode;
};

// Renders a Link when `active` (e.g. an admin who can open the detail), otherwise a
// plain element — so list rows don't repeat the same isAdmin ternary in the table
// and the cards.
export function RowLink({ to, active, as: Tag = 'span', className, title, children }: RowLinkProps) {
  if (active) {
    return (
      <Link to={to} className={className} title={title}>
        {children}
      </Link>
    );
  }
  return (
    <Tag className={className} title={title}>
      {children}
    </Tag>
  );
}
