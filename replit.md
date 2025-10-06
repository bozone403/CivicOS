# CivicOS - Canadian Government Accountability Platform

## Overview
CivicOS is an independent Canadian civic engagement platform that promotes government accountability and transparency. The platform provides real-time access to government data, bill tracking, politician monitoring, and civic participation tools.

## Recent Changes (Replit Setup - October 6, 2025)

### Infrastructure Setup
- ✅ Created PostgreSQL database for the application
- ✅ Configured Vite dev server for Replit proxy (port 5000, 0.0.0.0 host)
- ✅ Configured backend server to listen on 0.0.0.0:5001
- ✅ Set up API proxy from frontend to backend
- ✅ Fixed database schema (user_follows composite primary key)
- ✅ Installed all dependencies (root and client)
- ✅ Configured deployment for autoscale

### Architecture
- **Frontend**: React + Vite on port 5000 (0.0.0.0)
- **Backend**: Express + TypeScript on port 5001 (0.0.0.0)
- **Database**: PostgreSQL (Replit managed)
- **ORM**: Drizzle ORM
- **Deployment**: Autoscale deployment configured

### Development Workflow
The application uses a custom `dev-replit.sh` script that:
1. Starts the backend server on port 5001
2. Starts the frontend dev server on port 5000
3. Frontend proxies API requests to backend

### Key Files
- `client/vite.config.ts` - Frontend dev server config with API proxy
- `server/index.ts` - Backend Express server
- `shared/schema.ts` - Database schema definitions
- `dev-replit.sh` - Development startup script
- `.replit` - Replit workflow configuration

### Environment Variables
Required environment variables (already configured in Replit):
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - JWT session secret
- `NODE_ENV` - Set to 'development' for local dev
- `PORT` - Backend port (defaults to 5001)

### Main Features
- **Political Intelligence Hub**: Track 128,000+ Canadian politicians, bills, and voting records
- **Civic Engagement Suite**: Petitions, discussions, and democratic participation
- **AI-Powered Assistance**: Civic chatbot and content analysis
- **Social Features**: User profiles, messaging, and community engagement
- **Transparency Tools**: Campaign finance tracking, procurement monitoring

### Project Structure
```
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types and schemas
├── database/        # Database migrations
├── scripts/         # Utility scripts
└── dev-replit.sh   # Development startup script
```

### Development Commands
- `npm run dev` - Start backend only
- `npm run db:push -- --force` - Push schema changes to database
- `npm run build` - Build both frontend and backend
- `bash dev-replit.sh` - Start full dev environment (used by workflow)

### Deployment
The application is configured for Replit autoscale deployment:
- Build: `npm run build` (builds both frontend and backend)
- Run: `node dist/server/index.js` (serves both API and static frontend)

### Notes
- The backend serves both API routes and built frontend static files in production
- In development, Vite dev server proxies API calls to the backend
- Database migrations run automatically on server startup
