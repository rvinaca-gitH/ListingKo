-- ListingKo Initial Schema
-- Creates all core tables with constraints, indexes, and Row Level Security

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================

CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,

  -- Preferences
  email_notifications BOOLEAN DEFAULT TRUE,
  dark_mode BOOLEAN DEFAULT FALSE,

  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_created_at ON public.users(created_at DESC);

-- ============================================================================
-- 2. PRODUCTS TABLE
-- ============================================================================

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Basic info
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,

  -- Upload metadata
  raw_photos JSONB,  -- Array of uploaded image URLs

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'DRAFT',

  -- Usage tracking
  free_tier_used BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('DRAFT', 'ANALYZING', 'READY', 'PUBLISHED'))
);

CREATE INDEX idx_products_user_id ON public.products(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_status ON public.products(user_id, status);
CREATE INDEX idx_products_created_at ON public.products(user_id, created_at DESC);

-- ============================================================================
-- 3. PRODUCT_MASTERS TABLE
-- ============================================================================

CREATE TABLE public.product_masters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Structured product analysis
  name TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Key attributes
  category TEXT NOT NULL,
  sku TEXT NOT NULL,
  strengths TEXT[] NOT NULL,
  target_customer TEXT NOT NULL,
  use_cases TEXT[] NOT NULL,

  -- SEO
  keywords TEXT[] NOT NULL,
  seo_score INTEGER,

  -- Specifications (flexible JSONB)
  specifications JSONB,

  -- Safety checks
  unsupported_claims TEXT[],
  confidence_score NUMERIC(3, 2),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_sku CHECK (sku ~ '^[A-Z0-9\-_]+$'),
  CONSTRAINT valid_confidence CHECK (confidence_score >= 0 AND confidence_score <= 1)
);

CREATE INDEX idx_product_masters_user_id ON public.product_masters(user_id);
CREATE INDEX idx_product_masters_product_id ON public.product_masters(product_id);
CREATE INDEX idx_product_masters_created_at ON public.product_masters(user_id, created_at DESC);

-- ============================================================================
-- 4. LISTINGS TABLE
-- ============================================================================

CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_master_id UUID NOT NULL REFERENCES public.product_masters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Platform info
  platform TEXT NOT NULL,

  -- Content
  title TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Platform-specific data
  platform_data JSONB,

  -- Generation metadata
  ai_version TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Publishing (V2)
  published_at TIMESTAMP WITH TIME ZONE,
  platform_listing_id TEXT,

  -- QA result (most recent)
  qa_result_id UUID,
  qa_passed BOOLEAN DEFAULT FALSE,
  qa_score INTEGER,

  -- Status
  status TEXT NOT NULL DEFAULT 'DRAFT',

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT valid_platform CHECK (platform IN ('shopee', 'lazada', 'tiktok', 'facebook')),
  CONSTRAINT valid_status CHECK (status IN ('DRAFT', 'QA_PENDING', 'QA_FAILED', 'QA_PASSED', 'PUBLISHED')),
  CONSTRAINT unique_user_product_platform UNIQUE (user_id, product_id, platform)
);

CREATE INDEX idx_listings_product_id ON public.listings(product_id);
CREATE INDEX idx_listings_user_id ON public.listings(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_listings_platform ON public.listings(user_id, platform);
CREATE INDEX idx_listings_status ON public.listings(user_id, status);
CREATE INDEX idx_listings_created_at ON public.listings(user_id, created_at DESC);

-- ============================================================================
-- 5. QA_RESULTS TABLE
-- ============================================================================

CREATE TABLE public.qa_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Scores (each 0-100)
  fact_accuracy INTEGER NOT NULL,
  seo_quality INTEGER NOT NULL,
  platform_fit INTEGER NOT NULL,
  readability INTEGER NOT NULL,
  claim_safety INTEGER NOT NULL,

  -- Composite
  total_score INTEGER NOT NULL,
  passed BOOLEAN NOT NULL DEFAULT FALSE,

  -- Issues found
  issues JSONB,

  -- Auto-repair attempt
  attempted_repair BOOLEAN DEFAULT FALSE,
  repair_success BOOLEAN,
  repaired_listing_id UUID REFERENCES public.listings(id),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_fact_accuracy CHECK (fact_accuracy >= 0 AND fact_accuracy <= 100),
  CONSTRAINT valid_seo_quality CHECK (seo_quality >= 0 AND seo_quality <= 100),
  CONSTRAINT valid_platform_fit CHECK (platform_fit >= 0 AND platform_fit <= 100),
  CONSTRAINT valid_readability CHECK (readability >= 0 AND readability <= 100),
  CONSTRAINT valid_claim_safety CHECK (claim_safety >= 0 AND claim_safety <= 100),
  CONSTRAINT valid_total_score CHECK (total_score >= 0 AND total_score <= 100)
);

CREATE INDEX idx_qa_results_listing_id ON public.qa_results(listing_id);
CREATE INDEX idx_qa_results_user_id ON public.qa_results(user_id, created_at DESC);
CREATE INDEX idx_qa_results_passed ON public.qa_results(listing_id, passed);

-- ============================================================================
-- 6. IMAGES TABLE
-- ============================================================================

CREATE TABLE public.images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Image data
  url_original TEXT NOT NULL,
  url_thumbnail TEXT,
  url_medium TEXT,
  url_large TEXT,

  -- Image type
  type TEXT NOT NULL,

  -- Purpose/platform usage
  purposes TEXT[],

  -- Generation metadata (if AI-generated)
  ai_prompt TEXT,
  ai_version TEXT,
  ai_model TEXT,

  -- File info
  original_filename TEXT,
  size_bytes INTEGER,
  width INTEGER,
  height INTEGER,
  mime_type TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT valid_type CHECK (type IN ('USER_UPLOAD', 'AI_GENERATED', 'AI_EDITED')),
  CONSTRAINT valid_dimensions CHECK (width > 0 AND height > 0)
);

CREATE INDEX idx_images_product_id ON public.images(product_id);
CREATE INDEX idx_images_user_id ON public.images(user_id);
CREATE INDEX idx_images_type ON public.images(product_id, type);
CREATE INDEX idx_images_created_at ON public.images(user_id, created_at DESC);

-- ============================================================================
-- 7. USAGE_TRACKING TABLE
-- ============================================================================

CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Event type
  event_type TEXT NOT NULL,

  -- Resource references
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  image_id UUID REFERENCES public.images(id) ON DELETE SET NULL,

  -- Usage quantity
  quantity INTEGER DEFAULT 1,

  -- Cost tracking
  cost_tokens INTEGER DEFAULT 0,
  cost_credits INTEGER DEFAULT 0,

  -- Billing period
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_event CHECK (event_type IN (
    'product_created',
    'analysis_started',
    'analysis_completed',
    'listing_generated',
    'image_generated',
    'qa_scored',
    'export_created',
    'listing_published'
  ))
);

CREATE INDEX idx_usage_user_period ON public.usage_tracking(user_id, period_year, period_month);
CREATE INDEX idx_usage_event_type ON public.usage_tracking(user_id, event_type);
CREATE INDEX idx_usage_created_at ON public.usage_tracking(user_id, created_at DESC);

-- ============================================================================
-- 8. SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,

  -- Plan
  plan TEXT NOT NULL DEFAULT 'FREE',

  -- Billing
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  billing_period TEXT,

  -- Stripe integration (V2)
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,

  -- Dates
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  renewal_at TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_plan CHECK (plan IN ('FREE', 'STARTER', 'PRO', 'ENTERPRISE')),
  CONSTRAINT valid_status CHECK (status IN ('ACTIVE', 'CANCELED', 'PAST_DUE'))
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_plan ON public.subscriptions(plan);

-- ============================================================================
-- 9. ENTITLEMENTS TABLE (V2)
-- ============================================================================

CREATE TABLE public.entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Entitlements
  products_per_month INTEGER NOT NULL,
  images_per_product INTEGER NOT NULL,
  ai_generations_per_month INTEGER NOT NULL,
  marketplace_integrations BOOLEAN DEFAULT FALSE,
  bulk_operations BOOLEAN DEFAULT FALSE,
  direct_publishing BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_entitlements_user_id ON public.entitlements(user_id);

-- ============================================================================
-- 10. MARKETPLACE_CONNECTIONS TABLE (V2)
-- ============================================================================

CREATE TABLE public.marketplace_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Marketplace
  marketplace TEXT NOT NULL,

  -- Credentials (encrypted, never plain text)
  credentials_encrypted TEXT NOT NULL,
  credentials_iv TEXT NOT NULL,

  -- OAuth
  oauth_token TEXT,
  oauth_refresh_token TEXT,
  oauth_expires_at TIMESTAMP WITH TIME ZONE,

  -- Status
  status TEXT NOT NULL DEFAULT 'CONNECTED',

  -- Shop info
  shop_id TEXT,
  shop_name TEXT,

  -- Last sync
  last_sync_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_marketplace CHECK (marketplace IN ('shopee', 'lazada', 'tiktok', 'facebook')),
  CONSTRAINT valid_status CHECK (status IN ('CONNECTED', 'EXPIRED', 'REVOKED', 'ERROR')),
  CONSTRAINT unique_user_marketplace UNIQUE (user_id, marketplace)
);

CREATE INDEX idx_marketplace_connections_user_id ON public.marketplace_connections(user_id);

-- ============================================================================
-- 11. TRIGGERS FOR auto-updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_masters_updated_at
BEFORE UPDATE ON public.product_masters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_listings_updated_at
BEFORE UPDATE ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_entitlements_updated_at
BEFORE UPDATE ON public.entitlements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketplace_connections_updated_at
BEFORE UPDATE ON public.marketplace_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 12. ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all user-owned tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_connections ENABLE ROW LEVEL SECURITY;

-- Products: Users can only see their own
CREATE POLICY "Users can view their own products"
ON public.products FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create products"
ON public.products FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
ON public.products FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products"
ON public.products FOR DELETE
USING (auth.uid() = user_id);

-- Product Masters
CREATE POLICY "Users can view their own product masters"
ON public.product_masters FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create product masters"
ON public.product_masters FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own product masters"
ON public.product_masters FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Listings
CREATE POLICY "Users can view their own listings"
ON public.listings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create listings"
ON public.listings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listings"
ON public.listings FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own listings"
ON public.listings FOR DELETE
USING (auth.uid() = user_id);

-- QA Results
CREATE POLICY "Users can view their own QA results"
ON public.qa_results FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create QA results"
ON public.qa_results FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Images
CREATE POLICY "Users can view their own images"
ON public.images FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create images"
ON public.images FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own images"
ON public.images FOR DELETE
USING (auth.uid() = user_id);

-- Usage Tracking
CREATE POLICY "Users can view their own usage"
ON public.usage_tracking FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create usage records"
ON public.usage_tracking FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Subscriptions
CREATE POLICY "Users can view their own subscription"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Entitlements
CREATE POLICY "Users can view their own entitlements"
ON public.entitlements FOR SELECT
USING (auth.uid() = user_id);

-- Marketplace Connections
CREATE POLICY "Users can view their own marketplace connections"
ON public.marketplace_connections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create marketplace connections"
ON public.marketplace_connections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own marketplace connections"
ON public.marketplace_connections FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own marketplace connections"
ON public.marketplace_connections FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- 13. FOREIGN KEY: Update qa_result_id in listings after QA is created
-- ============================================================================

ALTER TABLE public.listings
ADD CONSTRAINT fk_listings_qa_result_id
FOREIGN KEY (qa_result_id) REFERENCES public.qa_results(id) ON DELETE SET NULL;

-- ============================================================================
-- 14. DEVELOPMENT SEED DATA
-- ============================================================================

-- Create development user in auth.users (Supabase automatically creates this)
-- Note: In a real Supabase project, use the Supabase dashboard or auth API
-- For local development, this inserts directly into the public users table
INSERT INTO public.users (id, email, full_name, created_at, updated_at)
VALUES ('a1111111-1111-1111-1111-111111111111', 'dev@example.com', 'Dev User', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create corresponding auth user for RLS to work (Supabase specific)
-- This is a placeholder; in production use proper auth flows

-- ============================================================================
-- Done
-- ============================================================================