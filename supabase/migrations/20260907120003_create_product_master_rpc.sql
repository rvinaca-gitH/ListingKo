-- Simple RPC function to create product master, bypassing RLS
CREATE OR REPLACE FUNCTION public.create_product_master_dev(
  p_product_id UUID,
  p_user_id UUID,
  p_name TEXT,
  p_description TEXT,
  p_category TEXT,
  p_sku TEXT,
  p_strengths TEXT[],
  p_target_customer TEXT,
  p_use_cases TEXT[],
  p_keywords TEXT[],
  p_seo_score INTEGER,
  p_specifications JSONB,
  p_unsupported_claims TEXT[],
  p_confidence_score NUMERIC
)
RETURNS json AS $$
INSERT INTO public.product_masters (
  product_id, user_id, name, description, category, sku,
  strengths, target_customer, use_cases, keywords,
  seo_score, specifications, unsupported_claims, confidence_score
) VALUES (
  p_product_id, p_user_id, p_name, p_description, p_category, p_sku,
  p_strengths, p_target_customer, p_use_cases, p_keywords,
  p_seo_score, p_specifications, p_unsupported_claims, p_confidence_score
)
ON CONFLICT (product_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  sku = EXCLUDED.sku,
  strengths = EXCLUDED.strengths,
  target_customer = EXCLUDED.target_customer,
  use_cases = EXCLUDED.use_cases,
  keywords = EXCLUDED.keywords,
  seo_score = EXCLUDED.seo_score,
  specifications = EXCLUDED.specifications,
  unsupported_claims = EXCLUDED.unsupported_claims,
  confidence_score = EXCLUDED.confidence_score,
  updated_at = NOW()
RETURNING row_to_json(product_masters.*)
$$ LANGUAGE sql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_product_master_dev TO authenticated, anon;
