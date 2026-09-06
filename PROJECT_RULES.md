# ListingKo — Project Engineering Rules

> Detailed engineering rules and patterns for ListingKo development.

---

## 1. Code Organization

### Directory Structure

```
listingko/
├── apps/
│   ├── web/                    # Next.js web app
│   │   ├── src/
│   │   │   ├── app/           # Next.js app router
│   │   │   ├── components/    # React components
│   │   │   ├── lib/           # Utilities, helpers
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   ├── types/         # TypeScript types
│   │   │   └── styles/        # Global styles
│   │   └── package.json
│   ├── mobile/                 # React Native + Expo
│   │   ├── src/
│   │   │   ├── screens/       # Screen components
│   │   │   ├── components/    # Reusable components
│   │   │   ├── lib/           # Utilities
│   │   │   ├── hooks/         # Custom hooks
│   │   │   ├── types/         # TypeScript types
│   │   │   └── navigation/    # Navigation config
│   │   └── app.json           # Expo config
│   └── api/                    # Backend (Next.js API routes + actions)
│       ├── src/
│       │   ├── app/           # API routes & server actions
│       │   ├── services/      # Business logic
│       │   ├── lib/           # Database, utilities
│       │   ├── types/         # Types
│       │   └── middleware/    # Auth, logging, etc.
│       └── package.json
├── packages/
│   ├── shared-types/          # Shared TypeScript types
│   └── shared-utils/          # Shared utilities
├── docs/
│   ├── architecture/
│   ├── database/
│   └── api/
├── plan.md
├── CLAUDE.md
├── PROJECT_RULES.md
├── ARCHITECTURE.md
├── DATABASE.md
├── API.md
├── AI_PROMPTS.md
└── package.json               # Monorepo root
```

### Naming Conventions

- **Components:** PascalCase (`ProductForm.tsx`, `ListingCard.tsx`)
- **Hooks:** camelCase, prefix with `use` (`useProductMaster`, `useImageFactory`)
- **Utilities:** camelCase (`formatListingTitle`, `validateSKU`)
- **Types/Interfaces:** PascalCase (`ProductMaster`, `ListingQAScore`)
- **Database tables:** snake_case (`products`, `listings`, `qa_results`)
- **Database columns:** snake_case (`created_at`, `user_id`)
- **Enums:** PascalCase values (`ProductStatus.DRAFT`)
- **Constants:** SCREAMING_SNAKE_CASE (`MAX_FREE_PRODUCTS`, `IMAGE_SIZE_LIMIT`)

---

## 2. TypeScript Standards

### Type Safety

- ✅ Strict mode enabled (`"strict": true`)
- ✅ All functions have explicit return types
- ✅ No `any` without `@ts-ignore` comment explaining why
- ✅ Discriminated unions for state machines
- ✅ `const` assertions for literal types where appropriate

### Type Organization

```typescript
// Good: Separate concerns, clear names
type ProductMasterInput = {
  name: string;
  description: string;
  // ...
};

type ProductMasterOutput = ProductMasterInput & {
  id: string;
  createdAt: Date;
  strengths: string[];
};

// Avoid: Mixed concerns
type Product = {
  id?: string;
  name: string;
  // unclear if input or output
};
```

---

## 3. API & Server Actions

### Server Actions vs Route Handlers

| Use Case | Pattern |
|----------|---------|
| Form submission | Server Action |
| File upload | Route Handler |
| Webhook | Route Handler |
| Real-time data | Route Handler with streaming |
| Simple data mutation | Server Action |
| Authorization enforcement | Both (wrap in middleware) |

### Server Action Template

```typescript
'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const schema = z.object({
  // validation
});

export async function createProduct(input: unknown) {
  const user = await auth();
  if (!user) throw new Error('Unauthorized');

  const data = schema.parse(input);
  
  // Business logic here
  const product = await db.products.create({
    ...data,
    userId: user.id, // Always include tenant/user ID
  });

  return product;
}
```

### Authorization Pattern

```typescript
// Every user-owned resource must verify ownership server-side
async function getUserProduct(productId: string, userId: string) {
  const product = await db.products.findFirst({
    where: {
      id: productId,
      userId: userId, // Never trust client-provided user ID
    },
  });

  if (!product) throw new Error('Not found or unauthorized');
  return product;
}
```

---

## 4. Database Patterns

### Migrations

- Use Supabase CLI for migrations
- One migration per logical change
- Migration naming: `[timestamp]_[description].sql`
- Always include rollback capability
- Test migrations locally before production

### Query Patterns

```typescript
// Good: Explicit selection, proper filtering
const product = await db.products.findFirst({
  where: {
    id: productId,
    userId: userId, // Tenant isolation
  },
  select: {
    id: true,
    title: true,
    productMaster: true,
    listings: {
      where: { deleted: false },
    },
  },
});

// Avoid: SELECT *, unbounded queries, missing tenant checks
const products = await db.products.findMany();
```

### Soft Deletes

Use `deleted_at` timestamp for user-visible deletions, not hard deletes.

```sql
-- Migrate to soft delete
ALTER TABLE products ADD COLUMN deleted_at TIMESTAMP;

-- Query pattern
SELECT * FROM products WHERE deleted_at IS NULL AND user_id = $1;
```

---

## 5. AI Integration

### Provider Interface

AI providers must be behind an interface to allow replacement.

```typescript
// lib/ai/types.ts
export interface AIProvider {
  analyzeProduct(input: ProductAnalysisInput): Promise<ProductMasterOutput>;
  generateListing(input: ListingGenerationInput): Promise<ListingOutput>;
  generateImages(input: ImageGenerationInput): Promise<ImageOutput[]>;
  scoreQA(input: QAScoringInput): Promise<QAScore>;
}

// lib/ai/anthropic.ts
export class AnthropicProvider implements AIProvider {
  async analyzeProduct(input: ProductAnalysisInput) {
    // Implementation
  }
}

// lib/ai/index.ts
export const ai: AIProvider = new AnthropicProvider();
```

### Output Validation

All AI outputs must be schema-validated before persisting.

```typescript
import { z } from 'zod';

const ProductMasterSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  strengths: z.array(z.string()).min(1),
  targetCustomer: z.string(),
  sku: z.string(),
  // ... other fields
});

async function analyzeProduct(input: ProductAnalysisInput) {
  const aiOutput = await ai.analyzeProduct(input);
  
  // Validate before storing
  const validated = ProductMasterSchema.parse(aiOutput);
  
  return validated;
}
```

### Prompts

Keep prompts modular and versioned. See `AI_PROMPTS.md` for all prompts.

```typescript
// lib/ai/prompts.ts
export const PROMPTS = {
  PRODUCT_ANALYSIS_V1: `...`,
  PRODUCT_ANALYSIS_V2: `...`, // Next version
  LISTING_GENERATION_V1: `...`,
};

// Usage
const prompt = PROMPTS.PRODUCT_ANALYSIS_V1;
const response = await ai.generateCompletion(prompt, input);
```

---

## 6. State Management

### Zustand Store Template

```typescript
import { create } from 'zustand';

type ProductStore = {
  product: Product | null;
  loading: boolean;
  error: string | null;
  fetchProduct: (id: string) => Promise<void>;
};

export const useProductStore = create<ProductStore>((set) => ({
  product: null,
  loading: false,
  error: null,
  fetchProduct: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const product = await fetchProductAction(id);
      set({ product });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      set({ loading: false });
    }
  },
}));
```

### When to Use Zustand

- ✅ Cross-component UI state (filters, modals, sidebar)
- ✅ Temporary form data before submission
- ❌ Server data (use React Query or SWR instead)
- ❌ Authentication state (use Supabase Auth context)

---

## 7. Form Handling

### React Hook Form + Zod

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1, 'Title required').max(200),
  sku: z.string().min(1),
  category: z.enum(['ELECTRONICS', 'FASHION', 'HOME']),
});

type FormData = z.infer<typeof schema>;

export function ProductForm() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await createProductAction(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* form fields */}
    </form>
  );
}
```

---

## 8. Component Patterns

### Page Components (Next.js)

```typescript
// app/products/[id]/page.tsx
import { notFound } from 'next/navigation';
import { ProductDetail } from '@/components/ProductDetail';
import { getUserProduct } from '@/lib/db';

type Props = {
  params: { id: string };
};

export default async function ProductPage({ params }: Props) {
  const product = await getUserProduct(params.id);
  
  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} />;
}
```

### Client Components with Loading States

```typescript
'use client';

import { useState } from 'react';

type State = 'idle' | 'loading' | 'success' | 'error';

export function CreateProductForm() {
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setState('loading');
    try {
      await createProductAction(formData);
      setState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setState('error');
    }
  };

  if (state === 'loading') return <div>Creating...</div>;
  if (state === 'error') return <div className="text-red-600">{error}</div>;
  if (state === 'success') return <div>Product created!</div>;

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

---

## 9. Error Handling

### Error Types

```typescript
// lib/errors.ts
export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ValidationError extends Error {
  constructor(public details: Record<string, string[]>) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}
```

### Error Boundaries

```typescript
'use client';

import { ReactNode } from 'react';

export function ErrorBoundary({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback: (error: Error, reset: () => void) => ReactNode;
}) {
  // Implementation using React Error Boundary
  return children;
}
```

---

## 10. Testing Strategy

### Unit Tests (Business Logic)

```typescript
// lib/productMaster.test.ts
import { describe, it, expect } from 'vitest';
import { validateProductMaster } from './productMaster';

describe('productMaster', () => {
  it('should reject empty strengths array', () => {
    expect(() =>
      validateProductMaster({ name: 'Test', strengths: [] })
    ).toThrow();
  });

  it('should allow valid product master', () => {
    const valid = {
      name: 'Test Product',
      description: 'A test product',
      strengths: ['Durable', 'Affordable'],
      targetCustomer: 'Young professionals',
      sku: 'TEST-001',
    };
    expect(() => validateProductMaster(valid)).not.toThrow();
  });
});
```

### Integration Tests

```typescript
// lib/db.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './db';

describe('Product Database', () => {
  beforeEach(async () => {
    // Setup test database
  });

  it('should create and retrieve a product', async () => {
    const product = await db.products.create({
      userId: 'test-user',
      title: 'Test',
      // ...
    });

    const retrieved = await db.products.findUnique({ id: product.id });
    expect(retrieved).toMatchObject({ title: 'Test' });
  });
});
```

### E2E Tests (Playwright)

```typescript
// e2e/product-creation.spec.ts
import { test, expect } from '@playwright/test';

test('user can create a product', async ({ page }) => {
  await page.goto('/dashboard');
  await page.click('text=New Product');
  await page.fill('input[name="title"]', 'Test Product');
  await page.click('button:has-text("Create")');
  await expect(page).toHaveURL(/\/products\/\d+/);
});
```

---

## 11. Performance Guidelines

### Image Optimization

```typescript
import Image from 'next/image';

// Good: Explicit dimensions, lazy loading
<Image
  src={product.image}
  alt={product.name}
  width={400}
  height={400}
  loading="lazy"
  priority={false}
/>

// Avoid: No dimensions
<img src={product.image} alt={product.name} />
```

### Query Optimization

```typescript
// Good: Specific selection, indexed queries
const products = await db.products.findMany({
  where: { userId, status: 'ACTIVE' },
  select: { id: true, title: true },
  take: 50,
});

// Avoid: N+1 queries
const products = await db.products.findMany({ where: { userId } });
products.forEach(p => {
  // Each product triggers a new query
  const listings = await db.listings.findMany({ where: { productId: p.id } });
});
```

### Bundle Size

- Monitor bundle size in CI/CD
- Lazy-load heavy components
- Code-split route-based features
- Avoid importing entire libraries when you only need one function

---

## 12. Versioning & Compatibility

### Backward Compatibility

- Never break existing API contracts without a deprecation period
- Use versioned endpoints if major changes are needed (`/api/v1/`, `/api/v2/`)
- Mark deprecated fields as `@deprecated` in comments

### Database Migrations

- Always provide migration rollback
- Never make destructive changes in production without backup
- Test migrations on production-like data volumes

---

## 13. Security Best Practices

### Input Validation

```typescript
// Always validate at system boundaries
import { z } from 'zod';

export async function createProduct(formData: FormData) {
  const schema = z.object({
    title: z.string().min(1).max(500),
    price: z.number().positive(),
  });

  const data = schema.parse(Object.fromEntries(formData));
  // Safe to use `data` now
}
```

### Secrets Management

- Never commit `.env.local`
- Use Supabase/Vercel environment variables
- Rotate secrets regularly
- Use separate credentials for dev/staging/production

### Rate Limiting

```typescript
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'),
});

export async function expensiveAIOperation(userId: string) {
  const { success } = await ratelimit.limit(userId);
  if (!success) throw new Error('Rate limit exceeded');
  
  // Proceed with AI operation
}
```

---

## 14. Monitoring & Logging

### Error Tracking

```typescript
import * as Sentry from '@sentry/nextjs';

try {
  await expensiveOperation();
} catch (error) {
  Sentry.captureException(error, {
    tags: { userId, operation: 'ai_generation' },
  });
  throw error;
}
```

### Structured Logging

```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, context: Record<string, unknown>) => {
    console.log(JSON.stringify({ level: 'INFO', message, ...context }));
  },
  error: (message: string, error: Error, context: Record<string, unknown>) => {
    console.error(JSON.stringify({ 
      level: 'ERROR', 
      message, 
      error: error.message, 
      ...context 
    }));
  },
};
```

---

## 15. Git & Code Review

### Commit Message Format

```
[scope] Brief description

Longer explanation if needed.

Fixes #123
```

Examples:
- `[api] Create product endpoint for mobile app`
- `[web] Fix alignment bug in listing card`
- `[db] Add index to products.user_id for performance`

### Pull Request Template

```markdown
## Description
What does this PR do?

## Changes
- [ ] Web app
- [ ] Mobile app
- [ ] Backend
- [ ] Database
- [ ] Docs

## Testing
How was this tested?

## Security
Any security implications?
```

---

## 16. Definition of Done Checklist

Before marking a feature complete:

- [ ] Code implemented and reviewed
- [ ] Types are correct (TypeScript strict mode)
- [ ] Validation added (client + server)
- [ ] Loading state implemented
- [ ] Empty state implemented
- [ ] Error state implemented
- [ ] Authorization checked server-side
- [ ] AI output validated if applicable
- [ ] Tests written for business logic
- [ ] Database migrations tested
- [ ] Performance checked (no N+1 queries, bundle size OK)
- [ ] Security reviewed (no XSS, SQL injection, auth bypass)
- [ ] UI verified in web + mobile (if applicable)
- [ ] Analytics events considered
- [ ] Documentation updated
- [ ] No secrets in code/commits

---

## 17. Troubleshooting Common Issues

### Type Errors in Build
- Run `tsc --noEmit` to check without emitting
- Check `tsconfig.json` strict settings
- Use `as const` for literal type assertions only

### Database Connection Issues
- Verify Supabase URL and API key
- Check network access from deployment
- Review Row Level Security policies

### Build Size Blowup
- Run `npm run build` and check `.next/` size
- Use `npm run analyze` if available
- Identify heavy dependencies with `npm ls`

### AI Cost Overruns
- Add rate limiting to expensive operations
- Use cheaper models for simple tasks
- Cache stable outputs (prompt results)

---

