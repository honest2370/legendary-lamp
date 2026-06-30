-- ============================================================
-- 005_delivery_unique_constraint.sql
--
-- The seller "fulfill order" action upserts one delivery record
-- per order (on_conflict: order_id). Postgres requires a unique
-- constraint to match against for that — order_id had none.
-- ============================================================

ALTER TABLE public.product_delivery_data
  ADD CONSTRAINT product_delivery_data_order_id_key UNIQUE (order_id);

-- The buyer checkout flow upserts a PIN per (email, order_id) so that
-- retrying/resuming a checkout doesn't create duplicate access rows.
ALTER TABLE public.buyer_access
  ADD CONSTRAINT buyer_access_email_order_id_key UNIQUE (email, order_id);
