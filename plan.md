# ListingKo — Product & Development Plan

> **Working brand:** ListingKo  
> **Product:** AI Ecommerce Product Launch Factory  
> **Brand status:** Leading candidate; pending formal trademark, business-name, domain, app-store, and social-handle clearance. Do not represent the brand as legally cleared until formal checks are completed.  
> **Platforms:** Web app + mobile app sharing one backend, AI layer, database, storage, authentication, and Product Master.

---

## 1. Product Definition

ListingKo transforms minimal product information and product photos into a complete, platform-optimized ecommerce product launch package.

### North Star

> **One product in → complete launch package out.**

The long-term product lifecycle is:

**Create → Publish → Measure → Learn → Improve**

ListingKo should not position itself merely as an AI copywriting or AI description generator. The differentiator is the complete product-launch workflow.

---

## 2. Platforms

ListingKo will be developed as two client applications on one shared platform.

### Web App

The primary workspace for serious sellers and larger catalogs.

- Dashboard
- Product catalog
- Product Master
- Listing editor
- AI generation
- Image Factory
- SEO
- SKU management
- Listing QA
- Templates
- Bulk operations
- Export
- Account/subscription management
- Future marketplace connections and publishing

### Mobile App

The fast, seller-friendly companion for on-the-go listing creation.

- Capture/upload product photos
- Add product information
- AI product analysis
- Generate listing
- Review/edit title and description
- SEO
- SKU
- AI QA
- Save drafts
- Export/share
- Notifications
- Future marketplace publishing

### Shared Platform Principle

Do not duplicate business logic between web and mobile. Business rules belong on the server.

```text
                    ListingKo Platform
                           │
             ┌─────────────┴─────────────┐
             │                           │
          Web App                    Mobile App
             │                           │
             └─────────────┬─────────────┘
                           │
                     Shared Backend
                           │
       ┌───────────┬───────┼───────┬───────────┐
       │           │       │       │           │
   Database       AI    Storage  Auth      Jobs/Events
```

---

## 3. Product Strategy

### V1 — AI Ecommerce Product Launch Factory

V1 is the core product and brand foundation.

```text
Product Information + Photos
            ↓
      AI Product Master
            ↓
     SKU / Strengths / SEO
            ↓
    Platform-Specific Content
            ↓
        Image Factory
            ↓
             QA
            ↓
          Export
```

### V1 capabilities

- Product input
- Product Master
- Product intelligence
- SKU generation
- Product strengths/benefits
- Target customer/use cases
- SEO keywords and optimization
- Shopee listing generation
- Lazada listing generation
- TikTok Shop listing generation
- Facebook content generation
- AI image generation
- Listing QA
- AI auto-repair
- Export
- Free-first infrastructure

### V2 — AI Ecommerce Publishing Factory

V2 adds connected channels and commercial capabilities.

```text
Product
  ↓
AI Listing Factory
  ↓
Review / QA
  ↓
Connected Channels
  ├── Shopee
  ├── Lazada
  ├── TikTok Shop
  └── Facebook Page
  ↓
Publish / Synchronize
```

V2 includes:

- Subscription and entitlement system
- Usage tracking
- Higher product limits
- Bulk generation
- Shopee connection
- Lazada connection
- TikTok Shop connection
- Facebook Page connection
- Direct publishing
- Listing updates
- Inventory synchronization where supported
- Order synchronization where supported
- Publishing status/error handling

### V3 / Future

- More marketplaces
- Scheduled publishing
- Advanced omnichannel inventory
- Marketplace performance analytics
- AI listing optimization based on performance
- Team/workspace management
- Enterprise deployments
- Additional APIs and integrations

### Explicitly Deferred

Do not turn V1 into a full ERP/OMS.

The following are future scope:

- Full ERP
- Full OMS
- Advanced inventory operations
- Accounting replacement
- Payroll/HR
- Complex warehouse management

---

## 4. Complete Product Launch Package

A ListingKo product should ultimately produce:

- Product Master
- SKU
- Product strengths
- Target customer
- Use cases
- SEO keywords
- Platform-specific listings
- Product images
- Social content
- QA score
- Export package

The user should not have to manually assemble these outputs.

---

## 5. Product Intelligence

AI must understand the product before writing content.

It should determine:

- What the product is
- Strongest features
- Supported benefits
- Target customer
- Relevant use cases
- Differentiators
- Missing information
- Product specifications
- Supported claims
- Potentially unsafe/unsupported claims

The Product Master is the source of truth for generated content.

AI must not invent product specifications, capabilities, certifications, guarantees, or claims.

---

## 6. Platform-Specific Content

ListingKo must not simply copy one listing to every marketplace.

Content should account for:

- Platform tone
- Character limits
- Search behavior
- Buyer expectations
- Formatting
- Keyword patterns
- Content requirements
- Category requirements

A single Product Master should generate multiple platform-specific versions.

---

## 7. AI Visual Merchandising / Image Factory

The Image Factory should produce a complete visual package rather than one generic image.

Potential outputs:

- Hero image
- Feature image
- Benefits image
- Specification image
- Lifestyle image
- Use-case image
- Promotional image
- Social-media creative

Whenever possible, use the customer's actual product image as a reference to preserve product identity.

---

## 8. Listing QA

Every generated listing should pass AI QA.

Check:

- Product accuracy
- Specification accuracy
- Unsupported claims
- Platform requirements
- SEO quality
- Readability
- Conversion clarity
- Image/product consistency

Example:

```text
LISTING SCORE

Fact Accuracy       100%
SEO                   91%
Platform Fit          94%
Readability           96%
Claim Safety          98%

TOTAL                 95/100
```

### AI Auto-Repair

```text
Generate
   ↓
QA
   ↓
Problem detected
   ↓
AI repairs
   ↓
QA again
   ↓
PASS
```

The repair process must only use supported product information.

---

## 9. V2 Omnichannel Architecture

The Product Master remains the central source of truth.

```text
                  PRODUCT MASTER
                        │
         ┌──────────────┼──────────────┐
         ↓              ↓              ↓
      Shopee         Lazada       TikTok Shop
         │              │              │
         └──────────────┼──────────────┘
                        ↓
                 Facebook Page
```

Create a channel abstraction in V1 so V2 integrations can be added without changing the core engine.

```text
ChannelService
├── generateListing()
├── validateListing()
├── publishListing()
├── updateListing()
├── getListing()
├── syncInventory()
└── getOrders()
```

Marketplace capabilities depend on each platform's current API and partner requirements.

Users must connect accounts through official authorization/API mechanisms. ListingKo must never store marketplace passwords.

---

## 10. Publishing Approval

Publishing should initially require human approval.

```text
AI Generated
     ↓
QA Passed
     ↓
User Review
     ↓
User Approval
     ↓
Publish
     ↓
Platform Response
     ↓
Success / Error
```

If publishing fails:

- Show the platform error
- Explain it where possible
- Suggest a fix
- Allow retry

Never report a failed publication as successful.

---

## 11. Freemium Model

The initial commercial model is freemium.

### Free

Each new user receives:

> **10 individual product launches for free**

A product launch includes the configured core V1 package:

- Product Master
- SKU
- Product strengths
- SEO
- Marketplace-specific listing content
- Listing images within defined limits
- QA results
- Export

Direct marketplace/social publishing and synchronization are not included in the initial free tier.

### Paid

Paid plans can unlock:

- Higher product limits
- More AI usage
- More images
- Bulk generation
- Marketplace integrations
- Social integrations
- Direct publishing
- Synchronization
- Advanced automation

### Entitlements

Do not hard-code pricing or limits into business logic.

```text
User
 ↓
Subscription
 ↓
Entitlements
 ├── Products/month
 ├── Images/product
 ├── AI generations
 ├── Marketplace integrations
 ├── Social integrations
 ├── Bulk generation
 └── Publishing
```

Usage tracking must distinguish:

- Product created
- Generation started
- Generation completed
- Regeneration
- Failed generation
- Duplicate generation

Free-tier cost protection may include:

- Maximum images per product
- Regeneration limits
- Image resolution limits
- Daily rate limits
- File/document limits
- Abuse protection

---

## 12. Competitive Positioning

Do not position ListingKo primarily as:

> AI Product Description Generator

or:

> AI Listing Generator

Those categories are increasingly commoditized.

### Recommended positioning

> **AI Ecommerce Product Launch Factory**

ListingKo combines:

```text
Product
  ↓
Product Intelligence
  ↓
SKU + SEO + Strengths
  ↓
Platform Content
  ↓
Image Factory
  ↓
QA
  ↓
Export / Publish
```

The goal is a better end-to-end product-launch workflow.

---

## 13. Long-Term Competitive Moat

### Product Intelligence Database

Over time, ListingKo can build structured ecommerce intelligence around:

- Product structures
- Category attributes
- Selling points
- Buyer objections
- Platform-specific patterns
- Brand writing rules

The goal is proprietary structured ecommerce intelligence, not simply a generic AI wrapper.

### Performance Feedback Loop

Future:

```text
LISTING
  ↓
PUBLISH
  ↓
PERFORMANCE
  ↓
AI ANALYSIS
  ↓
RECOMMENDATION
  ↓
IMPROVED LISTING
  ↓
A/B TEST
```

Potential signals:

- Views
- CTR
- Add-to-cart
- Conversion
- Sales
- Returns
- Reviews
- Rating
- Search performance where available

---

## 14. Recommended Technical Direction

Use a shared backend for web and mobile.

Initial free-first stack:

| Layer | Preferred technology |
|---|---|
| Language | TypeScript |
| Web | Next.js + React |
| Mobile | React Native + Expo |
| Styling | Tailwind CSS / platform-appropriate styling |
| Components | shadcn/ui for web; reusable mobile design system |
| Forms | React Hook Form |
| Validation | Zod |
| State | Zustand where needed |
| Database | PostgreSQL / Supabase |
| Auth | Supabase Auth or equivalent |
| Storage | Supabase Storage or equivalent |
| API | Next.js Server Actions / Route Handlers or dedicated API layer |
| Background jobs | Trigger.dev |
| Image processing | Sharp |
| Version control | Git + GitHub |
| Monitoring | Sentry |
| Browser QA | Playwright |
| Design | Figma |
| Deployment | Vercel or appropriate production platform |

Technology choices must be validated against current project requirements before implementation. Do not introduce dependencies merely because they are popular.

---

## 15. AI Architecture

Do not implement ListingKo as one giant AI prompt.

Use controlled AI workflows/agents for:

```text
Product Analysis
      ↓
Product Master
      ↓
Content Generation
      ├── SEO
      ├── Strengths
      ├── Platform Listing
      └── Social Content
      ↓
Image Generation
      ↓
QA
      ↓
Auto-Repair
      ↓
Final Package
```

AI provider integrations should be behind interfaces so providers can be replaced.

AI outputs must be schema-validated before being persisted or presented as trusted product data.

Business-critical rules must live in application code, not only in prompts.

---

## 16. Security

- Server-side authorization for every user-owned resource
- Never trust client-provided user IDs
- Least-privilege access
- Secure secrets/environment variables
- Validate uploaded files
- Restrict file size/type
- Rate-limit expensive AI operations
- Protect user/product data with tenant isolation
- Never store marketplace passwords
- Log safely and avoid unnecessary sensitive content
- Review third-party integrations before production

---

## 17. Analytics

Core events should include:

```text
signup_started
signup_completed

product_created
product_upload_started
product_analysis_started
product_analysis_completed

listing_generation_started
listing_generation_completed
listing_regenerated

image_generation_started
image_generation_completed

qa_started
qa_passed
qa_failed
qa_auto_repair_started
qa_auto_repair_completed

export_started
export_completed

subscription_started
subscription_cancelled

marketplace_connected
publish_started
publish_completed
publish_failed
```

Track AI usage and cost per major feature.

---

## 18. UX Principles

ListingKo should optimize for:

> **Minimum input → maximum useful output**

Design principles:

- Beginner-friendly
- No prompt-writing required
- Clear progress during AI generation
- Strong loading states
- Useful empty states
- Recoverable errors
- Human review before publishing
- Mobile-first interaction patterns
- Consistent design system across web and mobile
- Accessibility built into components

---

## 19. Development Rules

1. Read `plan.md` before major work.
2. Read `CLAUDE.md` before implementation.
3. Keep web and mobile business logic shared through the backend.
4. Do not duplicate core business rules in clients.
5. Keep V1/V2/V3 boundaries explicit.
6. Do not implement future ERP/OMS functionality prematurely.
7. Do not hard-code subscription pricing or limits.
8. Keep AI providers behind interfaces.
9. Validate AI outputs.
10. Write tests for business-critical logic.
11. Prefer small, reversible changes.
12. Document architectural decisions.
13. Track technical debt explicitly.
14. Verify UI behavior rather than assuming generated code works.
15. Never claim a marketplace operation succeeded without verified platform confirmation.

---

## 20. Definition of Done

A feature is not complete merely because the UI renders.

It is complete when appropriate:

- UI is implemented
- API/backend logic is implemented
- Database changes are complete
- Authorization is enforced
- Validation exists
- Loading state works
- Empty state works
- Error state works
- AI output is validated
- Critical business logic is tested
- Analytics events are considered
- Security implications are reviewed
- Documentation is updated
- Web/mobile behavior is verified where applicable

---

## 21. Documentation Source of Truth

```text
plan.md
    ↓
Product + scope + architecture source of truth

CLAUDE.md
    ↓
Claude Code operating manual

PROJECT_RULES.md
    ↓
Detailed engineering rules

ARCHITECTURE.md
    ↓
Technical architecture

DATABASE.md
    ↓
Database schema

API.md
    ↓
API contracts

AI_PROMPTS.md
    ↓
Versioned AI prompts and evaluation cases
```

---

## 22. Immediate Development Sequence

```text
1. Finalize ListingKo brand/clearance status
2. Confirm product scope
3. Confirm web + mobile architecture
4. Create CLAUDE.md
5. Create PROJECT_RULES.md
6. Create ARCHITECTURE.md
7. Create DATABASE.md
8. Create API.md
9. Create AI agent/tool specification
10. Create UX information architecture
11. Create design system
12. Create MVP backlog
13. Scaffold web app
14. Scaffold mobile app
15. Implement shared backend
16. Implement Product Master
17. Implement AI generation pipeline
18. Implement Image Factory
19. Implement QA/auto-repair
20. Implement export
21. Test and visually verify
22. Prepare V1 release
```

---

## 23. Product North Star

ListingKo should make a seller think:

> **“I give ListingKo my product once, and it prepares everything I need to launch it.”**

The long-term vision is:

**CREATE → PUBLISH → SELL → MEASURE → LEARN → OPTIMIZE → REPEAT**
