-- Simple RPC function to create listings, bypassing RLS
CREATE OR REPLACE FUNCTION public.create_listing_dev(
  p_product_id UUID,
  p_product_master_id UUID,
  p_user_id UUID,
  p_platform TEXT,
  p_title TEXT,
  p_description TEXT,
  p_platform_data JSONB,
  p_ai_version TEXT,
  p_status TEXT DEFAULT 'DRAFT'
)
RETURNS json AS $$
INSERT INTO public.listings (
  product_id, product_master_id, user_id, platform, title, description,
  platform_data, ai_version, status
) VALUES (
  p_product_id, p_product_master_id, p_user_id, p_platform, p_title, p_description,
  p_platform_data, p_ai_version, p_status
)
RETURNING row_to_json(listings.*)
$$ LANGUAGE sql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_listing_dev TO authenticated, anon;

-- Add RLS policy for development listing updates
-- (insert policy already created in 20260907120001_dev_rls_bypass.sql)
CREATE POLICY "Development: Allow dev user updates on listings"
ON public.listings FOR UPDATE
WITH CHECK (user_id = 'a1111111-1111-1111-1111-111111111111');
