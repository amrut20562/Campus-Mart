// CampusMart — Saved Products page (FAV-01, FAV-02)
// Shows current user's favourites with latest product status.
// Removing a favourite updates the page immediately.

import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthContext';
import { queryKeys } from '@/lib/queryKeys';
import { formatINR, STATUS_LABELS, CONDITION_LABELS, getStatusClasses } from '@/lib/formatters';
import { getProductImageUrl } from '@/features/products/productUtils';
import { useToast } from '@/components/feedback/ToastContext';
import type { ProductWithDetails, FavouriteRow } from '@/types/database.types';

type FavouriteWithProduct = FavouriteRow & { products: ProductWithDetails };

export default function SavedPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { showToast } = useToast();

  const { data: favourites, isLoading, isError } = useQuery({
    queryKey: queryKeys.favourites(user!.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favourites')
        .select(`
          user_id, product_id, created_at,
          products (
            id, title, price, condition, status, image_path, created_at,
            categories ( name ),
            profiles:seller_id ( full_name, college )
          )
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as FavouriteWithProduct[];
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('favourites')
        .delete()
        .eq('user_id', user!.id)
        .eq('product_id', productId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.favourites(user!.id) });
      showToast('Removed from saved');
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-subheading font-medium tracking-tight mb-8">Saved Products</h1>

      {isLoading && (
        <div className="product-grid">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton aspect-[4/5] rounded" />)}
        </div>
      )}

      {isError && (
        <p className="text-caption text-ash-gray text-center py-8">Could not load saved products. Please refresh.</p>
      )}

      {!isLoading && !isError && favourites?.length === 0 && (
        <div className="text-center py-16">
          <Heart size={32} className="text-hairline-gray mx-auto mb-4" aria-hidden />
          <p className="text-subheading font-medium tracking-tight mb-2">No saved products</p>
          <p className="text-caption text-ash-gray mb-6">
            Tap the heart icon on any listing to save it here.
          </p>
          <Link to="/" className="btn-primary">Browse listings</Link>
        </div>
      )}

      <div className="product-grid">
        {favourites?.map(({ product_id, products: product }) => (
          <div key={product_id} className="product-card relative">
            <Link to={`/products/${product_id}`} className="block">
              <div className="relative aspect-[4/5] bg-soft-lift overflow-hidden" style={{ borderRadius: '2px' }}>
                <img
                  src={getProductImageUrl(product.image_path)}
                  alt={product.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-product.svg'; }}
                />
                <span className={`status-badge absolute top-2 left-2 ${getStatusClasses(product.status)}`}>
                  {STATUS_LABELS[product.status]}
                </span>
              </div>
              <div className="p-3 flex flex-col gap-1">
                <p className="text-body-sm font-medium line-clamp-2">{product.title}</p>
                <p className="text-caption font-medium">{formatINR(product.price)}</p>
                <p className="text-caption text-ash-gray">{CONDITION_LABELS[product.condition]}</p>
              </div>
            </Link>
            {/* Unsave button */}
            <button
              onClick={() => removeMutation.mutate(product_id)}
              disabled={removeMutation.isPending}
              aria-label={`Remove ${product.title} from saved`}
              className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-card rounded-full border border-hairline-gray"
            >
              <Heart size={14} className="text-gallery-black fill-gallery-black" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
