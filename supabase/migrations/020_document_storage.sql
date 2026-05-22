-- ============================================================
-- 020: Document storage bucket + upload metadata columns
-- ============================================================

-- 1. Create private storage bucket for uploaded documents
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  26214400,  -- 25 MB
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ]
);

-- 2. Storage RLS — users can only access files under their own {user_id}/ prefix

create policy "Users can upload own documents"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read own documents"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own documents"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Add file metadata columns to uploads (all nullable for backward compat)

alter table uploads
  add column if not exists filename     text,
  add column if not exists file_type    text,
  add column if not exists file_size    integer,
  add column if not exists storage_path text;
