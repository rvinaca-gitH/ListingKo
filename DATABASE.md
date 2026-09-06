# ListingKo — Database Schema & Design

> PostgreSQL schema, migrations, and data models.

---

## 1. Database Initialization

### Supabase Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase project
supabase init

# Link to existing project
supabase link --project-ref <project-ref>

# Start local development
supabase start

# Create migrations
supabase migration new <name>
```

---

## 2. Core Tables

### users

```sql
CREATE TABLE users (
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

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
```

### products

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Basic info
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  
  -- Upload metadata
  raw_photos JSONB,  -- Array of uploaded image URLs
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'DRAFT',
    -- DRAFT, ANALYZING, READY, PUBLISHED
  
  -- Usage tracking
  free_tier_used BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('DRAFT', 'ANALYZING', 'READY', 'PUBLISHED'))
);

CREATE INDEX idx_products_user_id ON products(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_status ON products(user_id, status);
CREATE INDEX idx_products_created_at ON products(user_id, created_at DESC);
```

### product_masters

```sql
CREATE TABLE product_masters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Structured product analysis
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Key attributes
  category TEXT NOT NULL,
  sku TEXT NOT NULL,
  strengths TEXT[] NOT NULL,  -- Top 5 features
  target_customer TEXT NOT NULL,
  use_cases TEXT[] NOT NULL,
  
  -- SEO
  keywords TEXT[] NOT NULL,
  seo_score INTEGER,  -- 0-100
  
  -- Specifications (flexible JSONB)
  specifications JSONB,  -- { "color": "black", "material": "plastic", etc. }
  
  -- Safety checks
  unsupported_claims TEXT[],  -- Claims that shouldn't be used
  confidence_score NUMERIC(3, 2),  -- 0.00-1.00
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_sku CHECK (sku ~ '^[A-Z0-9\-_]+$'),
  CONSTRAINT valid_confidence CHECK (confidence_score >= 0 AND confidence_score <= 1)
);

CREATE INDEX idx_product_masters_user_id ON product_masters(user_id);
CREATE INDEX idx_product_masters_product_id ON product_masters(product_id);
CREATE INDEX idx_product_masters_created_at ON product_masters(user_id, created_at DESC);
```

### listings

```sql
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_master_id UUID NOT NULL REFERENCES product_masters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Platform info
  platform TEXT NOT NULL,  -- 'shopee', 'lazada', 'tiktok', 'facebook'
  
  -- Content
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Platform-specific data
  platform_data JSONB,  -- Platform-specific fields (attributes, category ID, etc.)
  
  -- Generation metadata
  ai_version TEXT,  -- Prompt/model version used
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Publishing (V2)
  published_at TIMESTAMP WITH TIME ZONE,
  platform_listing_id TEXT,  -- External listing ID
  
  -- QA result (most recent)
  qa_result_id UUID REFERENCES qa_results(id),
  qa_passed BOOLEAN DEFAULT FALSE,
  qa_score INTEGER,  -- 0-100
  
  -- Status
  status TEXT NOT NULL DEFAULT 'DRAFT',
    -- DRAFT, QA_PENDING, QA_FAILED, QA_PASSED, PUBLISHED
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT valid_platform CHECK (platform IN ('shopee', 'lazada', 'tiktok', 'facebook')),
  CONSTRAINT valid_status CHECK (status IN ('DRAFT', 'QA_PENDING', 'QA_FAILED', 'QA_PASSED', 'PUBLISHED')),
  CONSTRAINT unique_user_product_platform UNIQUE (user_id, product_id, platform)
);

CREATE INDEX idx_listings_product_id ON listings(product_id);
CREATE INDEX idx_listings_user_id ON listings(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_listings_platform ON listings(user_id, platform);
CREATE INDEX idx_listings_status ON listings(user_id, status);
CREATE INDEX idx_listings_created_at ON listings(user_id, created_at DESC);
```

### qa_results

```sql
CREATE TABLE qa_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Scores (each 0-100)
  fact_accuracy INTEGER NOT NULL,
  seo_quality INTEGER NOT NULL,
  platform_fit INTEGER NOT NULL,
  readability INTEGER NOT NULL,
  claim_safety INTEGER NOT NULL,
  
  -- Composite
  total_score INTEGER NOT NULL,  -- Average of above
  passed BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE if total >= 85
  
  -- Issues found
  issues JSONB,  -- { "fact_accuracy": "...missing...", "claim_safety": "...unsupported..." }
  
  -- Auto-repair attempt
  attempted_repair BOOLEAN DEFAULT FALSE,
  repair_success BOOLEAN,
  repaired_listing_id UUID REFERENCES listings(id),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_score CHECK (fact_accuracy >= 0 AND fact_accuracy <= 100),
  CONSTRAINT valid_total_score CHECK (total_score >= 0 AND total_score <= 100)
);

CREATE INDEX idx_qa_results_listing_id ON qa_results(listing_id);
CREATE INDEX idx_qa_results_user_id ON qa_results(user_id, created_at DESC);
CREATE INDEX idx_qa_results_passed ON qa_results(listing_id, passed);
```

### images

```sql
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Image data
  url_original TEXT NOT NULL,  -- Original uploaded image
  url_thumbnail TEXT,  -- 200x200
  url_medium TEXT,     -- 400x400
  url_large TEXT,      -- 800x800
  
  -- Image type
  type TEXT NOT NULL,  -- 'USER_UPLOAD', 'AI_GENERATED', 'AI_EDITED'
  
  -- Purpose/platform usage
  purposes TEXT[],  -- ['hero', 'feature', 'social', 'shopee', etc.]
  
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

CREATE INDEX idx_images_product_id ON images(product_id);
CREATE INDEX idx_images_user_id ON images(user_id);
CREATE INDEX idx_images_type ON images(product_id, type);
CREATE INDEX idx_images_created_at ON images(user_id, created_at DESC);
```

### usage_tracking

```sql
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Event type
  event_type TEXT NOT NULL,
    -- 'product_created', 'analysis_started', 'analysis_completed',
    -- 'listing_generated', 'image_generated', 'qa_scored', 'export_created'
  
  -- Resource references
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  image_id UUID REFERENCES images(id) ON DELETE SET NULL,
  
  -- Usage quantity
  quantity INTEGER DEFAULT 1,
  
  -- Cost tracking (for free-tier enforcement)
  cost_tokens INTEGER DEFAULT 0,  -- For AI operations
  cost_credits INTEGER DEFAULT 0,
  
  -- Billing period
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,
  period TEXT GENERATED ALWAYS AS (period_year || '-' || LPAD(period_month::TEXT, 2, '0')) STORED,
  
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

CREATE INDEX idx_usage_user_period ON usage_tracking(user_id, period);
CREATE INDEX idx_usage_event_type ON usage_tracking(user_id, event_type);
CREATE INDEX idx_usage_created_at ON usage_tracking(user_id, created_at DESC);
```

### subscriptions

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Plan
  plan TEXT NOT NULL DEFAULT 'FREE',
    -- 'FREE', 'STARTER', 'PRO', 'ENTERPRISE'
  
  -- Billing
  status TEXT NOT NULL DEFAULT 'ACTIVE',  -- 'ACTIVE', 'CANCELED', 'PAST_DUE'
  billing_period TEXT,  -- 'monthly', 'yearly'
  
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

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan);
```

### entitlements (V2)

```sql
CREATE TABLE entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Entitlements
  products_per_month INTEGER NOT NULL,  -- Number of products/month allowed
  images_per_product INTEGER NOT NULL,  -- Number of generated images per product
  ai_generations_per_month INTEGER NOT NULL,  -- Total AI generations
  marketplace_integrations BOOLEAN DEFAULT FALSE,
  bulk_operations BOOLEAN DEFAULT FALSE,
  direct_publishing BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_entitlements_user_id ON entitlements(user_id);
```

### marketplace_connections (V2)

```sql
CREATE TABLE marketplace_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Marketplace
  marketplace TEXT NOT NULL,  -- 'shopee', 'lazada', 'tiktok', 'facebook'
  
  -- Credentials (encrypted, never plain text)
  credentials_encrypted TEXT NOT NULL,  -- Encrypted JSON blob
  credentials_iv TEXT NOT NULL,  -- Initialization vector
  
  -- OAuth
  oauth_token TEXT,
  oauth_refresh_token TEXT,
  oauth_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'CONNECTED',
    -- 'CONNECTED', 'EXPIRED', 'REVOKED', 'ERROR'
  
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

CREATE INDEX idx_marketplace_connections_user_id ON marketplace_connections(user_id);
```

---

## 3. Row Level Security (RLS)

Enable RLS on all user-owned tables:

```sql
-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Products: Users can only see their own
CREATE POLICY "Users can view their own products"
ON products FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create products"
ON products FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
ON products FOR UPDATE
USING (auth.uid() = user_id);

-- Listings: Same pattern
CREATE POLICY "Users can view their own listings"
ON listings FOR SELECT
USING (auth.uid() = user_id);

-- Images: Same pattern
CREATE POLICY "Users can view their own images"
ON images FOR SELECT
USING (auth.uid() = user_id);

-- Subscriptions: Users can view their own
CREATE POLICY "Users can view their own subscription"
ON subscriptions FOR SELECT
USING (auth.uid() = user_id);
```

---

## 4. Triggers & Automations

### Auto-update updated_at

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_masters_updated_at
BEFORE UPDATE ON product_masters
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ... etc for other tables
```

### Track usage on listing generation

```sql
CREATE OR REPLACE FUNCTION track_listing_generation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ai_version IS NOT NULL THEN
    INSERT INTO usage_tracking (user_id, event_type, product_id, listing_id, quantity, period_year, period_month)
    VALUES (NEW.user_id, 'listing_generated', NEW.product_id, NEW.id, 1, EXTRACT(YEAR FROM NOW())::INTEGER, EXTRACT(MONTH FROM NOW())::INTEGER);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_listing_generation_trigger
AFTER INSERT ON listings
FOR EACH ROW
EXECUTE FUNCTION track_listing_generation();
```

---

## 5. Migrations Workflow

### Create a Migration

```bash
supabase migration new <descriptive_name>
```

Example migrations:

```
001_initial_schema.sql
002_add_product_masters.sql
003_add_rls_policies.sql
004_add_images.sql
005_add_usage_tracking.sql
006_add_subscriptions.sql
```

### Migration Template

```sql
-- Migration: add_product_masters

-- Up: Apply changes
ALTER TABLE products ADD COLUMN status TEXT DEFAULT 'DRAFT';

CREATE TABLE product_masters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL UNIQUE REFERENCES products(id),
  -- ...
);

-- Down: Rollback (commented, but keep for reference)
-- DROP TABLE product_masters;
-- ALTER TABLE products DROP COLUMN status;
```

### Test Migrations

```bash
# Reset local database
supabase db reset

# Test migrations run successfully
supabase db pull

# Deploy to production
supabase db push
```

---

## 6. Backup & Recovery

### Automated Backups

Supabase provides daily backups. For critical data:

```sql
-- Manual backup export (weekly)
pg_dump -h db.supabase.co -U postgres -d postgres > backup.sql
```

### Point-in-Time Recovery

```bash
supabase projects list
supabase db restore --project-id <id> --backup-id <backup-id>
```

---

## 7. Query Examples

### Get all products for a user with their listings

```sql
SELECT 
  p.id,
  p.title,
  COUNT(l.id) as listing_count,
  MAX(l.created_at) as latest_listing
FROM products p
LEFT JOIN listings l ON p.id = l.product_id AND l.deleted_at IS NULL
WHERE p.user_id = $1 AND p.deleted_at IS NULL
GROUP BY p.id, p.title
ORDER BY p.created_at DESC;
```

### Get monthly usage summary

```sql
SELECT 
  event_type,
  COUNT(*) as count,
  SUM(cost_tokens) as total_tokens
FROM usage_tracking
WHERE user_id = $1
  AND period_year = 2024
  AND period_month = 9
GROUP BY event_type;
```

### Find listings that failed QA more than once

```sql
SELECT 
  l.id,
  l.platform,
  COUNT(qr.id) as qa_attempts,
  MAX(qr.total_score) as best_score
FROM listings l
LEFT JOIN qa_results qr ON l.id = qr.listing_id
WHERE l.user_id = $1 AND qr.passed = FALSE
GROUP BY l.id, l.platform
HAVING COUNT(qr.id) > 1
ORDER BY qa_attempts DESC;
```

### Check user's free-tier usage

```sql
SELECT 
  COUNT(DISTINCT p.id) as products_created,
  COUNT(DISTINCT l.id) as listings_generated,
  COUNT(DISTINCT i.id) as images_generated
FROM products p
LEFT JOIN listings l ON p.id = l.product_id AND l.deleted_at IS NULL
LEFT JOIN images i ON p.id = i.product_id AND i.deleted_at IS NULL
WHERE p.user_id = $1
  AND p.free_tier_used = TRUE
  AND EXTRACT(MONTH FROM p.created_at) = EXTRACT(MONTH FROM NOW())
  AND EXTRACT(YEAR FROM p.created_at) = EXTRACT(YEAR FROM NOW());
```

---

## 8. Performance Tuning

### Indexes to Create Early

```sql
-- Foreign key indexes
CREATE INDEX idx_listings_product_master_id ON listings(product_master_id);
CREATE INDEX idx_qa_results_listing_id ON qa_results(listing_id);

-- Tenant isolation (most common filter)
CREATE INDEX idx_products_user_id_status ON products(user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_listings_user_id_platform ON listings(user_id, platform) WHERE deleted_at IS NULL;

-- Time-based queries
CREATE INDEX idx_products_user_created ON products(user_id, created_at DESC);
CREATE INDEX idx_usage_user_period ON usage_tracking(user_id, period);

-- Soft deletes
CREATE INDEX idx_products_deleted ON products(deleted_at) WHERE deleted_at IS NOT NULL;
```

### Query Analysis

```sql
-- Check query plan
EXPLAIN ANALYZE
SELECT * FROM products WHERE user_id = $1 AND status = 'ACTIVE';

-- Identify missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public' AND attname IN ('user_id', 'status')
ORDER BY abs(correlation) DESC;
```

---

## 9. Data Consistency

### Foreign Key Constraints

All user-owned data includes `user_id` and references the users table directly:

```sql
-- Every table has this constraint
CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
```

### Cascade Deletion

When a user is deleted:
- All products are deleted (CASCADE)
- All listings are deleted (CASCADE)
- All images are deleted (CASCADE)
- All usage tracking records are deleted (CASCADE)

This keeps the database clean and consistent.

---

## 10. Future Schema Changes (V2+)

### Marketplace Sync Table

```sql
CREATE TABLE marketplace_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  listing_id UUID REFERENCES listings(id),
  marketplace TEXT NOT NULL,
  
  action TEXT,  -- 'publish', 'update', 'sync_inventory'
  status TEXT,  -- 'success', 'failed', 'pending'
  
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Analytics Table

```sql
CREATE TABLE listing_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id),
  user_id UUID NOT NULL,
  
  date DATE NOT NULL,
  marketplace TEXT NOT NULL,
  
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  add_to_cart INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue NUMERIC(10, 2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(listing_id, date)
);
```

---

