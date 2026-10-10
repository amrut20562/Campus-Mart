// CampusMart — Create Listing page (LIST-01, LIST-02)
// seller_id is ALWAYS set to auth.uid() — never from a form field.

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthContext';
import { listingSchema, type ListingFormValues, validateImageFile } from '@/schemas';
import { queryKeys } from '@/lib/queryKeys';
import { CONDITION_OPTIONS, TRANSACTION_OPTIONS } from '@/lib/constants';
import { uploadProductImage, deleteProductImage } from '@/features/products/productUtils';
import { useToast } from '@/components/feedback/ToastContext';
import type { CategoryRow } from '@/types/database.types';

export default function SellPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { showToast } = useToast();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: { transaction_mode: 'sell', condition: 'good' },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateImageFile(file);
    if (err) {
      setImageError(err);
      return;
    }
    setImageError('');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const mutation = useMutation({
    mutationFn: async (values: ListingFormValues) => {
      if (!imageFile) throw new Error('Please select an image for your listing.');
      if (!user) throw new Error('You must be signed in.');

      // 1. Upload image — path stored in DB, not signed URL (LIST-02)
      const imagePath = await uploadProductImage(user.id, imageFile);

      try {
        // 2. Insert product — seller_id locked to auth.uid() (LIST-01)
        const { data, error } = await supabase.from('products').insert({
          seller_id: user.id,
          category_id: values.category_id,
          title: values.title.trim(),
          description: values.description.trim(),
          condition: values.condition,
          price: values.price,
          age_months: values.age_months ?? null,
          transaction_mode: values.transaction_mode,
          location_text: values.location_text?.trim() || null,
          image_path: imagePath,
          status: 'available',
        }).select('id').single();

        if (error) throw error;
        return data.id as string;
      } catch (err) {
        // Roll back uploaded image on insert failure (LIST-01 data flow)
        await deleteProductImage(imagePath);
        throw err;
      }
    },
    onSuccess: (productId) => {
      qc.invalidateQueries({ queryKey: queryKeys.products() });
      qc.invalidateQueries({ queryKey: queryKeys.myListings(user!.id) });
      qc.invalidateQueries({ queryKey: queryKeys.stats });
      showToast('Listing created!');
      navigate(`/products/${productId}`);
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  });

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-subheading font-medium tracking-tight mb-8">Create a Listing</h1>

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="flex flex-col gap-8">

        {/* Basics */}
        <section className="card flex flex-col gap-4">
          <h2 className="text-body-sm font-medium border-b border-hairline-gray pb-3 -mx-6 px-6 -mt-6 pt-5">Basics</h2>

          <div className="form-group">
            <label htmlFor="title" className="label">Title *</label>
            <input id="title" type="text" className="input" aria-invalid={!!errors.title}
              placeholder="e.g. Engineering Mathematics Vol 1" {...register('title')} />
            {errors.title && <p className="field-error">{errors.title.message}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="description" className="label">Description *</label>
            <textarea id="description" className="textarea" aria-invalid={!!errors.description}
              placeholder="Describe the item, its condition, and why you're selling…"
              {...register('description')} />
            {errors.description && <p className="field-error">{errors.description.message}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="category_id" className="label">Category *</label>
            <select id="category_id" className="select" aria-invalid={!!errors.category_id}
              {...register('category_id', { valueAsNumber: true })}>
              <option value="">Select a category…</option>
              {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.category_id && <p className="field-error">{errors.category_id.message}</p>}
          </div>
        </section>

        {/* Item */}
        <section className="card flex flex-col gap-4">
          <h2 className="text-body-sm font-medium border-b border-hairline-gray pb-3 -mx-6 px-6 -mt-6 pt-5">Item Details</h2>

          <div className="form-group">
            <label htmlFor="condition" className="label">Condition *</label>
            <select id="condition" className="select" {...register('condition')}>
              {CONDITION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="age_months" className="label">
              Age in Months <span className="text-ash-gray font-normal">(optional)</span>
            </label>
            <input id="age_months" type="number" min={0} step={1} className="input"
              placeholder="e.g. 6" {...register('age_months', { valueAsNumber: true })} />
            {errors.age_months && <p className="field-error">{errors.age_months.message}</p>}
          </div>
        </section>

        {/* Offer */}
        <section className="card flex flex-col gap-4">
          <h2 className="text-body-sm font-medium border-b border-hairline-gray pb-3 -mx-6 px-6 -mt-6 pt-5">Offer</h2>

          <div className="form-group">
            <label htmlFor="price" className="label">Price (₹) *</label>
            <input id="price" type="number" min={0.01} step={0.01} className="input" aria-invalid={!!errors.price}
              placeholder="e.g. 500" {...register('price', { valueAsNumber: true })} />
            {errors.price && <p className="field-error">{errors.price.message}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="transaction_mode" className="label">Transaction Mode *</label>
            <select id="transaction_mode" className="select" {...register('transaction_mode')}>
              {TRANSACTION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="location_text" className="label">
              Campus / Location <span className="text-ash-gray font-normal">(optional)</span>
            </label>
            <input id="location_text" type="text" maxLength={120} className="input"
              placeholder="e.g. Main Campus, Hostel A" {...register('location_text')} />
          </div>
        </section>

        {/* Image */}
        <section className="card flex flex-col gap-4">
          <h2 className="text-body-sm font-medium border-b border-hairline-gray pb-3 -mx-6 px-6 -mt-6 pt-5">Image *</h2>
          <p className="text-caption text-ash-gray">JPEG, PNG or WebP · Maximum 5 MB</p>

          <input
            ref={fileInputRef}
            type="file"
            id="image-file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleImageChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-ghost w-full justify-center py-6 flex-col gap-2"
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="max-h-40 object-contain" />
            ) : (
              <>
                <ImageIcon size={24} className="text-ash-gray" aria-hidden />
                <span className="text-caption">Click to select image</span>
              </>
            )}
          </button>
          {imageError && <p className="field-error">{imageError}</p>}
          {!imageFile && mutation.isError && (
            <p className="field-error">An image is required</p>
          )}
        </section>

        {/* Submit */}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn-primary w-full justify-center py-3 text-body-sm"
        >
          <Upload size={16} aria-hidden />
          {mutation.isPending ? 'Publishing…' : 'Publish Listing'}
        </button>
      </form>
    </div>
  );
}
