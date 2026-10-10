// CampusMart — Zod validation schemas (LIST-01, AUTH-01, PROF-01, REQ-01, REP-01)

import { z } from 'zod';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } from '@/lib/constants';

// ---------------------------------------------------------------
// Auth schemas
// ---------------------------------------------------------------
export const registerSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(80),
  email: z.string().email('Enter a valid email'),
  college: z.string().min(2, 'College name must be at least 2 characters').max(150),
  department: z.string().max(100).optional().or(z.literal('')),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------
// Profile schema (PROF-01)
// ---------------------------------------------------------------
export const profileSchema = z.object({
  full_name: z.string().min(2).max(80),
  college: z.string().min(2).max(150),
  department: z.string().max(100).optional().or(z.literal('')),
  graduation_year: z
    .number()
    .int()
    .min(1900)
    .max(2100)
    .optional()
    .nullable(),
  contact_text: z.string().max(100).optional().or(z.literal('')),
});
export type ProfileFormValues = z.infer<typeof profileSchema>;

// ---------------------------------------------------------------
// Product listing schema (LIST-01, LIST-04)
// ---------------------------------------------------------------
export const listingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be at most 100 characters'),
  description: z
    .string()
    .trim()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be at most 2000 characters'),
  category_id: z
    .number({ message: 'Please select a category' })
    .int()
    .positive(),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor'], {
    message: 'Please select a condition',
  }),
  price: z
    .number({ message: 'Price is required' })
    .positive('Price must be greater than 0')
    .multipleOf(0.01, 'Price can have at most 2 decimal places'),
  age_months: z
    .number()
    .int('Age must be a whole number')
    .min(0, 'Age cannot be negative')
    .optional()
    .nullable(),
  transaction_mode: z.enum(['sell', 'exchange', 'either'], {
    message: 'Please select a transaction mode',
  }),
  location_text: z.string().max(120).optional().or(z.literal('')),
});
export type ListingFormValues = z.infer<typeof listingSchema>;

// Image validation helper (LIST-02)
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
    return 'Image must be JPEG, PNG or WebP';
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return 'Image must be smaller than 5 MB';
  }
  return null;
}

// ---------------------------------------------------------------
// Request schema (REQ-01)
// ---------------------------------------------------------------
export const requestSchema = z.object({
  request_type: z.enum(['buy', 'exchange']),
  message: z
    .string()
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(500, 'Message must be at most 500 characters'),
  offered_item_text: z.string().max(300).optional().or(z.literal('')),
});
export type RequestFormValues = z.infer<typeof requestSchema>;

// ---------------------------------------------------------------
// Report schema (REP-01)
// ---------------------------------------------------------------
export const reportSchema = z.object({
  reason: z.enum([
    'misleading_information',
    'prohibited_item',
    'suspected_scam',
    'duplicate_listing',
    'inappropriate_content',
    'other',
  ]),
  details: z.string().max(1000).optional().or(z.literal('')),
});
export type ReportFormValues = z.infer<typeof reportSchema>;

// ---------------------------------------------------------------
// Filter schema (PROD-03) — all fields optional for URL parsing
// ---------------------------------------------------------------
export const filterSchema = z.object({
  search: z.string().optional().default(''),
  category: z.string().optional().default(''),
  condition: z.enum(['', 'new', 'like_new', 'good', 'fair', 'poor']).optional().default(''),
  minPrice: z.string().optional().default(''),
  maxPrice: z.string().optional().default(''),
  status: z.enum(['', 'available', 'reserved', 'sold']).optional().default(''),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).optional().default('newest'),
});
