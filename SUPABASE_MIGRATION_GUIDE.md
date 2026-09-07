# Supabase Edge Functions Migration Guide

## Status: Phase 2 COMPLETE - Core + QA + Export Endpoints ✅✅

We've successfully migrated from Next.js API routes to Supabase Edge Functions for **Option B (Zero-Cost MVP)**.

### ✅ Phase 1 - Completed (Core Product Workflow)
- ✅ `/supabase/functions/products/index.ts` - GET/POST products
- ✅ `/supabase/functions/products-detail/index.ts` - GET/PATCH/DELETE individual products
- ✅ `/supabase/functions/analyze/index.ts` - POST analyze product
- ✅ `/supabase/functions/listings/index.ts` - GET/POST listings

### ✅ Phase 2 - COMPLETE (QA + Export + Marketplace)
- ✅ `/supabase/functions/qa-results/index.ts` - GET/POST QA scoring
- ✅ `/supabase/functions/export/index.ts` - POST export (JSON/CSV formats)
- ✅ `/supabase/functions/marketplace-connections/index.ts` - GET/POST marketplace connections
- ✅ `/supabase/functions/marketplace-connections-detail/index.ts` - GET/PUT/DELETE individual connections

### ⏳ Phase 3 (Remaining - OAuth & Images)
- OAuth flows (for Phase 4.1)
- Image upload/generation (for Phase 5)

---

## How to Test Locally

### 1. Install Supabase CLI
```bash
brew install supabase/tap/supabase  # macOS
# or visit https://supabase.com/docs/guides/cli
```

### 2. Start Supabase locally
```bash
cd /Users/rvin.aca/Documents/ListingKo
supabase start
```

This starts:
- PostgreSQL database
- Supabase API
- Auth system
- Local Edge Functions server

### 3. Test Edge Functions locally
```bash
# Terminal 1: Keep supabase running
supabase start

# Terminal 2: In another terminal, test the products endpoint
curl -X GET http://localhost:54321/functions/v1/products \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json"

# Should return: {"success": true, "data": {"items": [], "total": 0}, "error": null}
```

### 4. Local Testing Examples

**Create a product:**
```bash
curl -X POST http://localhost:54321/functions/v1/products \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Product",
    "description": "A test product",
    "category": "Electronics"
  }'
```

**Get product details:**
```bash
curl -X GET http://localhost:54321/functions/v1/products-detail/PRODUCT_ID \
  -H "Authorization: Bearer test-token"
```

**Analyze product:**
```bash
curl -X POST http://localhost:54321/functions/v1/analyze/PRODUCT_ID \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json"
```

**Generate listings:**
```bash
curl -X POST http://localhost:54321/functions/v1/listings \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PRODUCT_ID",
    "platforms": ["shopee", "lazada", "tiktok", "facebook"]
  }'
```

---

## How to Deploy to Production

### 1. Connect Supabase Project
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

### 2. Deploy Edge Functions
```bash
supabase functions deploy products
supabase functions deploy products-detail
supabase functions deploy analyze
supabase functions deploy listings
```

### 3. Set Environment Variables
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set SUPABASE_URL=https://xxx.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 4. Verify Deployment
```bash
curl -X GET https://YOUR_PROJECT.supabase.co/functions/v1/products \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json"
```

---

## Architecture Comparison

### Before (Next.js API Routes on Railway)
```
Frontend (Vercel)
    ↓
Backend (Railway - $30/month)
    ↓
PostgreSQL (Supabase)
```

### After (Supabase Edge Functions - FREE)
```
Frontend (Vercel)
    ↓
Supabase Edge Functions (FREE)
    ↓
PostgreSQL (Supabase)
```

**Key Benefits:**
- No need for Railway ($30/month saved)
- Functions run closer to database (lower latency)
- Auto-scaling built-in
- Managed by Supabase
- Same API endpoints (no frontend changes needed!)

---

## Frontend Updates Required

### Current API Base URL
```typescript
// Currently: http://localhost:3000 or https://listingko-api.railway.app
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
```

### New URL Structure
```typescript
// When deployed:
// Supabase project URL: https://YOUR_PROJECT.supabase.co
// Edge function endpoint: https://YOUR_PROJECT.supabase.co/functions/v1/{function-name}

// Update .env.local:
NEXT_PUBLIC_API_URL=https://YOUR_PROJECT.supabase.co/functions/v1
```

### API Client Example
```typescript
// In apps/web/src/lib/api-client.ts
// No changes needed! Same endpoint structure:
// POST /api/products → POST /functions/v1/products
// GET /api/products/:id → GET /functions/v1/products-detail/:id
```

---

## Rollout Plan

### Phase 1: Core Endpoints (TODAY) ✅
- Products CRUD
- Product analysis
- Listings CRUD

### Phase 2: Next (TOMORROW)
- QA Results
- Export functionality
- Marketplace connections

### Phase 3: OAuth & Images (END OF WEEK)
- OAuth flows
- Image upload/generation
- Marketplace publishing

### Phase 4: Deploy to Production (NEXT WEEK)
- All functions deployed
- Frontend updated
- Full testing
- Supabase project configured

---

## Debugging Edge Functions

### View logs locally
```bash
# Logs appear in terminal where you ran supabase start
supabase functions list
supabase functions logs products
```

### View logs in production
```bash
# Check Supabase dashboard:
# Project → Edge Functions → Logs
```

### Common Issues

**"Missing Supabase credentials"**
- Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- In local dev: Should auto-detect from `supabase start`
- In production: Set via `supabase secrets set`

**"Unauthorized"**
- Auth token is missing or invalid
- All requests need `Authorization: Bearer TOKEN` header
- Dev mode currently accepts any token

**"Function not found"**
- Ensure function is deployed
- Check correct endpoint URL
- Verify function name in URL matches directory name

---

## Remaining Work

### Endpoints to Migrate
```
/api/qa-results
/api/products/:id/export
/api/marketplace-connections
/api/marketplace-connections/:id
/api/listings/:id/publish
/api/oauth/authorize
/api/oauth/:marketplace/callback
/api/images/upload
/api/images/generate
/api/images/:id
```

### Estimated Time
- Each endpoint: ~15-30 minutes
- Total: ~4-6 hours

### Priority Order
1. QA Results (blocks listing workflow)
2. Export (blocks user export workflow)
3. Marketplace (Phase 4.1 feature)
4. Images (Phase 5 feature)

---

## Cost Impact

### Before Migration
- Vercel: $0
- Railway: $30/month
- Supabase: $0
- **Total: $30/month**

### After Migration
- Vercel: $0
- Supabase Edge Functions: $0 (included in free tier!)
- Supabase Database: $0 (unchanged)
- **Total: $0/month** 🎉

**Savings: $30/month ($360/year)**

---

## Testing Checklist

- [ ] Supabase CLI installed
- [ ] `supabase start` runs successfully
- [ ] Products endpoint responds
- [ ] Can create product
- [ ] Can fetch product details
- [ ] Can analyze product (requires ANTHROPIC_API_KEY)
- [ ] Can generate listings
- [ ] All endpoints have correct CORS headers
- [ ] Auth check works (rejects missing token)
- [ ] Error handling returns proper format

---

## Next Steps

1. **Today**: Start testing Edge Functions locally with `supabase start`
2. **Tomorrow**: Migrate remaining endpoints (QA, Export, OAuth)
3. **Wednesday**: Deploy to production
4. **Thursday**: Update frontend environment variables
5. **Friday**: Full end-to-end testing
6. **Saturday**: Launch MVP! 🚀

---

## Questions?

See:
- Supabase Edge Functions docs: https://supabase.com/docs/guides/functions
- Deno runtime docs: https://deno.land/manual/runtime/fundamentals
- Implementation roadmap: /Users/rvin.aca/Documents/ListingKo/IMPLEMENTATION_ROADMAP.md
