-- Create product-images storage bucket
INSERT INTO storage.buckets (id, name, owner, public)
VALUES ('product-images', 'product-images', NULL, true)
ON CONFLICT DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Allow authenticated users to update their images
CREATE POLICY "Allow authenticated users to update images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- Allow authenticated users to delete their images
CREATE POLICY "Allow authenticated users to delete images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- Allow public access to read images
CREATE POLICY "Allow public read access to images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');
