-- Supabase Storage Policies for disease-images bucket
-- Run this in Supabase SQL Editor after creating the bucket

-- Public read access (anyone can view images)
CREATE POLICY IF NOT EXISTS "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'disease-images');

-- Admin-only insert access (only admins can upload images)
CREATE POLICY IF NOT EXISTS "Admin insert access" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'disease-images'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() AND role = 'ADMIN'
  )
);

-- Admin-only update access (only admins can update images)
CREATE POLICY IF NOT EXISTS "Admin update access" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'disease-images'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() AND role = 'ADMIN'
  )
);

-- Admin-only delete access (only admins can delete images)
CREATE POLICY IF NOT EXISTS "Admin delete access" ON storage.objects
FOR DELETE USING (
  bucket_id = 'disease-images'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() AND role = 'ADMIN'
  )
);
