// CampusMart — Centralized TanStack Query keys
// Each key uniquely identifies a query so mutations can target precise invalidations.
// Pattern: QueryKeyFactory per feature, exported as queryKeys object.

export const queryKeys = {
  // Categories
  categories: ['categories'] as const,

  // Products
  products: (filters?: Record<string, unknown>) =>
    filters ? ['products', filters] : (['products'] as const),
  product: (id: string) => ['products', id] as const,

  // My listings (seller-specific)
  myListings: (sellerId: string) => ['myListings', sellerId] as const,

  // Favourites
  favourites: (userId: string) => ['favourites', userId] as const,

  // Requests
  requests: (userId: string) => ['requests', userId] as const,

  // Profile
  profile: (userId: string) => ['profile', userId] as const,

  // Reports (admin + own)
  reports: ['reports'] as const,

  // Admin queries
  adminUsers: ['adminUsers'] as const,
  adminProducts: ['adminProducts'] as const,
  adminReports: ['adminReports'] as const,

  // Homepage statistics
  stats: ['stats'] as const,

  // User role (to check admin)
  userRole: (userId: string) => ['userRole', userId] as const,
} as const;
