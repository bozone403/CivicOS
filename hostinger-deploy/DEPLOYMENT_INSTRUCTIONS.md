# CivicOS Hostinger Deployment Instructions

## Quick Setup

1. **Upload Files**: Upload all files in this directory to your Hostinger root directory
2. **Environment Variables**: 
   - Rename `.env.example` to `.env`
   - Update all values with your actual credentials
3. **Start Application**: Run `./start.sh` or contact Hostinger support to start the Node.js app

## File Structure
```
/
├── dist/server/          # Backend compiled code
├── dist/shared/          # Shared schemas
├── public/               # Frontend build files
├── package.json          # Dependencies
├── .env                  # Environment variables (create from .env.example)
├── start.sh             # Startup script
└── .htaccess            # Apache configuration
```

## Environment Variables Required

- `DATABASE_URL`: Your Supabase database connection string
- `SESSION_SECRET`: A secure random string for JWT signing
- `CORS_ORIGIN`: Your domain (e.g., https://yourdomain.com)
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VITE_API_BASE_URL`: Your API base URL (e.g., https://yourdomain.com/api)

## Support

If you need help with deployment, contact Hostinger support and provide them with:
- This is a Node.js application
- It needs to run on port 5000
- It serves both API endpoints and static files
- The entry point is `dist/server/index.js`
