# ListingKo — Phase 1: Project Scaffolding

> Step-by-step guide to set up the monorepo, apps, and configuration.

---

## Prerequisites

Verify you have these installed:

```bash
# Node.js 18+
node --version

# pnpm 9+
pnpm --version

# Git
git --version

# Supabase CLI
supabase --version
```

If any are missing, install them first.

---

## Step 1: Initialize Git Repository

```bash
cd /Users/rvin.aca/Documents/ListingKo

# Initialize git (if not already done)
git init

# Add initial files
git add plan.md CLAUDE.md PROJECT_RULES.md ARCHITECTURE.md DATABASE.md API.md AI_PROMPTS.md progress.md README.md .gitignore package.json SETUP_COMPLETE.md SCAFFOLDING.md

git commit -m "docs: Initial project documentation and foundation"
```

---

## Step 2: Create Directory Structure

```bash
# Create workspace directories
mkdir -p apps/api
mkdir -p apps/web
mkdir -p apps/mobile
mkdir -p packages/shared-types
mkdir -p packages/shared-utils

# Create additional directories
mkdir -p docs
mkdir -p .github/workflows

echo "✅ Directory structure created"
```

---

## Step 3: Configure Root package.json

Your `package.json` already exists. Verify it looks like this:

```bash
cat package.json | head -20
```

Should show workspaces configuration. If not, the file is already correct.

Now install root dependencies:

```bash
# Install root dev dependencies
pnpm install

# This installs: turbo, typescript, eslint, prettier, etc.
```

---

## Step 4: Create TypeScript Configuration

Create `tsconfig.json` at the root:

```bash
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./packages/shared-types/src/*"],
      "@utils/*": ["./packages/shared-utils/src/*"]
    }
  },
  "include": ["apps/**/*.ts", "apps/**/*.tsx", "packages/**/*.ts"],
  "exclude": ["node_modules", "**/dist", "**/build", "**/.next", "**/out"]
}
EOF

cat tsconfig.json
```

---

## Step 5: Create ESLint & Prettier Config

Create `.eslintrc.json`:

```bash
cat > .eslintrc.json << 'EOF'
{
  "root": true,
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "no-console": ["warn", { "allow": ["error", "warn"] }]
  },
  "overrides": [
    {
      "files": ["apps/api/**/*.ts"],
      "rules": {
        "no-console": "off"
      }
    }
  ]
}
EOF

cat > .prettierrc.json << 'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always"
}
EOF

cat > .prettierignore << 'EOF'
node_modules
dist
build
.next
out
.expo
coverage
*.lock
.supabase
EOF

echo "✅ ESLint and Prettier configured"
```

---

## Step 6: Scaffold Backend (apps/api)

```bash
cd apps/api

# Create Next.js app with TypeScript
pnpm create next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-git \
  --no-src-dir

# Remove default Next.js files we won't use
rm -rf public/next.svg public/vercel.svg

echo "✅ Next.js backend scaffolded"
```

Create `apps/api/package.json` additions:

```bash
cd /Users/rvin.aca/Documents/ListingKo

cat > apps/api/package.json.additions << 'EOF'
Add these dependencies to apps/api/package.json:

devDependencies:
  "@supabase/cli": "^1.148.0"
  "@types/node": "^20"
  "vitest": "^1.0.0"

Add these scripts:
  "db:setup": "supabase db reset",
  "db:migrate": "supabase db push",
  "db:pull": "supabase db pull",
  "db:start": "supabase start"
EOF

cat apps/api/package.json.additions
```

Update manually or use this:

```bash
# Add to apps/api package.json scripts section
# "db:setup": "supabase db reset",
# "db:migrate": "supabase db push", 
# "db:pull": "supabase db pull"
```

Create `.env.example` for backend:

```bash
cat > apps/api/.env.example << 'EOF'
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key-here
SUPABASE_SERVICE_ROLE_KEY=your-key-here

# API
NEXT_PUBLIC_API_URL=http://localhost:3000

# AI
ANTHROPIC_API_KEY=your-key-here

# Stripe (V2)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Monitoring
SENTRY_DSN=https://...

# Environment
NODE_ENV=development
EOF

echo "✅ Backend configuration created"
```

---

## Step 7: Scaffold Web App (apps/web)

```bash
cd apps/web

# Create Next.js app
pnpm create next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-git

# Remove defaults
rm -rf public/next.svg public/vercel.svg

echo "✅ Next.js web app scaffolded"
```

Create `.env.example`:

```bash
cat > apps/web/.env.example << 'EOF'
# API
NEXT_PUBLIC_API_URL=http://localhost:3000

# Supabase (frontend)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key-here

# Analytics
NEXT_PUBLIC_GA_ID=G_...

# Environment
NEXT_PUBLIC_ENV=development
EOF

echo "✅ Web app configuration created"
```

---

## Step 8: Scaffold Mobile App (apps/mobile)

```bash
cd apps/mobile

# Create Expo app
pnpm create expo-app .

# Install dependencies
pnpm add -D typescript @types/react @types/react-native

# Initialize TypeScript
echo "{}" > tsconfig.json

echo "✅ React Native + Expo app scaffolded"
```

Create `app.json` configuration:

```bash
cat > app.json << 'EOF'
{
  "expo": {
    "name": "ListingKo",
    "slug": "listingko",
    "version": "0.1.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "listingko",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTabletMode": true,
      "bundleIdentifier": "com.listingko.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.listingko.app"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow ListingKo to access your photos",
          "cameraPermission": "Allow ListingKo to access your camera"
        }
      ]
    ]
  }
}
EOF

echo "✅ Mobile app configuration created"
```

---

## Step 9: Create Shared Packages

### Shared Types

```bash
cd packages/shared-types

cat > package.json << 'EOF'
{
  "name": "@listingko/shared-types",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
EOF

mkdir -p src

cat > src/index.ts << 'EOF'
// Export types from shared-types package

// Product types
export type Product = {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: 'DRAFT' | 'ANALYZING' | 'READY' | 'PUBLISHED';
  createdAt: string;
};

// Add more types as needed
// Keep in sync with DATABASE.md table schemas
EOF

cat > tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "declaration": true
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
EOF

echo "✅ Shared types package created"
```

### Shared Utils

```bash
cd packages/shared-utils

cat > package.json << 'EOF'
{
  "name": "@listingko/shared-utils",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "dependencies": {}
}
EOF

mkdir -p src

cat > src/index.ts << 'EOF'
// Export utilities from shared-utils package

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US').format(date);
};

export const formatListingTitle = (title: string): string => {
  return title.trim().substring(0, 60);
};

// Add more utilities as needed
EOF

cat > tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src"]
}
EOF

echo "✅ Shared utils package created"
```

---

## Step 10: Install All Dependencies

```bash
cd /Users/rvin.aca/Documents/ListingKo

# Install all workspace dependencies
pnpm install

# This may take 2-3 minutes
# Watch for any peer dependency warnings
```

---

## Step 11: Set Up Supabase Locally

```bash
# Initialize Supabase
supabase init

# Start local Supabase
supabase start

# This will:
# - Start PostgreSQL container
# - Start PostgREST API
# - Generate local API keys
# - Output connection details

# Save the output - you'll need the API keys for .env files
```

Save the output (look for lines like):
```
API URL: http://localhost:54321
anon key: eyJ...
service_role key: eyJ...
```

---

## Step 12: Create Environment Files

### Backend (.env.local)

```bash
cd apps/api

cat > .env.local << 'EOF'
# Copy from Supabase start output
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste-anon-key-here>
SUPABASE_SERVICE_ROLE_KEY=<paste-service-role-key-here>

# API
NEXT_PUBLIC_API_URL=http://localhost:3000

# AI (get from https://console.anthropic.com)
ANTHROPIC_API_KEY=sk-ant-...

# Monitoring (optional for now)
SENTRY_DSN=

# Environment
NODE_ENV=development
EOF

echo "⚠️  Update ANTHROPIC_API_KEY in .env.local"
```

### Web App (.env.local)

```bash
cd apps/web

cat > .env.local << 'EOF'
# Copy from Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste-anon-key-here>

# API
NEXT_PUBLIC_API_URL=http://localhost:3000

# Environment
NEXT_PUBLIC_ENV=development
EOF
```

### Mobile App (.env)

```bash
cd apps/mobile

cat > .env << 'EOF'
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<paste-anon-key-here>
EXPO_PUBLIC_API_URL=http://localhost:3000
EOF
```

---

## Step 13: Verify Setup

```bash
cd /Users/rvin.aca/Documents/ListingKo

# Run type checking on all workspaces
pnpm type-check

# Run linting
pnpm lint

# Format code
pnpm format

# Try building (this will take a few minutes)
pnpm build
```

---

## Step 14: Start Development Servers

In separate terminal windows:

**Terminal 1 - All apps in parallel:**
```bash
cd /Users/rvin.aca/Documents/ListingKo
pnpm dev
```

This starts:
- API on http://localhost:3000 (or next available port)
- Web on http://localhost:3001
- Mobile on http://localhost:19000

**Terminal 2 - Supabase (if stopped):**
```bash
cd /Users/rvin.aca/Documents/ListingKo
supabase start
```

---

## Step 15: Commit Scaffolding

```bash
cd /Users/rvin.aca/Documents/ListingKo

git add -A
git commit -m "chore: Project scaffolding - monorepo, apps, and configuration

- Initialize pnpm monorepo with workspaces
- Scaffold Next.js backend (apps/api)
- Scaffold Next.js web app (apps/web)
- Scaffold React Native + Expo mobile app (apps/mobile)
- Create shared packages (types, utils)
- Configure TypeScript, ESLint, Prettier
- Set up Supabase locally
- Add environment file templates
- Ready for Phase 2 (backend implementation)"
```

---

## ✅ Verification Checklist

```bash
# Test each app
cd apps/api && pnpm dev     # Should start on port 3000
cd apps/web && pnpm dev     # Should start on port 3001
cd apps/mobile && pnpm dev  # Should start on port 19000

# Verify Supabase
curl http://localhost:54321/health

# Verify dependencies
pnpm list --depth=0

# Verify TypeScript
pnpm type-check

# Verify lint
pnpm lint --max-warnings=0
```

---

## 🎉 Phase 1 Complete!

You now have:
- ✅ Monorepo structure
- ✅ All three apps scaffolded
- ✅ Shared packages ready
- ✅ TypeScript configured
- ✅ ESLint & Prettier set up
- ✅ Supabase running locally
- ✅ Environment files ready
- ✅ All dependencies installed

---

## Next: Phase 2

See `SETUP_COMPLETE.md` for Phase 2 (Backend Foundation) next steps.

Key tasks:
1. Apply database migrations from `DATABASE.md`
2. Set up authentication middleware
3. Create core API services

---

## Troubleshooting

### pnpm install fails
```bash
# Clear cache and retry
pnpm store prune
pnpm install
```

### Supabase start fails
```bash
# Make sure Docker is running
docker ps

# Reset Supabase
supabase stop
supabase start
```

### TypeScript errors
```bash
# Regenerate TypeScript
pnpm type-check
```

### Port conflicts
- API: Change port in `apps/api/next.config.js`
- Web: Change port in `apps/web/next.config.js`
- Mobile: Expo will use next available port

---

