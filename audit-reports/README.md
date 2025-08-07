# CivicOS - Canadian Civic Engagement Platform

## 🚀 **DEPLOYMENT TRIGGER** - Latest deployment ready

A comprehensive Canadian civic engagement platform built with React, TypeScript, and Express.

## Features

- **Real-time voting system** on bills and legislation
- **Politician tracking** and statement analysis
- **News aggregation** with bias detection
- **Legal database** with Canadian law search
- **Identity verification** for secure voting
- **Gamification** with civic points and badges
- **Forum discussions** for civic engagement
- **Campaign finance** transparency tracking

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based Auth (no Replit)
- **Deployment**: Render

## Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

## Environment Variables

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `OLLAMA_BASE_URL` - Ollama server URL for local AI
- `OLLAMA_MODEL` - Ollama model name (default: mistral:latest)
- `STRIPE_SECRET_KEY` - Stripe payment processing
- `FRONTEND_BASE_URL` - Frontend base URL

## Development

```bash
# Start development server
npm run dev

# Type checking
npm run check

# Database migrations
npm run db:push
```

## Testing

### Backend Integration Tests
Run backend tests with:
```
npm run test:backend
```

### Frontend E2E Tests
Run frontend E2E tests with:
```
npm run test:frontend:e2e
```

## Test Structure

- **Backend integration tests:** `tests/` (e.g., `tests/auth.test.ts`)
- **Frontend E2E tests:** `tests/e2e/` (e.g., `tests/e2e/auth.e2e.ts`)

## Production Deployment

The application is configured for deployment on Render with:
- Automatic builds from GitHub
- Environment variable management
- Health check endpoints
- Production-ready security settings

---

**Status**: ✅ Production ready with comprehensive audit completed

> **Security Note:** Never use production data or secrets in test environments. Use dedicated test credentials and databases for all automated tests.
> **Test Safety:** Create a `.env.test` file with a test database connection string. Never use your production `.env` for tests. Example:
> 
> ```env
> DATABASE_URL=postgres://user:password@localhost:5432/civicos_test
> SESSION_SECRET=your_test_secret
> ```
