// CampusMart — Requests page (REQ-01, REQ-02)
// Two tabs: Received (seller) and Sent (buyer).
// Seller can accept/reject; Buyer can cancel pending.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthContext';
import { queryKeys } from '@/lib/queryKeys';
import { formatDate, REQUEST_STATUS_LABELS, formatINR } from '@/lib/formatters';
import { useToast } from '@/components/feedback/ToastContext';
import type { RequestStatus, RequestWithProduct, RequestWithBuyer } from '@/types/database.types';

type Tab = 'received' | 'sent';

const STATUS_COLOR: Record<RequestStatus, string> = {
  pending:   'bg-hairline-gray text-gallery-black',
  accepted:  'bg-gallery-black text-paper-white',
  rejected:  'bg-ash-gray text-paper-white',
  cancelled: 'bg-ash-gray text-paper-white',
};

export default function RequestsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>('received');

  // ---- Received requests (seller) ----
  const { data: received, isLoading: receivedLoading } = useQuery({
    queryKey: [...queryKeys.requests(user!.id), 'received'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_requests')
        .select(`
          *, 
          profiles ( id, full_name, college ),
          products ( id, title, image_path, price, seller_id )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      // Filter to requests for this seller's products (RLS handles this too)
      return (data as RequestWithBuyer[]).filter(
        (r) => (r.products as any)?.seller_id === user!.id
      );
    },
    enabled: tab === 'received',
  });

  // ---- Sent requests (buyer) ----
  const { data: sent, isLoading: sentLoading } = useQuery({
    queryKey: [...queryKeys.requests(user!.id), 'sent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_requests')
        .select(`
          *,
          products ( id, title, image_path, price, status )
        `)
        .eq('buyer_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as RequestWithProduct[];
    },
    enabled: tab === 'sent',
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RequestStatus }) => {
      const { error } = await supabase
        .from('product_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.requests(user!.id) });
      showToast('Request updated');
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  });

  const isLoading = tab === 'received' ? receivedLoading : sentLoading;
  const items = tab === 'received' ? received : sent;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-subheading font-medium tracking-tight mb-8">Requests</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-8" role="tablist">
        {(['received', 'sent'] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`btn-ghost py-1.5 px-4 text-caption capitalize ${tab === t ? 'bg-gallery-black text-paper-white border-gallery-black' : ''}`}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded" />)}
        </div>
      )}

      {!isLoading && items?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-subheading font-medium tracking-tight mb-2">No {tab} requests</p>
          <p className="text-caption text-ash-gray">
            {tab === 'sent' ? 'Browse listings to send a buy or exchange request.' : 'Buyers will appear here when they contact you.'}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {/* RECEIVED */}
        {tab === 'received' && received?.map((req: RequestWithBuyer) => (
          <div key={req.id} className="bg-card p-4 flex flex-col gap-3" style={{ borderRadius: '2px' }}>
            <div className="flex items-start gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`status-badge ${STATUS_COLOR[req.status]}`}>
                    {REQUEST_STATUS_LABELS[req.status]}
                  </span>
                  <span className="text-caption text-ash-gray capitalize">{req.request_type}</span>
                </div>
                <Link to={`/products/${req.product_id}`} className="text-body-sm font-medium hover:underline">
                  {(req.products as any)?.title}
                </Link>
                <p className="text-caption text-ash-gray mt-0.5">
                  From: <strong>{req.profiles?.full_name}</strong> · {req.profiles?.college}
                </p>
                <p className="text-caption mt-2">{req.message}</p>
                {req.offered_item_text && (
                  <p className="text-caption text-ash-gray mt-1">Offering: {req.offered_item_text}</p>
                )}
                <p className="text-caption text-ash-gray mt-2">{formatDate(req.created_at)}</p>
              </div>
            </div>
            {/* Seller actions */}
            {req.status === 'pending' && (
              <div className="flex gap-2">
                <button
                  onClick={() => updateMutation.mutate({ id: req.id, status: 'accepted' })}
                  disabled={updateMutation.isPending}
                  className="btn-primary flex-1 justify-center text-caption py-1.5"
                >
                  Accept
                </button>
                <button
                  onClick={() => updateMutation.mutate({ id: req.id, status: 'rejected' })}
                  disabled={updateMutation.isPending}
                  className="btn-ghost flex-1 justify-center text-caption py-1.5"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}

        {/* SENT */}
        {tab === 'sent' && sent?.map((req: RequestWithProduct) => (
          <div key={req.id} className="bg-card p-4 flex flex-col gap-3" style={{ borderRadius: '2px' }}>
            <div className="flex items-start gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`status-badge ${STATUS_COLOR[req.status]}`}>
                    {REQUEST_STATUS_LABELS[req.status]}
                  </span>
                  <span className="text-caption text-ash-gray capitalize">{req.request_type}</span>
                </div>
                <Link to={`/products/${req.product_id}`} className="text-body-sm font-medium hover:underline">
                  {req.products?.title}
                </Link>
                <p className="text-caption text-ash-gray mt-0.5">
                  Price: {req.products?.price ? formatINR(req.products.price) : '—'}
                </p>
                <p className="text-caption mt-2">{req.message}</p>
                <p className="text-caption text-ash-gray mt-2">{formatDate(req.created_at)}</p>
              </div>
            </div>
            {/* Buyer cancel */}
            {req.status === 'pending' && (
              <button
                onClick={() => updateMutation.mutate({ id: req.id, status: 'cancelled' })}
                disabled={updateMutation.isPending}
                className="btn-ghost text-caption py-1.5"
              >
                Cancel Request
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
