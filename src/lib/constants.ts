// CampusMart — App-wide constants
// Do not add runtime values here; use Supabase for dynamic data (QR-08).

import type { ProductCondition, ProductStatus, TransactionMode, ReportReason, SortOption } from '@/types/database.types';

// Storage bucket name (must match migration bucket)
export const PRODUCT_IMAGES_BUCKET = 'product-images';

// Allowed image MIME types and max size (LIST-02)
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// Product condition options
export const CONDITION_OPTIONS: { value: ProductCondition; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

// Transaction mode options
export const TRANSACTION_OPTIONS: { value: TransactionMode; label: string }[] = [
  { value: 'sell', label: 'Sell' },
  { value: 'exchange', label: 'Exchange' },
  { value: 'either', label: 'Sell or Exchange' },
];

// Product status options
export const STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'sold', label: 'Sold' },
];

// Sort options (PROD-04)
export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

// Report reasons (REP-01)
export const REPORT_REASON_OPTIONS: { value: ReportReason; label: string }[] = [
  { value: 'misleading_information', label: 'Misleading Information' },
  { value: 'prohibited_item', label: 'Prohibited Item' },
  { value: 'suspected_scam', label: 'Suspected Scam' },
  { value: 'duplicate_listing', label: 'Duplicate Listing' },
  { value: 'inappropriate_content', label: 'Inappropriate Content' },
  { value: 'other', label: 'Other' },
];

// Default products per page
export const PRODUCTS_PER_PAGE = 20;

// Default sort
export const DEFAULT_SORT: SortOption = 'newest';
