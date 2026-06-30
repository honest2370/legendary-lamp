import { useEffect, useState } from 'react';
import { LogIn, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { LoadingBlock, EmptyState, StatusBadge, fmtMoney, fmtDateTime } from '@/components/shared/ui';

export function BuyerOrders() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      setLoading(false);
      return;
    }
    supabase
      .from('orders')
      .select('id, amount, currency, status, delivery_status, created_at, products(name, image_url)')
      .eq('buyer_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders(data || []);
        setLoading(false);
      });
  }, [profile?.id]);

  if (!profile) {
    return (
      <div className="p-4 max-w-lg mx-auto animate-fade-in flex flex-col items-center justify-center min-h-[70vh] text-center">
        <LogIn className="w-10 h-10 text-primary mb-3" />
        <p className="text-base font-semibold dark:text-dark-text text-light-text mb-1">Sign in to see your orders</p>
        <p className="text-sm dark:text-dark-muted text-light-muted mb-4">Checked out as a guest? Use Product Access instead.</p>
        <div className="flex gap-2">
          <button onClick={() => navigate('/login')} className="btn-primary text-sm px-4 py-2">Sign in</button>
          <button onClick={() => navigate('/buyer/access')} className="btn-outline text-sm px-4 py-2">Product Access</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <h1 className="text-xl font-bold dark:text-dark-text text-light-text mb-4">My Orders</h1>
      {loading ? (
        <LoadingBlock rows={4} />
      ) : orders.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No orders yet" description="Your purchases will show up here once you buy something." />
      ) : (
        <div className="space-y-2">
          {orders.map((o) => (
            <div key={o.id} className="card flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg dark:bg-dark-surface bg-light-surface flex items-center justify-center shrink-0 overflow-hidden">
                {o.products?.image_url ? <img src={o.products.image_url} className="w-full h-full object-cover" /> : <ShoppingBag className="w-4 h-4 dark:text-dark-muted text-light-muted" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium dark:text-dark-text text-light-text truncate">{o.products?.name}</p>
                <p className="text-xs dark:text-dark-muted text-light-muted">{fmtDateTime(o.created_at)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold dark:text-dark-text text-light-text">{fmtMoney(o.amount, o.currency)}</p>
                <StatusBadge status={o.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
