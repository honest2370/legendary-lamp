import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Package, Search, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageHeader, LoadingBlock, EmptyState, ErrorState, StatusBadge, fmtMoney, fmtDateTime } from '@/components/shared/ui';

/* ----------------------------------- Products ----------------------------------- */

interface AdminProductRow {
  id: string;
  name: string;
  type: string;
  price: number;
  currency: string;
  is_active: boolean;
  total_sales: number;
  created_at: string;
  seller_id: string;
}

export function AdminProducts() {
  const [products, setProducts] = useState<AdminProductRow[]>([]);
  const [sellers, setSellers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = async () => {
    setLoading(true);
    const { data, error: err } = await supabase.from('products').select('*').order('created_at', { ascending: false }).limit(200);
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setProducts(data || []);
    const sellerIds = Array.from(new Set((data || []).map((p: any) => p.seller_id)));
    if (sellerIds.length) {
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', sellerIds);
      const map: Record<string, string> = {};
      (profiles || []).forEach((p: any) => (map[p.id] = p.full_name || p.email));
      setSellers(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => products.filter((p) => !query || p.name.toLowerCase().includes(query.toLowerCase())), [products, query]);

  const toggleActive = async (p: AdminProductRow) => {
    const { error: err } = await supabase.from('products').update({ is_active: !p.is_active }).eq('id', p.id);
    if (err) return toast.error('Could not update — has migration 008 been run?');
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_active: !x.is_active } : x)));
  };

  const remove = async (p: AdminProductRow) => {
    if (!window.confirm(`Remove "${p.name}" from the marketplace?`)) return;
    const { error: err } = await supabase.from('products').delete().eq('id', p.id);
    if (err) return toast.error('Could not delete — has migration 008 been run?');
    setProducts((prev) => prev.filter((x) => x.id !== p.id));
    toast.success('Product removed');
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Products" subtitle={`${products.length} listings`} />
      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 dark:text-dark-muted text-light-muted" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products..." className="input-field pl-9 text-sm" />
      </div>

      {loading ? (
        <LoadingBlock rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Package} title="No products" />
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <div key={p.id} className="card">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium dark:text-dark-text text-light-text truncate">{p.name}</p>
                <span className={`badge ${p.is_active ? 'badge-success' : 'badge-warning'}`}>{p.is_active ? 'Active' : 'Draft'}</span>
              </div>
              <p className="text-xs dark:text-dark-muted text-light-muted mb-2">{sellers[p.seller_id] || 'Unknown seller'} · {fmtMoney(p.price, p.currency)} · {p.total_sales} sold</p>
              <div className="flex gap-2">
                <button onClick={() => toggleActive(p)} className="flex-1 py-2 rounded-lg text-xs font-medium dark:bg-dark-surface bg-light-surface dark:text-dark-text text-light-text">
                  {p.is_active ? 'Unpublish' : 'Publish'}
                </button>
                <button onClick={() => remove(p)} className="flex-1 py-2 rounded-lg text-xs font-medium bg-danger/10 text-danger">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------ Orders ------------------------------------- */

interface AdminOrderRow {
  id: string;
  amount: number;
  currency: string;
  status: string;
  buyer_email: string;
  seller_id: string;
  reference: string | null;
  created_at: string;
  products: { name: string } | null;
}

const STATUS_FILTERS = ['all', 'pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'] as const;

export function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [sellers, setSellers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<typeof STATUS_FILTERS[number]>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('orders')
      .select('id, amount, currency, status, buyer_email, seller_id, reference, created_at, products(name)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setOrders((data as any) || []);
    const sellerIds = Array.from(new Set((data || []).map((o: any) => o.seller_id)));
    if (sellerIds.length) {
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', sellerIds);
      const map: Record<string, string> = {};
      (profiles || []).forEach((p: any) => (map[p.id] = p.full_name || p.email));
      setSellers(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => (filter === 'all' ? orders : orders.filter((o) => o.status === filter)), [orders, filter]);

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Orders" subtitle={`${orders.length} total`} />
      <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar">
        {STATUS_FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap ${filter === f ? 'bg-primary text-dark' : 'dark:bg-dark-surface bg-light-surface dark:text-dark-muted text-light-muted'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingBlock rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No orders" />
      ) : (
        <div className="space-y-2">
          {filtered.map((o) => {
            const isOpen = openId === o.id;
            return (
              <div key={o.id} className="card">
                <button onClick={() => setOpenId(isOpen ? null : o.id)} className="w-full flex items-center justify-between gap-3 text-left">
                  <div className="min-w-0">
                    <p className="text-sm font-medium dark:text-dark-text text-light-text truncate">{o.products?.name || 'Product'}</p>
                    <p className="text-xs dark:text-dark-muted text-light-muted truncate">{o.buyer_email} · {fmtDateTime(o.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold dark:text-dark-text text-light-text">{fmtMoney(o.amount, o.currency)}</p>
                      <StatusBadge status={o.status} />
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="mt-3 pt-3 border-t dark:border-dark-border border-light-border space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="dark:text-dark-muted text-light-muted">Seller</span><span className="dark:text-dark-text text-light-text">{sellers[o.seller_id] || '—'}</span></div>
                    <div className="flex justify-between"><span className="dark:text-dark-muted text-light-muted">Reference</span><span className="dark:text-dark-text text-light-text font-mono text-xs">{o.reference || '—'}</span></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
