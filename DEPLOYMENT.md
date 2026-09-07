# ListingKo V1 MVP — Production Deployment Guide

> **Date:** 2026-09-08  
> **Status:** Ready for Deployment  
> **Tested:** ✅ All workflows verified end-to-end

---

## 📋 Deployment Checklist

### Phase 1: Pre-Deployment (Day 1)

- [ ] **Environment Setup**
  - [ ] Create Supabase.com account
  - [ ] Create Vercel account
  - [ ] Set up GitHub repo (if not already)
  - [ ] Generate API keys for all services

- [ ] **Database Migration**
  - [ ] Export local database schema
  - [ ] Import to Supabase.com
  - [ ] Verify all migrations applied
  - [ ] Test RLS policies
  - [ ] Verify Edge Functions deployment

- [ ] **Web App Configuration**
  - [ ] Update `.env.production` with Supabase.com URLs
  - [ ] Update API endpoints to production
  - [ ] Test local build: `npm run build`
  - [ ] Verify no TypeScript errors
  - [ ] Test production build locally

- [ ] **Mobile App Configuration**
  - [ ] Update `.env` with production API URL
  - [ ] Test Expo build: `npm run build:web`
  - [ ] Prepare EAS Build credentials (if using)
  - [ ] Configure app.json for production

### Phase 2: Deployment (Day 2)

- [ ] **Web App Deployment**
  - [ ] Push code to GitHub main branch
  - [ ] Connect Vercel to GitHub repo
  - [ ] Configure environment variables
  - [ ] Deploy to Vercel
  - [ ] Test homepage loads
  - [ ] Test API calls work
  - [ ] Verify data flows through to Supabase

- [ ] **Database Verification**
  - [ ] Check Supabase.com dashboard
  - [ ] Verify all tables present
  - [ ] Verify RLS policies active
  - [ ] Run smoke test queries
  - [ ] Verify backup is enabled

- [ ] **Mobile App Preparation**
  - [ ] Update API client base URL to production
  - [ ] Build for EAS: `eas build --platform ios`
  - [ ] Build for EAS: `eas build --platform android`
  - [ ] Distribute to TestFlight (iOS)
  - [ ] Distribute to Google Play Beta (Android)

### Phase 3: Post-Deployment (Day 3)

- [ ] **Production Monitoring**
  - [ ] Enable Sentry error tracking
  - [ ] Enable analytics events
  - [ ] Set up monitoring/alerting
  - [ ] Check logs for errors
  - [ ] Monitor API response times

- [ ] **Testing in Production**
  - [ ] Create test account
  - [ ] Create test product
  - [ ] Analyze product (AI)
  - [ ] Generate listings for all 4 platforms
  - [ ] Verify data in Supabase dashboard
  - [ ] Test on mobile app

- [ ] **Documentation**
  - [ ] Create deployment runbook
  - [ ] Document emergency rollback procedures
  - [ ] Create team onboarding guide
  - [ ] Document API endpoints
  - [ ] Create user guide

- [ ] **Team Communication**
  - [ ] Notify team of production deployment
  - [ ] Provide production URLs
  - [ ] Provide test account credentials
  - [ ] Schedule team walkthrough
  - [ ] Document support process

---

## 🔧 Detailed Deployment Steps

### Step 1: Prepare Supabase.com Project

```bash
# Export current local database
supabase db dump --data-only > backup_data.sql
supabase db dump > backup_schema.sql

# Create Supabase.com project
# 1. Go to https://supabase.com
# 2. Create new project
# 3. Get project URL and API keys
```

**Environment Variables Needed:**
```
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Step 2: Migrate Database

```bash
# Install Supabase CLI globally
npm install -g supabase

# Link to Supabase.com project
supabase link --project-ref [project-id]

# Push all migrations
supabase db push

# Verify migrations
supabase db list

# Test RLS policies
# Login with test user and verify access control
```

### Step 3: Deploy to Vercel

```bash
# 1. Create new project on Vercel
# 2. Connect GitHub repository
# 3. Configure environment variables:

NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_API_URL=https://listingko.vercel.app

# 4. Deploy
vercel --prod

# 5. Test
# Visit https://listingko.vercel.app
# Create product
# Analyze product
# Verify data in Supabase
```

### Step 4: Deploy Edge Functions

```bash
# Deploy all Edge Functions to Supabase
supabase functions deploy

# Verify deployment
supabase functions list

# Test each function
curl -X POST https://[project-id].supabase.co/functions/v1/analyze-product \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"productId":"test"}'
```

### Step 5: Mobile App Distribution

**For iOS (TestFlight):**
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to EAS
eas login

# Configure iOS build
eas build --platform ios --auto-submit

# Distribute via TestFlight
eas submit --platform ios
```

**For Android (Google Play Beta):**
```bash
# Configure Android build
eas build --platform android --auto-submit

# Distribute via Google Play Beta
eas submit --platform android
```

---

## 🚀 Production Configuration

### Web App (`apps/web/.env.production`)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ[key]
SUPABASE_SERVICE_ROLE_KEY=eyJ[key]

# API
NEXT_PUBLIC_API_URL=https://listingko.vercel.app

# Environment
NEXT_PUBLIC_ENV=production

# Optional: Sentry
SENTRY_AUTH_TOKEN=sntrys_[token]
```

### Mobile App (`apps/mobile/.env`)

```env
# API
EXPO_PUBLIC_API_URL=https://listingko.vercel.app

# Environment
EXPO_PUBLIC_ENV=production
```

### Database Configuration

**RLS Policies** (Already configured in migrations):
- ✅ Users can only access their own products
- ✅ Users can only access their own product masters
- ✅ Users can only access their own listings
- ✅ Service role can bypass RLS (for backend)

**Backups** (Supabase.com):
- ✅ Daily automated backups
- ✅ Point-in-time recovery
- ✅ Backup retention: 30 days

---

## 🔐 Security Checklist

- [ ] **Secrets Management**
  - [ ] All API keys in environment variables
  - [ ] No secrets in source code
  - [ ] Rotate keys after deployment
  - [ ] Enable Supabase API key expiration

- [ ] **Authentication**
  - [ ] Supabase Auth configured
  - [ ] Email verification enabled
  - [ ] Password reset working
  - [ ] Session management secure

- [ ] **Authorization**
  - [ ] RLS policies enabled on all tables
  - [ ] User isolation enforced
  - [ ] Service role restricted
  - [ ] API key permissions minimal

- [ ] **Data Protection**
  - [ ] HTTPS enabled everywhere
  - [ ] Passwords hashed (Supabase handles)
  - [ ] PII not logged
  - [ ] GDPR compliant

- [ ] **Rate Limiting**
  - [ ] API rate limits set
  - [ ] DDoS protection enabled (Vercel)
  - [ ] Database connection limits set
  - [ ] File upload limits configured

---

## 📊 Monitoring & Observability

### Application Monitoring

```javascript
// Sentry (Error Tracking)
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_ENV,
  tracesSampleRate: 0.1,
});
```

### Database Monitoring

- Supabase.com Dashboard:
  - Query performance
  - Storage usage
  - API request metrics
  - Error rates

### API Monitoring

- Vercel Analytics:
  - Page load times
  - API response times
  - Error rates
  - Traffic patterns

### Key Metrics to Track

```
Success Metrics:
  - Page load time: < 2s
  - API response time: < 500ms
  - Database query time: < 100ms
  - Error rate: < 0.1%
  - Uptime: > 99.9%

Business Metrics:
  - Products created (per day/week)
  - Listings generated
  - AI analysis requests
  - User retention
  - Feature usage
```

---

## 🔄 Rollback Procedures

### Quick Rollback (If critical issue)

```bash
# 1. Revert to previous Vercel deployment
vercel rollback

# 2. Verify API is responding
curl https://listingko.vercel.app/api/health

# 3. Check database integrity
# Via Supabase dashboard
```

### Full Rollback (If data corruption)

```bash
# 1. Stop all writes
# Disable API endpoints

# 2. Restore from backup
# Via Supabase.com dashboard
# Select backup point

# 3. Verify data integrity
# Run validation queries

# 4. Resume service
# Re-enable endpoints
```

---

## 📝 Runbook

### Daily Operations

**Morning Checklist:**
- [ ] Check Sentry for critical errors
- [ ] Review API response times
- [ ] Check database performance
- [ ] Review user activity logs

**Incident Response:**
- [ ] Check error logs
- [ ] Identify root cause
- [ ] Apply fix
- [ ] Deploy fix
- [ ] Verify resolution
- [ ] Document incident

---

## 🎯 Success Criteria

Deployment is successful when:

1. ✅ **Web app loads** at https://listingko.vercel.app
2. ✅ **Can create products** via web interface
3. ✅ **Can analyze products** with AI
4. ✅ **Can generate listings** for all 4 platforms
5. ✅ **Data persists** to Supabase.com
6. ✅ **Mobile app connects** to production API
7. ✅ **All workflows work** end-to-end
8. ✅ **No errors** in Sentry
9. ✅ **Performance acceptable** (< 500ms API response)
10. ✅ **Team can use** production system

---

## 📞 Support & Troubleshooting

### Common Issues

**API Connection Error**
```
Error: connect ECONNREFUSED 127.0.0.1:3001

Solution:
- Check Vercel deployment status
- Verify environment variables
- Check Supabase.com status
```

**Database Connection Error**
```
Error: connect ECONNREFUSED 127.0.0.1:54321

Solution:
- Verify Supabase.com project is active
- Check connection string
- Verify IP whitelist (if applicable)
```

**Mobile App Won't Connect**
```
Error: Network request failed

Solution:
- Update API_URL in mobile .env
- Verify EXPO_PUBLIC_API_URL is set
- Check mobile device network connectivity
- Rebuild app: eas build --platform ios/android
```

---

## 📚 Documentation Links

- **Supabase Docs:** https://supabase.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Expo Docs:** https://docs.expo.dev
- **React Native Docs:** https://reactnative.dev/docs

---

## ✅ Post-Deployment

After successful deployment:

1. **Announce Launch**
   - Notify team
   - Update social media
   - Send press release (if applicable)

2. **Monitor Closely**
   - First 24 hours: Hourly checks
   - First week: Daily checks
   - Ongoing: Weekly reviews

3. **Gather Feedback**
   - User feedback forms
   - Error logs analysis
   - Performance metrics review

4. **Plan Iterations**
   - Document issues found
   - Prioritize improvements
   - Plan Phase 2 features

---

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Verified By:** _______________  
**Sign-off:** _______________
