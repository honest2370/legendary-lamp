-- ============================================================
-- 004_messaging.sql
--
-- The original schema only had ticket_messages (seller <-> admin
-- support chat). There was no table at all for buyer <-> seller
-- product questions / messaging, which is what the "Messages"
-- seller page is supposed to show. Adding it here.
--
-- Buyers in this app can be guests (email + PIN, no auth.uid()),
-- so INSERT is left open rather than locked to auth.uid() — the
-- seller-side read/manage policies are still locked down.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES public.profiles(id),
  buyer_id UUID REFERENCES public.profiles(id),
  buyer_email TEXT NOT NULL,
  buyer_name TEXT,
  product_id UUID REFERENCES public.products(id),
  is_read_by_seller BOOLEAN DEFAULT false,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('buyer', 'seller')),
  sender_id UUID REFERENCES public.profiles(id),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_select" ON public.conversations FOR SELECT USING (
  auth.uid() = seller_id OR auth.uid() = buyer_id OR public.is_admin()
);
CREATE POLICY "conversations_insert" ON public.conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "conversations_update" ON public.conversations FOR UPDATE USING (
  auth.uid() = seller_id OR auth.uid() = buyer_id OR public.is_admin()
);

CREATE POLICY "messages_select" ON public.messages FOR SELECT USING (
  auth.uid() = (SELECT seller_id FROM public.conversations WHERE id = conversation_id)
  OR auth.uid() = (SELECT buyer_id FROM public.conversations WHERE id = conversation_id)
  OR public.is_admin()
);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_conversations_seller ON public.conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);

-- Requires public.is_admin() from 002_security_rls.sql to already exist.
