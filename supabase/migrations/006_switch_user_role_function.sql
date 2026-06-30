-- ============================================================
-- 006_switch_user_role_function.sql
--
-- BuyerLayout.tsx calls supabase.rpc('switch_user_role', ...) when
-- a buyer taps "Switch to Seller" — but this function never existed
-- in 001_initial_schema.sql, so that button has been silently
-- failing (caught by the try/catch and shown as a toast error).
--
-- This also creates a `sellers` row when switching to seller, so
-- the new seller dashboard (useSellerStore hook) has something to
-- find immediately instead of erroring before its own auto-create
-- logic kicks in.
-- ============================================================

CREATE OR REPLACE FUNCTION public.switch_user_role(user_id UUID, new_role TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF new_role NOT IN ('buyer', 'seller') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;

  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'Not authorized to change this account';
  END IF;

  UPDATE public.profiles SET role = new_role, updated_at = now() WHERE id = user_id;

  IF new_role = 'seller' THEN
    INSERT INTO public.sellers (user_id, store_name)
    SELECT user_id, COALESCE(full_name, 'My Store') FROM public.profiles WHERE id = user_id
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END;
$$;
