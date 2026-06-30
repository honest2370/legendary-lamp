-- ============================================================
-- 003_seller_extra_features.sql
--
-- Adds 4 tables that the seller dashboard's "Team", "Webhooks",
-- "Integrations" and "Automations" pages need but that never
-- existed in 001_initial_schema.sql. RLS is enabled from the
-- start this time, not bolted on after.
--
-- HONESTY NOTE: these tables let a seller CONFIGURE team access,
-- webhooks, integrations and automations, and the UI fully
-- reads/writes them. But there is no background worker yet that
-- actually fires webhooks, runs automations, or enforces team
-- member permissions on login — that's a real backend job
-- (listening for DB events and dispatching them) beyond what a
-- frontend page can do. The pages say this plainly.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- TEAM_MEMBERS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES public.profiles(id),
  invited_email TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id),
  role TEXT DEFAULT 'staff' CHECK (role IN ('manager', 'staff', 'support')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'removed')),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_members_select" ON public.team_members FOR SELECT USING (
  auth.uid() = owner_id OR auth.uid() = user_id OR public.is_admin()
);
CREATE POLICY "team_members_write" ON public.team_members FOR ALL USING (
  auth.uid() = owner_id OR public.is_admin()
);

-- ------------------------------------------------------------
-- WEBHOOKS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES public.profiles(id),
  url TEXT NOT NULL,
  events TEXT[] DEFAULT ARRAY['order.completed'],
  secret TEXT,
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  last_status TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhooks_all" ON public.webhooks FOR ALL USING (
  auth.uid() = owner_id OR public.is_admin()
);

-- ------------------------------------------------------------
-- INTEGRATIONS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES public.profiles(id),
  provider TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "integrations_all" ON public.integrations FOR ALL USING (
  auth.uid() = owner_id OR public.is_admin()
);

-- ------------------------------------------------------------
-- AUTOMATIONS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.automations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('order_completed', 'new_customer', 'product_out_of_stock', 'cart_abandoned')),
  action_type TEXT NOT NULL CHECK (action_type IN ('send_notification', 'send_email', 'apply_coupon')),
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  times_triggered INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "automations_all" ON public.automations FOR ALL USING (
  auth.uid() = owner_id OR public.is_admin()
);

-- Requires public.is_admin() from 002_security_rls.sql to already exist.
-- Run 002 before this file.
