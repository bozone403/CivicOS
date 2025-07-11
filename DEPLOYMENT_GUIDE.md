# CivicOS Deployment Guide

## 🚀 Quick Deployment

### Option 1: Automated Script
```bash
chmod +x deploy-all.sh
./deploy-all.sh
```

### Option 2: Manual Steps

#### 1. Push to GitHub
```bash
git add .
git commit -m "Deploy: Production configuration for civicos.ca"
git push origin main
```

#### 2. Build and Deploy
```bash
# Install dependencies
npm install
cd client && npm install && cd ..

# Build project
npm run build

# Deploy to Vercel
npx vercel --prod
```

## 🔧 Environment Variables for Vercel

Add these to your Vercel project settings:

```bash
DATABASE_URL=postgresql://postgres.wmpsjclnykcxtqwxfffv:0QZpuL2bShMezo2S@aws-0-us-east-2.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://wmpsjclnykcxtqwxfffv.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtcHNqY2xueWtjeHRxd3hmZmZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MjYwNDEsImV4cCI6MjA2NzQwMjA0MX0.hHrXn_D4e8f9JFLig5-DTVOzr5aCUpi3aeh922mNw4c
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtcHNqY2xueWtjeHRxd3hmZmZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyNjA0MSwiZXhwIjoyMDY3NDAyMDQxfQ.VeqLO3T2Ixu31MYrTxLX1Qod4rUxMfBcCGXmQlyrXY4
OPENAI_API_KEY=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
STRIPE_PUBLISHABLE_KEY=pk_live_51RXSIIG7smx2v2qq53S9qPt0UQoMQfRy7G8aTWU9XuHjRrbwvnoZSOIZuehqm6a9Gs3Evb7zgIKtifP3jWq9yukf00CJBb2Sfn
STRIPE_SECRET_KEY=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
NODE_ENV=production
SESSION_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12
CORS_ORIGIN=https://civicos.ca
JWT_SECRET=civicos-jwt-secret-key-2024
ENABLE_STRIPE_PAYMENTS=true
ENABLE_OPENAI_INTEGRATION=true
ENABLE_SUPABASE_AUTH=true
```

## 🔗 Production URLs

- **Frontend:** https://civicos.ca
- **Health Check:** https://civicos.ca/health
- **API Test:** https://civicos.ca/api/auth/user

## 📋 Post-Deployment Checklist

- [ ] Environment variables set in Vercel
- [ ] Database connection working
- [ ] Authentication flow working
- [ ] API endpoints responding
- [ ] Frontend loading correctly
- [ ] CORS configured properly

## 🐛 Troubleshooting

### Build Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
cd client && rm -rf node_modules package-lock.json && npm install && cd ..
```

### Deployment Issues
```bash
# Check Vercel logs
npx vercel logs

# Redeploy
npx vercel --prod --force
``` 