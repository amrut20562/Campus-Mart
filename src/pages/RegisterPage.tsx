// CampusMart — Register page (AUTH-01)
// - Email/password registration via Supabase Auth
// - Profile row created by trigger (handle_new_user) with full_name and college from metadata
// - Shows validation and Supabase error messages in readable form
// - Redirects to marketplace on success

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase';
import { registerSchema, type RegisterFormValues } from '@/schemas';
import { useToast } from '@/components/feedback/ToastContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError('');
    setIsSubmitting(true);

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.full_name.trim(),
          college: values.college.trim(),
          department: values.department?.trim() ?? null,
        },
      },
    });

    setIsSubmitting(false);

    if (error) {
      // Map Supabase error messages to friendly text
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        setServerError('An account with this email already exists. Try logging in.');
      } else {
        setServerError(error.message);
      }
      return;
    }

    showToast('Account created! Welcome to CampusMart.');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-subheading font-medium tracking-tight">Create an account</h1>
          <p className="text-caption text-ash-gray mt-1">
            Already have one?{' '}
            <Link to="/login" className="text-gallery-black underline underline-offset-2">
              Sign in
            </Link>
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">

            {/* Full name */}
            <div className="form-group">
              <label htmlFor="full_name" className="label">Full Name *</label>
              <input
                id="full_name"
                type="text"
                autoComplete="name"
                className="input"
                aria-describedby={errors.full_name ? 'full_name-error' : undefined}
                aria-invalid={!!errors.full_name}
                {...register('full_name')}
              />
              {errors.full_name && (
                <p id="full_name-error" className="field-error">{errors.full_name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="label">Email *</label>
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

            {/* College */}
            <div className="form-group">
              <label htmlFor="college" className="label">College / University *</label>
              <input
                id="college"
                type="text"
                autoComplete="organization"
                className="input"
                aria-invalid={!!errors.college}
                aria-describedby={errors.college ? 'college-error' : undefined}
                {...register('college')}
              />
              {errors.college && (
                <p id="college-error" className="field-error">{errors.college.message}</p>
              )}
            </div>

            {/* Department (optional) */}
            <div className="form-group">
              <label htmlFor="department" className="label">
                Department <span className="text-ash-gray font-normal">(optional)</span>
              </label>
              <input
                id="department"
                type="text"
                className="input"
                aria-describedby={errors.department ? 'department-error' : undefined}
                {...register('department')}
              />
              {errors.department && (
                <p id="department-error" className="field-error">{errors.department.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password" className="label">Password *</label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                className="input"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                {...register('password')}
              />
              {errors.password && (
                <p id="password-error" className="field-error">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm password */}
            <div className="form-group">
              <label htmlFor="confirmPassword" className="label">Confirm Password *</label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                className="input"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p id="confirm-error" className="field-error">{errors.confirmPassword.message}</p>
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
              {isSubmitting ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
