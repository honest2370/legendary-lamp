import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Store, Package, ShoppingBag, DollarSign, LifeBuoy, Activity, Megaphone } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LoadingBlock, EmptyState, fmtMoney, fmtDateTime, StatusBadge } from '@/components/shared/ui';

interface Stats {
  totalUsers: number;
  totalSellers: number;
  totalStores: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  openTickets: number;
  pendingPayouts: number;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [
        usersRes, sellersRes, storesRes, productsRes, ordersRes,
        revenueRes, ticketsRes, payoutsRes, recentOrdersRes, recentUsersRes,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'seller'),
        supabase.from('stores').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('amount').eq('status', 'completed'),
        supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('payouts').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('id, amount, currency, status, buyer_email, created_at, products(name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('profiles').select('id, full_name, email, role, created_at').order('created_at', { ascending: false }).limit(5),
      ]);

      setStats({
        totalUsers: usersRes.count || 0,
        totalSellers: sellersRes.count || 0,
        totalStores: storesRes.count || 0,
        totalProducts: productsRes.count || 0,
        totalOrders: ordersRes.count || 0,
        totalRevenue: (revenueRes.data || []).reduce((s: number, o: any) => s + Number(o.amount), 0),
        openTickets: ticketsRes.count || 0,
        pendingPayouts: payoutsRes.count || 0,
      });
      setRecentOrders((recentOrdersRes.data as any) || []);
      setRecentUsers(recentUsersRes.data || []);
      setLoading(false);
    })();
  }, []);

  if (loading || !stats) {
    return <div className="p-4 max-w-lg mx-auto"><LoadingBlock rows={5} /></div>;
  }

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, path: '/admin/users', color: 'primary' },
    { label: 'Sellers', value: stats.totalSellers, icon: Store, path: '/admin/users', color: 'secondary' },
    { label: 'Stores', value: stats.totalStores, icon: Store, path: '/admin/stores', color: 'accent' },
    { label: 'Products', value: stats.totalProducts, icon: Package, path: '/admin/products', color: 'warning' },
    { label: 'Orders', value: stats.totalOrders, icon: ShoppingBag, path: '/admin/orders', color: 'primary' },
    { label: 'Open Tickets', value: stats.openTickets, icon: LifeBuoy, path: '/admin/tickets', color: 'danger' },
  ];

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <h1 className="text-xl font-bold dark:text-dark-text text-light-text mb-1">Admin Dashboard</h1>
      <p className="text-sm dark:text-dark-muted text-light-muted mb-5">Platform overview</p>

      <div className="card stat-card stat-card-primary mb-4">
        <p className="text-xs dark:text-dark-muted text-light-muted mb-1">Platform Revenue (completed orders)</p>
        <p className="text-2xl font-bold dark:text-dark-text text-light-text">{fmtMoney(stats.totalRevenue)}</p>
        {stats.pendingPayouts > 0 && (
          <button onClick={() => navigate('/admin/payouts')} className="text-xs text-warning font-medium mt-1">
            {stats.pendingPayouts} payout{stats.pendingPayouts > 1 ? 's' : ''} pending review →
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {cards.map((c) => (
          <button key={c.label} onClick={() => navigate(c.path)} className="card card-hover text-left">
            <div className={`w-9 h-9 rounded-lg bg-${c.color}/10 flex items-center justify-center mb-2`}>
              <c.icon className={`w-4.5 h-4.5 text-${c.color}`} />
            </div>
            <p className="text-xl font-bold dark:text-dark-text text-light-text">{c.value}</p>
            <p className="text-xs dark:text-dark-muted text-light-muted">{c.label}</p>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold dark:text-dark-muted text-light-muted uppercase tracking-wider">Recent Orders</p>
        <button onClick={() => navigate('/admin/orders')} className="text-xs text-primary font-medium">View all</button>
      </div>
      {recentOrders.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No orders yet" />
      ) : (
        <div className="space-y-2 mb-6">
          {recentOrders.map((o) => (
            <div key={o.id} className="card flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium dark:text-dark-text text-light-text truncate">{o.products?.name || 'Product'}</p>
                <p className="text-xs dark:text-dark-muted text-light-muted truncate">{o.buyer_email} · {fmtDateTime(o.created_at)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold dark:text-dark-text text-light-text">{fmtMoney(o.amount, o.currency)}</p>
                <StatusBadge status={o.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold dark:text-dark-muted text-light-muted uppercase tracking-wider">New Users</p>
        <button onClick={() => navigate('/admin/users')} className="text-xs text-primary font-medium">View all</button>
      </div>
      <div className="space-y-2">
        {recentUsers.map((u) => (
          <div key={u.id} className="card flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium dark:text-dark-text text-light-text truncate">{u.full_name || u.email}</p>
              <p className="text-xs dark:text-dark-muted text-light-muted">{fmtDateTime(u.created_at)}</p>
            </div>
            <span className="badge badge-info capitalize">{u.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
