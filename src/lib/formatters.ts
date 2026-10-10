// CampusMart — Shared formatters (QR-04, QR-05)

import type { ProductCondition, ProductStatus, RequestStatus, ReportStatus, TransactionMode } from '@/types/database.types';

// ---------------------------------------------------------------
// Currency — INR (QR-04)
// ---------------------------------------------------------------
const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

export function formatINR(value: number): string {
  return INR.format(value);
}

// ---------------------------------------------------------------
// Dates (QR-05)
// ---------------------------------------------------------------
const DATE_FMT = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function formatDate(iso: string): string {
  return DATE_FMT.format(new Date(iso));
}

export function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

// ---------------------------------------------------------------
// Enum display labels
// ---------------------------------------------------------------
export const CONDITION_LABELS: Record<ProductCondition, string> = {
  new: 'New',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};

export const STATUS_LABELS: Record<ProductStatus, string> = {
  available: 'Available',
  reserved: 'Reserved',
  sold: 'Sold',
};

export const TRANSACTION_LABELS: Record<TransactionMode, string> = {
  sell: 'Sell',
  exchange: 'Exchange',
  either: 'Sell or Exchange',
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  open: 'Open',
  reviewing: 'Under Review',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

// ---------------------------------------------------------------
// Status badge style classes (gallery-black/white design)
// ---------------------------------------------------------------
export function getStatusClasses(status: ProductStatus): string {
  switch (status) {
    case 'available':
      return 'bg-gallery-black text-paper-white';
    case 'reserved':
      return 'bg-fog-gray text-gallery-black';
    case 'sold':
      return 'bg-ash-gray text-paper-white';
    default:
      return 'bg-hairline-gray text-gallery-black';
  }
}
