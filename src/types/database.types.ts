// CampusMart Phase 1 — Hand-written database types
// Replace with: supabase gen types typescript --linked > src/types/database.types.ts
// after linking to a Supabase project.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ---------------------------------------------------------------
// Enum types — must match migration enums exactly
// ---------------------------------------------------------------
export type ProductCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';
export type TransactionMode = 'sell' | 'exchange' | 'either';
export type ProductStatus = 'available' | 'reserved' | 'sold';
export type RequestType = 'buy' | 'exchange';
export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';
export type ReportReason =
  | 'misleading_information'
  | 'prohibited_item'
  | 'suspected_scam'
  | 'duplicate_listing'
  | 'inappropriate_content'
  | 'other';
export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';
export type UserRole = 'student' | 'admin';
export type InteractionType = 'view' | 'favourite';

// ---------------------------------------------------------------
// Row types (match column names in migration)
// ---------------------------------------------------------------
export interface ProfileRow {
  id: string;
  full_name: string;
  college: string;
  department: string | null;
  graduation_year: number | null;
  contact_text: string | null;
  avatar_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRow {
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface CategoryRow {
  id: number;
  name: string;
  slug: string;
  icon_key: string | null;
  is_active?: boolean;
  sort_order?: number;
}

export interface ProductRow {
  id: string;
  seller_id: string;
  category_id: number;
  title: string;
  description: string;
  condition: ProductCondition;
  price: number;
  age_months: number | null;
  transaction_mode: TransactionMode;
  location_text: string | null;
  image_path: string;
  status: ProductStatus;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

export interface FavouriteRow {
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface ProductRequestRow {
  id: string;
  product_id: string;
  buyer_id: string;
  request_type: RequestType;
  message: string;
  offered_item_text: string | null;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
}

export interface ReportRow {
  id: string;
  product_id: string;
  reporter_id: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface InteractionRow {
  id: number;
  user_id: string | null;
  product_id: string;
  interaction_type: InteractionType;
  created_at: string;
}

// ---------------------------------------------------------------
// Joined / enriched types used in the UI
// ---------------------------------------------------------------
export interface ProductWithDetails extends ProductRow {
  categories: Pick<CategoryRow, 'id' | 'name' | 'slug' | 'icon_key'>;
  profiles: Pick<ProfileRow, 'id' | 'full_name' | 'college' | 'department'>;
}

export interface RequestWithProduct extends ProductRequestRow {
  products: Pick<ProductRow, 'id' | 'title' | 'image_path' | 'price' | 'status'>;
}

export interface RequestWithBuyer extends ProductRequestRow {
  profiles: Pick<ProfileRow, 'id' | 'full_name' | 'college'>;
  products: Pick<ProductRow, 'id' | 'title' | 'image_path' | 'price'>;
}

export interface ReportWithDetails extends ReportRow {
  products: Pick<ProductRow, 'id' | 'title' | 'status'>;
  profiles: Pick<ProfileRow, 'id' | 'full_name' | 'college'>;
}

// ---------------------------------------------------------------
// Marketplace statistics
// ---------------------------------------------------------------
export interface MarketplaceStats {
  active_listings: number;
  sold_products: number;
  registered_students: number;
  active_categories: number;
}

// ---------------------------------------------------------------
// Filter / query state
// ---------------------------------------------------------------
export type SortOption = 'newest' | 'price_asc' | 'price_desc';

export interface ProductFilters {
  search: string;
  category: string; // slug or ''
  condition: ProductCondition | '';
  minPrice: string;
  maxPrice: string;
  status: ProductStatus | '';
  sort: SortOption;
}
