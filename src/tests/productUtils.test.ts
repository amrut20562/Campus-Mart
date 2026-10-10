// CampusMart — Unit tests for product image helper (LIST-02, 07-TESTING-DEMO.md)

import { describe, it, expect } from 'vitest';
import { getProductImageUrl } from '@/features/products/productUtils';

describe('getProductImageUrl', () => {
  it('returns fallback placeholder when imagePath is empty', () => {
    expect(getProductImageUrl('')).toBe('/placeholder-product.svg');
  });

  it('returns external HTTP/HTTPS URL unchanged', () => {
    const httpUrl = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c';
    expect(getProductImageUrl(httpUrl)).toBe(httpUrl);
  });

  it('constructs Supabase storage public URL for storage relative paths', () => {
    const path = 'user-123/laptop.jpg';
    const result = getProductImageUrl(path);
    expect(result).toContain('product-images');
    expect(result).toContain('user-123/laptop.jpg');
  });

  it('returns root-relative image paths unchanged', () => {
    const localPath = '/images/lenovo-laptop.png';
    expect(getProductImageUrl(localPath)).toBe(localPath);
  });
});
