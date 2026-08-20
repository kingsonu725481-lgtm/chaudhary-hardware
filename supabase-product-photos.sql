-- Add product photos for the website catalogue.
-- Run this once in Supabase: SQL Editor.

alter table store_products
add column if not exists image_url text;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;
