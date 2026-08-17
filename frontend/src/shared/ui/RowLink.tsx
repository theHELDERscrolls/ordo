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

/**
 * A `<Link>` when `active`, a plain element otherwise, so list rows do not repeat
 * the same role check in both the table and the cards.
 */
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
