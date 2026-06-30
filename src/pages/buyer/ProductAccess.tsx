import { useState } from 'react';
import toast from 'react-hot-toast';
import { Lock, Package, Link2, FileDown, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { EmptyState } from '@/components/shared/ui';

interface ContentResult {
  product: { id: string; name: string; type: string; image_url: string | null; description: string | null };
  delivery: { delivery_type: string; content: Record<string, any>; links: string[]; files: string[] } | null;
}

export function BuyerProductAccess() {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ContentResult[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const lookup = async () => {
    if (!email.trim() || pin.length !== 5) return toast.error('Enter your email and 5-digit PIN');
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('get-purchase-content', {
      body: { email: email.trim().toLowerCase(), pin },
    });
    setLoading(false);
    if (error || data?.error) {
      return toast.error(data?.message || 'Invalid email or PIN');
    }
    setResults(data.results || []);
    if ((data.results || []).length === 0) toast('Found your account, but no delivery content yet — ask the seller', { icon: 'ℹ️' });
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied');
  };

  if (results) {
    return (
      <div className="p-4 max-w-lg mx-auto animate-fade-in">
        <h1 className="text-xl font-bold dark:text-dark-text text-light-text mb-1">Your Products</h1>
        <p className="text-sm dark:text-dark-muted text-light-muted mb-4">{email}</p>

        {results.length === 0 ? (
          <EmptyState icon={Package} title="Nothing delivered yet" description="The seller hasn't added delivery content for your order(s) yet. Check back soon." />
        ) : (
          <div className="space-y-2">
            {results.map((r) => {
              const isOpen = openId === r.product.id;
              return (
                <div key={r.product.id} className="card">
                  <button onClick={() => setOpenId(isOpen ? null : r.product.id)} className="w-full flex items-center justify-between gap-3 text-left">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg dark:bg-dark-surface bg-light-surface flex items-center justify-center shrink-0 overflow-hidden">
                        {r.product.image_url ? <img src={r.product.image_url} className="w-full h-full object-cover" /> : <Package className="w-4 h-4 dark:text-dark-muted text-light-muted" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium dark:text-dark-text text-light-text truncate">{r.product.name}</p>
                        <p className="text-xs dark:text-dark-muted text-light-muted capitalize">{r.product.type.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="mt-3 pt-3 border-t dark:border-dark-border border-light-border space-y-2">
                      {!r.delivery ? (
                        <p className="text-xs dark:text-dark-muted text-light-muted">Not delivered yet — the seller hasn't added content for this order.</p>
                      ) : (
                        <>
                          {Object.entries(r.delivery.content || {}).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between gap-2 dark:bg-dark-surface bg-light-surface rounded-lg p-2.5">
                              <div className="min-w-0">
                                <p className="text-xs dark:text-dark-muted text-light-muted capitalize">{key.replace(/_/g, ' ')}</p>
                                <p className="text-sm font-mono dark:text-dark-text text-light-text truncate">{String(value)}</p>
                              </div>
                              <button onClick={() => copy(String(value))} className="shrink-0"><Copy className="w-4 h-4 text-primary" /></button>
                            </div>
                          ))}
                          {(r.delivery.links || []).map((link: string, i: number) => (
                            <a key={i} href={link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary font-medium">
                              <Link2 className="w-4 h-4" /> Open link {i + 1}
                            </a>
                          ))}
                          {(r.delivery.files || []).map((file: string, i: number) => (
                            <a key={i} href={file} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary font-medium">
                              <FileDown className="w-4 h-4" /> Download file {i + 1}
                            </a>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <button onClick={() => { setResults(null); setPin(''); }} className="text-sm text-primary font-medium mt-4">Look up a different email</button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in flex flex-col justify-center min-h-[70vh]">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 mx-auto">
        <Lock className="w-7 h-7 text-primary" />
      </div>
      <h1 className="text-xl font-bold dark:text-dark-text text-light-text text-center mb-1">Product Access</h1>
      <p className="text-sm dark:text-dark-muted text-light-muted text-center mb-6">Enter your purchase email and PIN to view what you bought</p>
      <div className="space-y-3 max-w-sm mx-auto w-full">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email used to purchase" className="input-field" />
        <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 5))} placeholder="5-digit PIN" inputMode="numeric" maxLength={5} className="input-field text-center tracking-widest" />
        <button onClick={lookup} disabled={loading} className="btn-primary w-full py-3">{loading ? 'Checking...' : 'Access my products'}</button>
        <p className="text-xs dark:text-dark-muted text-light-muted text-center">No PIN yet? Use "Access My Purchases" from the sign-in screen after your first order.</p>
      </div>
    </div>
  );
}
