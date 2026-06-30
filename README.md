# SELLIZI - Digital Commerce Platform

> Buy and sell digital products across Africa with seamless mobile money payments.

## Architecture

- **Frontend**: React 19 + Vite + Tailwind CSS 4 (Mobile-first)
- **Backend**: Supabase (Auth, Database, Storage, Edge Functions, Realtime)
- **Payments**: Ashtechpay API (16 African countries, Mobile Money)
- **PWA**: Service Worker, Web Manifest, Offline support

## Three Separate Spaces

### Buyer Space (`/buyer/*`) - NO LOGIN REQUIRED
- **Direct access** from welcome page - no signup or login needed
- Browse marketplace with categories, featured, trending
- Chariow-style product discovery with search and filters
- Access purchased products with email + 5-digit PIN
- Track orders, notifications, wishlist
- Support tickets with file uploads
- Optional signup for order tracking and profile

### Seller Space (`/seller/*`) - 40+ Tools
- **Signup required** - auto-redirects to seller dashboard after signup
- **Commerce**: Products (15 types), Orders, Customers, Inventory, Reviews
- **Analytics**: Revenue, Sales Chart, Visitors, Conversion Rate, Link Traffic, Reports
- **Marketing**: Coupons, Affiliates, Broadcasts, Automations, SEO, Templates
- **Finance**: Payouts, Custom Charges, Currencies
- **Communication**: Messages, Notifications, Support Tickets, Team, Support Channels
- **Settings**: Store, Profile, Email, Delivery, Design, Domain, Webhooks, Security

### Admin Space (`/admin/*`) - 30+ Tools (Accessed via `/adminentry`)
- Completely separate from seller/buyer spaces
- Uses Supabase service_role key (bypasses RLS)
- Users, Sellers, Stores, Products, Orders, Payments, Payouts management
- Broadcasts, Support Tickets, Notifications, Push Notifications
- AI Configurations (Grok, Gemini, Claude), Countries, Templates
- Security, Reports, Activity Logs, System Health, Maintenance

## Key Security

- **Admin**: Uses service_role key (bypasses RLS) - separate space
- **Sellers**: RLS restricted to own stores/products/orders
- **Buyers**: RLS restricted to own orders/notifications/access
- **Ashtechpay API key**: Stored in Supabase Edge Function secrets only
- **All other keys**: Set in Vercel environment variables

## Setup

### 1. Clone & Install
```bash
git clone <repo>
cd sellizi
npm install
```

### 2. Supabase Setup
```bash
# Run SQL migration in Supabase SQL Editor
# File: supabase/migrations/001_initial_schema.sql

# Deploy Edge Functions
supabase secrets set ASHTECHPAY_API_KEY=your_ashtechpay_key
bash deploy-supabase.sh
```

### 3. Vercel Environment Variables
Set in Vercel dashboard (Settings > Environment Variables):
- `VITE_SUPABASE_URL` = your Supabase URL
- `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
- `VITE_APP_URL` = your Vercel domain
- `VITE_VAPID_KEY` = your VAPID public key

### 4. Deploy
```bash
npm run build
# Deploy to Vercel
```

## Edge Functions (8)

| Function | Auth | Purpose |
|----------|------|---------|
| `ashtechpay-collect` | No JWT | Payment initiation |
| `ashtechpay-webhook` | No JWT | Payment callbacks |
| `ashtechpay-status` | JWT | Transaction status |
| `ashtechpay-fees` | JWT | Fee schedule |
| `ashtechpay-countries` | JWT | Countries/operators |
| `send-broadcast` | JWT | Admin broadcasts |
| `create-ticket` | JWT | Support tickets |
| `send-ticket-message` | JWT | Ticket messages + files |

## Database Tables (35)

### User Flow
- **Buyers**: Browse and buy without login. Optional signup for tracking.
- **Sellers**: Must signup → auto-redirect to seller dashboard → seller record auto-created
- **Admin**: Access via `/adminentry` → uses service_role (bypasses RLS)

1. profiles - User profiles
2. sellers - Seller-specific data (auto-created on signup)
3. stores - Seller stores  
3. products - Product listings
4. product_content - Delivery content
5. orders - Purchase orders
6. buyer_access - PIN-based access
7. payments - Transactions
8. notifications - User notifications
9. broadcasts - Admin broadcasts
10. support_tickets - Support tickets
11. ticket_messages - Real-time chat
12. analytics_views - View tracking
13. analytics_sales - Sales analytics
14. affiliates - Affiliate program
15. affiliate_clicks - Click tracking
16. payout_settings - Payout config
17. payouts - Payout transactions
18. reviews - Product reviews
19. coupons - Discount coupons
20. email_preferences - Email settings
21. legal_pages - Terms/Privacy
22. help_topics - Help content
23. ai_configs - AI providers
24. subscriptions - Subscriptions
25. product_delivery_data - Delivery data
26. custom_charges - Store charges
27. store_templates - Themes
28. push_subscriptions - Web push
29. admin_settings - App settings
30. activity_logs - Audit trail
31. store_followers - Store following (Chariow)
32. wishlists - Product wishlists (Chariow)
33. product_collections - Collections (Chariow)
34. collection_products - Collection items

## Supported Countries (Ashtechpay)

| Country | Code | Currency | Operators |
|---------|------|----------|-----------|
| Benin | BJ | XOF | Moov, MTN |
| Burkina Faso | BF | XOF | Moov, Orange |
| Cameroon | CM | XAF | MTN, Orange |
| Central African Rep. | CF | XAF | Orange |
| Congo | CG | XAF | Airtel, MTN |
| Cote d'Ivoire | CI | XOF | Moov, MTN, Orange, Wave |
| Gabon | GA | XAF | Airtel, Moov |
| Guinea Conakry | GN | GNF | MTN, Orange |
| Equatorial Guinea | GQ | XAF | Orange |
| Guinea-Bissau | GW | XOF | Orange |
| Mali | ML | XOF | Moov, Orange |
| Niger | NE | XOF | Airtel |
| DR Congo | CD | CDF | Afrimoney, Airtel, Orange, Vodacom |
| Senegal | SN | XOF | Free, Orange, Wave |
| Chad | TD | XAF | Airtel, Moov |
| Togo | TG | XOF | Flooz, T-Money |

## Product Types (15)

Each type has its own form fields matching how the product is delivered:
1. E-Book (title, author, file, cover)
2. Account - Proxy (protocol, server, port)
3. Account - Authenticated (username, password)
4. Account - Other (custom slots)
5. Video Course (chapters, modules)
6. Single Link (URL)
7. Software (version, platform, file)
8. Template/Theme (file, preview)
9. Music/Audio (file, duration)
10. Graphic Design (file, dimensions)
11. License Key (keys list)
12. Subscription Access (credentials, duration)
13. Document/Notes (file, pages)
14. Product Bundle (included products)
15. Digital Service (delivery time, revisions)

## Support

Email: honestansah@gmail.com

## License

MIT
