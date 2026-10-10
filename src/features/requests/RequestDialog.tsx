// CampusMart — Request Dialog (REQ-01)
// Authenticated non-owner can submit buy or exchange interest


import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthContext';
import { requestSchema, type RequestFormValues } from '@/schemas';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/components/feedback/ToastContext';
import type { TransactionMode } from '@/types/database.types';

interface RequestDialogProps {
  productId: string;
  productTitle: string;
  transactionMode: TransactionMode;
  onClose: () => void;
}

export default function RequestDialog({ productId, productTitle, transactionMode, onClose }: RequestDialogProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const qc = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      request_type: transactionMode === 'exchange' ? 'exchange' : 'buy',
    },
  });

  const requestType = watch('request_type');

  const mutation = useMutation({
    mutationFn: async (values: RequestFormValues) => {
      const { error } = await supabase.from('product_requests').insert({
        product_id: productId,
        buyer_id: user!.id,
        request_type: values.request_type,
        message: values.message.trim(),
        offered_item_text: values.offered_item_text?.trim() || null,
        status: 'pending',
      });
      if (error) {
        // Surface friendly messages
        if (error.message.includes('violates row-level security')) {
          throw new Error('You cannot request your own listing or a sold item.');
        }
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.requests(user!.id) });
      showToast('Request sent!');
      onClose();
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  });

  return (
    <div className="dialog-overlay" role="dialog" aria-modal aria-labelledby="request-title" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 id="request-title" className="text-body-sm font-medium">Send a Request</h2>
          <button onClick={onClose} className="btn-ghost p-1.5" aria-label="Close dialog">
            <X size={16} aria-hidden />
          </button>
        </div>
        <p className="text-caption text-ash-gray mb-5">
          For: <span className="font-medium text-gallery-black">{productTitle}</span>
        </p>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="flex flex-col gap-4">
          {/* Request type */}
          {transactionMode !== 'sell' && transactionMode !== 'exchange' && (
            <div className="form-group">
              <label className="label">I want to</label>
              <div className="flex gap-3">
                {(['buy', 'exchange'] as const).map((t) => (
                  <label key={t} className="flex items-center gap-2 text-caption cursor-pointer">
                    <input type="radio" value={t} {...register('request_type')} className="accent-gallery-black" />
                    {t === 'buy' ? 'Buy' : 'Exchange'}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Message */}
          <div className="form-group">
            <label htmlFor="req-message" className="label">Message *</label>
            <textarea
              id="req-message"
              className="textarea"
              placeholder="Introduce yourself and explain your interest…"
              aria-invalid={!!errors.message}
              aria-describedby={errors.message ? 'req-msg-error' : undefined}
              {...register('message')}
            />
            {errors.message && <p id="req-msg-error" className="field-error">{errors.message.message}</p>}
          </div>

          {/* Exchange item (if exchange) */}
          {requestType === 'exchange' && (
            <div className="form-group">
              <label htmlFor="offered-item" className="label">
                What are you offering? <span className="text-ash-gray font-normal">(optional)</span>
              </label>
              <textarea
                id="offered-item"
                className="textarea"
                placeholder="Describe what you'd like to exchange…"
                {...register('offered_item_text')}
              />
            </div>
          )}

          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 justify-center">
              {mutation.isPending ? 'Sending…' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
