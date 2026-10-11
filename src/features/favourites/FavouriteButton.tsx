// CampusMart — Favourite Button (FAV-01)
// Authenticated users can toggle favourite.
// Uses optimistic insert/delete against Supabase.

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthContext';
import { queryKeys } from '@/lib/queryKeys';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

interface FavouriteButtonProps {
  productId: string;
}

export default function FavouriteButton({ productId }: FavouriteButtonProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load initial favourite state
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from('favourites')
      .select('product_id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .maybeSingle()
      .then(({ data }) => {
        setIsFav(!!data);
        setLoading(false);
      });
  }, [user, productId]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user || loading) return;
    const next = !isFav;
    setIsFav(next);

    if (next) {
      const { error } = await supabase
        .from('favourites')
        .insert({ user_id: user.id, product_id: productId });
      if (error) {
        setIsFav(!next);
        return;
      }
    } else {
      const { error } = await supabase
        .from('favourites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);
      if (error) {
        setIsFav(!next);
        return;
      }
    }

    qc.invalidateQueries({ queryKey: queryKeys.favourites(user.id) });
  };

  if (!user) {
    return (
      <Link
        to="/login"
        aria-label="Log in to save this product"
        className="w-6 h-6 flex items-center justify-center bg-card rounded-full border border-hairline-gray"
        style={{ width: '24px', height: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <Heart size={24} className="text-ash-gray" aria-hidden />
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isFav ? 'Remove from saved' : 'Save product'}
      aria-pressed={isFav}
      disabled={loading}
      className="w-6 h-6 flex items-center justify-center bg-card rounded-full border border-hairline-gray transition-opacity hover:opacity-80 disabled:opacity-40"
      style={{ width: '24px', height: '24px' }}
    >
      <Heart
        size={24}
        className={isFav ? 'text-gallery-black fill-gallery-black' : 'text-ash-gray'}
        aria-hidden
      />
    </button>
  );
}
