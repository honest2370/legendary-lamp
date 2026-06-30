import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Star, Heart, MessageCircle, ShoppingBag, ArrowLeft, X, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { LoadingBlock, EmptyState, fmtMoney, fmtDate } from '@/components/shared/ui';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compare_price: number | null;
  currency: string;
  image_url: string | null;
  gallery_urls: string[];
  category: string | null;
  type: string;
  rating_avg: number;
  rating_count: number;
  total_sales: number;
  total_views: number;
  seller_id: string;
  store_id: string | null;
  stores: { name: string; logo_url: string | null } | null;
}

export function BuyerProductView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlisted, setWishlisted] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [productRes, reviewsRes] = await Promise.all([
        supabase.from('products').select('*, stores(name, logo_url)').eq('id', id).single(),
        supabase.from('reviews').select('*, profiles(full_name)').eq('product_id', id).order('created_at', { ascending: false }).limit(10),
      ]);
      setProduct(productRes.data as any);
      setReviews(reviewsRes.data || []);
      setLoading(false);

      // Record a page view - this is the fix for the previously-empty
      // analytics_views table; nothing wrote to it before this existed.
      if (productRes.data) {
        let visitorId = localStorage.getItem('sellizi_visitor_id');
        if (!visitorId) {
          visitorId = crypto.randomUUID();
          localStorage.setItem('sellizi_visitor_id', visitorId);
        }
        supabase.from('analytics_views').insert({
          store_id: (productRes.data as any).store_id,
          product_id: id,
          user_id: profile?.id || null,
          referrer: document.referrer || null,
          visitor_id: visitorId,
        }).then();
        supabase.from('products').update({ total_views: (productRes.data as any).total_views + 1 }).eq('id', id).then();
      }

      if (profile) {
        const { data: wish } = await supabase.from('wishlists').select('id').eq('user_id', profile.id).eq('product_id', id).maybeSingle();
        setWishlisted(!!wish);
      }
    })();
  }, [id, profile?.id]);

  const toggleWishlist = async () => {
    if (!profile) return toast.error('Sign in to save items to your wishlist');
    if (wishlisted) {
      await supabase.from('wishlists').delete().eq('user_id', profile.id).eq('product_id', id);
      setWishlisted(false);
    } else {
      await supabase.from('wishlists').insert({ user_id: profile.id, product_id: id });
      setWishlisted(true);
      toast.success('Saved to wishlist');
    }
  };

  if (loading) return <div className="p-4 max-w-lg mx-auto"><LoadingBlock rows={4} /></div>;
  if (!product) return <div className="p-4 max-w-lg mx-auto"><EmptyState icon={ShoppingBag} title="Product not found" /></div>;

  return (
    <div className="max-w-lg mx-auto animate-fade-in pb-28">
      <div className="relative">
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-dark/60 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <button onClick={toggleWishlist} className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-dark/60 flex items-center justify-center">
          <Heart className={`w-5 h-5 ${wishlisted ? 'fill-danger text-danger' : 'text-white'}`} />
        </button>
        <div className="w-full aspect-square dark:bg-dark-surface bg-light-surface">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-12 h-12 dark:text-dark-muted text-light-muted" /></div>
          )}
        </div>
      </div>

      <div className="p-4">
        <p className="text-xs dark:text-dark-muted text-light-muted">{product.stores?.name}</p>
        <h1 className="text-xl font-bold dark:text-dark-text text-light-text mb-1">{product.name}</h1>
        <div className="flex items-center gap-3 mb-3">
          {product.rating_count > 0 && (
            <span className="flex items-center gap-1 text-sm dark:text-dark-text text-light-text">
              <Star className="w-4 h-4 fill-warning text-warning" /> {product.rating_avg.toFixed(1)} ({product.rating_count})
            </span>
          )}
          <span className="text-xs dark:text-dark-muted text-light-muted">{product.total_sales} sold</span>
        </div>

        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-2xl font-bold dark:text-dark-text text-light-text">{fmtMoney(product.price, product.currency)}</span>
          {product.compare_price && product.compare_price > product.price && (
            <span className="text-sm dark:text-dark-muted text-light-muted line-through">{fmtMoney(product.compare_price, product.currency)}</span>
          )}
        </div>

        {product.description && <p className="text-sm dark:text-dark-text text-light-text whitespace-pre-wrap mb-4">{product.description}</p>}

        <button onClick={() => setShowMessage(true)} className="w-full flex items-center justify-center gap-2 text-sm text-primary font-medium py-2.5 mb-6">
          <MessageCircle className="w-4 h-4" /> Ask the seller a question
        </button>

        <p className="text-sm font-semibold dark:text-dark-muted text-light-muted uppercase tracking-wider mb-3">Reviews</p>
        {reviews.length === 0 ? (
          <p className="text-sm dark:text-dark-muted text-light-muted mb-4">No reviews yet — be the first to buy and review.</p>
        ) : (
          <div className="space-y-2 mb-4">
            {reviews.map((r) => (
              <div key={r.id} className="card">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium dark:text-dark-text text-light-text">{r.profiles?.full_name || 'Buyer'}</p>
                  <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-warning text-warning' : 'dark:text-dark-border text-light-border'}`} />)}</div>
                </div>
                {r.comment && <p className="text-sm dark:text-dark-text text-light-text">{r.comment}</p>}
                <p className="text-xs dark:text-dark-muted text-light-muted mt-1">{fmtDate(r.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 dark:bg-dark bg-light border-t dark:border-dark-border border-light-border max-w-lg mx-auto">
        <button onClick={() => setShowCheckout(true)} className="btn-primary w-full py-3.5 text-base">
          <ShoppingBag className="w-5 h-5" /> Buy Now — {fmtMoney(product.price, product.currency)}
        </button>
      </div>

      {showCheckout && <CheckoutSheet product={product} onClose={() => setShowCheckout(false)} />}
      {showMessage && <MessageSheet product={product} onClose={() => setShowMessage(false)} />}
    </div>
  );
}

/* ------------------------------------ Checkout ------------------------------------ */

function CheckoutSheet({ product, onClose }: { product: Product; onClose: () => void }) {
  const { profile } = useAuth();
  const [step, setStep] = useState<'details' | 'otp' | 'pending' | 'success'>('details');
  const [email, setEmail] = useState(profile?.email || '');
  const [name, setName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState('');
  const [operator, setOperator] = useState('');
  const [countryCode, setCountryCode] = useState('CM');
  const [otp, setOtp] = useState('');
  const [orderId, setOrderId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pin, setPin] = useState('');

  const createOrderAndPay = async (otpValue?: string) => {
    if (!email.trim() || !name.trim() || !phone.trim() || !operator.trim()) {
      return toast.error('Fill in all fields');
    }
    setSubmitting(true);
    try {
      let currentOrderId = orderId;
      if (!currentOrderId) {
        const { data: order, error } = await supabase
          .from('orders')
          .insert({
            buyer_id: profile?.id || null,
            buyer_email: email.trim().toLowerCase(),
            buyer_name: name.trim(),
            buyer_phone: phone.trim(),
            product_id: product.id,
            seller_id: product.seller_id,
            store_id: product.store_id,
            amount: product.price,
            currency: product.currency,
            payment_method: 'mobile_money',
            payment_provider: 'ashtechpay',
          })
          .select('id')
          .single();
        if (error || !order) throw new Error('Could not create order');
        currentOrderId = order.id;
        setOrderId(currentOrderId);
      }

      const { data, error } = await supabase.functions.invoke('ashtechpay-collect', {
        body: {
          amount: product.price,
          currency: product.currency,
          phone: phone.trim(),
          operator: operator.trim(),
          country_code: countryCode,
          order_id: currentOrderId,
          otp: otpValue,
        },
      });

      if (error) throw new Error('Payment request failed');
      if (data?.error === 'otp_required' || data?.otp_required) {
        setStep('otp');
        return;
      }
      if (data?.error) throw new Error(data.message || 'Payment failed');

      setStep('pending');
      pollStatus(data.transaction_id, currentOrderId);
    } catch (e: any) {
      toast.error(e.message || 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  };

  const pollStatus = (txId: string, oId: string) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const { data } = await supabase.functions.invoke('ashtechpay-status', { body: { transaction_id: txId } });
      if (data?.status === 'success') {
        clearInterval(interval);
        await finalizePin(oId);
        setStep('success');
      } else if (data?.status === 'failed' || attempts > 20) {
        clearInterval(interval);
        if (attempts > 20) toast.error('Still processing — check My Products shortly');
        else toast.error('Payment failed');
        onClose();
      }
    }, 4000);
  };

  const finalizePin = async (oId: string) => {
    const generatedPin = Math.floor(10000 + Math.random() * 90000).toString();
    setPin(generatedPin);
    await supabase.from('buyer_access').upsert(
      { email: email.trim().toLowerCase(), pin: generatedPin, order_id: oId, product_id: product.id, seller_id: product.seller_id, is_active: true },
      { onConflict: 'email,order_id' }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg dark:bg-dark bg-light rounded-t-2xl p-5 pb-8 animate-slide-up max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold dark:text-dark-text text-light-text">Checkout</h2>
          <button onClick={onClose}><X className="w-5 h-5 dark:text-dark-muted text-light-muted" /></button>
        </div>

        {step === 'details' && (
          <div className="space-y-3">
            <p className="text-sm dark:text-dark-text text-light-text font-medium">{product.name} — {fmtMoney(product.price, product.currency)}</p>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="input-field text-sm" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (used to access your purchase)" className="input-field text-sm" />
            <div className="grid grid-cols-3 gap-2">
              <input value={countryCode} onChange={(e) => setCountryCode(e.target.value.toUpperCase())} placeholder="CM" className="input-field text-sm" />
              <input value={operator} onChange={(e) => setOperator(e.target.value)} placeholder="Operator (MTN/Orange)" className="input-field text-sm col-span-2" />
            </div>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Mobile money number" className="input-field text-sm" />
            <button onClick={() => createOrderAndPay()} disabled={submitting} className="btn-primary w-full py-3 text-sm">
              {submitting ? 'Processing...' : `Pay ${fmtMoney(product.price, product.currency)}`}
            </button>
            <p className="text-xs dark:text-dark-muted text-light-muted text-center flex items-center justify-center gap-1"><ShieldCheck className="w-3 h-3" /> Secured by Ashtechpay</p>
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-3">
            <p className="text-sm dark:text-dark-text text-light-text">Enter the OTP code sent to your phone to confirm payment.</p>
            <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="OTP code" className="input-field text-sm" />
            <button onClick={() => createOrderAndPay(otp)} disabled={submitting} className="btn-primary w-full py-3 text-sm">
              {submitting ? 'Confirming...' : 'Confirm payment'}
            </button>
          </div>
        )}

        {step === 'pending' && (
          <div className="flex flex-col items-center py-8">
            <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-sm dark:text-dark-text text-light-text font-medium">Confirm the payment on your phone</p>
            <p className="text-xs dark:text-dark-muted text-light-muted mt-1">This usually takes under a minute</p>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <ShieldCheck className="w-7 h-7 text-success" />
            </div>
            <p className="text-base font-bold dark:text-dark-text text-light-text mb-1">Payment successful!</p>
            <p className="text-sm dark:text-dark-muted text-light-muted mb-4">Your access PIN is</p>
            <p className="text-3xl font-bold tracking-widest text-primary mb-4">{pin}</p>
            <p className="text-xs dark:text-dark-muted text-light-muted mb-4">Save this PIN with your email ({email}) — you'll need both to access your purchase anytime from "Product Access".</p>
            <button onClick={onClose} className="btn-primary w-full py-3 text-sm">Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* --------------------------------- Message seller --------------------------------- */

function MessageSheet({ product, onClose }: { product: Product; onClose: () => void }) {
  const { profile } = useAuth();
  const [name, setName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const send = async () => {
    if (!email.trim() || !message.trim()) return toast.error('Enter your email and a message');
    setSending(true);
    const { data: conv, error } = await supabase
      .from('conversations')
      .insert({ store_id: product.store_id, seller_id: product.seller_id, buyer_id: profile?.id || null, buyer_email: email.trim().toLowerCase(), buyer_name: name.trim() || null, product_id: product.id })
      .select('id')
      .single();
    if (error || !conv) {
      setSending(false);
      return toast.error('Could not send message');
    }
    await supabase.from('messages').insert({ conversation_id: conv.id, sender_role: 'buyer', sender_id: profile?.id || null, message: message.trim() });
    setSending(false);
    setSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg dark:bg-dark bg-light rounded-t-2xl p-5 pb-8 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold dark:text-dark-text text-light-text">Message seller</h2>
          <button onClick={onClose}><X className="w-5 h-5 dark:text-dark-muted text-light-muted" /></button>
        </div>
        {sent ? (
          <div className="text-center py-6">
            <p className="text-sm dark:text-dark-text text-light-text font-medium mb-1">Message sent!</p>
            <p className="text-xs dark:text-dark-muted text-light-muted">The seller will see this in their Messages tab. There's no buyer inbox yet to view their reply in-app — they may reach back out via your email.</p>
            <button onClick={onClose} className="btn-primary w-full py-2.5 text-sm mt-4">Close</button>
          </div>
        ) : (
          <div className="space-y-3">
            {!profile && (
              <>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="input-field text-sm" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" className="input-field text-sm" />
              </>
            )}
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder={`Ask about "${product.name}"...`} className="input-field text-sm resize-none" />
            <button onClick={send} disabled={sending} className="btn-primary w-full py-2.5 text-sm">{sending ? 'Sending...' : 'Send message'}</button>
          </div>
        )}
      </div>
    </div>
  );
}
