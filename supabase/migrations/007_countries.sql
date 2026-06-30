-- ============================================================
-- 007_countries.sql
--
-- The admin sidebar links to "Countries & Ops" but no countries
-- table existed anywhere in 001_initial_schema.sql. Adding a
-- minimal one so admin can manage supported countries/currencies
-- for payment operations.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.countries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  currency TEXT NOT NULL,
  phone_prefix TEXT,
  is_active BOOLEAN DEFAULT true,
  payment_methods JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "countries_select" ON public.countries FOR SELECT USING (true);
CREATE POLICY "countries_write" ON public.countries FOR ALL USING (public.is_admin());

-- Seed a few common ones so the page isn't empty on first load.
INSERT INTO public.countries (name, code, currency, phone_prefix, payment_methods)
VALUES
  ('Cameroon', 'CM', 'XAF', '+237', '["mobile_money"]'),
  ('Nigeria', 'NG', 'NGN', '+234', '["mobile_money", "bank_transfer"]'),
  ('Ghana', 'GH', 'GHS', '+233', '["mobile_money"]'),
  ('Kenya', 'KE', 'KES', '+254', '["mobile_money"]'),
  ('Ivory Coast', 'CI', 'XOF', '+225', '["mobile_money"]')
ON CONFLICT (code) DO NOTHING;

-- Requires public.is_admin() from 002_security_rls.sql to already exist.
