-- Create RPC function to bypass RLS for product creation in development
CREATE OR REPLACE FUNCTION public.create_product_dev(
  p_user_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_category TEXT,
  p_status TEXT DEFAULT 'DRAFT'
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  status TEXT,
  free_tier_used BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_product_id UUID;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- Insert the product
  INSERT INTO public.products (
    user_id,
    title,
    description,
    category,
    status,
    free_tier_used,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_title,
    p_description,
    p_category,
    p_status,
    FALSE,
    v_now,
    v_now
  ) RETURNING public.products.id INTO v_product_id;

  -- Return the created product
  RETURN QUERY
  SELECT
    public.products.id,
    public.products.user_id,
    public.products.title,
    public.products.description,
    public.products.category,
    public.products.status,
    public.products.free_tier_used,
    public.products.created_at,
    public.products.updated_at
  FROM public.products
  WHERE public.products.id = v_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users and anon
GRANT EXECUTE ON FUNCTION public.create_product_dev TO authenticated, anon;
