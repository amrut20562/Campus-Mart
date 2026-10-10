// CampusMart — Product Detail Page (PROD-05)
// Contextual actions based on auth state:
//   Visitor: login prompts
//   Non-owner student: Save, Send Request, Report
//   Owner: Edit, Change Status, Delete

import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthContext';
import { queryKeys } from '@/lib/queryKeys';
import { formatINR, formatDate, STATUS_LABELS, CONDITION_LABELS, TRANSACTION_LABELS, getStatusClasses } from '@/lib/formatters';
import { STATUS_OPTIONS } from '@/lib/constants';
import { getProductImageUrl, deleteProductImage } from '@/features/products/productUtils';
import FavouriteButton from '@/features/favourites/FavouriteButton';
import RequestDialog from '@/features/requests/RequestDialog';
import ReportDialog from '@/features/reports/ReportDialog';
import type { ProductWithDetails, ProductStatus } from '@/types/database.types';
import { useToast } from '@/components/feedback/ToastContext';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { showToast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: queryKeys.product(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories ( id, name, slug, icon_key ),
          profiles:seller_id ( id, full_name, college, department, contact_text, created_at )
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as ProductWithDetails & { profiles: { contact_text: string | null; created_at: string } };
    },
    enabled: !!id,
  });

  const isOwner = user && product?.seller_id === user.id;
  const isOther = user && !isOwner;

  // Status update mutation (LIST-06)
  const statusMutation = useMutation({
    mutationFn: async (newStatus: ProductStatus) => {
      const { error } = await supabase
        .from('products')
        .update({ status: newStatus })
        .eq('id', id)
        .eq('seller_id', user!.id); // extra safety; RLS also enforces
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.product(id!) });
      qc.invalidateQueries({ queryKey: queryKeys.products() });
      qc.invalidateQueries({ queryKey: queryKeys.stats });
      showToast('Status updated');
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  });

  // Delete mutation (LIST-05)
  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Delete storage image first
      if (product?.image_path) await deleteProductImage(product.image_path);
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('seller_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.products() });
      qc.invalidateQueries({ queryKey: queryKeys.myListings(user!.id) });
      qc.invalidateQueries({ queryKey: queryKeys.stats });
      showToast('Listing deleted');
      navigate('/', { replace: true });
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="skeleton h-5 w-24 mb-8 rounded" />
        <div className="grid md:grid-cols-2 gap-8">
          <div className="skeleton aspect-square rounded" />
          <div className="flex flex-col gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-6 rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <p className="text-caption text-ash-gray">Product not found or is no longer available.</p>
        <Link to="/" className="btn-ghost mt-4 inline-flex">← Back to listings</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <Link to="/" className="inline-flex items-center gap-1 text-caption text-ash-gray hover:text-gallery-black mb-8">
        <ChevronLeft size={14} aria-hidden /> Back to listings
      </Link>

      {/* Hidden warning */}
      {product.is_hidden && (
        <div className="flex items-center gap-2 bg-soft-lift border border-hairline-gray px-4 py-3 mb-6" style={{ borderRadius: '2px' }}>
          <AlertTriangle size={16} className="text-ash-gray shrink-0" aria-hidden />
          <p className="text-caption">This listing is hidden from public view.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Left — Image */}
        <div>
          <div className="relative aspect-square bg-soft-lift overflow-hidden" style={{ borderRadius: '2px' }}>
            <img
              src={getProductImageUrl(product.image_path)}
              alt={product.title}
              className="w-full h-full object-contain"
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-product.svg'; }}
            />
            <span className={`status-badge absolute top-3 left-3 ${getStatusClasses(product.status)}`}>
              {STATUS_LABELS[product.status]}
            </span>
          </div>
        </div>

        {/* Right — Details */}
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-caption text-ash-gray mb-1">{product.categories?.name}</p>
            <h1 className="text-heading-sm font-medium tracking-tight leading-snug">{product.title}</h1>
            <p className="text-subheading font-medium mt-2">{formatINR(product.price)}</p>
          </div>

          <hr className="section-divider" />

          {/* Metadata grid */}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-caption">
            <div><dt className="text-ash-gray">Condition</dt><dd className="font-medium">{CONDITION_LABELS[product.condition]}</dd></div>
            <div><dt className="text-ash-gray">Transaction</dt><dd className="font-medium">{TRANSACTION_LABELS[product.transaction_mode]}</dd></div>
            {product.age_months != null && (
              <div><dt className="text-ash-gray">Age</dt><dd className="font-medium">{product.age_months} month{product.age_months !== 1 ? 's' : ''}</dd></div>
            )}
            {product.location_text && (
              <div><dt className="text-ash-gray">Location</dt><dd className="font-medium">{product.location_text}</dd></div>
            )}
            <div><dt className="text-ash-gray">Listed</dt><dd>{formatDate(product.created_at)}</dd></div>
          </dl>

          <hr className="section-divider" />

          {/* Description */}
          <div>
            <p className="label mb-2">Description</p>
            <p className="text-caption leading-relaxed whitespace-pre-wrap">{product.description}</p>
          </div>

          <hr className="section-divider" />

          {/* Seller info */}
          <div className="bg-soft-lift p-4" style={{ borderRadius: '2px' }}>
            <p className="label mb-1">Seller</p>
            <p className="text-body-sm font-medium">{product.profiles?.full_name}</p>
            <p className="text-caption text-ash-gray">{product.profiles?.college}</p>
            {product.profiles?.department && (
              <p className="text-caption text-ash-gray">{product.profiles.department}</p>
            )}
            {/* Contact text shown only to authenticated users (PROF-02) */}
            {user && (product.profiles as any)?.contact_text && (
              <p className="text-caption mt-2">{(product.profiles as any).contact_text}</p>
            )}
          </div>

          {/* ---- Contextual actions ---- */}
          <div className="flex flex-col gap-3">

            {/* OWNER actions */}
            {isOwner && (
              <>
                <div className="flex gap-2 flex-wrap">
                  <Link to={`/products/${product.id}/edit`} className="btn-ghost flex-1 justify-center">
                    <Edit size={14} aria-hidden /> Edit
                  </Link>
                  <button
                    onClick={() => setDeleteDialogOpen(true)}
                    className="btn-danger flex-1 justify-center"
                  >
                    <Trash2 size={14} aria-hidden /> Delete
                  </button>
                </div>

                <div className="form-group">
                  <label htmlFor="status-select" className="label">Change Status</label>
                  <select
                    id="status-select"
                    className="select"
                    value={product.status}
                    onChange={(e) => statusMutation.mutate(e.target.value as ProductStatus)}
                    disabled={statusMutation.isPending}
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  {statusMutation.isPending && <p className="text-caption text-ash-gray">Updating…</p>}
                </div>
              </>
            )}

            {/* NON-OWNER STUDENT actions */}
            {isOther && (
              <div className="flex gap-2 flex-wrap">
                <FavouriteButton productId={product.id} />
                {product.status !== 'sold' && (
                  <button
                    onClick={() => setRequestDialogOpen(true)}
                    className="btn-primary flex-1 justify-center"
                  >
                    Send Request
                  </button>
                )}
                <button
                  onClick={() => setReportDialogOpen(true)}
                  className="btn-ghost flex-1 justify-center text-ash-gray"
                >
                  Report
                </button>
              </div>
            )}

            {/* VISITOR prompts */}
            {!user && (
              <Link to={`/login?redirect=/products/${product.id}`} className="btn-primary w-full justify-center">
                Log in to Save / Request / Report
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ---- Delete Confirmation Dialog (LIST-05) ---- */}
      {deleteDialogOpen && (
        <div className="dialog-overlay" role="dialog" aria-modal aria-labelledby="delete-title">
          <div className="dialog-content">
            <h2 id="delete-title" className="text-body-sm font-medium mb-2">Delete this listing?</h2>
            <p className="text-caption text-ash-gray mb-6">
              This will permanently remove "{product.title}" and its image. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteDialogOpen(false)} className="btn-ghost flex-1 justify-center">
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="btn-danger flex-1 justify-center"
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete Listing'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Request Dialog (REQ-01) ---- */}
      {requestDialogOpen && product && (
        <RequestDialog
          productId={product.id}
          productTitle={product.title}
          transactionMode={product.transaction_mode}
          onClose={() => setRequestDialogOpen(false)}
        />
      )}

      {/* ---- Report Dialog (REP-01) ---- */}
      {reportDialogOpen && product && (
        <ReportDialog
          productId={product.id}
          productTitle={product.title}
          onClose={() => setReportDialogOpen(false)}
        />
      )}
    </div>
  );
}
