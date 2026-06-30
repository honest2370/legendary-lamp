import { useEffect, useState } from 'react';
import { Star, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { PageHeader, LoadingBlock, EmptyState, fmtDate } from '@/components/seller/ui';

interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  is_verified: boolean;
  created_at: string;
  products: { name: string } | null;
  profiles: { full_name: string | null; email: string } | null;
}

export function SellerReviews() {
  const { profile } = useAuth();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: products } = await supabase.from('products').select('id').eq('seller_id', profile.id);
      const ids = (products || []).map((p: any) => p.id);
      if (ids.length === 0) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('reviews')
        .select('id, rating, comment, is_verified, created_at, products(name), profiles(full_name, email)')
        .in('product_id', ids)
        .order('created_at', { ascending: false });
      setReviews((data as any) || []);
      setLoading(false);
    })();
  }, [profile?.id]);

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0.0';

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Reviews" subtitle={`${avg} average · ${reviews.length} reviews`} />
      {loading ? (
        <LoadingBlock rows={4} />
      ) : reviews.length === 0 ? (
        <EmptyState icon={MessageCircle} title="No reviews yet" description="Reviews left by buyers on your products will show up here." />
      ) : (
        <div className="space-y-2">
          {reviews.map((r) => (
            <div key={r.id} className="card">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium dark:text-dark-text text-light-text">{r.profiles?.full_name || r.profiles?.email || 'Buyer'}</p>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-warning text-warning' : 'dark:text-dark-border text-light-border'}`} />
                  ))}
                </div>
              </div>
              <p className="text-xs dark:text-dark-muted text-light-muted mb-1">{r.products?.name}</p>
              {r.comment && <p className="text-sm dark:text-dark-text text-light-text">{r.comment}</p>}
              <p className="text-xs dark:text-dark-muted text-light-muted mt-1">{fmtDate(r.created_at)} {r.is_verified && '· Verified purchase'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
