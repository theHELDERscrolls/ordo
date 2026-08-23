import { forwardRef, type InputHTMLAttributes } from 'react';

import { fieldClasses } from './field-styles';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

/**
 * A labelled input. The message line always reserves its height, so revealing an
 * error never shifts the layout. Forwards its ref for React Hook Form to register.
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, id, ...props }, ref) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        ref={ref}
        aria-invalid={error ? true : undefined}
        {...props}
        className={`mt-1.5 ${fieldClasses(Boolean(error))}`}
      />
      <p
        className="mt-1 min-h-4 text-xs text-red-600 transition-colors dark:text-red-400"
        role="alert"
      >
        {error}
      </p>
    </div>
  ),
);

TextField.displayName = 'TextField';
