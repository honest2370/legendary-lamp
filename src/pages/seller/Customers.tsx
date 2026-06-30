import { useEffect, useMemo, useState } from 'react';
import { Users, Search, Mail, Phone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useSellerStore } from '@/hooks/useSellerStore';
import { PageHeader, LoadingBlock, EmptyState, ErrorState, fmtMoney, fmtDate } from '@/components/seller/ui';

interface Customer {
  email: string;
  name: string | null;
  phone: string | null;
  orderCount: number;
  totalSpent: number;
  lastOrder: string;
}

export function SellerCustomers() {
  const { profile } = useAuth();
  const { store } = useSellerStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    supabase
      .from('orders')
      .select('buyer_email, buyer_name, buyer_phone, amount, currency, status, created_at')
      .eq('seller_id', profile.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message);
          setLoading(false);
          return;
        }
        const map = new Map<string, Customer>();
        (data || []).forEach((o: any) => {
          const existing = map.get(o.buyer_email);
          if (existing) {
            existing.orderCount += 1;
            existing.totalSpent += Number(o.amount);
          } else {
            map.set(o.buyer_email, {
              email: o.buyer_email,
              name: o.buyer_name,
              phone: o.buyer_phone,
              orderCount: 1,
              totalSpent: Number(o.amount),
              lastOrder: o.created_at,
            });
          }
        });
        setCustomers(Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent));
        setLoading(false);
      });
  }, [profile?.id]);

  const filtered = useMemo(
    () =>
      customers.filter(
        (c) =>
          !query ||
          c.email.toLowerCase().includes(query.toLowerCase()) ||
          (c.name || '').toLowerCase().includes(query.toLowerCase())
      ),
    [customers, query]
  );

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Customers" subtitle={`${customers.length} unique buyers`} />

      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 dark:text-dark-muted text-light-muted" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customers..." className="input-field pl-9 text-sm" />
      </div>

      {loading ? (
        <LoadingBlock rows={4} />
      ) : error ? (
        <ErrorState message={error} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={customers.length === 0 ? 'No customers yet' : 'No matches'}
          description="Buyers who complete a purchase from your store will appear here."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <div key={c.email} className="card">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium dark:text-dark-text text-light-text">{c.name || c.email}</p>
                <p className="text-sm font-semibold dark:text-dark-text text-light-text">{fmtMoney(c.totalSpent, store?.currency)}</p>
              </div>
              <div className="flex items-center gap-3 text-xs dark:text-dark-muted text-light-muted">
                <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {c.email}</span>
                {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}</span>}
              </div>
              <p className="text-xs dark:text-dark-muted text-light-muted mt-1">
                {c.orderCount} order{c.orderCount > 1 ? 's' : ''} · last on {fmtDate(c.lastOrder)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
