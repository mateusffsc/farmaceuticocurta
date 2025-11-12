/*
  # Storage bucket: banners

  Creates a public bucket `banners` for pharmacy ads images.
  Adds policies to allow authenticated users to upload to this bucket
  and anyone to read images (public URLs).
*/

-- Create public bucket (positional args) and only if it doesn't exist
do $$
begin
  if not exists (
    select 1 from storage.buckets where name = 'banners'
  ) then
    perform storage.create_bucket('banners', true);
  end if;
end $$;

-- Policies on storage.objects
-- Ensure previous policies are removed to avoid conflicts when reapplying
do $$
begin
  if exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Public read banners'
  ) then
    execute 'drop policy "Public read banners" on storage.objects';
  end if;
  if exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Authenticated upload banners'
  ) then
    execute 'drop policy "Authenticated upload banners" on storage.objects';
  end if;
  if exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Authenticated update banners'
  ) then
    execute 'drop policy "Authenticated update banners" on storage.objects';
  end if;
  if exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Authenticated delete banners'
  ) then
    execute 'drop policy "Authenticated delete banners" on storage.objects';
  end if;
end $$;

create policy "Public read banners"
  on storage.objects for select
  to public
  using (
    bucket_id = 'banners'
  );

create policy "Authenticated upload banners"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'banners'
  );

create policy "Authenticated update banners"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'banners'
  )
  with check (
    bucket_id = 'banners'
  );

create policy "Authenticated delete banners"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'banners'
  );