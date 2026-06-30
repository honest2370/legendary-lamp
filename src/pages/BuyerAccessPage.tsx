import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function BuyerAccessPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'pin' | 'products'>('email');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [isNewBuyer, setIsNewBuyer] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [delivery, setDelivery] = useState<Record<string, any>>({});
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const loadDeliveryContent = async (pinValue: string) => {
    const { data } = await supabase.functions.invoke('get-purchase-content', { body: { email: email.toLowerCase(), pin: pinValue } });
    const map: Record<string, any> = {};
    (data?.results || []).forEach((r: any) => {
      if (r.product?.id) map[r.product.id] = r.delivery;
    });
    setDelivery(map);
  };

  const handleEmailSubmit = async () => {
    if (!email) { toast.error('Please enter your email'); return; }
    setLoading(true);
    try {
      const { data: access } = await supabase
        .from('buyer_access')
        .select('*, products(*)')
        .eq('email', email.toLowerCase())
        .eq('is_active', true);

      if (access && access.length > 0) {
        setIsNewBuyer(false);
        setStep('pin');
      } else {
        const { data: orders } = await supabase
          .from('orders')
          .select('*, products(*)')
          .eq('buyer_email', email.toLowerCase())
          .eq('status', 'completed');

        if (orders && orders.length > 0) {
          setIsNewBuyer(true);
          setStep('pin');
          toast('Create a 5-digit PIN to secure your purchases', { icon: '🔒' });
        } else {
          toast.error('No purchases found for this email');
        }
      }
    } catch (error) {
      toast.error('Error checking purchases');
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async () => {
    if (pin.length !== 5) { toast.error('PIN must be 5 digits'); return; }
    setLoading(true);
    try {
      if (isNewBuyer) {
        const { data: orders } = await supabase
          .from('orders')
          .select('*, products(*)')
          .eq('buyer_email', email.toLowerCase())
          .eq('status', 'completed');

        if (orders) {
          for (const order of orders) {
            await supabase.from('buyer_access').upsert({
              email: email.toLowerCase(),
              pin: pin,
              order_id: order.id,
              product_id: order.product_id,
              seller_id: order.seller_id,
              is_active: true,
            }, { onConflict: 'email,order_id' });
          }
        }
        toast.success('PIN created! You can now access your products.');
        setProducts(orders?.map(o => o.products) || []);
        setStep('products');
        loadDeliveryContent(pin);
      } else {
        const { data: access } = await supabase
          .from('buyer_access')
          .select('*, products(*)')
          .eq('email', email.toLowerCase())
          .eq('pin', pin)
          .eq('is_active', true);

        if (access && access.length > 0) {
          setProducts(access.map(a => a.products));
          setStep('products');
          toast.success('Access granted!');
          loadDeliveryContent(pin);
        } else {
          toast.error('Invalid PIN');
        }
      }
    } catch (error) {
      toast.error('Error verifying PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen dark:bg-dark bg-light flex flex-col px-6 py-12 safe-top">
      <button onClick={() => step === 'email' ? navigate('/') : setStep('email')} className="mb-8 p-2 rounded-xl dark:text-dark-text text-light-text self-start">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
      </button>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        {step === 'email' && (
          <div className="animate-fade-in">
            <div className="mb-8">
              <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </div>
              <h1 className="text-2xl font-bold dark:text-dark-text text-light-text">Access My Purchases</h1>
              <p className="text-sm dark:text-dark-muted text-light-muted mt-1">Enter the email you used to purchase</p>
            </div>
            <div className="space-y-4">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Purchase email" className="input-field" onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()} />
              <button onClick={handleEmailSubmit} disabled={loading} className="btn-primary w-full py-3.5 text-base disabled:opacity-50">
                {loading ? <div className="w-5 h-5 border-2 border-dark/30 border-t-dark rounded-full animate-spin" /> : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {step === 'pin' && (
          <div className="animate-fade-in">
            <div className="mb-8">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h1 className="text-2xl font-bold dark:text-dark-text text-light-text">{isNewBuyer ? 'Create PIN' : 'Enter PIN'}</h1>
              <p className="text-sm dark:text-dark-muted text-light-muted mt-1">{isNewBuyer ? 'Create a 5-digit PIN to secure your purchases' : 'Enter your 5-digit PIN'}</p>
            </div>
            <div className="space-y-4">
              <div className="flex justify-center gap-3">
                {[0,1,2,3,4].map(i => (
                  <div key={i} className={`w-12 h-14 rounded-xl flex items-center justify-center text-xl font-bold dark:bg-dark-surface bg-light-surface border-2 transition-all ${pin.length > i ? 'border-primary dark:text-dark-text text-light-text' : 'dark:border-dark-border border-light-border'}`}>
                    {pin[i] || ''}
                  </div>
                ))}
              </div>
              <input type="tel" maxLength={5} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} className="opacity-0 absolute" autoFocus />
              <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((n, i) => (
                  <button key={i} onClick={() => {
                    if (n === '⌫') setPin(p => p.slice(0, -1));
                    else if (n !== '' && pin.length < 5) setPin(p => p + n);
                  }} className={`h-14 rounded-xl font-semibold text-lg transition-all ${n === '' ? 'invisible' : 'dark:bg-dark-surface bg-light-surface dark:text-dark-text text-light-text active:scale-95'}`}>
                    {n}
                  </button>
                ))}
              </div>
              <button onClick={handlePinSubmit} disabled={loading || pin.length !== 5} className="btn-primary w-full py-3.5 text-base disabled:opacity-50">
                {loading ? <div className="w-5 h-5 border-2 border-dark/30 border-t-dark rounded-full animate-spin" /> : isNewBuyer ? 'Create & Access' : 'Access Products'}
              </button>
            </div>
          </div>
        )}

        {step === 'products' && (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold dark:text-dark-text text-light-text mb-6">My Products</h1>
            {products.length > 0 ? (
              <div className="space-y-3">
                {products.map((product: any, i: number) => {
                  const d = delivery[product?.id];
                  const isOpen = openIdx === i;
                  return (
                    <div key={i} className="card card-hover">
                      <button onClick={() => setOpenIdx(isOpen ? null : i)} className="w-full flex items-center gap-3 text-left">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold dark:text-dark-text text-light-text truncate">{product?.name || 'Product'}</h3>
                          <p className="text-xs dark:text-dark-muted text-light-muted capitalize">{product?.type || 'Digital'}</p>
                        </div>
                      </button>
                      {isOpen && (
                        <div className="mt-3 pt-3 border-t dark:border-dark-border border-light-border space-y-2">
                          {!d ? (
                            <p className="text-xs dark:text-dark-muted text-light-muted">Not delivered yet — check back soon.</p>
                          ) : (
                            <>
                              {Object.entries(d.content || {}).map(([key, value]: [string, any]) => (
                                <div key={key} className="flex items-center justify-between gap-2 dark:bg-dark-surface bg-light-surface rounded-lg p-2.5">
                                  <div className="min-w-0">
                                    <p className="text-xs dark:text-dark-muted text-light-muted capitalize">{key.replace(/_/g, ' ')}</p>
                                    <p className="text-sm font-mono dark:text-dark-text text-light-text truncate">{String(value)}</p>
                                  </div>
                                  <button onClick={() => { navigator.clipboard.writeText(String(value)); toast.success('Copied'); }} className="text-xs text-primary font-medium shrink-0">Copy</button>
                                </div>
                              ))}
                              {(d.links || []).map((link: string, li: number) => (
                                <a key={li} href={link} target="_blank" rel="noreferrer" className="block text-sm text-primary font-medium">Open link {li + 1}</a>
                              ))}
                              {(d.files || []).map((file: string, fi: number) => (
                                <a key={fi} href={file} target="_blank" rel="noreferrer" className="block text-sm text-primary font-medium">Download file {fi + 1}</a>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="card text-center py-8">
                <p className="dark:text-dark-muted text-light-muted">No products found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
