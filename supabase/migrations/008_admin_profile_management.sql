-- ============================================================
-- 008_admin_profile_management.sql
--
-- profiles_update only allowed auth.uid() = id, meaning admin had
-- no way to suspend, verify, or otherwise manage another user's
-- profile — every admin user-management action would silently
-- fail under RLS. This adds an admin override.
-- ============================================================

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (
  auth.uid() = id OR public.is_admin()
);

-- Also needed: admin must be able to view/manage sellers, products,
-- and orders that aren't their own. Re-checking and tightening these
-- so admin reads work, since several of these were either missing
-- an admin clause or (worse) wide open to any authenticated user.

-- SELLERS: was selectable by anyone (fine, storefront needs it) but
-- only updatable by the seller themself — admin needs override too.
DROP POLICY IF EXISTS "sellers_update" ON public.sellers;
CREATE POLICY "sellers_update" ON public.sellers FOR UPDATE USING (
  auth.uid() = user_id OR public.is_admin()
);

-- PRODUCTS: admin needs to be able to deactivate/remove any listing.
DROP POLICY IF EXISTS "products_update" ON public.products;
CREATE POLICY "products_update" ON public.products FOR UPDATE USING (
  auth.uid() = seller_id OR public.is_admin()
);
DROP POLICY IF EXISTS "products_delete" ON public.products;
CREATE POLICY "products_delete" ON public.products FOR DELETE USING (
  auth.uid() = seller_id OR public.is_admin()
);

-- ORDERS: admin needs read access across all orders for the admin
-- orders/payments dashboards (sellers/buyers already see their own).
DROP POLICY IF EXISTS "orders_select" ON public.orders;
CREATE POLICY "orders_select" ON public.orders FOR SELECT USING (
  auth.uid() = seller_id OR auth.uid() = buyer_id OR public.is_admin()
);

-- STORES: admin needs to be able to deactivate/feature any store.
DROP POLICY IF EXISTS "stores_update" ON public.stores;
CREATE POLICY "stores_update" ON public.stores FOR UPDATE USING (
  auth.uid() = owner_id OR public.is_admin()
);

-- REVIEWS: admin needs to be able to remove abusive/fake reviews.
DROP POLICY IF EXISTS "reviews_delete" ON public.reviews;
CREATE POLICY "reviews_delete" ON public.reviews FOR DELETE USING (
  auth.uid() = user_id OR public.is_admin()
);

-- SUPPORT_TICKETS: admin needs to see and respond to every ticket,
-- not just ones they personally opened.
DROP POLICY IF EXISTS "tickets_select" ON public.support_tickets;
CREATE POLICY "tickets_select" ON public.support_tickets FOR SELECT USING (
  auth.uid() = user_id OR public.is_admin()
);
DROP POLICY IF EXISTS "tickets_update" ON public.support_tickets;
CREATE POLICY "tickets_update" ON public.support_tickets FOR UPDATE USING (
  auth.uid() = user_id OR public.is_admin()
);

-- TICKET_MESSAGES: same problem — admin couldn't read or reply to
-- tickets they didn't personally open.
DROP POLICY IF EXISTS "ticket_msgs_select" ON public.ticket_messages;
CREATE POLICY "ticket_msgs_select" ON public.ticket_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid())
  OR public.is_admin()
);
DROP POLICY IF EXISTS "ticket_msgs_insert" ON public.ticket_messages;
CREATE POLICY "ticket_msgs_insert" ON public.ticket_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid())
  OR public.is_admin()
);

-- Requires public.is_admin() from 002_security_rls.sql to already exist.
