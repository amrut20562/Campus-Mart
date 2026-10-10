// CampusMart — Edit Listing page (LIST-04)
// Owner edits same fields; RLS rejects non-owners.
// Preserves existing image unless a new one is uploaded.

import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthContext';
import { listingSchema, type ListingFormValues, validateImageFile } from '@/schemas';
import { queryKeys } from '@/lib/queryKeys';
import { CONDITION_OPTIONS, TRANSACTION_OPTIONS } from '@/lib/constants';
import { uploadProductImage, deleteProductImage, getProductImageUrl } from '@/features/products/productUtils';
import { useToast } from '@/components/feedback/ToastContext';
import type { CategoryRow, ProductRow } from '@/types/database.types';

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { showToast } = useToast();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: product, isLoading } = useQuery({
    queryKey: queryKeys.product(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as ProductRow;
    },
    enabled: !!id,
  });

  const { data: categories } = useQuery({
    queryKey: queryKeys.categories,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug')
        .order('id');
      if (error) throw error;
      return data as CategoryRow[];
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
  });

  useEffect(() => {
    if (product) {
      reset({
        title: product.title,
        description: product.description,
        category_id: product.category_id,
        condition: product.condition,
        price: product.price,
        age_months: product.age_months ?? undefined,
        transaction_mode: product.transaction_mode,
        location_text: product.location_text ?? '',
      });
      setImagePreview(getProductImageUrl(product.image_path));
    }
  }, [product, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateImageFile(file);
    if (err) { setImageError(err); return; }
    setImageError('');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const mutation = useMutation({
    mutationFn: async (values: ListingFormValues) => {
      if (!product) throw new Error('Product not found');

      let imagePath = product.image_path;

      // Upload new image if provided
      if (imageFile) {
        const newPath = await uploadProductImage(user!.id, imageFile);
        // Delete old image (best effort)
        await deleteProductImage(product.image_path);
        imagePath = newPath;
      }

      const { error } = await supabase
        .from('products')
        .update({
          category_id: values.category_id,
          title: values.title.trim(),
          description: values.description.trim(),
          condition: values.condition,
          price: values.price,
          age_months: values.age_months ?? null,
          transaction_mode: values.transaction_mode,
          location_text: values.location_text?.trim() || null,
          image_path: imagePath,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('seller_id', user!.id); // RLS also enforces ownership

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.product(id!) });
      qc.invalidateQueries({ queryKey: queryKeys.products() });
      qc.invalidateQueries({ queryKey: queryKeys.myListings(user!.id) });
      showToast('Listing updated');
      navigate(`/products/${id}`);
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  });

  // Redirect non-owners (should be caught by RLS too, but good UX)
  if (!isLoading && product && product.seller_id !== user?.id) {
    navigate('/', { replace: true });
    return null;
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-12 mb-4 rounded" />)}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-subheading font-medium tracking-tight mb-8">Edit Listing</h1>

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="flex flex-col gap-8">

        <section className="card flex flex-col gap-4">
          <h2 className="text-body-sm font-medium border-b border-hairline-gray pb-3 -mx-6 px-6 -mt-6 pt-5">Basics</h2>
          <div className="form-group">
            <label htmlFor="title" className="label">Title *</label>
            <input id="title" type="text" className="input" aria-invalid={!!errors.title} {...register('title')} />
            {errors.title && <p className="field-error">{errors.title.message}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="description" className="label">Description *</label>
            <textarea id="description" className="textarea" aria-invalid={!!errors.description} {...register('description')} />
            {errors.description && <p className="field-error">{errors.description.message}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="category_id" className="label">Category *</label>
            <select id="category_id" className="select" {...register('category_id', { valueAsNumber: true })}>
              {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </section>

        <section className="card flex flex-col gap-4">
          <h2 className="text-body-sm font-medium border-b border-hairline-gray pb-3 -mx-6 px-6 -mt-6 pt-5">Item Details</h2>
          <div className="form-group">
            <label htmlFor="condition" className="label">Condition *</label>
            <select id="condition" className="select" {...register('condition')}>
              {CONDITION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="age_months" className="label">Age in Months <span className="text-ash-gray font-normal">(optional)</span></label>
            <input id="age_months" type="number" min={0} step={1} className="input"
              {...register('age_months', { valueAsNumber: true })} />
          </div>
        </section>

        <section className="card flex flex-col gap-4">
          <h2 className="text-body-sm font-medium border-b border-hairline-gray pb-3 -mx-6 px-6 -mt-6 pt-5">Offer</h2>
          <div className="form-group">
            <label htmlFor="price" className="label">Price (₹) *</label>
            <input id="price" type="number" min={0.01} step={0.01} className="input" aria-invalid={!!errors.price}
              {...register('price', { valueAsNumber: true })} />
            {errors.price && <p className="field-error">{errors.price.message}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="transaction_mode" className="label">Transaction Mode *</label>
            <select id="transaction_mode" className="select" {...register('transaction_mode')}>
              {TRANSACTION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="location_text" className="label">Campus / Location <span className="text-ash-gray font-normal">(optional)</span></label>
            <input id="location_text" type="text" maxLength={120} className="input" {...register('location_text')} />
          </div>
        </section>

        <section className="card flex flex-col gap-4">
          <h2 className="text-body-sm font-medium border-b border-hairline-gray pb-3 -mx-6 px-6 -mt-6 pt-5">Image</h2>
          <p className="text-caption text-ash-gray">Leave unchanged to keep the current image. JPEG, PNG or WebP · Max 5 MB</p>
          <input ref={fileInputRef} type="file" id="image-file" accept="image/jpeg,image/png,image/webp"
            className="sr-only" onChange={handleImageChange} />
          <button type="button" onClick={() => fileInputRef.current?.click()}
            className="btn-ghost w-full justify-center py-6 flex-col gap-2">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="max-h-40 object-contain" />
            ) : (
              <><ImageIcon size={24} className="text-ash-gray" aria-hidden /><span className="text-caption">Click to change image</span></>
            )}
          </button>
          {imageError && <p className="field-error">{imageError}</p>}
        </section>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-ghost flex-1 justify-center">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 justify-center">
            {mutation.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
