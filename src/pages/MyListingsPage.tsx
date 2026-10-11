// CampusMart — My Listings page (LIST-03, LIST-05, LIST-06)
// Shows only the signed-in seller's products with status tabs.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthContext';
import { queryKeys } from '@/lib/queryKeys';
import { formatINR, formatDate, STATUS_LABELS, CONDITION_LABELS, getStatusClasses } from '@/lib/formatters';
import { STATUS_OPTIONS } from '@/lib/constants';
import { getProductImageUrl, deleteProductImage } from '@/features/products/productUtils';
import { useToast } from '@/components/feedback/ToastContext';
import type { ProductRow, ProductStatus } from '@/types/database.types';

const STATUS_TABS: { value: ProductStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'available', label: 'Available' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'sold', label: 'Sold' },
];

export default function MyListingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<ProductStatus | 'all'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: products, isLoading, isError } = useQuery({
    queryKey: queryKeys.myListings(user!.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('seller_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as (ProductRow & { categories: { name: string } })[];
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ProductStatus }) => {
      const { error } = await supabase
        .from('products')
        .update({ status })
        .eq('id', id)
        .eq('seller_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.myListings(user!.id) });
      qc.invalidateQueries({ queryKey: queryKeys.stats });
      showToast('Status updated');
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (product: ProductRow) => {
      await deleteProductImage(product.image_path);
      const { error } = await supabase
        .from('products').delete().eq('id', product.id).eq('seller_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.myListings(user!.id) });
      qc.invalidateQueries({ queryKey: queryKeys.products() });
      qc.invalidateQueries({ queryKey: queryKeys.stats });
      setDeletingId(null);
      showToast('Listing deleted');
    },
    onError: (e: Error) => { showToast(e.message, 'error'); setDeletingId(null); },
  });

  const filtered = products?.filter((p) => activeTab === 'all' || p.status === activeTab) ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <h1 className="text-subheading font-medium tracking-tight">My Listings</h1>
        <Link to="/sell" className="btn-primary">+ New Listing</Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-6 flex-wrap" role="tablist">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={activeTab === tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`btn-ghost text-caption py-1.5 px-4 ${activeTab === tab.value ? 'bg-gallery-black text-paper-white border-gallery-black' : ''}`}
          >
            {tab.label}
            {tab.value !== 'all' && products && (
              <span className="ml-1 text-xs opacity-70">
                ({products.filter(p => p.status === tab.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-[152px] rounded" />)}
        </div>
      )}

      {isError && (
        <p className="text-caption text-ash-gray text-center py-8">Could not load listings. Please refresh.</p>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-subheading font-medium tracking-tight mb-2">
            {products?.length === 0 ? 'No listings yet' : 'No listings in this status'}
          </p>
          <p className="text-caption text-ash-gray mb-6">
            {products?.length === 0 ? 'Start by creating your first listing.' : 'Switch tabs to view other statuses.'}
          </p>
          {products?.length === 0 && (
            <Link to="/sell" className="btn-primary">Create your first listing</Link>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {filtered.map((product) => (
          <div key={product.id} className="bg-card flex gap-4 p-4" style={{ borderRadius: '2px' }}>
            {/* Thumbnail */}
            <img
              src={getProductImageUrl(product.image_path)}
              alt={product.title}
              width={120}
              height={120}
              className="w-[120px] h-[120px] object-cover shrink-0"
              style={{ borderRadius: '2px', width: '120px', height: '120px' }}
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-product.svg'; }}
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 flex-wrap">
                <Link to={`/products/${product.id}`} className="text-body-sm font-medium hover:underline truncate">
                  {product.title}
                </Link>
                <span className={`status-badge shrink-0 ${getStatusClasses(product.status)}`}>
                  {STATUS_LABELS[product.status]}
                </span>
              </div>
              <p className="text-caption text-ash-gray mt-0.5">
                {formatINR(product.price)} · {CONDITION_LABELS[product.condition]} · {formatDate(product.created_at)}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <select
                className="select text-caption py-1"
                style={{ minWidth: '120px' }}
                value={product.status}
                aria-label={`Change status for ${product.title}`}
                onChange={(e) => statusMutation.mutate({ id: product.id, status: e.target.value as ProductStatus })}
                disabled={statusMutation.isPending}
              >
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <Link to={`/products/${product.id}/edit`} className="btn-ghost p-2" aria-label={`Edit ${product.title}`}>
                <Edit size={14} aria-hidden />
              </Link>
              <button
                onClick={() => setDeletingId(product.id)}
                className="btn-danger p-2"
                aria-label={`Delete ${product.title}`}
              >
                <Trash2 size={14} aria-hidden />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation dialog */}
      {deletingId && (
        <div className="dialog-overlay" role="dialog" aria-modal aria-labelledby="del-confirm-title">
          <div className="dialog-content">
            <h2 id="del-confirm-title" className="text-body-sm font-medium mb-2">Delete listing?</h2>
            <p className="text-caption text-ash-gray mb-6">
              "{products?.find(p => p.id === deletingId)?.title}" will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingId(null)} className="btn-ghost flex-1 justify-center">Cancel</button>
              <button
                onClick={() => {
                  const p = products?.find(x => x.id === deletingId);
                  if (p) deleteMutation.mutate(p);
                }}
                disabled={deleteMutation.isPending}
                className="btn-danger flex-1 justify-center"
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
