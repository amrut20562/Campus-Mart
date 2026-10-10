// CampusMart — Unit tests for schemas (listing boundary values)
// Implements automated test priority: "Listing Zod schema accepts/rejects boundary values"

import { describe, it, expect } from 'vitest';
import { listingSchema, validateImageFile, registerSchema, filterSchema } from '@/schemas';

describe('listingSchema', () => {
  const valid = {
    title: 'A valid title here',
    description: 'This is a valid description that has at least twenty characters.',
    category_id: 1,
    condition: 'good' as const,
    price: 100,
    transaction_mode: 'sell' as const,
  };

  it('accepts a minimal valid listing', () => {
    expect(listingSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects title shorter than 5 chars', () => {
    const r = listingSchema.safeParse({ ...valid, title: 'Hi' });
    expect(r.success).toBe(false);
  });

  it('rejects title longer than 100 chars', () => {
    const r = listingSchema.safeParse({ ...valid, title: 'a'.repeat(101) });
    expect(r.success).toBe(false);
  });

  it('rejects description shorter than 20 chars', () => {
    const r = listingSchema.safeParse({ ...valid, description: 'Too short' });
    expect(r.success).toBe(false);
  });

  it('rejects price of 0', () => {
    const r = listingSchema.safeParse({ ...valid, price: 0 });
    expect(r.success).toBe(false);
  });

  it('rejects negative price', () => {
    const r = listingSchema.safeParse({ ...valid, price: -10 });
    expect(r.success).toBe(false);
  });

  it('accepts price with 2 decimal places', () => {
    const r = listingSchema.safeParse({ ...valid, price: 9.99 });
    expect(r.success).toBe(true);
  });

  it('rejects price with more than 2 decimal places', () => {
    const r = listingSchema.safeParse({ ...valid, price: 9.999 });
    expect(r.success).toBe(false);
  });

  it('accepts optional age_months = 0', () => {
    const r = listingSchema.safeParse({ ...valid, age_months: 0 });
    expect(r.success).toBe(true);
  });

  it('rejects negative age_months', () => {
    const r = listingSchema.safeParse({ ...valid, age_months: -1 });
    expect(r.success).toBe(false);
  });

  it('rejects unknown condition', () => {
    const r = listingSchema.safeParse({ ...valid, condition: 'mint' });
    expect(r.success).toBe(false);
  });

  it('rejects unknown transaction mode', () => {
    const r = listingSchema.safeParse({ ...valid, transaction_mode: 'rent' });
    expect(r.success).toBe(false);
  });
});

describe('validateImageFile', () => {
  const makeFile = (type: string, size: number) =>
    new File(['x'.repeat(size)], 'test.jpg', { type });

  it('accepts JPEG', () => {
    expect(validateImageFile(makeFile('image/jpeg', 1000))).toBeNull();
  });

  it('accepts PNG', () => {
    expect(validateImageFile(makeFile('image/png', 1000))).toBeNull();
  });

  it('accepts WebP', () => {
    expect(validateImageFile(makeFile('image/webp', 1000))).toBeNull();
  });

  it('rejects GIF', () => {
    expect(validateImageFile(makeFile('image/gif', 1000))).not.toBeNull();
  });

  it('rejects files over 5 MB', () => {
    expect(validateImageFile(makeFile('image/jpeg', 6 * 1024 * 1024))).not.toBeNull();
  });

  it('accepts exactly 5 MB', () => {
    expect(validateImageFile(makeFile('image/jpeg', 5 * 1024 * 1024))).toBeNull();
  });
});

describe('registerSchema', () => {
  const valid = {
    full_name: 'Alice Student',
    email: 'alice@example.com',
    college: 'IIT Delhi',
    password: 'password123',
    confirmPassword: 'password123',
  };

  it('accepts valid registration', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    const r = registerSchema.safeParse({ ...valid, confirmPassword: 'different' });
    expect(r.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const r = registerSchema.safeParse({ ...valid, email: 'not-an-email' });
    expect(r.success).toBe(false);
  });

  it('rejects password shorter than 8 chars', () => {
    const r = registerSchema.safeParse({ ...valid, password: 'short', confirmPassword: 'short' });
    expect(r.success).toBe(false);
  });
});

describe('filterSchema', () => {
  it('defaults to newest sort and empty filters', () => {
    const r = filterSchema.safeParse({});
    expect(r.success).toBe(true);
    expect(r.data?.sort).toBe('newest');
  });

  it('accepts all valid sort options', () => {
    for (const sort of ['newest', 'price_asc', 'price_desc']) {
      expect(filterSchema.safeParse({ sort }).success).toBe(true);
    }
  });

  it('rejects invalid sort', () => {
    expect(filterSchema.safeParse({ sort: 'random' }).success).toBe(false);
  });
});
