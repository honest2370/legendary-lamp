import { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { PageHeader, LoadingBlock, EmptyState, ErrorState, StatusBadge, fmtMoney, fmtDateTime } from '@/components/seller/ui';

interface OrderRow {
  id: string;
  product_id: string | null;
  buyer_name: string | null;
  buyer_email: string;
  buyer_phone: string | null;
  amount: number;
  fee_amount: number;
  net_amount: number | null;
  currency: string;
  status: string;
  delivery_status: string;
  payment_method: string | null;
  reference: string | null;
  created_at: string;
  completed_at: string | null;
  products: { name: string } | null;
}

const STATUS_FILTERS = ['all', 'pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'] as const;
const DELIVERY_OPTIONS = ['pending', 'delivered', 'failed'];

export function SellerOrders() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<typeof STATUS_FILTERS[number]>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deliveryForm, setDeliveryForm] = useState<Record<string, string>>({});
  const [savingDelivery, setSavingDelivery] = useState<string | null>(null);
  const [deliveredContent, setDeliveredContent] = useState<Record<string, any>>({});

  const load = async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('orders')
      .select(
        'id, product_id, buyer_name, buyer_email, buyer_phone, amount, fee_amount, net_amount, currency, status, delivery_status, payment_method, reference, created_at, completed_at, products(name)'
      )
      .eq('seller_id', profile.id)
      .order('created_at', { ascending: false });
    if (err) setError(err.message);
    else setOrders((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [profile?.id]);

  const filtered = useMemo(
    () => (filter === 'all' ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter]
  );

  const updateDelivery = async (order: OrderRow, deliveryStatus: string) => {
    setUpdating(order.id);
    const { error: err } = await supabase.from('orders').update({ delivery_status: deliveryStatus }).eq('id', order.id);
    setUpdating(null);
    if (err) return toast.error('Could not update delivery status');
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, delivery_status: deliveryStatus } : o)));
    toast.success('Delivery status updated');
  };

  const toggleExpand = async (order: OrderRow) => {
    const isOpen = expanded === order.id;
    setExpanded(isOpen ? null : order.id);
    if (!isOpen && !(order.id in deliveredContent)) {
      const { data } = await supabase.from('product_delivery_data').select('*').eq('order_id', order.id).maybeSingle();
      setDeliveredContent((prev) => ({ ...prev, [order.id]: data || null }));
      if (data?.content) {
        setDeliveryForm((prev) => ({ ...prev, [order.id]: JSON.stringify(data.content, null, 2) }));
      }
    }
  };

  const saveDelivery = async (order: OrderRow) => {
    const text = deliveryForm[order.id]?.trim();
    if (!text) return toast.error('Enter what to deliver to the buyer');
    setSavingDelivery(order.id);
    // Try to parse as JSON (key: value per line is also fine, stored as plain text under "details")
    let content: Record<string, any>;
    try {
      content = JSON.parse(text);
    } catch {
      content = { details: text };
    }
    const { data, error } = await supabase
      .from('product_delivery_data')
      .upsert({ product_id: order.product_id, order_id: order.id, delivery_type: 'manual', content }, { onConflict: 'order_id' })
      .select()
      .single();
    setSavingDelivery(null);
    if (error) return toast.error('Could not save delivery content');
    setDeliveredContent((prev) => ({ ...prev, [order.id]: data }));
    await supabase.from('orders').update({ delivery_status: 'delivered' }).eq('id', order.id);
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, delivery_status: 'delivered' } : o)));
    toast.success('Delivered to buyer');
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Orders" subtitle={`${orders.length} total`} />

      <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap ${
              filter === f ? 'bg-primary text-dark' : 'dark:bg-dark-surface bg-light-surface dark:text-dark-muted text-light-muted'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingBlock rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={orders.length === 0 ? 'No orders yet' : 'No orders match this filter'}
          description="Orders placed by buyers for your products will show up here."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((o) => {
            const isOpen = expanded === o.id;
            return (
              <div key={o.id} className="card">
                <button
                  onClick={() => toggleExpand(o)}
                  className="w-full flex items-center justify-between gap-3 text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium dark:text-dark-text text-light-text truncate">
                      {o.products?.name || 'Product'}
                    </p>
                    <p className="text-xs dark:text-dark-muted text-light-muted truncate">
                      {o.buyer_name || o.buyer_email} · {fmtDateTime(o.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold dark:text-dark-text text-light-text">{fmtMoney(o.amount, o.currency)}</p>
                      <StatusBadge status={o.status} />
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 dark:text-dark-muted text-light-muted" />
                    ) : (
                      <ChevronDown className="w-4 h-4 dark:text-dark-muted text-light-muted" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-3 pt-3 border-t dark:border-dark-border border-light-border space-y-2 text-sm">
                    <div className="flex justify-between"><span className="dark:text-dark-muted text-light-muted">Buyer email</span><span className="dark:text-dark-text text-light-text">{o.buyer_email}</span></div>
                    {o.buyer_phone && <div className="flex justify-between"><span className="dark:text-dark-muted text-light-muted">Phone</span><span className="dark:text-dark-text text-light-text">{o.buyer_phone}</span></div>}
                    <div className="flex justify-between"><span className="dark:text-dark-muted text-light-muted">Reference</span><span className="dark:text-dark-text text-light-text font-mono text-xs">{o.reference || '—'}</span></div>
                    <div className="flex justify-between"><span className="dark:text-dark-muted text-light-muted">Payment method</span><span className="dark:text-dark-text text-light-text capitalize">{o.payment_method || '—'}</span></div>
                    <div className="flex justify-between"><span className="dark:text-dark-muted text-light-muted">Platform fee</span><span className="dark:text-dark-text text-light-text">{fmtMoney(o.fee_amount, o.currency)}</span></div>
                    <div className="flex justify-between"><span className="dark:text-dark-muted text-light-muted">Net to you</span><span className="dark:text-dark-text text-light-text font-semibold">{fmtMoney(o.net_amount ?? o.amount - (o.fee_amount || 0), o.currency)}</span></div>

                    <div className="pt-2">
                      <p className="text-xs dark:text-dark-muted text-light-muted mb-1.5">Delivery status</p>
                      <div className="flex gap-2">
                        {DELIVERY_OPTIONS.map((d) => (
                          <button
                            key={d}
                            disabled={updating === o.id}
                            onClick={() => updateDelivery(o, d)}
                            className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize ${
                              o.delivery_status === d
                                ? 'bg-primary text-dark'
                                : 'dark:bg-dark-surface bg-light-surface dark:text-dark-muted text-light-muted'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    {o.product_id && (
                      <div className="pt-3 border-t dark:border-dark-border border-light-border">
                        <p className="text-xs dark:text-dark-muted text-light-muted mb-1.5">
                          What buyer receives {deliveredContent[o.id] ? '(already sent — editing replaces it)' : ''}
                        </p>
                        <textarea
                          value={deliveryForm[o.id] || ''}
                          onChange={(e) => setDeliveryForm((prev) => ({ ...prev, [o.id]: e.target.value }))}
                          rows={3}
                          placeholder='e.g. license key, download link, or account details — plain text or JSON like {"key": "ABC-123"}'
                          className="input-field text-xs resize-none font-mono"
                        />
                        <button
                          onClick={() => saveDelivery(o)}
                          disabled={savingDelivery === o.id}
                          className="btn-primary w-full text-xs py-2 mt-2"
                        >
                          {savingDelivery === o.id ? 'Sending...' : 'Send to buyer'}
                        </button>
                      </div>
                    )}
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
