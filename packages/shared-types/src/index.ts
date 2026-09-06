// ListingKo Shared Types
// Keep in sync with DATABASE.md table schemas

export type Product = {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category?: string;
  status: 'DRAFT' | 'ANALYZING' | 'READY' | 'PUBLISHED';
  createdAt: string;
  updatedAt: string;
};

export type ProductMaster = {
  id: string;
  productId: string;
  name: string;
  description: string;
  category: string;
  sku: string;
  strengths: string[];
  targetCustomer: string;
  useCases: string[];
  keywords: string[];
  seoScore?: number;
  confidenceScore: number;
  specifications?: Record<string, unknown>;
  unsupportedClaims?: string[];
  missingInformation?: string[];
};

export type Listing = {
  id: string;
  productId: string;
  platform: 'shopee' | 'lazada' | 'tiktok' | 'facebook';
  title: string;
  description: string;
  platformData?: Record<string, unknown>;
  qaResult?: QAResult;
  status: 'DRAFT' | 'QA_PENDING' | 'QA_FAILED' | 'QA_PASSED' | 'PUBLISHED';
  createdAt: string;
};

export type QAResult = {
  id: string;
  factAccuracy: number;
  seoQuality: number;
  platformFit: number;
  readability: number;
  claimSafety: number;
  totalScore: number;
  passed: boolean;
  issues?: Record<string, string[]>;
};

export type Image = {
  id: string;
  productId: string;
  type: 'USER_UPLOAD' | 'AI_GENERATED' | 'AI_EDITED';
  urlOriginal: string;
  urlThumbnail?: string;
  urlMedium?: string;
  urlLarge?: string;
  width: number;
  height: number;
  purposes?: string[];
};

export type Subscription = {
  id: string;
  plan: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
  status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE';
  entitlements: Entitlements;
};

export type Entitlements = {
  productsPerMonth: number;
  imagesPerProduct: number;
  aiGenerationsPerMonth: number;
  marketplaceIntegrations: boolean;
  bulkOperations: boolean;
  directPublishing: boolean;
};

// API Response wrapper
export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  } | null;
};
