// CampusMart — Report Dialog (REP-01)
// Authenticated non-owner reports a listing for moderation review.
// One unresolved report per (reporter, product) enforced by DB partial unique index.

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthContext';
import { reportSchema, type ReportFormValues } from '@/schemas';
import { queryKeys } from '@/lib/queryKeys';
import { REPORT_REASON_OPTIONS } from '@/lib/constants';
import { useToast } from '@/components/feedback/ToastContext';

interface ReportDialogProps {
  productId: string;
  productTitle: string;
  onClose: () => void;
}

export default function ReportDialog({ productId, productTitle, onClose }: ReportDialogProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const qc = useQueryClient();

  const { register, handleSubmit, formState: { errors } } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
  });

  const mutation = useMutation({
    mutationFn: async (values: ReportFormValues) => {
      const { error } = await supabase.from('reports').insert({
        product_id: productId,
        reporter_id: user!.id,
        reason: values.reason,
        details: values.details?.trim() || null,
        status: 'open',
      });
      if (error) {
        if (error.code === '23505') {
          throw new Error('You already have an open report for this listing.');
        }
        if (error.message.includes('violates row-level security')) {
          throw new Error('You cannot report your own listing.');
        }
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.reports });
      showToast('Report submitted. Our team will review it.');
      onClose();
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  });

  return (
    <div className="dialog-overlay" role="dialog" aria-modal aria-labelledby="report-title" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 id="report-title" className="text-body-sm font-medium">Report a Listing</h2>
          <button onClick={onClose} className="btn-ghost p-1.5" aria-label="Close dialog">
            <X size={16} aria-hidden />
          </button>
        </div>

        <p className="text-caption text-ash-gray mb-2">
          Reporting: <span className="font-medium text-gallery-black">{productTitle}</span>
        </p>
        <p className="text-caption text-ash-gray mb-5">
          Reports are reviewed by our team. Submitting a report does not automatically hide the listing or prove fraud.
        </p>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="flex flex-col gap-4">
          {/* Reason */}
          <div className="form-group">
            <label htmlFor="report-reason" className="label">Reason *</label>
            <select
              id="report-reason"
              className="select"
              aria-invalid={!!errors.reason}
              {...register('reason')}
            >
              <option value="">Select a reason…</option>
              {REPORT_REASON_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            {errors.reason && <p className="field-error">{errors.reason.message}</p>}
          </div>

          {/* Details */}
          <div className="form-group">
            <label htmlFor="report-details" className="label">
              Additional Details <span className="text-ash-gray font-normal">(optional)</span>
            </label>
            <textarea
              id="report-details"
              className="textarea"
              placeholder="Provide any additional context…"
              maxLength={1000}
              {...register('details')}
            />
          </div>

          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 justify-center">
              {mutation.isPending ? 'Submitting…' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
