import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ShoppingBag, BarChart3, MessageSquare, Plus, Upload, Megaphone, Wallet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useSellerStore } from '@/hooks/useSellerStore';
import { fmtMoney, fmtDateTime, StatusBadge, LoadingBlock, EmptyState } from '@/components/seller/ui';

interface RecentOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
  buyer_name: string | null;
  buyer_email: string;
  created_at: string;
  products: { name: string } | null;
}

export function SellerDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { seller, store, loading: storeLoading } = useSellerStore();
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [todayViews, setTodayViews] = useState(0);
  const [loadingExtra, setLoadingExtra] = useState(true);

  useEffect(() => {
    if (!profile || !store) return;
    let active = true;
    setLoadingExtra(true);

    (async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const [ordersRes, unreadRes, viewsRes] = await Promise.all([
        supabase
          .from('orders')
          .select('id, amount, currency, status, buyer_name, buyer_email, created_at, products(name)')
          .eq('seller_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .eq('is_read', false),
        supabase
          .from('analytics_views')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', store.id)
          .gte('created_at', startOfDay.toISOString()),
      ]);

      if (!active) return;
      setRecentOrders((ordersRes.data as any) || []);
      setUnreadCount(unreadRes.count || 0);
      setTodayViews(viewsRes.count || 0);
      setLoadingExtra(false);
    })();

    return () => {
      active = false;
    };
  }, [profile, store]);

  const quickActions = [
    { label: 'Add Product', icon: Plus, path: '/seller/products/add', color: 'primary' },
    { label: 'Bulk Import', icon: Upload, path: '/seller/bulk-actions', color: 'secondary' },
    { label: 'Broadcasts', icon: Megaphone, path: '/seller/broadcasts', color: 'accent' },
    { label: 'Payouts', icon: Wallet, path: '/seller/payouts', color: 'warning' },
  ];

  if (storeLoading) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <LoadingBlock rows={4} />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <div className="mb-6">
        <p className="text-sm dark:text-dark-muted text-light-muted">Welcome back,</p>
        <h1 className="text-2xl font-bold dark:text-dark-text text-light-text">
          {seller?.store_name || store?.name || profile?.full_name || 'Seller'}
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card stat-card stat-card-primary">
          <p className="text-xs dark:text-dark-muted text-light-muted mb-1">Total Revenue</p>
          <p className="text-xl font-bold dark:text-dark-text text-light-text">
            {fmtMoney(seller?.total_revenue, store?.currency)}
          </p>
        </div>
        <div className="card stat-card stat-card-secondary">
          <p className="text-xs dark:text-dark-muted text-light-muted mb-1">Total Orders</p>
          <p className="text-xl font-bold dark:text-dark-text text-light-text">{seller?.total_orders ?? 0}</p>
        </div>
        <div className="card stat-card stat-card-accent">
          <p className="text-xs dark:text-dark-muted text-light-muted mb-1">Products</p>
          <p className="text-xl font-bold dark:text-dark-text text-light-text">{seller?.total_products ?? 0}</p>
        </div>
        <div className="card stat-card stat-card-warning">
          <p className="text-xs dark:text-dark-muted text-light-muted mb-1">Views Today</p>
          <p className="text-xl font-bold dark:text-dark-text text-light-text">{loadingExtra ? '—' : todayViews}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-sm font-semibold dark:text-dark-muted text-light-muted uppercase tracking-wider mb-3">
        Quick Actions
      </h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {quickActions.map((action) => (
          <button
            key={action.path}
            onClick={() => navigate(action.path)}
            className="card card-hover flex flex-col items-center py-6 gap-3"
          >
            <div className={`w-12 h-12 rounded-xl bg-${action.color}/10 flex items-center justify-center`}>
              <action.icon className={`w-6 h-6 text-${action.color}`} />
            </div>
            <span className="text-sm font-medium dark:text-dark-text text-light-text">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Recent orders */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold dark:text-dark-muted text-light-muted uppercase tracking-wider">
          Recent Orders
        </h2>
        <button onClick={() => navigate('/seller/orders')} className="text-xs text-primary font-medium">
          View all
        </button>
      </div>

      {loadingExtra ? (
        <LoadingBlock rows={3} />
      ) : recentOrders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders yet"
          description="Once buyers purchase your products, orders will show up here."
        />
      ) : (
        <div className="space-y-2 mb-6">
          {recentOrders.map((o) => (
            <div key={o.id} className="card flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium dark:text-dark-text text-light-text truncate">
                  {o.products?.name || 'Product'}
                </p>
                <p className="text-xs dark:text-dark-muted text-light-muted truncate">
                  {o.buyer_name || o.buyer_email} · {fmtDateTime(o.created_at)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold dark:text-dark-text text-light-text">
                  {fmtMoney(o.amount, o.currency)}
                </p>
                <StatusBadge status={o.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom shortcuts */}
      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => navigate('/seller/products')} className="card card-hover flex flex-col items-center py-4 gap-2">
          <Package className="w-5 h-5 text-primary" />
          <span className="text-xs dark:text-dark-text text-light-text">Products</span>
        </button>
        <button onClick={() => navigate('/seller/analytics')} className="card card-hover flex flex-col items-center py-4 gap-2">
          <BarChart3 className="w-5 h-5 text-secondary" />
          <span className="text-xs dark:text-dark-text text-light-text">Analytics</span>
        </button>
        <button onClick={() => navigate('/seller/messages')} className="card card-hover flex flex-col items-center py-4 gap-2 relative">
          <MessageSquare className="w-5 h-5 text-accent" />
          <span className="text-xs dark:text-dark-text text-light-text">Messages</span>
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-danger" />
          )}
        </button>
      </div>
    </div>
  );
}
