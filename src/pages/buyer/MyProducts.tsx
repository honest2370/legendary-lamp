import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Package, Heart, LogIn, Link2, FileDown, Copy, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { LoadingBlock, EmptyState, fmtMoney } from '@/components/shared/ui';

export function BuyerMyProducts() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [tab, setTab] = useState<'purchased' | 'wishlist'>('purchased');
  const [purchased, setPurchased] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [delivery, setDelivery] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!profile) {
      setLoading(false);
      return;
    }
    (async () => {
      const [ordersRes, wishRes] = await Promise.all([
        supabase.from('orders').select('id, amount, currency, status, created_at, products(*)').eq('buyer_id', profile.id).eq('status', 'completed').order('created_at', { ascending: false }),
        supabase.from('wishlists').select('id, products(*)').eq('user_id', profile.id),
      ]);
      setPurchased(ordersRes.data || []);
      setWishlist(wishRes.data || []);

      const orderIds = (ordersRes.data || []).map((o: any) => o.id);
      if (orderIds.length > 0) {
        const { data: deliveries } = await supabase.from('product_delivery_data').select('*').in('order_id', orderIds);
        const map: Record<string, any> = {};
        (deliveries || []).forEach((d: any) => (map[d.order_id] = d));
        setDelivery(map);
      }
      setLoading(false);
    })();
  }, [profile?.id]);

  const removeWishlist = async (id: string) => {
    await supabase.from('wishlists').delete().eq('id', id);
    setWishlist((prev) => prev.filter((w) => w.id !== id));
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied');
  };

  const submitReview = async (order: any) => {
    if (!profile) return;
    const { error } = await supabase.from('reviews').insert({
      product_id: order.products.id,
      user_id: profile.id,
      order_id: order.id,
      rating,
      comment: comment.trim() || null,
      is_verified: true,
    });
    if (error) return toast.error(error.message.includes('duplicate') ? 'You already reviewed this product' : 'Could not submit review');
    toast.success('Review submitted');
    setReviewing(null);
    setComment('');
    setRating(5);
  };

  if (!profile) {
    return (
      <div className="p-4 max-w-lg mx-auto animate-fade-in flex flex-col items-center justify-center min-h-[70vh] text-center">
        <LogIn className="w-10 h-10 text-primary mb-3" />
        <p className="text-base font-semibold dark:text-dark-text text-light-text mb-1">Sign in to see your products</p>
        <p className="text-sm dark:text-dark-muted text-light-muted mb-4">Or use Product Access if you checked out as a guest.</p>
        <div className="flex gap-2">
          <button onClick={() => navigate('/login')} className="btn-primary text-sm px-4 py-2">Sign in</button>
          <button onClick={() => navigate('/buyer/access')} className="btn-outline text-sm px-4 py-2">Product Access</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <h1 className="text-xl font-bold dark:text-dark-text text-light-text mb-4">My Products</h1>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('purchased')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${tab === 'purchased' ? 'bg-primary text-dark' : 'dark:bg-dark-surface bg-light-surface dark:text-dark-muted text-light-muted'}`}>Purchased</button>
        <button onClick={() => setTab('wishlist')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${tab === 'wishlist' ? 'bg-primary text-dark' : 'dark:bg-dark-surface bg-light-surface dark:text-dark-muted text-light-muted'}`}>Wishlist</button>
      </div>

      {loading ? (
        <LoadingBlock rows={4} />
      ) : tab === 'purchased' ? (
        purchased.length === 0 ? (
          <EmptyState icon={Package} title="No purchases yet" description="Products you buy will show up here, with access to whatever the seller delivers." />
        ) : (
          <div className="space-y-2">
            {purchased.map((o) => {
              const isOpen = openId === o.id;
              const d = delivery[o.id];
              return (
                <div key={o.id} className="card">
                  <button onClick={() => setOpenId(isOpen ? null : o.id)} className="w-full flex items-center justify-between gap-3 text-left">
                    <div className="min-w-0">
                      <p className="text-sm font-medium dark:text-dark-text text-light-text truncate">{o.products?.name}</p>
                      <p className="text-xs dark:text-dark-muted text-light-muted">{fmtMoney(o.amount, o.currency)}</p>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="mt-3 pt-3 border-t dark:border-dark-border border-light-border space-y-2">
                      {!d ? (
                        <p className="text-xs dark:text-dark-muted text-light-muted">Not delivered yet — check back soon.</p>
                      ) : (
                        <>
                          {Object.entries(d.content || {}).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between gap-2 dark:bg-dark-surface bg-light-surface rounded-lg p-2.5">
                              <div className="min-w-0">
                                <p className="text-xs dark:text-dark-muted text-light-muted capitalize">{key.replace(/_/g, ' ')}</p>
                                <p className="text-sm font-mono dark:text-dark-text text-light-text truncate">{String(value)}</p>
                              </div>
                              <button onClick={() => copy(String(value))}><Copy className="w-4 h-4 text-primary" /></button>
                            </div>
                          ))}
                          {(d.links || []).map((link: string, i: number) => (
                            <a key={i} href={link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary font-medium"><Link2 className="w-4 h-4" /> Open link {i + 1}</a>
                          ))}
                          {(d.files || []).map((file: string, i: number) => (
                            <a key={i} href={file} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary font-medium"><FileDown className="w-4 h-4" /> Download {i + 1}</a>
                          ))}
                        </>
                      )}

                      {reviewing === o.id ? (
                        <div className="pt-2 space-y-2">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <button key={n} onClick={() => setRating(n)}><Star className={`w-5 h-5 ${n <= rating ? 'fill-warning text-warning' : 'dark:text-dark-border text-light-border'}`} /></button>
                            ))}
                          </div>
                          <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience..." rows={2} className="input-field text-xs resize-none" />
                          <button onClick={() => submitReview(o)} className="btn-primary w-full text-xs py-2">Submit review</button>
                        </div>
                      ) : (
                        <button onClick={() => setReviewing(o.id)} className="text-xs text-primary font-medium pt-1">Leave a review</button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : wishlist.length === 0 ? (
        <EmptyState icon={Heart} title="Your wishlist is empty" description="Tap the heart icon on any product to save it here." />
      ) : (
        <div className="space-y-2">
          {wishlist.map((w) => (
            <div key={w.id} className="card flex items-center gap-3">
              <button onClick={() => navigate(`/buyer/product/${w.products.id}`)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <div className="w-10 h-10 rounded-lg dark:bg-dark-surface bg-light-surface flex items-center justify-center shrink-0 overflow-hidden">
                  {w.products.image_url ? <img src={w.products.image_url} className="w-full h-full object-cover" /> : <Package className="w-4 h-4 dark:text-dark-muted text-light-muted" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium dark:text-dark-text text-light-text truncate">{w.products.name}</p>
                  <p className="text-xs dark:text-dark-muted text-light-muted">{fmtMoney(w.products.price, w.products.currency)}</p>
                </div>
              </button>
              <button onClick={() => removeWishlist(w.id)}><Heart className="w-4 h-4 fill-danger text-danger" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
