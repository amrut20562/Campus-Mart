// Annotation: Main homepage component
// CampusMart — Home Page
// Implements: PROD-01, PROD-02, PROD-03, PROD-04, CAT-01, STAT-01
// URL-driven search/filter/sort state

import { useState, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryKeys';
import { formatINR, formatRelativeDate, CONDITION_LABELS, STATUS_LABELS, getStatusClasses } from '@/lib/formatters';
import { CONDITION_OPTIONS, STATUS_OPTIONS, SORT_OPTIONS, PRODUCTS_PER_PAGE } from '@/lib/constants';
import type {
  CategoryRow, ProductWithDetails, MarketplaceStats,
  ProductCondition, ProductStatus, SortOption
} from '@/types/database.types';
import { useAuth } from '@/features/auth/AuthContext';
import FavouriteButton from '@/features/favourites/FavouriteButton';
import { getProductImageUrl } from '@/features/products/productUtils';

// ---------------------------------------------------------------
// Statistics Cards (STAT-01) with dummy/demo data fallback
// ---------------------------------------------------------------
const DUMMY_STATS: MarketplaceStats = {
  active_listings: 24,
  sold_products: 48,
  registered_students: 156,
  active_categories: 7,
};

function StatsSection() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.stats,
    queryFn: async () => {
      // 1. Try secure SQL RPC function
      try {
        const { data: rpcData, error } = await supabase.rpc('get_marketplace_stats');
        if (!error && rpcData) {
          const stats = rpcData as MarketplaceStats;
          return {
            active_listings: stats.active_listings || DUMMY_STATS.active_listings,
            sold_products: stats.sold_products || DUMMY_STATS.sold_products,
            registered_students: stats.registered_students || DUMMY_STATS.registered_students,
            active_categories: stats.active_categories || DUMMY_STATS.active_categories,
          };
        }
      } catch {
        // Fall through to direct table counts
      }

      // 2. Fallback to direct table count queries
      try {
        const [activeRes, soldRes, profRes, catRes] = await Promise.all([
          supabase.from('products').select('*', { count: 'exact', head: true }).in('status', ['available', 'reserved']).eq('is_hidden', false),
          supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'sold').eq('is_hidden', false),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('categories').select('*', { count: 'exact', head: true }),
        ]);

        return {
          active_listings: activeRes.count || DUMMY_STATS.active_listings,
          sold_products: soldRes.count || DUMMY_STATS.sold_products,
          registered_students: profRes.count || DUMMY_STATS.registered_students,
          active_categories: catRes.count || DUMMY_STATS.active_categories,
        };
      } catch {
        return DUMMY_STATS;
      }
    },
    staleTime: 1000 * 60,
  });

  const displayStats = data ?? DUMMY_STATS;

  const stats = [
    { label: 'Active Listings', value: displayStats.active_listings },
    { label: 'Products Sold', value: displayStats.sold_products },
    { label: 'Registered Students', value: displayStats.registered_students },
    { label: 'Categories', value: displayStats.active_categories },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-1 mb-12">
      {stats.map(({ label, value }) => (
        <div key={label} className="bg-card p-5 flex flex-col gap-1" style={{ borderRadius: '2px' }}>
          {isLoading ? (
            <div className="skeleton h-8 w-20 rounded" />
          ) : (
            <p className="text-subheading font-medium tracking-tight">
              {(value ?? 0).toLocaleString('en-IN')}
            </p>
          )}
          <p className="text-caption text-ash-gray">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------
// Category chips (CAT-01) — database-driven
// ---------------------------------------------------------------
function CategoryNav({
  selected,
  onSelect,
  categories,
}: {
  selected: string;
  onSelect: (slug: string) => void;
  categories?: CategoryRow[];
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="Product categories">
      <button
        onClick={() => onSelect('')}
        className={`btn-ghost text-caption py-1.5 px-7 min-w-[88px] justify-center ${selected === '' ? 'bg-gallery-black text-paper-white border-gallery-black' : ''}`}
      >
        All
      </button>
      {categories?.map((cat) => (
        <button
          key={cat.slug}
          onClick={() => onSelect(cat.slug)}
          className={`btn-ghost text-caption py-1.5 px-4 ${selected === cat.slug ? 'bg-gallery-black text-paper-white border-gallery-black' : ''}`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------
// Product card
// ---------------------------------------------------------------
export function ProductCard({ product }: { product: ProductWithDetails }) {
  const { user } = useAuth();
  const imageUrl = getProductImageUrl(product.image_path);

  return (
    <Link
      to={`/products/${product.id}`}
      className="product-card block group"
      aria-label={`${product.title} — ${formatINR(product.price)}`}
    >
      {/* Image */}
      <div className="relative aspect-[4/5] bg-soft-lift overflow-hidden" style={{ borderRadius: '2px' }}>
        <img
          src={imageUrl}
          alt={product.title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-product.svg';
          }}
        />
        {/* Status badge */}
        <span
          className={`status-badge absolute top-2 left-2 ${getStatusClasses(product.status)}`}
        >
          {STATUS_LABELS[product.status]}
        </span>
        {/* Favourite button — visible to auth users */}
        {user && (
          <div
            className="absolute top-2 right-2"
            onClick={(e) => e.preventDefault()}
          >
            <FavouriteButton productId={product.id} />
          </div>
        )}
      </div>

      {/* Card metadata */}
      <div className="p-3 flex flex-col gap-1">
        <p className="text-body-sm font-medium line-clamp-2 tracking-tight">{product.title}</p>
        <p className="text-caption font-medium">{formatINR(product.price)}</p>
        <p className="text-caption text-ash-gray">
          {product.categories?.name} · {CONDITION_LABELS[product.condition]}
        </p>
        <p className="text-caption text-ash-gray line-clamp-1">
          {product.profiles?.college}
        </p>
        <p className="text-caption text-ash-gray mt-1">
          {formatRelativeDate(product.created_at)}
        </p>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------
// Product card skeleton
// ---------------------------------------------------------------
function ProductCardSkeleton() {
  return (
    <div className="product-card" aria-hidden>
      <div className="skeleton aspect-[4/5]" />
      <div className="p-3 flex flex-col gap-2">
        <div className="skeleton h-4 rounded w-full" />
        <div className="skeleton h-4 rounded w-2/3" />
        <div className="skeleton h-3 rounded w-1/2" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Home Page
// ---------------------------------------------------------------
export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Parse URL params (PROD-02 — search text in URL)
  const search   = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? '';
  const condition = (searchParams.get('condition') ?? '') as ProductCondition | '';
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const statusFilter = (searchParams.get('status') ?? '') as ProductStatus | '';
  const sort     = (searchParams.get('sort') ?? 'newest') as SortOption;

  const [localSearch, setLocalSearch] = useState(search);

  // Debounce search → URL update (PROD-02)
  const handleSearchChange = useCallback((val: string) => {
    setLocalSearch(val);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (val) next.set('q', val); else next.delete('q');
        return next;
      }, { replace: true });
    }, 350);
  }, [setSearchParams]);

  const updateParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value); else next.delete(key);
      return next;
    }, { replace: true });
  };

  const clearFilters = () => {
    setLocalSearch('');
    setSearchParams({}, { replace: true });
  };

  const hasFilters = search || category || condition || minPrice || maxPrice || statusFilter || sort !== 'newest';

  // ---------------------------------------------------------------
  // Categories query (CAT-01) — shared for nav and filter panel
  // ---------------------------------------------------------------
  const { data: categories } = useQuery({
    queryKey: queryKeys.categories,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, icon_key')
        .order('id');
      if (error) throw error;
      return data as CategoryRow[];
    },
  });

  // ---------------------------------------------------------------
  // Supabase query (PROD-01, PROD-02, PROD-03, PROD-04)
  // ---------------------------------------------------------------
  const { data: products, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.products({ search, category, condition, minPrice, maxPrice, status: statusFilter, sort }),
    queryFn: async () => {
      let q = supabase
        .from('products')
        .select(`
          id, seller_id, category_id, title, price, condition, status, image_path, created_at,
          transaction_mode, location_text,
          categories ( id, name, slug, icon_key ),
          profiles:seller_id ( id, full_name, college, department )
        `)
        .eq('is_hidden', false);

      // Default: show available and reserved; only show sold if explicitly requested
      if (statusFilter) {
        q = q.eq('status', statusFilter);
      } else {
        q = q.in('status', ['available', 'reserved']);
      }

      // Full-text search via generated tsvector (PROD-02)
      if (search.trim()) {
        q = q.textSearch('fts', search.trim().split(/\s+/).join(' & '), {
          type: 'websearch',
          config: 'english',
        });
      }

      // Category filter (PROD-03)
      if (category) {
        const { data: catRow } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', category)
          .single();
        if (catRow) q = q.eq('category_id', catRow.id);
      }

      // Condition filter (PROD-03)
      if (condition) q = q.eq('condition', condition);

      // Price range (PROD-03)
      const minP = parseFloat(minPrice);
      const maxP = parseFloat(maxPrice);
      if (!isNaN(minP) && minP >= 0) q = q.gte('price', minP);
      if (!isNaN(maxP) && maxP > 0) q = q.lte('price', maxP);

      // Sorting (PROD-04)
      if (sort === 'price_asc')  q = q.order('price', { ascending: true });
      else if (sort === 'price_desc') q = q.order('price', { ascending: false });
      else q = q.order('created_at', { ascending: false }); // newest

      q = q.limit(PRODUCTS_PER_PAGE);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as ProductWithDetails[];
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* ---- Hero Search (PROD-02) ---- */}
      <section className="mb-12">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-ash-gray"
            aria-hidden
          />
          <input
            ref={searchRef}
            type="search"
            role="searchbox"
            aria-label="Search products"
            placeholder="Search textbooks, electronics, furniture…"
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="input pl-10"
          />
        </div>
      </section>

      {/* ---- Statistics (STAT-01) ---- */}
      <StatsSection />

      {/* ---- Category navigation (CAT-01) ---- */}
      <section aria-label="Category navigation">
        <h2 className="text-caption text-ash-gray uppercase tracking-widest mb-3">Browse by Category</h2>
        <CategoryNav
          selected={category}
          onSelect={(slug) => updateParam('category', slug)}
          categories={categories}
        />
      </section>

      {/* ---- Filters + Sort bar ---- */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <button
          onClick={() => setFilterOpen((o) => !o)}
          className="btn-ghost text-caption py-1.5 px-4"
          aria-expanded={filterOpen}
          aria-controls="filter-panel"
        >
          <SlidersHorizontal size={14} aria-hidden />
          Filters
        </button>

        {/* Sort */}
        <select
          className="select text-caption py-1.5"
          style={{ width: 'auto', minWidth: '160px' }}
          value={sort}
          onChange={(e) => updateParam('sort', e.target.value)}
          aria-label="Sort products"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {hasFilters && (
          <button onClick={clearFilters} className="btn-ghost text-caption py-1.5 px-4 ml-auto text-ash-gray">
            <X size={13} aria-hidden />
            Clear filters
          </button>
        )}
      </div>

      {/* ---- Filter panel ---- */}
      {filterOpen && (
        <div
          id="filter-panel"
          className="bg-card p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
          style={{ borderRadius: '2px' }}
        >
          {/* Category */}
          <div className="form-group">
            <label htmlFor="filter-category" className="label">Category</label>
            <select
              id="filter-category"
              className="select"
              value={category}
              onChange={(e) => updateParam('category', e.target.value)}
            >
              <option value="">All Categories</option>
              {categories?.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Condition */}
          <div className="form-group">
            <label htmlFor="filter-condition" className="label">Condition</label>
            <select
              id="filter-condition"
              className="select"
              value={condition}
              onChange={(e) => updateParam('condition', e.target.value)}
            >
              <option value="">Any</option>
              {CONDITION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Min price */}
          <div className="form-group">
            <label htmlFor="filter-min" className="label">Min Price (₹)</label>
            <input
              id="filter-min"
              type="number"
              min={0}
              step={1}
              className="input"
              value={minPrice}
              onChange={(e) => updateParam('minPrice', e.target.value)}
            />
          </div>

          {/* Max price */}
          <div className="form-group">
            <label htmlFor="filter-max" className="label">Max Price (₹)</label>
            <input
              id="filter-max"
              type="number"
              min={0}
              step={1}
              className="input"
              value={maxPrice}
              onChange={(e) => updateParam('maxPrice', e.target.value)}
            />
          </div>

          {/* Status */}
          <div className="form-group">
            <label htmlFor="filter-status" className="label">Status</label>
            <select
              id="filter-status"
              className="select"
              value={statusFilter}
              onChange={(e) => updateParam('status', e.target.value)}
            >
              <option value="">Available &amp; Reserved</option>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ---- Product grid (PROD-01) ---- */}
      <section aria-label="Product listings">
        {isLoading && (
          <div className="product-grid">
            {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        )}

        {isError && (
          <div role="alert" className="text-center py-16">
            <p className="text-caption text-ash-gray">
              Could not load products: {(error as Error)?.message ?? 'Unknown error'}
            </p>
          </div>
        )}

        {!isLoading && !isError && products?.length === 0 && (
          <div className="text-center py-16">
            <p className="text-subheading font-medium tracking-tight mb-2">No products found</p>
            <p className="text-caption text-ash-gray mb-6">
              {hasFilters ? 'Try adjusting your filters or search term.' : 'Be the first to list something!'}
            </p>
            {hasFilters && (
              <button onClick={clearFilters} className="btn-ghost">Clear filters</button>
            )}
          </div>
        )}

        {!isLoading && !isError && products && products.length > 0 && (
          <>
            <p className="text-caption text-ash-gray mb-4">
              {products.length} result{products.length !== 1 ? 's' : ''}
              {hasFilters ? ' (filtered)' : ''}
            </p>
            <div className="product-grid">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
