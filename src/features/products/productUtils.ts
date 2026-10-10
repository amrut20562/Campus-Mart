// CampusMart — Product image URL helper (LIST-02)
// Converts stored object path to a public URL from Supabase Storage.
// The product-images bucket is PUBLIC (per 04-SUPABASE-DESIGN.md prototype decision).

import { supabase } from '@/lib/supabase';
import { PRODUCT_IMAGES_BUCKET } from '@/lib/constants';

export function getProductImageUrl(imagePath: string): string {
  if (!imagePath) return '/placeholder-product.svg';
  // If already a full URL or root-relative path (e.g. /images/...), return as-is
  if (imagePath.startsWith('http') || imagePath.startsWith('/') || imagePath.startsWith('data:')) {
    return imagePath;
  }

  const { data } = supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(imagePath);

  return data.publicUrl;
}

/**
 * Upload an image file for the authenticated user.
 * Returns the storage object path (not a signed URL), as per LIST-02.
 * On failure, throws an Error.
 */
export async function uploadProductImage(
  userId: string,
  file: File
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const filename = `${crypto.randomUUID()}.${ext}`;
  const objectPath = `${userId}/${filename}`;

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(objectPath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw new Error(`Image upload failed: ${error.message}`);
  return objectPath;
}

/**
 * Delete a product image from storage.
 * Call this before/after deleting a product row (LIST-05).
 */
export async function deleteProductImage(imagePath: string): Promise<void> {
  if (!imagePath || imagePath.startsWith('http')) return;
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .remove([imagePath]);
  if (error) {
    // Log but don't throw — row deletion should still succeed
    console.warn('Could not delete product image:', error.message);
  }
}
