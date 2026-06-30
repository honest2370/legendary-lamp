-- ============================================================
-- 002_security_rls.sql
--
-- WHY THIS EXISTS:
-- 19 tables in 001_initial_schema.sql were created WITHOUT Row
-- Level Security enabled. That means the public anon key (which
-- is embedded in your deployed frontend and visible to anyone)
-- can currently read/write/delete rows in these tables directly
-- via the Supabase REST API — completely bypassing your app's
-- UI and any "seller_id = me" checks written in React.
--
-- Most seriously: ai_configs stores provider API keys in plain
-- text and had zero protection. payouts, payments, coupons,
-- affiliates, custom_charges, and subscriptions were also fully
-- open to read AND write by anyone.
--
-- Run this whole file once in the Supabase SQL Editor.
-- It is safe to re-run (DROP POLICY IF EXISTS guards included).
-- ============================================================

-- Helper: check if the current user is an admin, used by several
-- policies below. SECURITY DEFINER so it can read profiles even
-- under RLS.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ------------------------------------------------------------
-- COUPONS — store owner manages, anyone can read (buyers need
-- to validate codes at checkout)
-- ------------------------------------------------------------
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coupons_select" ON public.coupons;
DROP POLICY IF EXISTS "coupons_write" ON public.coupons;
CREATE POLICY "coupons_select" ON public.coupons FOR SELECT USING (true);
CREATE POLICY "coupons_write" ON public.coupons FOR ALL USING (
  auth.uid() = (SELECT owner_id FROM public.stores WHERE id = store_id) OR public.is_admin()
);

-- ------------------------------------------------------------
-- AFFILIATES — visible to the affiliate themself, the store
-- owner, or admin. Managed by the store owner (who invites
-- affiliates) or admin.
-- ------------------------------------------------------------
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "affiliates_select" ON public.affiliates;
DROP POLICY IF EXISTS "affiliates_write" ON public.affiliates;
CREATE POLICY "affiliates_select" ON public.affiliates FOR SELECT USING (
  auth.uid() = user_id
  OR auth.uid() = (SELECT owner_id FROM public.stores WHERE id = store_id)
  OR public.is_admin()
);
CREATE POLICY "affiliates_write" ON public.affiliates FOR ALL USING (
  auth.uid() = (SELECT owner_id FROM public.stores WHERE id = store_id) OR public.is_admin()
);

-- ------------------------------------------------------------
-- AFFILIATE_CLICKS — anyone can record a click (anonymous
-- tracking pixel/redirect), only the affiliate/store
-- owner/admin can read the data back.
-- ------------------------------------------------------------
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "affiliate_clicks_insert" ON public.affiliate_clicks;
DROP POLICY IF EXISTS "affiliate_clicks_select" ON public.affiliate_clicks;
CREATE POLICY "affiliate_clicks_insert" ON public.affiliate_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "affiliate_clicks_select" ON public.affiliate_clicks FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM public.affiliates WHERE id = affiliate_id)
  OR auth.uid() = (SELECT owner_id FROM public.stores WHERE id = (SELECT store_id FROM public.affiliates WHERE id = affiliate_id))
  OR public.is_admin()
);

-- ------------------------------------------------------------
-- PAYMENTS — visible to the buyer/seller on the linked order
-- or admin. Writes are reserved for the backend (service role
-- key in edge functions bypasses RLS entirely) and admin.
-- ------------------------------------------------------------
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payments_select" ON public.payments;
DROP POLICY IF EXISTS "payments_write" ON public.payments;
CREATE POLICY "payments_select" ON public.payments FOR SELECT USING (
  auth.uid() = (SELECT buyer_id FROM public.orders WHERE id = order_id)
  OR auth.uid() = (SELECT seller_id FROM public.orders WHERE id = order_id)
  OR public.is_admin()
);
CREATE POLICY "payments_write" ON public.payments FOR ALL USING (public.is_admin());

-- ------------------------------------------------------------
-- PAYOUTS — sellers can see and request their own payouts.
-- Only admin can change status (approve/process).
-- ------------------------------------------------------------
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payouts_select" ON public.payouts;
DROP POLICY IF EXISTS "payouts_insert" ON public.payouts;
DROP POLICY IF EXISTS "payouts_update" ON public.payouts;
CREATE POLICY "payouts_select" ON public.payouts FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "payouts_insert" ON public.payouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "payouts_update" ON public.payouts FOR UPDATE USING (public.is_admin());

-- ------------------------------------------------------------
-- SUBSCRIPTIONS — own records only, admin sees/manages all.
-- ------------------------------------------------------------
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscriptions_select" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_write" ON public.subscriptions;
CREATE POLICY "subscriptions_select" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "subscriptions_write" ON public.subscriptions FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- ------------------------------------------------------------
-- ANALYTICS_SALES — only the seller who made the sale (or
-- admin) can read it. Inserts happen from the payment webhook.
-- ------------------------------------------------------------
ALTER TABLE public.analytics_sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "analytics_sales_select" ON public.analytics_sales;
DROP POLICY IF EXISTS "analytics_sales_insert" ON public.analytics_sales;
CREATE POLICY "analytics_sales_select" ON public.analytics_sales FOR SELECT USING (auth.uid() = seller_id OR public.is_admin());
CREATE POLICY "analytics_sales_insert" ON public.analytics_sales FOR INSERT WITH CHECK (true);

-- ------------------------------------------------------------
-- ANALYTICS_VIEWS — anyone (including anonymous visitors) can
-- log a page view; only the store owner/admin can read them back.
-- ------------------------------------------------------------
ALTER TABLE public.analytics_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "analytics_views_select" ON public.analytics_views;
DROP POLICY IF EXISTS "analytics_views_insert" ON public.analytics_views;
CREATE POLICY "analytics_views_select" ON public.analytics_views FOR SELECT USING (
  auth.uid() = (SELECT owner_id FROM public.stores WHERE id = store_id) OR public.is_admin()
);
CREATE POLICY "analytics_views_insert" ON public.analytics_views FOR INSERT WITH CHECK (true);

-- ------------------------------------------------------------
-- ACTIVITY_LOGS — users can see their own log entries, admin
-- sees everything. Anyone can write a log entry about their
-- own action.
-- ------------------------------------------------------------
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "activity_logs_select" ON public.activity_logs;
DROP POLICY IF EXISTS "activity_logs_insert" ON public.activity_logs;
CREATE POLICY "activity_logs_select" ON public.activity_logs FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "activity_logs_insert" ON public.activity_logs FOR INSERT WITH CHECK (true);

-- ------------------------------------------------------------
-- AI_CONFIGS — admin only, full stop. Contains provider API keys.
-- ------------------------------------------------------------
ALTER TABLE public.ai_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ai_configs_admin_only" ON public.ai_configs;
CREATE POLICY "ai_configs_admin_only" ON public.ai_configs FOR ALL USING (public.is_admin());

-- ------------------------------------------------------------
-- ADMIN_SETTINGS — admin only.
-- ------------------------------------------------------------
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_settings_admin_only" ON public.admin_settings;
CREATE POLICY "admin_settings_admin_only" ON public.admin_settings FOR ALL USING (public.is_admin());

-- ------------------------------------------------------------
-- BROADCASTS (platform-wide, admin -> sellers/buyers) — admin only.
-- ------------------------------------------------------------
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "broadcasts_admin_only" ON public.broadcasts;
CREATE POLICY "broadcasts_admin_only" ON public.broadcasts FOR ALL USING (public.is_admin());

-- ------------------------------------------------------------
-- CUSTOM_CHARGES — readable by anyone (buyers need it at
-- checkout), managed by the store owner or admin.
-- ------------------------------------------------------------
ALTER TABLE public.custom_charges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "custom_charges_select" ON public.custom_charges;
DROP POLICY IF EXISTS "custom_charges_write" ON public.custom_charges;
CREATE POLICY "custom_charges_select" ON public.custom_charges FOR SELECT USING (true);
CREATE POLICY "custom_charges_write" ON public.custom_charges FOR ALL USING (
  auth.uid() = (SELECT owner_id FROM public.stores WHERE id = store_id) OR public.is_admin()
);

-- ------------------------------------------------------------
-- HELP_TOPICS / LEGAL_PAGES / STORE_TEMPLATES — public read
-- reference content, admin-managed.
-- ------------------------------------------------------------
ALTER TABLE public.help_topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "help_topics_select" ON public.help_topics;
DROP POLICY IF EXISTS "help_topics_write" ON public.help_topics;
CREATE POLICY "help_topics_select" ON public.help_topics FOR SELECT USING (is_published = true OR public.is_admin());
CREATE POLICY "help_topics_write" ON public.help_topics FOR ALL USING (public.is_admin());

ALTER TABLE public.legal_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "legal_pages_select" ON public.legal_pages;
DROP POLICY IF EXISTS "legal_pages_write" ON public.legal_pages;
CREATE POLICY "legal_pages_select" ON public.legal_pages FOR SELECT USING (is_published = true OR public.is_admin());
CREATE POLICY "legal_pages_write" ON public.legal_pages FOR ALL USING (public.is_admin());

ALTER TABLE public.store_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "store_templates_select" ON public.store_templates;
DROP POLICY IF EXISTS "store_templates_write" ON public.store_templates;
CREATE POLICY "store_templates_select" ON public.store_templates FOR SELECT USING (true);
CREATE POLICY "store_templates_write" ON public.store_templates FOR ALL USING (public.is_admin());

-- ------------------------------------------------------------
-- PRODUCT_CONTENT — general listing content (chapters, modules,
-- previews). Readable by anyone like products itself; only the
-- product's seller (or admin) can manage it.
-- ------------------------------------------------------------
ALTER TABLE public.product_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "product_content_select" ON public.product_content;
DROP POLICY IF EXISTS "product_content_write" ON public.product_content;
CREATE POLICY "product_content_select" ON public.product_content FOR SELECT USING (true);
CREATE POLICY "product_content_write" ON public.product_content FOR ALL USING (
  auth.uid() = (SELECT seller_id FROM public.products WHERE id = product_id) OR public.is_admin()
);

-- ------------------------------------------------------------
-- PRODUCT_DELIVERY_DATA — the actual secrets/keys/files handed
-- to a buyer after purchase. Locked to the seller who owns the
-- product and the buyer on that specific order, only.
-- ------------------------------------------------------------
ALTER TABLE public.product_delivery_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "delivery_data_select" ON public.product_delivery_data;
DROP POLICY IF EXISTS "delivery_data_write" ON public.product_delivery_data;
CREATE POLICY "delivery_data_select" ON public.product_delivery_data FOR SELECT USING (
  auth.uid() = (SELECT seller_id FROM public.products WHERE id = product_id)
  OR auth.uid() = (SELECT buyer_id FROM public.orders WHERE id = order_id)
  OR public.is_admin()
);
CREATE POLICY "delivery_data_write" ON public.product_delivery_data FOR ALL USING (
  auth.uid() = (SELECT seller_id FROM public.products WHERE id = product_id) OR public.is_admin()
);

-- ------------------------------------------------------------
-- COLLECTION_PRODUCTS — readable by anyone, managed by the
-- collection's store owner or admin.
-- ------------------------------------------------------------
ALTER TABLE public.collection_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "collection_products_select" ON public.collection_products;
DROP POLICY IF EXISTS "collection_products_write" ON public.collection_products;
CREATE POLICY "collection_products_select" ON public.collection_products FOR SELECT USING (true);
CREATE POLICY "collection_products_write" ON public.collection_products FOR ALL USING (
  auth.uid() = (SELECT owner_id FROM public.stores WHERE id = (SELECT store_id FROM public.product_collections WHERE id = collection_id))
  OR public.is_admin()
);

-- ============================================================
-- Done. Verify with:
--   select tablename, rowsecurity from pg_tables
--   where schemaname = 'public' order by tablename;
-- Every row should show rowsecurity = true.
-- ============================================================
