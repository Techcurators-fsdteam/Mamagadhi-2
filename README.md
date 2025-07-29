# Mamagadhi App - Turborepo Migration

A modern, scalable monorepo architecture for the Mamagadhi ride-sharing platform, built with Turborepo and designed for independent frontend and backend deployments.

## 🏗️ Architecture

```
mamagadhi-app/
├── apps/
│   ├── frontend/          # React application (Next.js) → Vercel
│   └── backend/           # API server (Next.js) → Digital Ocean
├── packages/
│   ├── shared-types/      # TypeScript interfaces
│   ├── eslint-config/     # Shared ESLint configuration
│   ├── typescript-config/ # Shared TypeScript configuration
│   └── ui/               # Shared UI components
└── migration-guides/      # Documentation and scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd mamagadhi-app

# Install dependencies
npm install

# Set up environment variables
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/backend/.env.example apps/backend/.env.local
# Edit the .env.local files with your configuration
```

### Development

Start both applications in development mode:
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:frontend  # http://localhost:3000
npm run dev:backend   # http://localhost:3001
```

### Building
```bash
# Build all packages
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📦 Packages

### Frontend (`apps/frontend`)
- **Framework**: Next.js 15.4.1 with React 19.1.0
- **Styling**: Tailwind CSS with Radix UI components
- **Authentication**: Firebase Auth
- **Deployment**: Vercel
- **Port**: 3000

**Key Features:**
- Server-side rendering
- Responsive design
- Real-time authentication
- Component library integration

### Backend (`apps/backend`)
- **Framework**: Next.js API routes
- **Database**: Supabase (PostgreSQL)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Deployment**: Digital Ocean
- **Port**: 3001

**Key Features:**
- RESTful API endpoints
- File upload handling
- Database operations
- CORS configuration for cross-origin requests

### Shared Types (`packages/shared-types`)
Common TypeScript interfaces used across frontend and backend:
- `UserProfile` - User data structure
- `UploadResponse` - File upload response format
- `ApiResponse<T>` - Standardized API response wrapper

## 🔧 Configuration

### Environment Variables

#### Frontend (`.env.local`)
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# Firebase (Client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Supabase (Client-side)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

#### Backend (`.env.local`)
```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Supabase (Server-side)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Cloudflare R2
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key
CLOUDFLARE_R2_BUCKET=your_bucket_name
CLOUDFLARE_R2_ENDPOINT=your_endpoint_url

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
```

## 🔗 API Integration

The frontend communicates with the backend through a centralized API client (`apps/frontend/src/lib/api-client.ts`):

```typescript
import { apiClient } from '@/lib/api-client';

// Health check
const health = await apiClient.health();

// File upload
const uploadResponse = await apiClient.getUploadUrl(fileName, fileType);
```

### Available Endpoints
- `GET /api/health` - Service health check
- `POST /api/get-upload-url` - Generate signed upload URL
- `POST /api/upload-document` - Process uploaded documents

## 🚀 Deployment

### Frontend (Vercel)
```bash
# Vercel CLI deployment
vercel --prod

# Or connect GitHub repository to Vercel dashboard
```

### Backend (Digital Ocean)
```bash
# Build for production
npm run build --filter=backend

# Deploy to Digital Ocean App Platform
# Or use Docker with the provided Dockerfile
```

## 🛠️ Development Workflow

1. **Feature Development**
   - Create feature branches
   - Make changes in appropriate apps/packages
   - Test locally with `npm run dev`

2. **Type Safety**
   - Use shared types from `packages/shared-types`
   - Run `npm run type-check` before commits

3. **Code Quality**
   - ESLint configuration in `packages/eslint-config`
   - Run `npm run lint` to check code style

4. **Testing**
   - Both servers should start without errors
   - API endpoints should return proper responses
   - Frontend should connect to backend successfully

## 📚 Migration Notes

This project was migrated from a Next.js monolith to a Turborepo architecture:

- **Original**: Single Next.js application
- **New**: Separate frontend and backend applications
- **Benefits**: 
  - Independent deployments
  - Better scalability
  - Shared code packages
  - Improved development workflow

For detailed migration steps, see `/migration-guides/MIGRATION_GUIDE.md`.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and type checking
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000 and 3001 are available
2. **Environment variables**: Verify all required variables are set
3. **CORS errors**: Check `ALLOWED_ORIGINS` in backend configuration
4. **Type errors**: Run `npm run type-check` to identify issues

### Getting Help

- Check the `/migration-guides/` directory for detailed documentation
- Review the API client implementation in `apps/frontend/src/lib/api-client.ts`
- Verify environment variable configuration

---

Built with ❤️ using Turborepo, Next.js, and modern web technologies.

You can build a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo build --filter=docs

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo build --filter=docs
yarn exec turbo build --filter=docs
pnpm exec turbo build --filter=docs
```

### Develop

To develop all apps and packages, run the following command:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev
yarn exec turbo dev
pnpm exec turbo dev
```

You can develop a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev --filter=web

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev --filter=web
yarn exec turbo dev --filter=web
pnpm exec turbo dev --filter=web
```

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo login

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo login
yarn exec turbo login
pnpm exec turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo link

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo link
yarn exec turbo link
pnpm exec turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.com/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.com/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.com/docs/reference/configuration)
- [CLI Usage](https://turborepo.com/docs/reference/command-line-reference)
