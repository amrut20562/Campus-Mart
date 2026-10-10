// CampusMart — Profile page (PROF-01)
// - View and edit own profile fields
// - Email shown read-only from Auth (PROF-01)
// - Cannot edit another user's profile — RLS enforces ownership

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthContext';
import { profileSchema, type ProfileFormValues } from '@/schemas';
import { queryKeys } from '@/lib/queryKeys';
import { formatDate } from '@/lib/formatters';
import { useToast } from '@/components/feedback/ToastContext';
import type { ProfileRow } from '@/types/database.types';

export default function ProfilePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const qc = useQueryClient();

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: queryKeys.profile(user!.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      return data as ProfileRow;
    },
    enabled: !!user,
  });

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (profile) {
      reset({
        full_name: profile.full_name,
        college: profile.college,
        department: profile.department ?? '',
        graduation_year: profile.graduation_year ?? undefined,
        contact_text: profile.contact_text ?? '',
      });
    }
  }, [profile, reset]);

  const mutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: values.full_name.trim(),
          college: values.college.trim(),
          department: values.department?.trim() || null,
          graduation_year: values.graduation_year ?? null,
          contact_text: values.contact_text?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.profile(user!.id) });
      showToast('Profile updated');
    },
    onError: (err: Error) => {
      showToast(err.message, 'error');
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="skeleton h-6 w-32 mb-6 rounded" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-12 mb-4 rounded" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-caption text-ash-gray">Could not load profile. Please refresh.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-subheading font-medium tracking-tight mb-8">Your Profile</h1>

      <div className="card">
        {/* Read-only email */}
        <div className="form-group mb-6 pb-6 border-b border-hairline-gray">
          <label className="label">Email</label>
          <input
            type="email"
            className="input bg-soft-lift"
            value={user!.email ?? ''}
            readOnly
            aria-readonly="true"
          />
          <p className="text-caption text-ash-gray mt-1">Email cannot be changed here.</p>
        </div>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="flex flex-col gap-4">
          {/* Full name */}
          <div className="form-group">
            <label htmlFor="full_name" className="label">Full Name *</label>
            <input id="full_name" type="text" className="input" aria-invalid={!!errors.full_name}
              {...register('full_name')} />
            {errors.full_name && <p className="field-error">{errors.full_name.message}</p>}
          </div>

          {/* College */}
          <div className="form-group">
            <label htmlFor="college" className="label">College / University *</label>
            <input id="college" type="text" className="input" aria-invalid={!!errors.college}
              {...register('college')} />
            {errors.college && <p className="field-error">{errors.college.message}</p>}
          </div>

          {/* Department */}
          <div className="form-group">
            <label htmlFor="department" className="label">
              Department <span className="text-ash-gray font-normal">(optional)</span>
            </label>
            <input id="department" type="text" className="input"
              {...register('department')} />
          </div>

          {/* Graduation year */}
          <div className="form-group">
            <label htmlFor="graduation_year" className="label">
              Graduation Year <span className="text-ash-gray font-normal">(optional)</span>
            </label>
            <input
              id="graduation_year"
              type="number"
              min={1900}
              max={2100}
              className="input"
              aria-invalid={!!errors.graduation_year}
              {...register('graduation_year', { valueAsNumber: true })}
            />
            {errors.graduation_year && <p className="field-error">{errors.graduation_year.message}</p>}
          </div>

          {/* Contact text */}
          <div className="form-group">
            <label htmlFor="contact_text" className="label">
              Contact Info <span className="text-ash-gray font-normal">(optional — shown to authenticated users only)</span>
            </label>
            <input id="contact_text" type="text" className="input" maxLength={100}
              placeholder="e.g. WhatsApp number or preferred contact"
              {...register('contact_text')} />
          </div>

          {/* Save button */}
          <div className="flex items-center gap-4 mt-2 pt-4 border-t border-hairline-gray">
            <button
              type="submit"
              disabled={!isDirty || mutation.isPending}
              className="btn-primary"
            >
              {mutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
            {profile?.created_at && (
              <p className="text-caption text-ash-gray ml-auto">
                Member since {formatDate(profile.created_at)}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
