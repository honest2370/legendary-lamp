-- SELLIZI Database Schema - 35 Tables
-- Run this in Supabase SQL Editor
-- Admin uses service_role key which BYPASSES RLS entirely
-- Sellers/Buyers use anon/authenticated key with RLS
-- Buyers can browse without login (public access)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- 1. PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  username TEXT UNIQUE,
  phone TEXT,
  country TEXT,
  avatar_url TEXT,
  bio TEXT,
  whatsapp TEXT,
  role TEXT DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'admin')),
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  rating_avg DECIMAL(3,2) DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. SELLERS (Extended seller-specific data)
CREATE TABLE IF NOT EXISTS public.sellers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  store_name TEXT,
  store_description TEXT,
  business_type TEXT DEFAULT 'individual' CHECK (business_type IN ('individual', 'business', 'company')),
  business_name TEXT,
  business_email TEXT,
  business_phone TEXT,
  tax_id TEXT,
  payout_method TEXT DEFAULT 'mobile_money',
  payout_account_name TEXT,
  payout_account_number TEXT,
  payout_provider TEXT,
  payout_country TEXT,
  commission_rate DECIMAL(5,2) DEFAULT 5.00,
  total_revenue DECIMAL(15,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_products INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  verification_documents JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. STORES
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
  banner_url TEXT,
  description TEXT,
  currency TEXT DEFAULT 'XAF',
  social_links JSONB DEFAULT '{}',
  custom_domain TEXT,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  theme TEXT DEFAULT 'default',
  template TEXT DEFAULT 'modern',
  delivery_settings JSONB DEFAULT '{}',
  support_channels JSONB DEFAULT '{}',
  seo_meta JSONB DEFAULT '{}',
  total_views INTEGER DEFAULT 0,
  total_followers INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  type TEXT NOT NULL,
  price DECIMAL(15,2) NOT NULL,
  compare_price DECIMAL(15,2),
  currency TEXT DEFAULT 'XAF',
  image_url TEXT,
  gallery_urls JSONB DEFAULT '[]',
  category TEXT,
  tags JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_digital BOOLEAN DEFAULT true,
  stock_count INTEGER DEFAULT -1,
  total_sales INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  rating_avg DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  content_data JSONB DEFAULT '{}',
  delivery_method TEXT DEFAULT 'instant',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. PRODUCT_CONTENT (delivery content for different types)
CREATE TABLE IF NOT EXISTS public.product_content (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  title TEXT,
  description TEXT,
  url TEXT,
  file_url TEXT,
  file_size BIGINT,
  duration INTEGER,
  order_index INTEGER DEFAULT 0,
  is_preview BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  buyer_id UUID REFERENCES public.profiles(id),
  buyer_email TEXT NOT NULL,
  buyer_name TEXT,
  buyer_phone TEXT,
  product_id UUID REFERENCES public.products(id),
  seller_id UUID REFERENCES public.profiles(id),
  store_id UUID REFERENCES public.stores(id),
  amount DECIMAL(15,2) NOT NULL,
  fee_amount DECIMAL(15,2) DEFAULT 0,
  net_amount DECIMAL(15,2),
  currency TEXT DEFAULT 'XAF',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
  payment_method TEXT,
  payment_provider TEXT,
  transaction_id TEXT,
  reference TEXT,
  buyer_pin TEXT,
  delivery_status TEXT DEFAULT 'pending',
  delivery_data JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. BUYER_ACCESS (PIN-based product access)
CREATE TABLE IF NOT EXISTS public.buyer_access (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT NOT NULL,
  pin TEXT,
  order_id UUID REFERENCES public.orders(id),
  product_id UUID REFERENCES public.products(id),
  seller_id UUID REFERENCES public.profiles(id),
  is_active BOOLEAN DEFAULT true,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id),
  transaction_id TEXT UNIQUE,
  reference TEXT,
  amount DECIMAL(15,2),
  fee_amount DECIMAL(15,2),
  net_amount DECIMAL(15,2),
  currency TEXT,
  phone TEXT,
  operator TEXT,
  country_code TEXT,
  status TEXT DEFAULT 'pending',
  flow_type TEXT,
  otp_required BOOLEAN DEFAULT false,
  wave_url TEXT,
  raw_response JSONB DEFAULT '{}',
  webhook_data JSONB DEFAULT '{}',
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. BROADCASTS
CREATE TABLE IF NOT EXISTS public.broadcasts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'promo', 'alert')),
  target TEXT DEFAULT 'all' CHECK (target IN ('all', 'sellers', 'buyers', 'specific')),
  target_emails JSONB DEFAULT '[]',
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. SUPPORT_TICKETS
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed', 'resolved')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  category TEXT DEFAULT 'general',
  assigned_to UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. TICKET_MESSAGES (real-time chat)
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id),
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. ANALYTICS_VIEWS
CREATE TABLE IF NOT EXISTS public.analytics_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id),
  product_id UUID REFERENCES public.products(id),
  visitor_id TEXT,
  user_id UUID REFERENCES public.profiles(id),
  referrer TEXT,
  user_agent TEXT,
  country TEXT,
  ip_hash TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. ANALYTICS_SALES
CREATE TABLE IF NOT EXISTS public.analytics_sales (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id),
  seller_id UUID REFERENCES public.profiles(id),
  product_id UUID REFERENCES public.products(id),
  order_id UUID REFERENCES public.orders(id),
  amount DECIMAL(15,2),
  currency TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. AFFILIATES
CREATE TABLE IF NOT EXISTS public.affiliates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  store_id UUID REFERENCES public.stores(id),
  code TEXT UNIQUE NOT NULL,
  commission_pct DECIMAL(5,2) DEFAULT 10.00,
  total_clicks INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  total_earnings DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. AFFILIATE_CLICKS
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  affiliate_id UUID REFERENCES public.affiliates(id),
  referrer TEXT,
  ip_hash TEXT,
  converted BOOLEAN DEFAULT false,
  order_id UUID REFERENCES public.orders(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 16. PAYOUT_SETTINGS
CREATE TABLE IF NOT EXISTS public.payout_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  account_name TEXT,
  account_number TEXT,
  provider TEXT,
  country TEXT,
  is_default BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 17. PAYOUTS
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  method TEXT,
  transaction_id TEXT,
  metadata JSONB DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 18. REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  order_id UUID REFERENCES public.orders(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_verified BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 19. COUPONS
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(15,2),
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  min_order_amount DECIMAL(15,2),
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 20. EMAIL_PREFERENCES
CREATE TABLE IF NOT EXISTS public.email_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  order_notifications BOOLEAN DEFAULT true,
  price_drop_alerts BOOLEAN DEFAULT true,
  promotions_news BOOLEAN DEFAULT true,
  security_alerts BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 21. LEGAL_PAGES
CREATE TABLE IF NOT EXISTS public.legal_pages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  is_published BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 22. HELP_TOPICS
CREATE TABLE IF NOT EXISTS public.help_topics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  content TEXT,
  category TEXT,
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 23. AI_CONFIGS
CREATE TABLE IF NOT EXISTS public.ai_configs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  api_key TEXT,
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 24. SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  plan TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  amount DECIMAL(15,2),
  currency TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 25. PRODUCT_DELIVERY_DATA
CREATE TABLE IF NOT EXISTS public.product_delivery_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id),
  delivery_type TEXT,
  content JSONB DEFAULT '{}',
  slots JSONB DEFAULT '[]',
  links JSONB DEFAULT '[]',
  files JSONB DEFAULT '[]',
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 26. CUSTOM_CHARGES
CREATE TABLE IF NOT EXISTS public.custom_charges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('percentage', 'fixed')),
  value DECIMAL(15,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 27. STORE_TEMPLATES
CREATE TABLE IF NOT EXISTS public.store_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  preview_url TEXT,
  config JSONB DEFAULT '{}',
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 28. PUSH_SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys JSONB DEFAULT '{}',
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 29. ADMIN_SETTINGS
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB DEFAULT '{}',
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 30. ACTIVITY_LOGS
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 31. STORE_FOLLOWERS (Chariow feature)
CREATE TABLE IF NOT EXISTS public.store_followers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id, user_id)
);

-- 32. WISHLISTS (Chariow feature)
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- 33. PRODUCT_COLLECTIONS (Chariow feature)
CREATE TABLE IF NOT EXISTS public.product_collections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 34. COLLECTION_PRODUCTS
CREATE TABLE IF NOT EXISTS public.collection_products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  collection_id UUID REFERENCES public.product_collections(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  UNIQUE(collection_id, product_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_sellers_user ON public.sellers(user_id);
CREATE INDEX IF NOT EXISTS idx_products_seller ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_store ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(type);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured, is_active);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_email ON public.orders(buyer_email);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_analytics_store ON public.analytics_views(store_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON public.analytics_sales(date);
CREATE INDEX IF NOT EXISTS idx_affiliate_code ON public.affiliates(code);
CREATE INDEX IF NOT EXISTS idx_buyer_access_email ON public.buyer_access(email);
CREATE INDEX IF NOT EXISTS idx_payments_transaction ON public.payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_store_followers ON public.store_followers(store_id, user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user ON public.wishlists(user_id);

-- ============================================
-- RLS POLICIES
-- Admin uses service_role key (bypasses RLS entirely)
-- These policies only apply to authenticated seller/buyer users
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_collections ENABLE ROW LEVEL SECURITY;

-- PROFILES: Public read, own write
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- SELLERS: Public read, own write
CREATE POLICY "sellers_select" ON public.sellers FOR SELECT USING (true);
CREATE POLICY "sellers_insert" ON public.sellers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sellers_update" ON public.sellers FOR UPDATE USING (auth.uid() = user_id);

-- STORES: Public read, owner write
CREATE POLICY "stores_select" ON public.stores FOR SELECT USING (true);
CREATE POLICY "stores_insert" ON public.stores FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "stores_update" ON public.stores FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "stores_delete" ON public.stores FOR DELETE USING (auth.uid() = owner_id);

-- PRODUCTS: Public read, seller write (sellers only manage their own)
CREATE POLICY "products_select" ON public.products FOR SELECT USING (true);
CREATE POLICY "products_insert" ON public.products FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "products_update" ON public.products FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "products_delete" ON public.products FOR DELETE USING (auth.uid() = seller_id);

-- ORDERS: Buyers see own orders by ID or email, sellers see orders for their products
CREATE POLICY "orders_select_buyer" ON public.orders FOR SELECT USING (
  auth.uid() = buyer_id OR 
  buyer_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "orders_select_seller" ON public.orders FOR SELECT USING (
  auth.uid() = seller_id
);
CREATE POLICY "orders_insert" ON public.orders FOR INSERT WITH CHECK (true);

-- NOTIFICATIONS: Users see own only
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- SUPPORT_TICKETS: Users see own tickets
CREATE POLICY "tickets_select" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tickets_insert" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tickets_update" ON public.support_tickets FOR UPDATE USING (auth.uid() = user_id);

-- TICKET_MESSAGES: Users see messages in their tickets
CREATE POLICY "ticket_msgs_select" ON public.ticket_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid())
);
CREATE POLICY "ticket_msgs_insert" ON public.ticket_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid())
);

-- REVIEWS: Public read, authenticated write
CREATE POLICY "reviews_select" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- EMAIL_PREFERENCES: Own only
CREATE POLICY "email_prefs_all" ON public.email_preferences FOR ALL USING (auth.uid() = user_id);

-- PAYOUT_SETTINGS: Own only
CREATE POLICY "payout_settings_all" ON public.payout_settings FOR ALL USING (auth.uid() = user_id);

-- BUYER_ACCESS: Public read (needed for PIN verification)
CREATE POLICY "buyer_access_select" ON public.buyer_access FOR SELECT USING (true);
CREATE POLICY "buyer_access_insert" ON public.buyer_access FOR INSERT WITH CHECK (true);

-- PUSH_SUBSCRIPTIONS: Own only
CREATE POLICY "push_subs_all" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id);

-- STORE_FOLLOWERS: Public read, own write
CREATE POLICY "store_followers_select" ON public.store_followers FOR SELECT USING (true);
CREATE POLICY "store_followers_insert" ON public.store_followers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "store_followers_delete" ON public.store_followers FOR DELETE USING (auth.uid() = user_id);

-- WISHLISTS: Own only
CREATE POLICY "wishlists_all" ON public.wishlists FOR ALL USING (auth.uid() = user_id);

-- PRODUCT_COLLECTIONS: Public read, store owner write
CREATE POLICY "collections_select" ON public.product_collections FOR SELECT USING (true);
CREATE POLICY "collections_insert" ON public.product_collections FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid())
);
CREATE POLICY "collections_update" ON public.product_collections FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid())
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-create profile + seller record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'buyer');
  
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    user_role
  );
  
  INSERT INTO public.email_preferences (user_id) VALUES (NEW.id);
  
  -- Auto-create seller record if role is seller
  IF user_role = 'seller' THEN
    INSERT INTO public.sellers (user_id, store_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'My Store'));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_sellers_updated_at BEFORE UPDATE ON public.sellers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Increment product sales
CREATE OR REPLACE FUNCTION public.increment_product_sales(product_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.products SET total_sales = total_sales + 1 WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Toggle store follow
CREATE OR REPLACE FUNCTION public.toggle_store_follow(p_store_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_following BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.store_followers WHERE store_id = p_store_id AND user_id = p_user_id) INTO is_following;
  
  IF is_following THEN
    DELETE FROM public.store_followers WHERE store_id = p_store_id AND user_id = p_user_id;
    UPDATE public.stores SET total_followers = GREATEST(total_followers - 1, 0) WHERE id = p_store_id;
    UPDATE public.profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = p_user_id;
    RETURN false;
  ELSE
    INSERT INTO public.store_followers (store_id, user_id) VALUES (p_store_id, p_user_id);
    UPDATE public.stores SET total_followers = total_followers + 1 WHERE id = p_store_id;
    UPDATE public.profiles SET following_count = following_count + 1 WHERE id = p_user_id;
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Toggle wishlist
CREATE OR REPLACE FUNCTION public.toggle_wishlist(p_product_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  exists_row BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.wishlists WHERE product_id = p_product_id AND user_id = p_user_id) INTO exists_row;
  
  IF exists_row THEN
    DELETE FROM public.wishlists WHERE product_id = p_product_id AND user_id = p_user_id;
    RETURN false;
  ELSE
    INSERT INTO public.wishlists (product_id, user_id) VALUES (p_product_id, p_user_id);
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Default admin settings
INSERT INTO public.admin_settings (key, value, description) VALUES
  ('support_email', '"honestansah@gmail.com"', 'Support email address'),
  ('app_name', '"SELLIZI"', 'Application name'),
  ('maintenance_mode', 'false', 'Enable maintenance mode'),
  ('registration_enabled', 'true', 'Allow new registrations'),
  ('ai_providers', '[]', 'Configured AI providers'),
  ('vapid_public_key', '""', 'VAPID public key for push notifications')
ON CONFLICT (key) DO NOTHING;

-- Default legal pages
INSERT INTO public.legal_pages (slug, title, content) VALUES
  ('terms-of-service', 'Terms of Service', 'Terms of Service for SELLIZI platform. Contact: honestansah@gmail.com'),
  ('privacy-policy', 'Privacy Policy', 'Privacy Policy for SELLIZI platform. Contact: honestansah@gmail.com')
ON CONFLICT (slug) DO NOTHING;
