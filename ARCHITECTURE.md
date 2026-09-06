# ListingKo — Technical Architecture

> System design, data flow, and integration patterns.

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Clients                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────┐      ┌─────────────────────┐   │
│  │   Web App        │      │   Mobile App        │   │
│  │ (Next.js+React)  │      │ (React Native+Expo) │   │
│  └────────┬─────────┘      └──────────┬──────────┘   │
│           │                           │               │
│           └───────────────┬───────────┘               │
│                           │                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │           API Gateway / Authentication           │  │
│  │  (Supabase Auth, CORS, Rate Limiting)           │  │
│  └─────────────────────────────────────────────────┘  │
│                           │                           │
├─────────────────────────────────────────────────────────┤
│                   Shared Backend                       │
│                  (Next.js API Routes)                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │   Products   │  │   Listings   │  │   Images   │  │
│  │   Service    │  │   Service    │  │  Service   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬─────┘  │
│         │                 │                 │         │
│  ┌──────┴─────────────────┴─────────────────┴──────┐ │
│  │          Business Logic Layer                   │ │
│  ├─────────────────────────────────────────────────┤ │
│  │ • Product Master                               │ │
│  │ • Listing Generation                           │ │
│  │ • Image Factory                                │ │
│  │ • QA & Auto-Repair                             │ │
│  │ • Usage Tracking / Entitlements                │ │
│  │ • Marketplace Adapters (V2)                    │ │
│  └─────────────────────────────────────────────────┘ │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │   AI Layer   │  │  Background  │  │   Storage  │  │
│  │ (Providers)  │  │   Jobs       │  │  (S3/Blob) │  │
│  │ • Analysis   │  │ (Trigger.dev)│  │  (Supabase)│  │
│  │ • Generation │  │              │  │            │  │
│  │ • Images     │  │ • Async work │  │ • Products │  │
│  │ • QA         │  │ • Webhooks   │  │ • Listings │  │
│  │              │  │ • Cleanup    │  │ • Images   │  │
│  └──────────────┘  └──────────────┘  └────────────┘  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                   Data Layer                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────────────────────────────────────┐   │
│  │       PostgreSQL (via Supabase)                │   │
│  │                                                 │   │
│  │ • users                                        │   │
│  │ • products                                     │   │
│  │ • product_masters                              │   │
│  │ • listings                                     │   │
│  │ • images                                       │   │
│  │ • qa_results                                   │   │
│  │ • usage_tracking                               │   │
│  │ • subscriptions                                │   │
│  │ • marketplace_connections (V2)                 │   │
│  └───────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Data Flow: Product Creation to Export

### Phase 1: Product Input

```
User Input
├── Product photos (upload)
├── Product name
├── Basic description
├── Category
└── Any known specifications
        │
        ↓
Input Validation
├── File type/size check
├── Schema validation
└── Virus scan (optional)
        │
        ↓
Stored in Temporary State
(products.raw_input)
```

### Phase 2: AI Product Analysis

```
Raw Product Input
        │
        ↓
AI Analysis Request
├── Photos (to vision API)
├── Text (to analysis API)
└── Category context
        │
        ↓
AI Output
├── Product name (refined)
├── Description (detailed)
├── Key features/strengths
├── Target customer
├── Use cases
├── Potential specifications
└── Confidence scores
        │
        ↓
Schema Validation
├── Required fields present
├── No unsupported claims
└── Fact checking against known data
        │
        ↓
Stored as Product Master
(product_masters table)
```

### Phase 3: Content Generation

```
Product Master (Source of Truth)
        │
        ├─→ SEO Analysis
        │   ├── Keywords
        │   ├── Search intent
        │   └── Optimization tips
        │
        ├─→ Strengths/Benefits
        │   ├── Top 5 features
        │   ├── Unique selling points
        │   └── Differentiators
        │
        ├─→ Shopee Listing
        │   ├── Title (60 chars)
        │   ├── Description (with formatting)
        │   └── Category attributes
        │
        ├─→ Lazada Listing
        │   ├── Title (255 chars)
        │   ├── Description
        │   └── Specification sheet
        │
        ├─→ TikTok Shop Listing
        │   ├── Short title
        │   ├── Hook
        │   └── Description (viral angle)
        │
        └─→ Facebook Content
            ├── Post copy
            ├── Ad copy
            └── Hashtags
                │
                ↓
All Stored as Listings
(listings table)
```

### Phase 4: Image Factory

```
Original Product Photos
+ Product Master
        │
        ├─→ Hero Image (Product showcase)
        ├─→ Feature Image (Key features)
        ├─→ Benefits Image (Use cases)
        ├─→ Specification Image (Details)
        ├─→ Lifestyle Image (Product in use)
        ├─→ Social Media Tile (Square, vibrant)
        └─→ Promotional Image (Deal/offer)
            │
            ↓
Each Stored as Image Record
(images table)
With platform-specific metadata
```

### Phase 5: QA & Validation

```
Generated Listing
        │
        ↓
AI QA Scoring
├── Fact Accuracy (100%)
├── SEO Quality (91%)
├── Platform Fit (94%)
├── Readability (96%)
└── Claim Safety (98%)
        │
        ├─ If ALL ≥ 85% → PASS
        │
        └─ If ANY < 85% → Auto-Repair
                │
                ↓
        AI Repair (using Product Master)
        ├── Remove unsupported claims
        ├── Improve SEO
        ├── Fix platform requirements
        └── Enhance readability
                │
                ↓
        Re-score QA
        └─ If PASS → Store result
           └─ If FAIL → Manual review needed
```

### Phase 6: Export Package

```
All Generated Content
├── Product Master (JSON)
├── All Listings (per platform)
├── All Images (per format)
├── QA Results
├── SKU
└── SEO Keywords
        │
        ↓
Export Formats
├── PDF (printable summary)
├── ZIP (all assets)
├── CSV (for spreadsheet import)
└── JSON (structured data)
        │
        ↓
Available for Download
```

---

## 3. API Architecture

### Server Actions (Preferred)

```typescript
// Recommended for:
// - Form submissions
// - Simple data mutations
// - Progressive enhancement
// - Automatic request deduplication

'use server';

export async function createProduct(formData: FormData) {
  // 1. Authentication
  const user = await auth();
  if (!user) throw new UnauthorizedError();

  // 2. Validation
  const data = ProductSchema.parse(Object.fromEntries(formData));

  // 3. Authorization
  // (implicit: we know the user ID)

  // 4. Business logic
  const product = await db.products.create({
    ...data,
    userId: user.id,
  });

  // 5. Queue background jobs if needed
  // await queue.analyze(product.id);

  return product;
}
```

### Route Handlers (File Upload, Webhooks)

```typescript
// app/api/products/[id]/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await auth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify ownership
  const product = await getUserProduct(params.id, user.id);

  const file = await request.formData();
  const imageFile = file.get('image') as File;

  // Validate file
  if (!isValidImageFile(imageFile)) {
    return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
  }

  // Upload
  const url = await uploadImage(imageFile);

  // Store reference
  await db.images.create({
    productId: product.id,
    url,
    type: 'USER_UPLOAD',
  });

  return NextResponse.json({ url });
}
```

### API Versioning (V2+)

When breaking changes are necessary:

```
/api/v1/products       ← Stable, old behavior
/api/v2/products       ← New behavior, breaking changes

Client specifies version in header or URL.
```

---

## 4. Database Design Principles

### Tenant Isolation

Every important table includes `user_id` (or workspace_id for V2):

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, id)  -- Implicit tenant isolation
);

-- Query pattern: Always filter by user_id
SELECT * FROM products WHERE id = $1 AND user_id = $2;
```

### Soft Deletes

```sql
ALTER TABLE products ADD COLUMN deleted_at TIMESTAMP;

-- Query: exclude deleted
SELECT * FROM products 
WHERE user_id = $1 AND deleted_at IS NULL;

-- Restore: update deleted_at to NULL
UPDATE products SET deleted_at = NULL WHERE id = $1 AND user_id = $2;
```

### Audit Trail (Optional)

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  resource_type TEXT,  -- 'product', 'listing', etc.
  resource_id UUID,
  action TEXT,         -- 'create', 'update', 'delete'
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes

```sql
-- Speed up common queries
CREATE INDEX idx_products_user_id ON products(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_listings_product_id ON listings(product_id);
CREATE INDEX idx_usage_user_id ON usage_tracking(user_id, period);
```

---

## 5. Authentication & Authorization

### Supabase Auth Flow

```
┌──────────────────────────────────────────────┐
│ User                                         │
│ ├─ Email                                    │
│ └─ Password                                 │
└──────────────┬───────────────────────────────┘
               │
               ↓
    ┌──────────────────────┐
    │  Supabase Auth UI    │
    │ (or custom form)     │
    └──────────┬───────────┘
               │
         ┌─────┴─────┐
         │           │
         ↓           ↓
      Sign Up     Sign In
         │           │
         └─────┬─────┘
               │
               ↓
    ┌──────────────────────┐
    │ Supabase Auth        │
    │ ├─ Hash password     │
    │ ├─ Create session    │
    │ └─ Issue JWT token   │
    └──────────┬───────────┘
               │
               ↓
    ┌──────────────────────┐
    │ Store in Cookie      │
    │ (auto by Supabase)   │
    └──────────┬───────────┘
               │
               ↓
    ┌──────────────────────┐
    │ On each request:     │
    │ Verify JWT + RLS     │
    └──────────────────────┘
```

### Authorization Patterns

```typescript
// Get authenticated user
const user = await auth();
if (!user) throw new UnauthorizedError();

// Verify resource ownership (server-side)
async function getUserProduct(productId: string, userId: string) {
  const product = await db.products.findFirst({
    where: {
      id: productId,
      userId: userId, // Always verify ownership
    },
  });
  
  if (!product) throw new NotFoundError();
  return product;
}

// Check entitlements (usage limits)
async function checkEntitlements(userId: string) {
  const subscription = await db.subscriptions.findUnique({
    where: { userId },
  });
  
  const usage = await db.usageTracking.aggregate({
    where: { userId, period: 'CURRENT_MONTH' },
    _sum: { count: true },
  });

  const limit = subscription?.plan === 'FREE' ? 10 : 1000;
  if ((usage._sum.count || 0) >= limit) {
    throw new Error('Usage limit exceeded');
  }
}
```

---

## 6. AI Integration Architecture

### Provider Interface

```typescript
// lib/ai/types.ts
export interface AIProvider {
  analyzeProduct(input: {
    images: Buffer[];
    name?: string;
    description?: string;
    category?: string;
  }): Promise<ProductAnalysisOutput>;

  generateListing(input: {
    productMaster: ProductMaster;
    platform: 'shopee' | 'lazada' | 'tiktok' | 'facebook';
  }): Promise<ListingOutput>;

  generateImages(input: {
    productMaster: ProductMaster;
    referenceImages: Buffer[];
    types: ('hero' | 'features' | 'lifestyle' | 'social')[];
  }): Promise<ImageOutput[]>;

  scoreQA(input: {
    listing: ListingOutput;
    productMaster: ProductMaster;
  }): Promise<QAScore>;

  repairListing(input: {
    listing: ListingOutput;
    issues: string[];
    productMaster: ProductMaster;
  }): Promise<ListingOutput>;
}
```

### Provider Implementation

```typescript
// lib/ai/anthropic.ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export class AnthropicProvider implements AIProvider {
  async analyzeProduct(input) {
    // Convert images to base64
    const imageBase64 = input.images.map(img => 
      img.toString('base64')
    );

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: imageBase64[0],
            },
          },
          {
            type: 'text',
            text: PROMPTS.PRODUCT_ANALYSIS_V1,
          },
        ],
      }],
    });

    // Parse and return structured output
    return parseAnalysisOutput(response);
  }
}
```

### Prompt Management

See `AI_PROMPTS.md` for all prompts. Each prompt is:

- Versioned (`_V1`, `_V2`)
- Modular
- Documented with examples
- Evaluated with test cases

```typescript
// lib/ai/prompts.ts
export const PROMPTS = {
  PRODUCT_ANALYSIS_V1: `You are an ecommerce product analyst...`,
  LISTING_GENERATION_SHOPEE_V1: `Generate a Shopee listing...`,
  // etc.
};
```

---

## 7. Background Jobs & Async Work

### Job Queue (Trigger.dev)

Heavy operations run asynchronously:

```typescript
// lib/jobs.ts
import { trigger } from '@trigger.dev/sdk';

export const analyzeProductJob = trigger.defineJob({
  id: 'analyze-product',
  name: 'Analyze Product',
  version: '1.0.0',
  trigger: trigger.on.custom({ event: 'analyze' }),
  run: async (payload: { productId: string; userId: string }) => {
    const product = await db.products.findUnique({
      where: { id: payload.productId },
    });

    // Perform expensive AI analysis
    const analysis = await ai.analyzeProduct({
      images: product.images,
      name: product.title,
    });

    // Store result
    await db.productMasters.create({
      productId: product.id,
      data: analysis,
    });

    // Notify user
    await notify.send(payload.userId, {
      type: 'ANALYSIS_COMPLETE',
      productId: payload.productId,
    });
  },
});
```

### Job Triggering

```typescript
// app/api/products/[id]/analyze/route.ts
'use server';

export async function triggerAnalysis(productId: string) {
  const user = await auth();
  const product = await getUserProduct(productId, user.id);

  // Check entitlements
  await checkEntitlements(user.id);

  // Trigger background job
  await analyzeProductJob.trigger({
    productId,
    userId: user.id,
  });

  // Update product status
  await db.products.update({
    where: { id: productId },
    data: { status: 'ANALYZING' },
  });

  return { status: 'analyzing' };
}
```

---

## 8. Image Storage & Processing

### Upload Flow

```
User selects image
        │
        ↓
Client-side validation
├── File type (jpg, png, webp)
├── File size (< 10MB)
└── Dimensions (≥ 400x400)
        │
        ↓
Upload to Supabase Storage
├── Path: products/{userId}/{productId}/{filename}
└── Public URL generated
        │
        ↓
Process with Sharp
├── Optimize (compress)
├── Resize to standard sizes
│   ├── Thumbnail (200x200)
│   ├── Medium (400x400)
│   └── Large (800x800)
└── Store processed versions
        │
        ↓
Store metadata in DB
(images table)
```

### Image Processing

```typescript
// lib/images/process.ts
import sharp from 'sharp';

export async function processProductImage(buffer: Buffer) {
  const sizes = [
    { name: 'thumbnail', width: 200, height: 200 },
    { name: 'medium', width: 400, height: 400 },
    { name: 'large', width: 800, height: 800 },
  ];

  const results = await Promise.all(
    sizes.map(async (size) => {
      const resized = await sharp(buffer)
        .resize(size.width, size.height, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: 80 })
        .toBuffer();

      return {
        size: size.name,
        buffer: resized,
      };
    })
  );

  return results;
}
```

---

## 9. Marketplace Integration (V2)

### Channel Abstraction

```typescript
// services/channels/types.ts
export interface ChannelAdapter {
  // Configuration
  connect(credentials: ChannelCredentials): Promise<void>;
  disconnect(): Promise<void>;

  // Listing operations
  generateListing(product: Product): Promise<ChannelListing>;
  validateListing(listing: ChannelListing): Promise<ValidationResult>;
  publishListing(listing: ChannelListing): Promise<PublishResult>;
  updateListing(listingId: string, updates: Partial<ChannelListing>): Promise<void>;
  getListing(listingId: string): Promise<ChannelListing>;

  // Inventory
  syncInventory(inventory: InventoryData): Promise<void>;
  getInventory(listingId: string): Promise<InventoryData>;

  // Orders
  getOrders(filters?: OrderFilters): Promise<Order[]>;
  updateOrderStatus(orderId: string, status: string): Promise<void>;
}
```

### Channel Implementations

```typescript
// services/channels/shopee.ts
export class ShopeeAdapter implements ChannelAdapter {
  private client: ShopeeAPIClient;

  async connect(credentials: ShopeeCredentials) {
    // OAuth flow or API key setup
    this.client = new ShopeeAPIClient(credentials);
  }

  async publishListing(listing: ChannelListing) {
    const response = await this.client.post('/api/v2/product/add', {
      name: listing.title,
      description: listing.description,
      images: listing.images,
      price: listing.price,
      // ... other Shopee-specific fields
    });

    return {
      success: response.error === null,
      listingId: response.data?.product_id,
      error: response.error?.message,
    };
  }

  // ... other methods
}
```

---

## 10. Monitoring & Error Tracking

### Sentry Integration

```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  debug: process.env.NODE_ENV === 'development',
});

export function captureError(error: Error, context: Record<string, unknown>) {
  Sentry.captureException(error, {
    tags: {
      service: context.service as string,
    },
    extra: context,
  });
}
```

### Structured Logging

```typescript
// lib/logger.ts
export const logger = {
  info(message: string, data: Record<string, unknown>) {
    console.log(JSON.stringify({ level: 'INFO', timestamp: new Date().toISOString(), message, ...data }));
  },

  error(message: string, error: Error, data: Record<string, unknown>) {
    console.error(JSON.stringify({
      level: 'ERROR',
      timestamp: new Date().toISOString(),
      message,
      error: error.message,
      stack: error.stack,
      ...data,
    }));
  },
};
```

---

## 11. Scalability & Performance

### Caching Strategy

```typescript
// lib/cache.ts
import { unstable_cache } from 'next/cache';

// Cache product master (revalidate every 1 hour)
export const getCachedProductMaster = unstable_cache(
  async (productId: string) => {
    return db.productMasters.findUnique({
      where: { productId },
    });
  },
  ['productMaster'],
  { revalidate: 3600 }
);
```

### Database Query Optimization

```typescript
// Good: Specific selection, indexed queries
const products = await db.products.findMany({
  where: {
    userId: user.id,
    status: 'ACTIVE',
    deletedAt: null,
  },
  select: {
    id: true,
    title: true,
    createdAt: true,
  },
  take: 50,
  orderBy: { createdAt: 'desc' },
});

// Bad: SELECT *, N+1 queries
const products = await db.products.findMany({ where: { userId } });
for (const product of products) {
  product.master = await db.productMasters.findUnique({
    where: { productId: product.id },
  });
}
```

---

## 12. Deployment Architecture

### Environment Stages

```
Development
├── Local PostgreSQL
├── Local Supabase emulator
└── Development API keys

Staging
├── Staging PostgreSQL (separate)
├── Staging Supabase project
└── Staging API keys

Production
├── Production PostgreSQL (RLS enabled)
├── Production Supabase project
├── Production secrets (Vercel env)
├── Monitoring + alerts
└── Backup strategy
```

### CI/CD Pipeline

```
Git Push
  │
  ├─→ Lint (ESLint)
  ├─→ Type Check (TypeScript)
  ├─→ Tests (Vitest, Playwright)
  ├─→ Security Scan (Snyk)
  │
  └─→ Build
      ├─→ Web app (Next.js)
      ├─→ Mobile app (Expo EAS)
      └─→ Deploy to Vercel / App Stores
```

---

