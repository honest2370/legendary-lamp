import { useEffect, useMemo, useState } from 'react';
import { format, subDays, parseISO, startOfMonth } from 'date-fns';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, Database, Server, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageHeader, LoadingBlock, EmptyState, fmtMoney, fmtDateTime } from '@/components/shared/ui';

/* ------------------------------------ Analytics ------------------------------------ */

export function AdminAnalytics() {
  const [range, setRange] = useState(30);
  const [orders, setOrders] = useState<any[]>([]);
  const [signups, setSignups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const since = subDays(new Date(), range).toISOString();
    Promise.all([
      supabase.from('orders').select('amount, status, created_at').gte('created_at', since),
      supabase.from('profiles').select('id, role, created_at').gte('created_at', since),
    ]).then(([ordersRes, signupsRes]) => {
      setOrders(ordersRes.data || []);
      setSignups(signupsRes.data || []);
      setLoading(false);
    });
  }, [range]);

  const revenueData = useMemo(() => {
    const buckets: Record<string, number> = {};
    for (let i = range - 1; i >= 0; i--) buckets[format(subDays(new Date(), i), 'MMM d')] = 0;
    orders.filter((o) => o.status === 'completed').forEach((o) => {
      const key = format(parseISO(o.created_at), 'MMM d');
      if (key in buckets) buckets[key] += Number(o.amount);
    });
    return Object.entries(buckets).map(([date, value]) => ({ date, value }));
  }, [orders, range]);

  const totalRevenue = orders.filter((o) => o.status === 'completed').reduce((s, o) => s + Number(o.amount), 0);
  const newSellers = signups.filter((s) => s.role === 'seller').length;
  const newBuyers = signups.filter((s) => s.role === 'buyer').length;

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Analytics" subtitle="Platform-wide performance" />
      <div className="flex gap-2 mb-4">
        {[7, 30, 90].map((d) => (
          <button key={d} onClick={() => setRange(d)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${range === d ? 'bg-primary text-dark' : 'dark:bg-dark-surface bg-light-surface dark:text-dark-muted text-light-muted'}`}>{d}d</button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card"><p className="text-xs dark:text-dark-muted text-light-muted mb-1">Revenue</p><p className="text-lg font-bold dark:text-dark-text text-light-text">{fmtMoney(totalRevenue)}</p></div>
        <div className="card"><p className="text-xs dark:text-dark-muted text-light-muted mb-1">Orders</p><p className="text-lg font-bold dark:text-dark-text text-light-text">{orders.length}</p></div>
        <div className="card"><p className="text-xs dark:text-dark-muted text-light-muted mb-1">New sellers</p><p className="text-lg font-bold dark:text-dark-text text-light-text">{newSellers}</p></div>
        <div className="card"><p className="text-xs dark:text-dark-muted text-light-muted mb-1">New buyers</p><p className="text-lg font-bold dark:text-dark-text text-light-text">{newBuyers}</p></div>
      </div>

      <div className="card">
        <p className="text-sm font-semibold dark:text-dark-text text-light-text mb-3">Revenue trend</p>
        {loading ? (
          <LoadingBlock rows={1} />
        ) : totalRevenue === 0 ? (
          <p className="text-xs dark:text-dark-muted text-light-muted text-center py-6">No revenue in this period yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="adminRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00D4AA" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#00D4AA" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={Math.ceil(range / 8)} />
              <Tooltip formatter={(v: number) => fmtMoney(v)} />
              <Area type="monotone" dataKey="value" stroke="#00D4AA" fill="url(#adminRev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------- Reports -------------------------------------- */

export function AdminReports() {
  const [rows, setRows] = useState<{ month: string; revenue: number; orders: number; signups: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const since = startOfMonth(subDays(new Date(), 180)).toISOString();
    Promise.all([
      supabase.from('orders').select('amount, status, created_at').gte('created_at', since),
      supabase.from('profiles').select('id, created_at').gte('created_at', since),
    ]).then(([ordersRes, profilesRes]) => {
      const months: Record<string, { revenue: number; orders: number; signups: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const key = format(startOfMonth(subDays(new Date(), i * 30)), 'MMM yyyy');
        months[key] = { revenue: 0, orders: 0, signups: 0 };
      }
      (ordersRes.data || []).forEach((o: any) => {
        const key = format(startOfMonth(parseISO(o.created_at)), 'MMM yyyy');
        if (months[key] && o.status === 'completed') {
          months[key].revenue += Number(o.amount);
          months[key].orders += 1;
        }
      });
      (profilesRes.data || []).forEach((p: any) => {
        const key = format(startOfMonth(parseISO(p.created_at)), 'MMM yyyy');
        if (months[key]) months[key].signups += 1;
      });
      setRows(Object.entries(months).map(([month, v]) => ({ month, ...v })));
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Reports" subtitle="Last 6 months" />
      {loading ? (
        <LoadingBlock rows={4} />
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.month} className="card">
              <p className="text-sm font-semibold dark:text-dark-text text-light-text mb-2">{r.month}</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><p className="text-xs dark:text-dark-muted text-light-muted">Revenue</p><p className="text-sm font-medium dark:text-dark-text text-light-text">{fmtMoney(r.revenue)}</p></div>
                <div><p className="text-xs dark:text-dark-muted text-light-muted">Orders</p><p className="text-sm font-medium dark:text-dark-text text-light-text">{r.orders}</p></div>
                <div><p className="text-xs dark:text-dark-muted text-light-muted">Signups</p><p className="text-sm font-medium dark:text-dark-text text-light-text">{r.signups}</p></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- System Health ----------------------------------- */

export function AdminSystemHealth() {
  const [checking, setChecking] = useState(true);
  const [dbOk, setDbOk] = useState<boolean | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [counts, setCounts] = useState<{ table: string; count: number }[]>([]);

  useEffect(() => {
    (async () => {
      const start = performance.now();
      const { error } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
      setLatencyMs(Math.round(performance.now() - start));
      setDbOk(!error);

      const tables = ['profiles', 'stores', 'products', 'orders', 'payments'];
      const results = await Promise.all(
        tables.map(async (t) => {
          const { count } = await supabase.from(t).select('id', { count: 'exact', head: true });
          return { table: t, count: count || 0 };
        })
      );
      setCounts(results);
      setChecking(false);
    })();
  }, []);

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="System Health" subtitle="Live status" />
      <p className="text-xs dark:text-dark-muted text-light-muted mb-4">
        This checks reachability and row counts only — it doesn't include uptime history, error rates, or server-side metrics, which would need separate hosting/monitoring tools.
      </p>

      <div className="card mb-4 flex items-center gap-3">
        {checking ? (
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        ) : dbOk ? (
          <CheckCircle className="w-8 h-8 text-success" />
        ) : (
          <AlertTriangle className="w-8 h-8 text-danger" />
        )}
        <div>
          <p className="text-sm font-medium dark:text-dark-text text-light-text">{checking ? 'Checking database...' : dbOk ? 'Database reachable' : 'Database unreachable'}</p>
          {latencyMs !== null && <p className="text-xs dark:text-dark-muted text-light-muted">{latencyMs}ms response time</p>}
        </div>
      </div>

      <p className="text-sm font-semibold dark:text-dark-muted text-light-muted uppercase tracking-wider mb-3">Table row counts</p>
      <div className="space-y-2">
        {counts.map((c) => (
          <div key={c.table} className="card flex items-center justify-between">
            <span className="text-sm dark:text-dark-text text-light-text capitalize flex items-center gap-2"><Database className="w-4 h-4 text-primary" /> {c.table}</span>
            <span className="text-sm font-semibold dark:text-dark-text text-light-text">{c.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------- Activity Logs ------------------------------------ */

export function AdminActivityLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(100).then(async ({ data }) => {
      setLogs(data || []);
      const userIds = Array.from(new Set((data || []).map((l: any) => l.user_id).filter(Boolean)));
      if (userIds.length) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', userIds);
        const map: Record<string, string> = {};
        (profiles || []).forEach((p: any) => (map[p.id] = p.full_name || p.email));
        setUsers(map);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Activity Logs" subtitle="Recent platform actions" />
      {loading ? (
        <LoadingBlock rows={5} />
      ) : logs.length === 0 ? (
        <EmptyState icon={Activity} title="No activity logged yet" description="Most pages don't currently write to activity_logs — only a few actions do. This will fill in as more logging is added." />
      ) : (
        <div className="space-y-2">
          {logs.map((l) => (
            <div key={l.id} className="card">
              <p className="text-sm dark:text-dark-text text-light-text capitalize">{l.action?.replace(/_/g, ' ')}</p>
              <p className="text-xs dark:text-dark-muted text-light-muted">{users[l.user_id] || 'System'} · {fmtDateTime(l.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
