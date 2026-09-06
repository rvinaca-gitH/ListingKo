// ListingKo Shared Types
// Keep in sync with DATABASE.md table schemas

// ============================================================================
// DATABASE MODELS (from Supabase)
// ============================================================================

export type User = {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  email_notifications: boolean;
  dark_mode: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
};

export type Product = {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category?: string;
  raw_photos?: unknown[];
  status: 'DRAFT' | 'ANALYZING' | 'READY' | 'PUBLISHED';
  free_tier_used: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
};

export type ProductMaster = {
  id: string;
  product_id: string;
  user_id: string;
  name: string;
  description: string;
  category: string;
  sku: string;
  strengths: string[];
  target_customer: string;
  use_cases: string[];
  keywords: string[];
  seo_score?: number;
  specifications?: Record<string, unknown>;
  unsupported_claims?: string[];
  confidence_score: number;
  created_at: string;
  updated_at: string;
};

export type Listing = {
  id: string;
  product_id: string;
  product_master_id: string;
  user_id: string;
  platform: 'shopee' | 'lazada' | 'tiktok' | 'facebook';
  title: string;
  description: string;
  platform_data?: Record<string, unknown>;
  ai_version?: string;
  generated_at?: string;
  published_at?: string;
  platform_listing_id?: string;
  qa_result_id?: string;
  qa_passed: boolean;
  qa_score?: number;
  status: 'DRAFT' | 'QA_PENDING' | 'QA_FAILED' | 'QA_PASSED' | 'PUBLISHED';
  created_at: string;
  updated_at: string;
  deleted_at?: string;
};

export type QAResult = {
  id: string;
  listing_id: string;
  user_id: string;
  fact_accuracy: number;
  seo_quality: number;
  platform_fit: number;
  readability: number;
  claim_safety: number;
  total_score: number;
  passed: boolean;
  issues?: Record<string, string[]>;
  attempted_repair: boolean;
  repair_success?: boolean;
  repaired_listing_id?: string;
  created_at: string;
};

export type Image = {
  id: string;
  product_id: string;
  user_id: string;
  url_original: string;
  url_thumbnail?: string;
  url_medium?: string;
  url_large?: string;
  type: 'USER_UPLOAD' | 'AI_GENERATED' | 'AI_EDITED';
  purposes?: string[];
  ai_prompt?: string;
  ai_version?: string;
  ai_model?: string;
  original_filename?: string;
  size_bytes?: number;
  width: number;
  height: number;
  mime_type?: string;
  created_at: string;
  deleted_at?: string;
};

export type UsageTracking = {
  id: string;
  user_id: string;
  event_type: 'product_created' | 'analysis_started' | 'analysis_completed' | 'listing_generated' | 'image_generated' | 'qa_scored' | 'export_created' | 'listing_published';
  product_id?: string;
  listing_id?: string;
  image_id?: string;
  quantity: number;
  cost_tokens: number;
  cost_credits: number;
  period_year: number;
  period_month: number;
  created_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
  status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE';
  billing_period?: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  started_at: string;
  renewal_at?: string;
  canceled_at?: string;
  created_at: string;
  updated_at: string;
};

export type Entitlements = {
  id: string;
  subscription_id: string;
  user_id: string;
  products_per_month: number;
  images_per_product: number;
  ai_generations_per_month: number;
  marketplace_integrations: boolean;
  bulk_operations: boolean;
  direct_publishing: boolean;
  created_at: string;
  updated_at: string;
};

export type MarketplaceConnection = {
  id: string;
  user_id: string;
  marketplace: 'shopee' | 'lazada' | 'tiktok' | 'facebook';
  credentials_encrypted: string;
  credentials_iv: string;
  oauth_token?: string;
  oauth_refresh_token?: string;
  oauth_expires_at?: string;
  status: 'CONNECTED' | 'EXPIRED' | 'REVOKED' | 'ERROR';
  shop_id?: string;
  shop_name?: string;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
};

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export type ApiResponse<T = unknown> = {
  success: boolean;
  data: T | null;
  error: ApiError | null;
};

export type ApiError = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  hasMore: boolean;
};

// ============================================================================
// API REQUEST TYPES
// ============================================================================

export type CreateProductInput = {
  title: string;
  description?: string;
  category?: string;
  images?: string[];
};

export type UpdateProductInput = {
  title?: string;
  description?: string;
  category?: string;
};

export type GenerateListingInput = {
  productId: string;
  platforms: ('shopee' | 'lazada' | 'tiktok' | 'facebook')[];
};

export type UpdateListingInput = {
  title?: string;
  description?: string;
  platformData?: Record<string, unknown>;
};

export type GenerateImagesInput = {
  productId: string;
  types: ('hero' | 'feature' | 'lifestyle' | 'social' | 'specification')[];
  count?: number;
};

export type CreateExportInput = {
  productId: string;
  format: 'pdf' | 'zip' | 'csv' | 'json';
  includeImages?: boolean;
};

// ============================================================================
// AUTHENTICATION
// ============================================================================

export type AuthUser = {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
};

export type AuthSession = {
  user: AuthUser;
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  token_type?: string;
};

// ============================================================================
// JOB/BACKGROUND TASK
// ============================================================================

export type JobResponse = {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  jobId: string;
  estimatedTime?: number;
};

export type JobResult<T> = {
  status: 'pending' | 'completed' | 'failed';
  result?: T;
  error?: string;
};
