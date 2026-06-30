import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface SellerRow {
  id: string;
  user_id: string;
  store_name: string | null;
  store_description: string | null;
  business_type: string;
  business_name: string | null;
  business_email: string | null;
  business_phone: string | null;
  payout_method: string;
  payout_account_name: string | null;
  payout_account_number: string | null;
  payout_provider: string | null;
  payout_country: string | null;
  commission_rate: number;
  total_revenue: number;
  total_orders: number;
  total_products: number;
  average_rating: number;
  is_verified: boolean;
  settings: Record<string, any>;
}

export interface StoreRow {
  id: string;
  owner_id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  banner_url: string | null;
  description: string | null;
  currency: string;
  social_links: Record<string, any>;
  custom_domain: string | null;
  is_active: boolean;
  theme: string;
  template: string;
  delivery_settings: Record<string, any>;
  support_channels: Record<string, any>;
  seo_meta: Record<string, any>;
  total_views: number;
  total_followers: number;
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40) || 'store';
}

/**
 * Loads the current seller's `sellers` row and `stores` row.
 * If the seller has no store yet (a gap in the current signup flow,
 * which only creates `profiles` + `sellers`), one is auto-created here
 * so every other seller feature has a store_id to attach to.
 */
export function useSellerStore() {
  const { user, profile } = useAuth();
  const [seller, setSeller] = useState<SellerRow | null>(null);
  const [store, setStore] = useState<StoreRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // 1. Ensure a `sellers` row exists
      let { data: sellerRow } = await supabase
        .from('sellers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!sellerRow) {
        const { data: created, error: createErr } = await supabase
          .from('sellers')
          .insert({ user_id: user.id, store_name: profile?.full_name || 'My Store' })
          .select('*')
          .single();
        if (createErr) throw createErr;
        sellerRow = created;
      }
      setSeller(sellerRow);

      // 2. Ensure a `stores` row exists
      let { data: storeRow } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!storeRow) {
        const baseName = sellerRow?.store_name || profile?.full_name || 'My Store';
        const slug = `${slugify(baseName)}-${user.id.slice(0, 6)}`;
        const { data: created, error: createErr } = await supabase
          .from('stores')
          .insert({ owner_id: user.id, name: baseName, slug })
          .select('*')
          .single();
        if (createErr) throw createErr;
        storeRow = created;
      }
      setStore(storeRow);
    } catch (e: any) {
      console.error('useSellerStore error:', e);
      setError(e.message || 'Failed to load store');
    } finally {
      setLoading(false);
    }
  }, [user, profile?.full_name]);

  useEffect(() => {
    load();
  }, [load]);

  const refreshSeller = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('sellers').select('*').eq('user_id', user.id).maybeSingle();
    if (data) setSeller(data);
  }, [user]);

  const refreshStore = useCallback(async () => {
    if (!store) return;
    const { data } = await supabase.from('stores').select('*').eq('id', store.id).maybeSingle();
    if (data) setStore(data);
  }, [store]);

  return { seller, store, loading, error, refresh: load, refreshSeller, refreshStore };
}
