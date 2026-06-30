import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { fmtMoney, fmtDateTime } from '@/components/shared/ui';

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [stats, setStats] = useState({ orders: 0, products: 0, spent: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      setLoading(false);
      return;
    }
    supabase
      .from('orders')
      .select('id, amount, currency, status, created_at, products(name, image_url)')
      .eq('buyer_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const completed = (data || []).filter((o: any) => o.status === 'completed');
        setStats({
          orders: data?.length || 0,
          products: completed.length,
          spent: completed.reduce((s: number, o: any) => s + Number(o.amount), 0),
        });
        setRecent((data || []).slice(0, 3));
        setLoading(false);
      });
  }, [profile?.id]);

  const quickActions = [
    { label: 'Browse Shop', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z', path: '/buyer/shop', color: 'primary' },
    { label: 'My Products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', path: '/buyer/my-products', color: 'secondary' },
    { label: 'Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', path: '/buyer/orders', color: 'accent' },
    { label: 'Support', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', path: '/buyer/support', color: 'warning' },
  ];

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      {/* Welcome */}
      <div className="mb-6">
        <p className="text-sm dark:text-dark-muted text-light-muted">Welcome back,</p>
        <h1 className="text-2xl font-bold dark:text-dark-text text-light-text">{profile?.full_name || 'Buyer'}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card text-center stat-card stat-card-primary">
          <p className="text-2xl font-bold dark:text-dark-text text-light-text">{stats.orders}</p>
          <p className="text-xs dark:text-dark-muted text-light-muted">Orders</p>
        </div>
        <div className="card text-center stat-card stat-card-secondary">
          <p className="text-2xl font-bold dark:text-dark-text text-light-text">{stats.products}</p>
          <p className="text-xs dark:text-dark-muted text-light-muted">Products</p>
        </div>
        <div className="card text-center stat-card stat-card-accent">
          <p className="text-base font-bold dark:text-dark-text text-light-text">{fmtMoney(stats.spent)}</p>
          <p className="text-xs dark:text-dark-muted text-light-muted">Spent</p>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-sm font-semibold dark:text-dark-muted text-light-muted uppercase tracking-wider mb-3">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {quickActions.map((action) => (
          <button key={action.path} onClick={() => navigate(action.path)} className={`card card-hover flex flex-col items-center py-6 gap-3`}>
            <div className={`w-12 h-12 rounded-xl bg-${action.color}/10 flex items-center justify-center`}>
              <svg className={`w-6 h-6 text-${action.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={action.icon} />
              </svg>
            </div>
            <span className="text-sm font-medium dark:text-dark-text text-light-text">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Recent Orders */}
      <h2 className="text-sm font-semibold dark:text-dark-muted text-light-muted uppercase tracking-wider mb-3">Recent Activity</h2>
      {loading ? (
        <div className="skeleton h-20 w-full" />
      ) : recent.length === 0 ? (
        <div className="card">
          <div className="flex flex-col items-center justify-center py-6">
            <ShoppingBag className="w-10 h-10 dark:text-dark-muted text-light-muted mb-2 opacity-50" />
            <p className="text-sm dark:text-dark-muted text-light-muted">No recent activity</p>
            <button onClick={() => navigate('/buyer/shop')} className="text-sm text-primary font-medium mt-2">Start Shopping</button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {recent.map((o) => (
            <div key={o.id} className="card flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg dark:bg-dark-surface bg-light-surface flex items-center justify-center shrink-0 overflow-hidden">
                {o.products?.image_url ? <img src={o.products.image_url} className="w-full h-full object-cover" /> : <ShoppingBag className="w-4 h-4 dark:text-dark-muted text-light-muted" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium dark:text-dark-text text-light-text truncate">{o.products?.name}</p>
                <p className="text-xs dark:text-dark-muted text-light-muted">{fmtDateTime(o.created_at)}</p>
              </div>
              <p className="text-sm font-semibold dark:text-dark-text text-light-text shrink-0">{fmtMoney(o.amount, o.currency)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
