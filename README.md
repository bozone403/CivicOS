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
- **Authentication**: Replit Auth
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
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `STRIPE_SECRET_KEY` - Stripe payment processing
- `REPLIT_DOMAINS` - Authentication domains
- `REPL_ID` - Replit project ID
- `ISSUER_URL` - Authentication issuer URL
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

## Production Deployment

The application is configured for deployment on Render with:
- Automatic builds from GitHub
- Environment variable management
- Health check endpoints
- Production-ready security settings

---

**Status**: ✅ Production ready with comprehensive audit completed
