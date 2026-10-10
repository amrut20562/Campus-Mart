-- CampusMart Phase 1 — Seed Data
-- Source of truth: 04-SUPABASE-DESIGN.md

-- ---------------------------------------------------------------
-- Categories (CAT-01 — 7 initial categories)
-- ---------------------------------------------------------------
insert into public.categories (name, slug, icon_key, is_active, sort_order) values
  ('Textbooks',      'textbooks',      'book',         true, 1),
  ('Electronics',    'electronics',    'laptop',        true, 2),
  ('Stationery',     'stationery',     'pen',           true, 3),
  ('Furniture',      'furniture',      'armchair',      true, 4),
  ('Lab Equipment',  'lab-equipment',  'flask-conical', true, 5),
  ('Sports',         'sports',         'trophy',        true, 6),
  ('Other',          'other',          'package',       true, 7)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------
-- Demo products (seeded after test accounts are created manually)
-- To seed products, run the following AFTER creating auth accounts
-- and noting their UUIDs.  Replace the UUIDs below.
-- These are placeholder rows commented out to prevent UUID mismatch.
-- ---------------------------------------------------------------
-- Uncomment and fill UUIDs after creating demo accounts:
-- insert into public.products (seller_id, category_id, title, description, condition, price, transaction_mode, image_path, status) values
-- ('<student-a-uuid>', 1, 'Engineering Maths Vol 1', 'Barely used, all pages intact.', 'like_new', 250.00, 'sell', '<student-a-uuid>/placeholder.jpg', 'available'),
-- ('<student-a-uuid>', 2, 'HP Scientific Calculator', 'Works perfectly, minor scratches.', 'good', 800.00, 'sell', '<student-a-uuid>/placeholder2.jpg', 'available');
