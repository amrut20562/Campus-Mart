// CampusMart — Login page (AUTH-02)
// - Email/password login
// - Preserves intended return route from ?redirect param
// - Shows error state; no session on failure

import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase';
import { loginSchema, type LoginFormValues } from '@/schemas';
import { useToast } from '@/components/feedback/ToastContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sanitize redirectTo to prevent open redirect attacks
  const rawRedirect = searchParams.get('redirect') ?? '/';
  const redirectTo = (rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')) ? rawRedirect : '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError('');
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        // Generic message to avoid leaking user-existence info
        setServerError('Invalid email or password. Please try again.');
        return;
      }

      // Optional profile check - don't fail if profiles table doesn't have entry yet
      if (data.user) {
        try {
          await supabase.from('profiles').select('id').eq('id', data.user.id).single();
        } catch {
          // Profile check is optional, continue regardless
        }
      }

      showToast('Signed in successfully!');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-subheading font-medium tracking-tight">Sign in</h1>
          <p className="text-caption text-gallery-black mt-1">
            New to CampusMart?{' '}
            <Link to="/register" className="text-gallery-black underline underline-offset-2">
              Create an account
            </Link>
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="input"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...register('email')}
              />
              {errors.email && (
                <p id="email-error" className="field-error">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="input"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                {...register('password')}
              />
              {errors.password && (
                <p id="password-error" className="field-error">{errors.password.message}</p>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <div role="alert" className="px-4 py-3 bg-red-50 border border-red-200 rounded-2xl">
                <p className="text-caption text-red-700">{serverError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full justify-center mt-2"
            >
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
