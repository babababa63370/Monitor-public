# AI Sentinel - Uptime Monitoring Platform

## Overview

AI Sentinel is a full-stack website uptime monitoring application. Users register, add websites to monitor, and the system periodically checks their availability, recording response times and up/down status. The app features a dashboard with real-time stats, per-site detail views with response time charts, a live monitoring grid, and AI-powered site analysis via OpenAI integration.

The stack is a monorepo with:
- **Frontend**: React + TypeScript SPA (Vite)
- **Backend**: Express.js API server (Node/TypeScript)
- **Database**: PostgreSQL with Drizzle ORM
- **UI**: shadcn/ui component library with Tailwind CSS (dark theme)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure
- `client/` — React frontend (Vite dev server, builds to `dist/public/`)
- `server/` — Express backend (TypeScript, runs via tsx in dev, esbuild bundle in prod)
- `shared/` — Shared code between client and server (schema, route definitions, types)
- `migrations/` — Drizzle-generated database migration files

### Frontend Architecture
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: `wouter` (lightweight client-side router)
- **State/Data**: TanStack React Query for server state, with polling intervals (10-30s) for real-time updates
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS
- **Charts**: Recharts for response time visualization (AreaChart)
- **Forms**: react-hook-form with zod validation via @hookform/resolvers
- **Auth**: JWT stored in localStorage, sent as `Authorization: Bearer <token>` header
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend Architecture
- **Framework**: Express.js on Node.js with TypeScript
- **Entry**: `server/index.ts` creates HTTP server, registers routes, serves static in production or Vite middleware in dev
- **API Pattern**: All routes under `/api/` prefix, defined in `server/routes.ts`
- **Route Contract**: `shared/routes.ts` defines a typed API contract object (`api`) with paths, methods, input schemas, and response schemas using Zod. Both client and server import this.
- **Auth**: JWT-based authentication (bcryptjs for password hashing, jsonwebtoken for tokens). Middleware `authenticateToken` protects routes.
- **Storage Layer**: `server/storage.ts` defines an `IStorage` interface implemented by `DatabaseStorage` class, abstracting all DB operations
- **Dev/Prod**: In development, Vite middleware serves the frontend with HMR. In production, pre-built static files are served from `dist/public/`.

### Database
- **Engine**: PostgreSQL (required via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-to-validation integration
- **Schema** (`shared/schema.ts`):
  - `users` — id, email, password (hashed), role (admin/user), createdAt
  - `sites` — id, userId (FK), name, url, intervalMinutes, isActive, lastChecked, createdAt
  - `logs` — id, siteId (FK), status (UP/DOWN), responseTime (ms), createdAt
- **Additional tables** (`shared/models/chat.ts`): `conversations` and `messages` for AI chat integration (Replit integrations)
- **Push migrations**: `npm run db:push` uses drizzle-kit to push schema changes directly

### API Routes
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Login, returns JWT token
- `GET /api/auth/me` — Get current user (authenticated)
- `GET /api/sites` — List user's sites (authenticated)
- `GET /api/sites/:id` — Get site details with stats (authenticated)
- `POST /api/sites` — Add new site (authenticated)
- `PUT /api/sites/:id` — Update site (authenticated)
- `DELETE /api/sites/:id` — Delete site (authenticated)
- `GET /api/sites/:siteId/logs` — Get monitoring logs for a site (authenticated)
- AI analysis endpoint for site diagnostics (uses OpenAI)

### Build Process
- `script/build.ts` handles production builds: Vite builds the client, esbuild bundles the server
- Server dependencies are selectively bundled (allowlist) vs externalized to optimize cold start times
- Output goes to `dist/` (server as `index.cjs`, client as `dist/public/`)

### Key Pages
- `/auth` — Login/Register (tabs)
- `/` and `/sites` — Dashboard with stat cards and site list
- `/sites/:id` — Site detail view with response time charts, logs, AI analysis
- `/monitoring` — Live monitor grid showing all sites' current status

## External Dependencies

### Database
- **PostgreSQL** — Primary data store, connected via `DATABASE_URL` environment variable
- **Drizzle ORM** — Schema management and query building
- **connect-pg-simple** — Available for session storage (though JWT is primary auth)

### AI / OpenAI
- **OpenAI API** — Used for AI-powered site analysis and chat features
- Configured via `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` environment variables
- Replit AI Integrations modules in `server/replit_integrations/` provide chat, audio, image, and batch processing capabilities

### Authentication
- **jsonwebtoken** — JWT token generation and verification
- **bcryptjs** — Password hashing
- **SESSION_SECRET** env var — Used as JWT signing secret (falls back to "default_secret")

### Environment Variables Required
- `DATABASE_URL` — PostgreSQL connection string (required)
- `SESSION_SECRET` — JWT signing secret (recommended)
- `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI API key (for AI features)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — OpenAI base URL (for AI features)