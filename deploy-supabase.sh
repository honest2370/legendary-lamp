#!/bin/bash
# SELLIZI - Supabase Edge Functions Deployment Script
# Run this script to deploy all Ashtechpay edge functions

echo "🚀 Deploying SELLIZI Edge Functions to Supabase..."

# Set your Ashtechpay API key as a secret
echo "Setting ASHTECHPAY_API_KEY secret..."
supabase secrets set ASHTECHPAY_API_KEY=YOUR_API_KEY_HERE

# Deploy all edge functions
echo "Deploying ashtechpay-collect..."
supabase functions deploy ashtechpay-collect --no-verify-jwt

echo "Deploying ashtechpay-webhook..."
supabase functions deploy ashtechpay-webhook --no-verify-jwt

echo "Deploying ashtechpay-status..."
supabase functions deploy ashtechpay-status

echo "Deploying ashtechpay-fees..."
supabase functions deploy ashtechpay-fees

echo "Deploying ashtechpay-countries..."
supabase functions deploy ashtechpay-countries

echo ""
echo "✅ All edge functions deployed!"
echo ""
echo "📋 Next steps:"
echo "1. Run the SQL migration in Supabase SQL Editor:"
echo "   supabase/migrations/001_initial_schema.sql"
echo ""
echo "2. Set your Ashtechpay API key:"
echo "   supabase secrets set ASHTECHPAY_API_KEY=your_actual_key"
echo ""
echo "3. Update your Ashtechpay webhook URL to:"
echo "   https://gffzzhbvqorepaycpcqz.supabase.co/functions/v1/ashtechpay-webhook"
echo ""
echo "4. Deploy to Vercel with environment variables:"
echo "   VITE_SUPABASE_URL=https://gffzzhbvqorepaycpcqz.supabase.co"
echo "   VITE_SUPABASE_ANON_KEY=<your_anon_key>"
echo "   VITE_SUPABASE_SERVICE_ROLE=<your_service_role_key>"
echo "   VITE_ASHTECHPAY_API_KEY=<your_ashtechpay_key>"
