# ListingKo — AI Ecommerce Product Launch Factory

> **One product in → complete launch package out.**

Transform minimal product information and photos into a complete, platform-optimized ecommerce product launch package in minutes.

---

## 🎯 Mission

ListingKo helps ecommerce sellers launch products faster with AI-powered:

- **Product Master** — Structured product intelligence
- **Platform-specific listings** — Shopee, Lazada, TikTok Shop, Facebook
- **AI Image generation** — Hero, feature, lifestyle, social media visuals
- **Listing QA** — Automated quality scoring and auto-repair
- **Export package** — Download complete launch assets

---

## 📚 Documentation

All critical documentation is in this repository. **Read these first:**

| File | Purpose |
|------|---------|
| **[plan.md](plan.md)** | Product strategy, vision, and roadmap |
| **[CLAUDE.md](CLAUDE.md)** | Claude Code operating manual |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | System design, data flow, integration patterns |
| **[DATABASE.md](DATABASE.md)** | PostgreSQL schema, migrations, queries |
| **[API.md](API.md)** | REST API and Server Actions specifications |
| **[PROJECT_RULES.md](PROJECT_RULES.md)** | Engineering best practices and standards |
| **[AI_PROMPTS.md](AI_PROMPTS.md)** | Versioned AI prompts and evaluation cases |
| **[progress.md](progress.md)** | Development phases and current status |

---

## 🏗️ Architecture

```
                    ListingKo Platform
                           │
             ┌─────────────┴─────────────┐
             │                           │
          Web App                    Mobile App
          (React)                 (React Native)
             │                           │
             └─────────────┬─────────────┘
                           │
                     Shared Backend
                    (Next.js API Routes)
                           │
       ┌───────────┬───────┼───────┬───────────┐
       │           │       │       │           │
   Database       AI    Storage  Auth      Jobs
   (Postgres)   (Claude) (S3)  (Supabase) (Trigger.dev)
```

Key principle: **No business logic duplication.** Everything critical lives on the backend.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Language** | TypeScript |
| **Web** | Next.js 14+ + React 18+ |
| **Mobile** | React Native + Expo |
| **Styling** | Tailwind CSS |
| **Components** | shadcn/ui (web) |
| **Forms** | React Hook Form + Zod |
| **State** | Zustand |
| **Database** | PostgreSQL (Supabase) |
| **Auth** | Supabase Auth |
| **Storage** | Supabase Storage |
| **API** | Next.js Server Actions + Route Handlers |
| **Jobs** | Trigger.dev |
| **AI** | Anthropic Claude |
| **Images** | Sharp + DALL-E 3 |
| **Monitoring** | Sentry |
| **Testing** | Vitest + Playwright |
| **Build** | Turbo |

---

## 📦 Project Structure

```
listingko/
├── apps/
│   ├── api/              # Next.js backend + database
│   ├── web/              # Next.js web app
│   └── mobile/           # React Native + Expo app
├── packages/
│   ├── shared-types/     # TypeScript types shared across apps
│   └── shared-utils/     # Utilities shared across apps
├── docs/                 # Additional documentation
├── plan.md               # Product strategy
├── CLAUDE.md             # Claude Code manual
├── PROJECT_RULES.md      # Engineering standards
├── ARCHITECTURE.md       # System design
├── DATABASE.md           # Schema & migrations
├── API.md                # API specifications
├── AI_PROMPTS.md         # AI workflow prompts
├── progress.md           # Development status
└── package.json          # Monorepo config
```

---

## 🚀 Quick Start

### Prerequisites

```bash
# Install pnpm
npm install -g pnpm

# Install Node.js 18+
node --version

# Install Supabase CLI
npm install -g supabase
```

### Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd listingko

# 2. Install dependencies
pnpm install

# 3. Setup local Supabase
supabase start

# 4. Create environment files
cp apps/api/.env.example apps/api/.env.local
cp apps/web/.env.example apps/web/.env.local

# 5. Run database migrations
pnpm db:setup

# 6. Start development servers
pnpm dev
```

This will start:
- **Web app:** http://localhost:3000
- **API:** http://localhost:3000/api
- **Mobile app:** http://localhost:19000

---

## 📋 Development Workflow

### Understanding a Feature Request

1. **Read** `plan.md` for scope and strategy
2. **Read** relevant section in `ARCHITECTURE.md`
3. **Check** `DATABASE.md` for schema requirements
4. **Review** `API.md` for endpoint contracts
5. **Implement** following `PROJECT_RULES.md`

### Example: Add Product Category Support

```
1. plan.md → Is this in V1 scope?
2. ARCHITECTURE.md → How does it fit into Product Master?
3. DATABASE.md → Update products table schema
4. API.md → Add category field to Product endpoints
5. PROJECT_RULES.md → Write tests, validate types, follow code style
6. AI_PROMPTS.md → Update prompts to handle categories
```

### Code Quality Checklist

Before committing:

```bash
# Type check
pnpm type-check

# Lint
pnpm lint:fix

# Format
pnpm format

# Test (where applicable)
pnpm test

# Build
pnpm build
```

---

## 🧪 Testing Strategy

### Unit Tests

Test business logic, AI output validation, authorization:

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
```

### Integration Tests

Test API endpoints, database operations, AI workflows:

```bash
cd apps/api
pnpm test:integration
```

### E2E Tests (Web)

Test user flows with Playwright:

```bash
cd apps/web
pnpm test:e2e
```

---

## 🐛 Debugging

### Check Logs

```bash
# API logs
pnpm dev --filter=@listingko/api

# Web logs (browser console)
# Mobile logs (Expo debugger)
```

### Database

```bash
# Access Supabase dashboard
supabase open

# Or use CLI
supabase db pull    # Pull schema changes
supabase db push    # Push migrations
supabase db reset   # Reset local database
```

### AI Operations

```bash
# Check usage & costs
# Implementation in /api/monitoring/ai-usage.ts
pnpm run check-ai-usage
```

---

## 🔒 Security

### Secrets Management

```bash
# Never commit .env files
# Use environment variable files:
.env.local                 # Local dev only
.env.production           # Never commit

# Deploy secrets via:
vercel env add             # For Vercel
# OR
supabase secrets set       # For Supabase
```

### Authentication

- All protected routes require valid JWT
- Every endpoint verifies user ownership of resources
- Server-side authorization only (never trust client)
- Row-Level Security (RLS) enabled on all user data

See `ARCHITECTURE.md` section 5 for details.

---

## 📊 Monitoring

### Key Metrics

```
Product creation rate
Analysis completion rate
AI token usage per feature
Error rates by service
API latency
Database query performance
Image generation success rate
```

### Sentry Setup

```typescript
// Already configured in apps/api/lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.captureException(error, {
  tags: { userId, operation: 'name' },
});
```

---

## 🚢 Deployment

### Web & API (Vercel)

```bash
# Push to main branch
git push origin main

# Vercel automatically deploys
# Monitor at: vercel.com/dashboard
```

### Mobile (Expo)

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to app stores
eas submit
```

### Database (Supabase)

```bash
# Apply pending migrations
pnpm db:migrate

# Verify on dashboard
supabase open
```

---

## 📈 Roadmap

### V1 (Current) ✅
- [x] Product input & analysis
- [x] Product Master
- [x] Platform-specific listings
- [x] AI image generation
- [x] QA & auto-repair
- [x] Export
- [x] Free-tier (10 launches)

### V2 (Next)
- [ ] Marketplace integrations (Shopee, Lazada, TikTok, Facebook)
- [ ] Direct publishing
- [ ] Subscription system
- [ ] Inventory sync
- [ ] Order sync

### V3+ (Future)
- [ ] Analytics dashboard
- [ ] A/B testing
- [ ] Team management
- [ ] Enterprise features

See `plan.md` for complete roadmap.

---

## 🤝 Contributing

### Getting Help

1. **Check documentation** — Start with `README.md` and `CLAUDE.md`
2. **Search architecture** — Most patterns are documented in `ARCHITECTURE.md`
3. **Review examples** — Check `PROJECT_RULES.md` for code patterns
4. **Ask questions** — Create an issue or contact the team

### Code Review Checklist

- [ ] Follows `PROJECT_RULES.md` style
- [ ] Types are correct (TypeScript strict mode)
- [ ] No business logic duplication
- [ ] Tests included for business logic
- [ ] Database migrations included (if schema changes)
- [ ] API documentation updated
- [ ] Security reviewed
- [ ] Performance considered (no N+1 queries, bundle size)
- [ ] UI verified on web & mobile (where applicable)

---

## 📞 Support

- **Docs:** See files in repo root (plan.md, ARCHITECTURE.md, etc.)
- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions

---

## 📄 License

[License type TBD]

---

## 🎓 Learning Resources

- **Product Vision:** `plan.md` (read first)
- **System Design:** `ARCHITECTURE.md`
- **Code Standards:** `PROJECT_RULES.md`
- **Database:** `DATABASE.md`
- **APIs:** `API.md`
- **AI Workflows:** `AI_PROMPTS.md`
- **Development Status:** `progress.md`

---

**Last updated:** 2024-09-06
