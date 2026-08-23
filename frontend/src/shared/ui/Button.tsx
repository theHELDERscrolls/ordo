import type { ButtonHTMLAttributes } from 'react';
import { buttonClasses, type ButtonVariant } from './button-styles';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant };

/** The app's button. See {@link buttonClasses} for the variants. */
export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return <button className={`${buttonClasses(variant)} ${className}`} {...props} />;
}
