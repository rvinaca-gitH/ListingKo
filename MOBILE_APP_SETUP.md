# ListingKo Mobile App - React Native/Expo Setup

## 📱 Technology Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **Storage**: AsyncStorage (for auth tokens)
- **Styling**: React Native StyleSheet
- **Backend**: Same API as web (no changes needed!)

## 🏗️ Architecture

The mobile app mirrors the web version with mobile-optimized UI:

```
Mobile App (Expo)
    ↓
Shared API Client
    ↓
Same Backend APIs (13 Edge Functions)
    ↓
Supabase Database
```

## 📁 Project Structure

```
apps/mobile/
├── app/
│   ├── _layout.tsx          # Root navigation
│   ├── index.tsx            # Landing screen
│   ├── screens/
│   │   ├── home.tsx         # Home dashboard ✅
│   │   ├── create-product.tsx
│   │   ├── product/
│   │   │   └── [id].tsx
│   │   ├── marketplace.tsx
│   │   ├── workflow/
│   │   │   ├── analyze.tsx
│   │   │   ├── listings.tsx
│   │   │   ├── qa.tsx
│   │   │   ├── export.tsx
│   │   │   └── images.tsx
│   │   └── auth/
│   │       ├── login.tsx
│   │       └── signup.tsx
│   └── components/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       └── Loading.tsx
├── lib/
│   ├── api-client.ts        # API integration ✅
│   └── auth.ts
├── app.json
├── package.json
└── tsconfig.json
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd apps/mobile
npm install
# or
pnpm install
```

### 2. Set Environment Variables

Create `.env`:
```
EXPO_PUBLIC_API_URL=http://YOUR_BACKEND_URL
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NODE_ENV=development
```

### 3. Start the Expo Dev Server

```bash
npm start
# or
expo start
```

### 4. Open on Device

**iOS Simulator:**
```bash
i
```

**Android Emulator:**
```bash
a
```

**Physical Device:**
- Scan QR code with Expo Go app (iOS/Android)
- Or use `expo start --tunnel` for remote connection

## 📋 Screens to Build (In Priority Order)

### Phase 1 (MVP - This Sprint)
- [x] API Client Setup ✅
- [x] Home Dashboard ✅
- [ ] Create Product
- [ ] Product Detail
- [ ] Auth Flow (Login/Signup)
- [ ] Marketplace Settings

### Phase 2 (Workflow)
- [ ] Product Analysis
- [ ] Listing Generation
- [ ] QA Results
- [ ] Export
- [ ] Image Management

### Phase 3 (Polish)
- [ ] Error handling
- [ ] Loading states
- [ ] Success confirmations
- [ ] Navigation guards
- [ ] Offline support

## 🔌 API Integration

The mobile app uses the same API client pattern as the web:

```typescript
// Import the API client
import { apiClient } from '../lib/api-client';

// Use it in your screen
const createProduct = async (title: string) => {
  try {
    const product = await apiClient.createProduct({
      title,
      description: '',
      category: ''
    });
    // Handle success
  } catch (error) {
    // Handle error
  }
};
```

## 🛠️ Available API Methods

```typescript
// Products
createProduct(input)
getProducts()
getProduct(id)
updateProduct(id, input)

// Analysis
analyzeProduct(productId)

// Listings
generateListings(productId, platforms)
getListings(productId)

// QA
getQAResults(productId)

// Export
exportProduct(productId, format)

// Marketplace
getMarketplaceConnections()
createMarketplaceConnection(data)
deleteMarketplaceConnection(id)

// OAuth
getOAuthUrl(marketplace)

// Images
uploadImage(productId, file)
generateImages(productId)
deleteImage(imageId)
```

## 🔐 Authentication

Authentication tokens are stored in AsyncStorage:

```typescript
// Get token
const token = await apiClient.getAuthToken();

// Set token (after login)
await apiClient.setAuthToken(token);

// Clear token (on logout)
await apiClient.clearAuthToken();
```

## 📱 Mobile-First Design Principles

1. **Thumb-friendly buttons** - Min 44pt tap targets
2. **Scrollable content** - No horizontal scrolling
3. **Clear navigation** - Tab bar or stack navigation
4. **Loading states** - Show spinners for long operations
5. **Error messages** - Clear, actionable alerts
6. **Safe areas** - Respect notches and home indicators
7. **Keyboard** - Auto-dismiss on submit
8. **Offline ready** - Store data locally when possible

## 🧪 Testing

### Local Testing

1. **Auth Flow**
   - Log in with any credentials
   - Verify token stored in AsyncStorage
   - Check if auth persists on app restart

2. **Product Workflow**
   - Create product
   - View product details
   - Generate listings
   - Check QA results
   - Export data

3. **Marketplace**
   - Connect marketplace
   - Store credentials
   - Disconnect

4. **Images**
   - Upload product image
   - Generate AI images
   - Delete image

### Performance

- Monitor app startup time (< 3 seconds target)
- Check memory usage during long scrolls
- Test with 50+ products in list
- Verify image handling with large files

## 🚀 Deployment

### Development
```bash
npm start
```

### Testing (Expo Go)
- Share QR code with testers
- Runs directly on their device

### Production Build
```bash
# iOS
eas build --platform ios

# Android
eas build --platform android

# Both
eas build
```

### Publishing to App Stores
```bash
# iOS
eas submit --platform ios

# Android
eas submit --platform android
```

## 📊 Parallel Testing

This mobile app can now be tested simultaneously with the web version:

```
┌─────────────────────────────────────┐
│     Shared Backend APIs             │
│     (13 Supabase Edge Functions)   │
└─────────────────────────────────────┘
         ↑              ↑
    Web (Vercel)   Mobile (Expo)
      Testing       Testing
     (Next.js)    (React Native)
```

Both apps hit the same APIs, so feature testing can happen in parallel:
- Web team tests desktop experience
- Mobile team tests touch experience
- Both verify backend behavior

## 🐛 Common Issues

### Issue: API calls failing
**Solution**: Check EXPO_PUBLIC_API_URL is set and backend is running

### Issue: Auth token not persisting
**Solution**: Verify AsyncStorage is installed: `npm install @react-native-async-storage/async-storage`

### Issue: Keyboard covering input
**Solution**: Use `KeyboardAvoidingView` wrapper in screens

### Issue: Images not loading
**Solution**: Verify file paths and upload endpoint returns public URLs

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [Expo Router Guide](https://docs.expo.dev/routing/introduction/)
- [AsyncStorage API](https://react-native-async-storage.github.io)

## ✅ Launch Checklist

- [ ] All screens built and tested
- [ ] API client fully integrated
- [ ] Auth flow working
- [ ] Offline support added
- [ ] Error handling complete
- [ ] Loading states implemented
- [ ] Performance optimized
- [ ] Accessibility checked
- [ ] Testing on iOS simulator
- [ ] Testing on Android emulator
- [ ] Testing on physical device
- [ ] Production build created
- [ ] App submitted to stores
- [ ] Ready to launch! 🚀

## 🎯 Next Steps

1. Install dependencies
2. Set environment variables
3. Build remaining screens (Create Product, Auth, etc.)
4. Start dev server
5. Test on simulator/device
6. Parallel test with web version
7. Fix any issues
8. Build for production
9. Ship! 🚀
