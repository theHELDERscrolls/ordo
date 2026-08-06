import { loginSchema, type LoginInput } from '@ordo/shared';
import { Navigate } from 'react-router-dom';
import { TextField } from '@/shared/ui/TextField';
import { ThemeToggle } from '@/shared/ui/ThemeToggle';
import { useAuth } from '@/core/auth/use-auth';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

export function LoginPage() {
  const auth = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  if (auth.status === 'authenticated') return <Navigate to="/" replace />;

  async function onSubmit(data: LoginInput) {
    setServerError(null);
    try {
      await auth.login(data.email, data.password);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Could not sign in');
    }
  }

  return (
    <div className="relative min-h-svh bg-bg text-fg transition-colors">
      <header className="absolute inset-x-0 top-0 flex items-center justify-between px-4 py-4 sm:px-6">
        <span className="text-sm font-semibold tracking-tight">Ordo</span>
        <ThemeToggle />
      </header>

      <main className="flex items-center justify-center px-4 min-h-svh">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm text-fg-muted transition-colors">
            Access your workspace to manage your inventory.
          </p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-8 space-y-5"
            noValidate
          >
            <TextField
              label="Email"
              id="email"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <TextField
              label="Password"
              id="password"
              type="password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />

            <p
              className="min-h-5 text-sm text-red-600 transition-colors dark:text-red-400"
              role="alert"
            >
              {serverError || ''}
            </p>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 text-sm font-medium transition-colors rounded-md bg-fg text-bg hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
