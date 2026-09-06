# ListingKo — API Contracts & Endpoints

> REST API and Server Actions specification for ListingKo.

---

## 1. API Architecture

### Authentication

All API calls require a valid Supabase JWT token:

```
Authorization: Bearer <jwt_token>
```

The token is automatically included by:
- Next.js Server Actions (via Supabase Auth)
- Client-side fetch calls (via `@supabase/ssr` client)
- Mobile app (via `@react-native-supabase/auth`)

### Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { /* response data */ },
  "error": null
}
```

Error response:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required",
    "details": { "field": "title" }
  }
}
```

### Error Codes

```
UNAUTHORIZED         - User not authenticated
FORBIDDEN            - User not authorized for resource
NOT_FOUND            - Resource not found
VALIDATION_ERROR     - Input validation failed
RATE_LIMIT_EXCEEDED  - Too many requests
INTERNAL_ERROR       - Server error
AI_ERROR             - AI provider error
MARKETPLACE_ERROR    - Marketplace integration error
```

---

## 2. Products API

### Create Product

**Server Action**

```typescript
// app/actions/products.ts
'use server';

type CreateProductInput = {
  title: string;
  description?: string;
  category?: string;
  images?: File[];
};

export async function createProduct(input: CreateProductInput) {
  // Returns: { id, title, status, createdAt }
}
```

**Request**

```typescript
const product = await createProduct({
  title: "Wireless Bluetooth Headphones",
  description: "Noise-cancelling over-ear headphones",
  category: "ELECTRONICS",
  images: [file1, file2],
});
```

**Response**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Wireless Bluetooth Headphones",
  "status": "DRAFT",
  "createdAt": "2024-09-06T10:00:00Z"
}
```

### Get Product

```typescript
export async function getProduct(productId: string) {
  // Returns: Full product with master, listings, images
}
```

**Response**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Wireless Bluetooth Headphones",
  "description": "Noise-cancelling over-ear headphones",
  "category": "ELECTRONICS",
  "status": "READY",
  "createdAt": "2024-09-06T10:00:00Z",
  "productMaster": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Wireless Bluetooth Headphones",
    "description": "Premium wireless headphones with active noise cancellation",
    "strengths": ["Noise cancellation", "30-hour battery", "Comfortable fit"],
    "targetCustomer": "Professionals & music enthusiasts",
    "useCases": ["Work calls", "Music listening", "Travel"],
    "sku": "WBH-001",
    "keywords": ["bluetooth headphones", "noise cancelling", "wireless audio"],
    "seoScore": 92,
    "confidenceScore": 0.95
  },
  "listings": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "platform": "shopee",
      "title": "Wireless Bluetooth Headphones - Noise Cancelling",
      "qaScore": 94,
      "qaPassed": true,
      "status": "QA_PASSED"
    }
  ],
  "images": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "type": "USER_UPLOAD",
      "urlLarge": "https://storage.example.com/images/...",
      "width": 800,
      "height": 800
    }
  ]
}
```

### List Products

```typescript
type ListProductsOptions = {
  limit?: number;     // Default: 50
  offset?: number;    // Default: 0
  status?: string;    // 'DRAFT', 'ANALYZING', 'READY', 'PUBLISHED'
  sortBy?: string;    // 'created_at', 'updated_at'
  sortOrder?: 'asc' | 'desc';
};

export async function listProducts(options?: ListProductsOptions) {
  // Returns: { items: Product[], total: number, hasMore: boolean }
}
```

### Update Product

```typescript
type UpdateProductInput = {
  title?: string;
  description?: string;
  category?: string;
};

export async function updateProduct(productId: string, input: UpdateProductInput) {
  // Returns: Updated product
}
```

### Delete Product

```typescript
export async function deleteProduct(productId: string) {
  // Soft delete: sets deleted_at timestamp
  // Returns: { success: true }
}
```

### Analyze Product

Triggers AI product analysis and creates Product Master.

```typescript
export async function analyzeProduct(productId: string) {
  // Queues background job
  // Returns: { status: 'analyzing', jobId: string }
}
```

**Response**

```json
{
  "status": "analyzing",
  "jobId": "job_550e8400-e29b-41d4-a716-446655440000",
  "estimatedTime": 30
}
```

Poll for completion:

```typescript
export async function getAnalysisStatus(jobId: string) {
  // Returns: { status: 'pending' | 'completed' | 'failed', productMaster?: ... }
}
```

---

## 3. Listings API

### Generate Listing

Creates platform-specific listing content from Product Master.

```typescript
type GenerateListingInput = {
  productId: string;
  platforms: ('shopee' | 'lazada' | 'tiktok' | 'facebook')[];
};

export async function generateListing(input: GenerateListingInput) {
  // Returns: { status: 'generating', jobId: string }
}
```

### Get Listing

```typescript
export async function getListing(listingId: string) {
  // Returns: Full listing with QA results
}
```

**Response**

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "platform": "shopee",
  "title": "Wireless Bluetooth Headphones - Noise Cancelling",
  "description": "Experience premium audio with our wireless bluetooth headphones...",
  "platformData": {
    "category": "ELECTRONICS",
    "subcategory": "AUDIO_HEADPHONES",
    "attributes": {
      "brand": "Unknown",
      "connection_type": "Bluetooth"
    }
  },
  "qaResult": {
    "factAccuracy": 95,
    "seoQuality": 92,
    "platformFit": 94,
    "readability": 96,
    "claimSafety": 98,
    "totalScore": 95,
    "passed": true,
    "issues": []
  },
  "status": "QA_PASSED",
  "createdAt": "2024-09-06T10:15:00Z"
}
```

### Update Listing

Allows user to edit listing content before publishing.

```typescript
type UpdateListingInput = {
  title?: string;
  description?: string;
  platformData?: Record<string, unknown>;
};

export async function updateListing(listingId: string, input: UpdateListingInput) {
  // Returns: Updated listing
}
```

### List Listings

```typescript
type ListListingsOptions = {
  productId?: string;
  platform?: string;
  status?: string;
  limit?: number;
  offset?: number;
};

export async function listListings(options?: ListListingsOptions) {
  // Returns: { items: Listing[], total: number }
}
```

### Delete Listing

```typescript
export async function deleteListing(listingId: string) {
  // Soft delete
  // Returns: { success: true }
}
```

### Re-Generate Listing

Regenerate a listing (after editing Product Master or trying different AI parameters).

```typescript
export async function regenerateListing(listingId: string) {
  // Returns: New listing ID
}
```

---

## 4. QA & Auto-Repair API

### Score Listing

Runs QA scoring on a listing.

```typescript
export async function scoreListing(listingId: string) {
  // Returns: { status: 'scoring', jobId: string }
}
```

Get QA result:

```typescript
export async function getQAResult(qaResultId: string) {
  // Returns: Full QA result
}
```

**Response**

```json
{
  "id": "990e8400-e29b-41d4-a716-446655440004",
  "listingId": "770e8400-e29b-41d4-a716-446655440002",
  "factAccuracy": 95,
  "seoQuality": 92,
  "platformFit": 94,
  "readability": 96,
  "claimSafety": 98,
  "totalScore": 95,
  "passed": true,
  "issues": [],
  "attemptedRepair": false,
  "createdAt": "2024-09-06T10:20:00Z"
}
```

### Auto-Repair Listing

If QA fails, attempt automatic repair.

```typescript
export async function repairListing(listingId: string) {
  // Returns: { status: 'repairing', jobId: string }
}
```

---

## 5. Images API

### Generate Images

Create AI-generated product images.

```typescript
type GenerateImagesInput = {
  productId: string;
  types: ('hero' | 'feature' | 'lifestyle' | 'social' | 'specification')[];
  count?: number;  // Images per type, default 1
};

export async function generateImages(input: GenerateImagesInput) {
  // Returns: { status: 'generating', jobId: string, estimatedTime: number }
}
```

### Upload Image

Upload user-provided product photos.

```typescript
export async function uploadImage(productId: string, file: File) {
  // Returns: { id, urlLarge, width, height, type: 'USER_UPLOAD' }
}
```

**Response**

```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440005",
  "urlOriginal": "https://storage.example.com/products/...",
  "urlThumbnail": "https://storage.example.com/products/...",
  "urlMedium": "https://storage.example.com/products/...",
  "urlLarge": "https://storage.example.com/products/...",
  "type": "USER_UPLOAD",
  "width": 1200,
  "height": 1200,
  "createdAt": "2024-09-06T10:05:00Z"
}
```

### Get Image

```typescript
export async function getImage(imageId: string) {
  // Returns: Image object with all URLs
}
```

### List Images

```typescript
type ListImagesOptions = {
  productId?: string;
  type?: 'USER_UPLOAD' | 'AI_GENERATED';
  limit?: number;
  offset?: number;
};

export async function listImages(options?: ListImagesOptions) {
  // Returns: { items: Image[], total: number }
}
```

### Delete Image

```typescript
export async function deleteImage(imageId: string) {
  // Soft delete + remove from storage
  // Returns: { success: true }
}
```

---

## 6. Export API

### Create Export

Package all product content for download.

```typescript
type CreateExportInput = {
  productId: string;
  format: 'pdf' | 'zip' | 'csv' | 'json';
  includeImages?: boolean;
};

export async function createExport(input: CreateExportInput) {
  // Returns: { exportId, downloadUrl, expiresAt }
}
```

**Response**

```json
{
  "exportId": "bb0e8400-e29b-41d4-a716-446655440006",
  "downloadUrl": "https://storage.example.com/exports/...",
  "format": "zip",
  "fileSize": 15728640,
  "expiresAt": "2024-09-13T10:30:00Z"
}
```

### List Exports

```typescript
export async function listExports(productId: string) {
  // Returns: { items: Export[], total: number }
}
```

### Get Export

```typescript
export async function getExport(exportId: string) {
  // Returns: Export with download URL
}
```

---

## 7. Subscriptions & Usage API

### Get Subscription

```typescript
export async function getSubscription() {
  // Returns: Current subscription info
}
```

**Response**

```json
{
  "id": "cc0e8400-e29b-41d4-a716-446655440007",
  "plan": "FREE",
  "status": "ACTIVE",
  "startedAt": "2024-09-06T10:00:00Z",
  "renewalAt": null,
  "entitlements": {
    "productsPerMonth": 10,
    "imagesPerProduct": 5,
    "aiGenerationsPerMonth": 50,
    "marketplaceIntegrations": false,
    "bulkOperations": false,
    "directPublishing": false
  }
}
```

### Get Usage

```typescript
type GetUsageOptions = {
  month?: string;  // 'YYYY-MM', default current month
};

export async function getUsage(options?: GetUsageOptions) {
  // Returns: Usage summary
}
```

**Response**

```json
{
  "period": "2024-09",
  "usage": {
    "productsCreated": 3,
    "analysisCompleted": 3,
    "listingsGenerated": 12,
    "imagesGenerated": 15,
    "qaRuns": 12,
    "exportsCreated": 3
  },
  "limits": {
    "productsPerMonth": 10,
    "imagesPerProduct": 5
  },
  "remaining": {
    "productsThisMonth": 7,
    "imagesAvailable": 10
  }
}
```

---

## 8. Marketplace Integration API (V2)

### Connect Marketplace

Initiate OAuth flow or API key setup.

```typescript
type ConnectMarketplaceInput = {
  marketplace: 'shopee' | 'lazada' | 'tiktok' | 'facebook';
  // OAuth will be handled by marketplace UI
};

export async function initiateMarketplaceConnection(input: ConnectMarketplaceInput) {
  // Returns: { authUrl, state }
}
```

### Get Marketplace Connection

```typescript
export async function getMarketplaceConnection(marketplace: string) {
  // Returns: Connection status, shop info
}
```

**Response**

```json
{
  "id": "dd0e8400-e29b-41d4-a716-446655440008",
  "marketplace": "shopee",
  "status": "CONNECTED",
  "shopId": "123456",
  "shopName": "My Shop",
  "lastSyncAt": "2024-09-06T10:00:00Z"
}
```

### List Marketplace Connections

```typescript
export async function listMarketplaceConnections() {
  // Returns: All user's marketplace connections
}
```

### Disconnect Marketplace

```typescript
export async function disconnectMarketplace(marketplace: string) {
  // Returns: { success: true }
}
```

### Publish Listing (V2)

Send listing to marketplace and publish.

```typescript
type PublishListingInput = {
  listingId: string;
  marketplace: string;
  publish: boolean;  // true = publish immediately, false = save as draft
};

export async function publishListing(input: PublishListingInput) {
  // Returns: { status: 'publishing', jobId, platformListingId? }
}
```

**Response**

```json
{
  "status": "publishing",
  "jobId": "job_ee0e8400-e29b-41d4-a716-446655440009",
  "platformListingId": "shop/123456/product/789012"
}
```

---

## 9. Webhooks (V2)

### Events

```typescript
type WebhookEvent = {
  id: string;
  type: string;
  timestamp: string;
  data: Record<string, unknown>;
};

// Event types:
// - product.created
// - product.analyzed
// - listing.generated
// - listing.qa_passed
// - listing.qa_failed
// - listing.published
// - listing.publish_failed
// - images.generated
// - export.created
// - subscription.changed
// - marketplace.sync_completed
```

### Endpoint Configuration

```bash
POST /api/webhooks

{
  "url": "https://your-app.com/webhooks/listingko",
  "events": ["listing.published", "listing.publish_failed"]
}
```

### Webhook Payload

```json
{
  "id": "webhook_ff0e8400-e29b-41d4-a716-446655440010",
  "type": "listing.published",
  "timestamp": "2024-09-06T10:30:00Z",
  "data": {
    "listingId": "770e8400-e29b-41d4-a716-446655440002",
    "productId": "550e8400-e29b-41d4-a716-446655440000",
    "platform": "shopee",
    "platformListingId": "shop/123456/product/789012",
    "status": "live"
  }
}
```

---

## 10. Rate Limiting

Rate limits are applied per user:

```
Free tier:    100 requests/hour
Paid tier:    1000 requests/hour
```

Expensive operations have lower limits:

```
generateListing:    10/hour
generateImages:     5/hour
analyzeProduct:     50/hour
```

Rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1694000000
```

---

## 11. Error Responses

### Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "title": ["Title is required", "Title must be less than 500 characters"],
      "category": ["Invalid category"]
    }
  }
}
```

### Authorization Error

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this resource"
  }
}
```

### Rate Limit Error

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Try again in 60 seconds.",
    "retryAfter": 60
  }
}
```

### AI Provider Error

```json
{
  "success": false,
  "error": {
    "code": "AI_ERROR",
    "message": "Failed to analyze product",
    "details": {
      "provider": "anthropic",
      "originalError": "Rate limit exceeded"
    }
  }
}
```

---

## 12. Type Definitions

```typescript
// Shared types for API contracts

type Product = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  status: 'DRAFT' | 'ANALYZING' | 'READY' | 'PUBLISHED';
  createdAt: string;
  updatedAt: string;
};

type ProductMaster = {
  id: string;
  productId: string;
  name: string;
  description: string;
  strengths: string[];
  targetCustomer: string;
  useCases: string[];
  sku: string;
  keywords: string[];
  seoScore: number;
  confidenceScore: number;
  specifications?: Record<string, unknown>;
};

type Listing = {
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

type QAResult = {
  id: string;
  factAccuracy: number;
  seoQuality: number;
  platformFit: number;
  readability: number;
  claimSafety: number;
  totalScore: number;
  passed: boolean;
  issues: Record<string, string[]>;
};

type Image = {
  id: string;
  productId: string;
  type: 'USER_UPLOAD' | 'AI_GENERATED';
  urlOriginal: string;
  urlThumbnail?: string;
  urlMedium?: string;
  urlLarge?: string;
  width: number;
  height: number;
  purposes?: string[];
};

type Subscription = {
  id: string;
  plan: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
  status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE';
  entitlements: Entitlements;
};

type Entitlements = {
  productsPerMonth: number;
  imagesPerProduct: number;
  aiGenerationsPerMonth: number;
  marketplaceIntegrations: boolean;
  bulkOperations: boolean;
  directPublishing: boolean;
};
```

---

