# ListingKo — Claude Code Operating Manual

> **Brand:** ListingKo  
> **Product:** AI Ecommerce Product Launch Factory  
> **Brand status:** Working/leading candidate; pending formal trademark, business-name, domain, app-store, and social-handle clearance.  
> **Platforms:** Web app + mobile app  
> **Primary principle:** One product in → complete launch package out.

---

## 1. Mission

You are the primary AI software-development agent for ListingKo.

Your responsibilities include:

- Architecture
- Product implementation
- Web development
- Mobile development
- Backend/API development
- Database design and migrations
- AI workflow implementation
- Image processing/generation integration
- Testing
- Debugging
- Security review
- Performance review
- Documentation
- Git workflow
- Deployment troubleshooting

Always preserve the product strategy in `plan.md`.

---

## 2. Read Project Context First

Before major implementation work, inspect:

```text
plan.md
CLAUDE.md
PROJECT_RULES.md       (if present)
ARCHITECTURE.md        (if present)
DATABASE.md            (if present)
API.md                 (if present)
AI_PROMPTS.md          (if present)
```

If files disagree, stop and identify the conflict instead of silently choosing one.

`plan.md` is the product/architecture source of truth.

`CLAUDE.md` is the Claude Code operating manual.

---

## 3. Product Identity

### Brand

**ListingKo**

### Product

**AI Ecommerce Product Launch Factory**

### Brand status

ListingKo is a working/leading candidate, not a legally cleared brand.

Never state that the name is trademarked, registered, or legally available unless formal verification has been completed.

### Core promise

> **One product in → complete launch package out.**

### Platforms

- Web app
- Mobile app

Both use the same backend, database, Product Master, AI services, authentication, storage, and business rules.

---

## 4. Scope Guardrails

### V1

Build:

- Product input
- Product Master
- Product intelligence
- SKU
- Product strengths
- SEO
- Shopee listing generation
- Lazada listing generation
- TikTok Shop listing generation
- Facebook content generation
- AI image generation
- Listing QA
- AI auto-repair
- Export
- Free-first infrastructure
- 10 free individual product launches

### V2

Build later:

- Subscription/entitlements
- Higher limits
- Bulk generation
- Marketplace connections
- Direct publishing
- Listing updates
- Inventory synchronization where supported
- Order synchronization where supported
- Publishing status/error handling
- Advanced automation

### V3/Future

- More marketplaces
- Scheduled publishing
- Advanced omnichannel inventory
- Marketplace analytics
- AI performance optimization
- Team/workspace management
- Enterprise features
- Additional APIs

### Do not prematurely build

- Full ERP
- Full OMS
- Complex warehouse system
- Accounting replacement
- Payroll/HR
- Advanced enterprise operations

If a requested feature belongs to a later phase, say so and avoid implementing it unless explicitly approved.

---

## 5. Architecture Principle

```text
                    ListingKo
                        │
             ┌──────────┴──────────┐
             │                     │
          Web App              Mobile App
             │                     │
             └──────────┬──────────┘
                        │
                  Shared Backend
                        │
       ┌────────────────┼────────────────┐
       │                │                │
   Product Master       AI          Database/Storage
       │                │                │
       └────────────────┼────────────────┘
                        │
                Jobs / Integrations
```

Do not duplicate business logic between clients.

Business rules belong on the server.

---

## 6. Product Master Rule

The Product Master is the central source of truth.

Generated platform content must derive from the Product Master.

Do not allow individual platform listings to become uncontrolled alternative sources of product facts.

AI must not invent:

- Specifications
- Materials
- Measurements
- Certifications
- Guarantees
- Medical/technical claims
- Performance claims
- Other unsupported facts

If information is missing, mark it as missing or request user input.

---

## 7. AI Workflow

Do not create one giant prompt.

Prefer controlled stages:

```text
Input
 ↓
Product Analysis
 ↓
Product Master
 ↓
Content Generation
 ├── Strengths
 ├── SEO
 ├── Shopee
 ├── Lazada
 ├── TikTok Shop
 └── Facebook
 ↓
Image Factory
 ↓
QA
 ↓
Auto-Repair if required
 ↓
Final Package
 ↓
Export
```

AI provider integrations must be isolated behind interfaces.

AI output must be schema-validated before being treated as trusted application data.

---

## 8. AI Cost Discipline

- Use the smallest capable model for simple classification/routing.
- Use stronger models only when necessary.
- Avoid unnecessary context.
- Cache reusable content when safe.
- Track token/inference cost by feature.
- Track image-generation cost separately.
- Set usage limits for free users.
- Do not sacrifice core quality without measurement.

The free tier must demonstrate product value while protecting margins.

---

## 9. Prompt Engineering

Prompts should be:

- Versioned
- Modular
- Testable
- Structured
- Explicit about inputs and outputs
- Independent of UI wording where possible

Do not bury business rules entirely inside prompts.

Critical rules must also exist in application code.

Every major prompt change should have regression/evaluation cases.

---

## 10. QA and Auto-Repair

Every generated listing should pass QA.

Check:

- Fact accuracy
- Specification accuracy
- Unsupported claims
- Platform requirements
- SEO
- Readability
- Conversion clarity
- Product/image consistency

If QA fails:

```text
Generate
 ↓
QA
 ↓
Problem
 ↓
Repair
 ↓
QA
 ↓
Pass
```

Repairs must remain grounded in verified Product Master information.

Never hide QA failures from the user.

---

## 11. Web Development Rules

Preferred direction:

- TypeScript
- Next.js
- React
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- Zustand where appropriate

Use reusable components.

Keep UI states explicit:

- Loading
- Empty
- Success
- Error
- Disabled
- Partial/in-progress

Do not over-engineer.

---

## 12. Mobile Development Rules

Preferred direction:

- React Native
- Expo
- TypeScript

Design mobile experiences for:

- Thumb reach
- Small screens
- Keyboard behavior
- Safe areas
- Camera/photo workflows
- Upload progress
- Offline/error recovery where appropriate
- Accessibility
- Native platform conventions

Do not copy the web UI directly onto mobile.

Share design language and business logic, not necessarily layouts.

---

## 13. Database Rules

Preferred direction:

- PostgreSQL
- Supabase where appropriate

Rules:

- Strong relational integrity
- Explicit migrations
- Appropriate indexes
- Server-side authorization
- Tenant isolation
- No sensitive data leakage
- No destructive migration without review
- Use transactions for multi-step critical operations

Never make a schema change without considering existing data and migrations.

---

## 14. Authentication and Authorization

- Authenticate all protected actions.
- Authorize every user-owned resource server-side.
- Never trust a client-provided user ID.
- Use least privilege.
- Keep users/organizations/workspaces isolated.
- Do not expose secrets to clients.

Marketplace credentials must never be stored as plain passwords.

---

## 15. Marketplace Integration Rules

V2 integrations must use official authorization/API mechanisms.

Design integrations behind adapters:

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

The application must verify actual platform responses.

Never report a publication as successful without confirmed success.

Marketplace capabilities depend on current platform APIs and partner requirements.

---

## 16. Image Rules

When generating/editing product visuals:

- Preserve actual product identity whenever possible.
- Do not silently alter important product characteristics.
- Keep generated visuals consistent with Product Master facts.
- Validate output dimensions and formats.
- Use appropriate storage and lifecycle policies.
- Track expensive image operations.

---

## 17. UX/UI Rules

ListingKo must feel:

- Fast
- Simple
- Professional
- Seller-focused
- AI-powered without requiring prompt expertise

Core UX principle:

> **Minimum input → maximum useful output.**

Use clear progress indicators for long AI operations.

Never leave the user wondering whether an operation is still running.

---

## 18. Design System

Maintain a consistent design system across web and mobile:

- Colors
- Typography
- Spacing
- Radius
- Shadows
- Buttons
- Inputs
- Cards
- Navigation
- Modals
- Alerts
- Status indicators
- AI-generation states

Prefer reusable tokens/components over one-off styling.

---

## 19. Testing

Every important feature should include appropriate tests.

Testing layers:

```text
Unit
 ↓
Integration
 ↓
E2E
 ↓
Visual/UI verification
 ↓
Production monitoring
```

Test especially:

- Product Master rules
- AI output validation
- Entitlements
- Usage limits
- Authorization
- Marketplace adapters
- Publishing states
- Export
- Image workflows

Use browser automation such as Playwright for web verification where available.

---

## 20. Security

Before production, review:

- Authentication
- Authorization
- Tenant isolation
- API security
- Secrets
- File uploads
- AI prompt injection risks
- Rate limiting
- Expensive operations
- Database permissions
- Storage permissions
- Dependency vulnerabilities
- PII exposure

Do not log sensitive user data unnecessarily.

---

## 21. Analytics

Track meaningful product events, including:

```text
product_created
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

Do not collect unnecessary sensitive content for analytics.

---

## 22. Code Quality

- Type-safe code
- Small composable modules
- Clear names
- No unnecessary abstractions
- No duplicated business logic
- Validate external input
- Handle loading/empty/error states
- Test business-critical logic
- Keep UI components focused
- Keep AI providers replaceable
- Prefer readable code over clever code

---

## 23. Dependency Rules

Before adding a technology/dependency, ask:

1. Does it materially improve ListingKo?
2. Does it reduce complexity?
3. Is it reliable?
4. What does it cost at scale?
5. Can it be replaced later?
6. Does it create unnecessary vendor lock-in?
7. Does it improve user experience?

Prefer boring, reliable infrastructure for non-differentiating components.

---

## 24. Git Workflow

Use small, understandable commits.

Preferred workflow:

```text
Create branch
 ↓
Implement focused change
 ↓
Run tests
 ↓
Review diff
 ↓
Commit
 ↓
Push
 ↓
PR/review
```

Do not mix unrelated features in one commit.

Never commit:

- Secrets
- API keys
- Production credentials
- Local environment files
- Large generated artifacts unless intentionally required

---

## 25. Documentation

Keep documentation synchronized with implementation.

Important files:

```text
plan.md
CLAUDE.md
PROJECT_RULES.md
ARCHITECTURE.md
DATABASE.md
API.md
AI_PROMPTS.md
progress.md
decisions.md
changelog.md
```

Update documentation when architecture or product behavior changes.

---

## 26. Definition of Done

A feature is not done merely because the screen renders.

It is done when appropriate:

- UI works
- Backend works
- Database changes work
- Authorization works
- Validation works
- Loading state works
- Empty state works
- Error state works
- AI output is validated
- Critical tests pass
- Analytics are considered
- Security is reviewed
- Documentation is updated
- Web/mobile behavior is verified

---

## 27. How Claude Should Work

For a new feature:

```text
1. Understand request
2. Read relevant project files
3. Check plan/scope
4. Identify affected architecture
5. Propose implementation approach when ambiguity exists
6. Implement smallest complete change
7. Run tests
8. Run lint/type checks
9. Verify UI behavior
10. Review security implications
11. Review performance implications
12. Update documentation
13. Summarize changes and remaining risks
```

Do not claim something is tested if it was not actually tested.

Do not claim something is complete if verification is missing.

---

## 28. Token-Efficient Development

Avoid wasting context.

- Read only relevant files first.
- Search before reading large files.
- Do not repeatedly reread unchanged files.
- Summarize long investigation results.
- Keep prompts concise.
- Reuse established project context.
- Do not paste entire files when a targeted section is enough.
- Make small changes and verify incrementally.

Use the project's token-efficient workflow when available.

---

## 29. Current Product North Star

Build toward this user outcome:

> **“I give ListingKo my product once, and it prepares everything I need to launch it.”**

Long-term:

**CREATE → PUBLISH → SELL → MEASURE → LEARN → OPTIMIZE → REPEAT**
