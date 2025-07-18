#!/bin/bash

# CivicOS Domain Update Script
echo "🌐 Updating CivicOS environment variables for your domain..."

# Get domain from user
read -p "Enter your domain (e.g., civicos.ca): " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo "❌ No domain provided. Exiting."
    exit 1
fi

# Update .env file with domain
echo "📝 Updating environment variables for domain: $DOMAIN"

# Create backup
cp hostinger-deploy/.env hostinger-deploy/.env.backup

# Update domain-specific variables
sed -i.bak "s|https://yourdomain.com|https://$DOMAIN|g" hostinger-deploy/.env
sed -i.bak "s|admin@yourdomain.com|admin@$DOMAIN|g" hostinger-deploy/.env

# Remove backup files
rm hostinger-deploy/.env.bak

echo "✅ Environment variables updated for domain: $DOMAIN"
echo "📁 Updated file: hostinger-deploy/.env"
echo ""
echo "🔧 Variables updated:"
echo "   - CORS_ORIGIN=https://$DOMAIN"
echo "   - BASE_URL=https://$DOMAIN"
echo "   - FRONTEND_BASE_URL=https://$DOMAIN"
echo "   - VITE_API_BASE_URL=https://$DOMAIN/api"
echo "   - ADMIN_EMAIL=admin@$DOMAIN"
echo ""
echo "🚀 Your deployment package is ready!"
echo "📤 Upload the contents of 'hostinger-deploy/' to your Hostinger root directory" 