import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format, subDays, parseISO, startOfMonth } from 'date-fns';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Eye, TrendingUp, Globe, FileDown, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useSellerStore } from '@/hooks/useSellerStore';
import { PageHeader, LoadingBlock, EmptyState, fmtMoney, fmtDate } from '@/components/seller/ui';

interface SaleRow { amount: number; currency: string; date: string; product_id: string | null }
interface ViewRow { created_at: string; referrer: string | null; country: string | null; product_id: string | null }

function useRangeData(days: number) {
  const { profile } = useAuth();
  const { store } = useSellerStore();
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [views, setViews] = useState<ViewRow[]>([]);
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile || !store) return;
    let active = true;
    setLoading(true);
    const since = subDays(new Date(), days).toISOString();

    (async () => {
      const [salesRes, viewsRes, productsRes] = await Promise.all([
        supabase.from('analytics_sales').select('amount, currency, date, product_id').eq('seller_id', profile.id).gte('created_at', since),
        supabase.from('analytics_views').select('created_at, referrer, country, product_id').eq('store_id', store.id).gte('created_at', since),
        supabase.from('products').select('id, name').eq('seller_id', profile.id),
      ]);
      if (!active) return;
      setSales(salesRes.data || []);
      setViews(viewsRes.data || []);
      const map: Record<string, string> = {};
      (productsRes.data || []).forEach((p: any) => (map[p.id] = p.name));
      setProductNames(map);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [profile?.id, store?.id, days]);

  return { sales, views, productNames, loading, currency: store?.currency || 'XAF' };
}

function groupByDay(items: { date: string }[], days: number, valueFn: (item: any) => number) {
  const buckets: Record<string, number> = {};
  for (let i = days - 1; i >= 0; i--) {
    buckets[format(subDays(new Date(), i), 'MMM d')] = 0;
  }
  items.forEach((it) => {
    const key = format(parseISO(it.date), 'MMM d');
    if (key in buckets) buckets[key] += valueFn(it);
  });
  return Object.entries(buckets).map(([date, value]) => ({ date, value }));
}

export function SellerAnalytics() {
  const navigate = useNavigate();
  const { sales, views, productNames, loading, currency } = useRangeData(14);

  const totalRevenue = sales.reduce((s, r) => s + Number(r.amount), 0);
  const totalViews = views.length;
  const totalOrders = sales.length;
  const conversion = totalViews > 0 ? ((totalOrders / totalViews) * 100).toFixed(1) : '0.0';
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const chartData = useMemo(() => groupByDay(sales, 14, (r) => Number(r.amount)), [sales]);

  const topProducts = useMemo(() => {
    const totals: Record<string, number> = {};
    sales.forEach((s) => {
      if (!s.product_id) return;
      totals[s.product_id] = (totals[s.product_id] || 0) + Number(s.amount);
    });
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, amount]) => ({ name: productNames[id] || 'Product', amount }));
  }, [sales, productNames]);

  const links = [
    { label: 'Sales Chart', path: '/seller/sales' },
    { label: 'Visitors', path: '/seller/visitors' },
    { label: 'Conversion', path: '/seller/conversion' },
    { label: 'Link Traffic', path: '/seller/traffic' },
    { label: 'Reports', path: '/seller/reports' },
  ];

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Analytics" subtitle="Store performance (last 14 days)" />

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card"><p className="text-xs dark:text-dark-muted text-light-muted mb-1">Total Views</p><p className="text-xl font-bold dark:text-dark-text text-light-text">{loading ? '—' : totalViews}</p></div>
        <div className="card"><p className="text-xs dark:text-dark-muted text-light-muted mb-1">Conversion</p><p className="text-xl font-bold dark:text-dark-text text-light-text">{loading ? '—' : `${conversion}%`}</p></div>
        <div className="card"><p className="text-xs dark:text-dark-muted text-light-muted mb-1">Revenue</p><p className="text-lg font-bold dark:text-dark-text text-light-text">{loading ? '—' : fmtMoney(totalRevenue, currency)}</p></div>
        <div className="card"><p className="text-xs dark:text-dark-muted text-light-muted mb-1">Avg Order</p><p className="text-lg font-bold dark:text-dark-text text-light-text">{loading ? '—' : fmtMoney(avgOrder, currency)}</p></div>
      </div>

      <div className="card mb-4">
        <p className="text-sm font-semibold dark:text-dark-text text-light-text mb-3">Revenue trend</p>
        {loading ? (
          <LoadingBlock rows={1} />
        ) : totalRevenue === 0 ? (
          <p className="text-xs dark:text-dark-muted text-light-muted text-center py-6">No sales in this period yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00D4AA" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#00D4AA" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={2} />
              <Tooltip formatter={(v: number) => fmtMoney(v, currency)} />
              <Area type="monotone" dataKey="value" stroke="#00D4AA" fill="url(#rev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <p className="text-sm font-semibold dark:text-dark-muted text-light-muted uppercase tracking-wider mb-3">Top Products</p>
      {!loading && topProducts.length === 0 ? (
        <EmptyState icon={BarChart3} title="No product sales yet" description="Once you make sales, your top products show up here." />
      ) : (
        <div className="space-y-2 mb-4">
          {topProducts.map((p) => (
            <div key={p.name} className="card flex items-center justify-between">
              <span className="text-sm dark:text-dark-text text-light-text">{p.name}</span>
              <span className="text-sm font-semibold dark:text-dark-text text-light-text">{fmtMoney(p.amount, currency)}</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-sm font-semibold dark:text-dark-muted text-light-muted uppercase tracking-wider mb-3">Deep Dive</p>
      <div className="grid grid-cols-2 gap-3">
        {links.map((l) => (
          <button key={l.path} onClick={() => navigate(l.path)} className="card card-hover text-sm font-medium dark:text-dark-text text-light-text text-left py-3">
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SellerSalesChart() {
  const [range, setRange] = useState(30);
  const { sales, loading, currency } = useRangeData(range);
  const data = useMemo(() => groupByDay(sales, range, (r) => Number(r.amount)), [sales, range]);
  const total = sales.reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Sales Chart" subtitle={fmtMoney(total, currency)} back />
      <div className="flex gap-2 mb-4">
        {[7, 30, 90].map((d) => (
          <button key={d} onClick={() => setRange(d)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${range === d ? 'bg-primary text-dark' : 'dark:bg-dark-surface bg-light-surface dark:text-dark-muted text-light-muted'}`}>
            {d}d
          </button>
        ))}
      </div>
      <div className="card">
        {loading ? (
          <LoadingBlock rows={1} />
        ) : total === 0 ? (
          <EmptyState icon={TrendingUp} title="No sales in this range" description="Sales recorded through completed orders will appear here." />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={Math.ceil(range / 8)} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip formatter={(v: number) => fmtMoney(v, currency)} />
              <Bar dataKey="value" fill="#00D4AA" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export function SellerVisitors() {
  const [range, setRange] = useState(30);
  const { views, loading } = useRangeData(range);

  const data = useMemo(() => {
    const buckets: Record<string, number> = {};
    for (let i = range - 1; i >= 0; i--) buckets[format(subDays(new Date(), i), 'MMM d')] = 0;
    views.forEach((v) => {
      const key = format(parseISO(v.created_at), 'MMM d');
      if (key in buckets) buckets[key]++;
    });
    return Object.entries(buckets).map(([date, value]) => ({ date, value }));
  }, [views, range]);

  const byCountry = useMemo(() => {
    const counts: Record<string, number> = {};
    views.forEach((v) => {
      const c = v.country || 'Unknown';
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [views]);

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Visitors" subtitle={`${views.length} views`} back />
      <div className="flex gap-2 mb-4">
        {[7, 30, 90].map((d) => (
          <button key={d} onClick={() => setRange(d)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${range === d ? 'bg-primary text-dark' : 'dark:bg-dark-surface bg-light-surface dark:text-dark-muted text-light-muted'}`}>
            {d}d
          </button>
        ))}
      </div>

      <div className="card mb-4">
        {loading ? (
          <LoadingBlock rows={1} />
        ) : views.length === 0 ? (
          <EmptyState icon={Eye} title="No visitors yet" description="Page views are recorded when buyers open your storefront or product pages." />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data}>
              <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={Math.ceil(range / 8)} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#6C5CE7" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {byCountry.length > 0 && (
        <>
          <p className="text-sm font-semibold dark:text-dark-muted text-light-muted uppercase tracking-wider mb-3">By Country</p>
          <div className="space-y-2">
            {byCountry.map(([country, count]) => (
              <div key={country} className="card flex items-center justify-between">
                <span className="text-sm dark:text-dark-text text-light-text flex items-center gap-2"><Globe className="w-4 h-4 text-secondary" /> {country}</span>
                <span className="text-sm font-semibold dark:text-dark-text text-light-text">{count}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function SellerConversionRate() {
  const [range, setRange] = useState(30);
  const { sales, views, loading } = useRangeData(range);

  const data = useMemo(() => {
    const viewBuckets: Record<string, number> = {};
    const saleBuckets: Record<string, number> = {};
    for (let i = range - 1; i >= 0; i--) {
      const key = format(subDays(new Date(), i), 'MMM d');
      viewBuckets[key] = 0;
      saleBuckets[key] = 0;
    }
    views.forEach((v) => {
      const key = format(parseISO(v.created_at), 'MMM d');
      if (key in viewBuckets) viewBuckets[key]++;
    });
    sales.forEach((s) => {
      const key = format(parseISO(s.date), 'MMM d');
      if (key in saleBuckets) saleBuckets[key]++;
    });
    return Object.keys(viewBuckets).map((date) => ({
      date,
      rate: viewBuckets[date] > 0 ? Number(((saleBuckets[date] / viewBuckets[date]) * 100).toFixed(1)) : 0,
    }));
  }, [views, sales, range]);

  const overall = views.length > 0 ? ((sales.length / views.length) * 100).toFixed(1) : '0.0';

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Conversion Rate" subtitle={`${overall}% overall`} back />
      <div className="flex gap-2 mb-4">
        {[7, 30, 90].map((d) => (
          <button key={d} onClick={() => setRange(d)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${range === d ? 'bg-primary text-dark' : 'dark:bg-dark-surface bg-light-surface dark:text-dark-muted text-light-muted'}`}>
            {d}d
          </button>
        ))}
      </div>
      <div className="card">
        {loading ? (
          <LoadingBlock rows={1} />
        ) : views.length === 0 ? (
          <EmptyState icon={TrendingUp} title="Not enough data" description="Conversion rate needs both views and sales to calculate. Views aren't tracked yet for storefront visits." />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data}>
              <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={Math.ceil(range / 8)} />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Line type="monotone" dataKey="rate" stroke="#FD79A8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export function SellerLinkTraffic() {
  const [range, setRange] = useState(30);
  const { views, loading } = useRangeData(range);

  const byReferrer = useMemo(() => {
    const counts: Record<string, number> = {};
    views.forEach((v) => {
      let ref = v.referrer || 'Direct';
      try {
        if (ref !== 'Direct') ref = new URL(ref).hostname.replace('www.', '');
      } catch {
        /* keep raw value */
      }
      counts[ref] = (counts[ref] || 0) + 1;
    });
    const total = views.length || 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([ref, count]) => ({ ref, count, pct: Math.round((count / total) * 100) }));
  }, [views]);

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Link Traffic" subtitle="Referrer breakdown" back />
      <div className="flex gap-2 mb-4">
        {[7, 30, 90].map((d) => (
          <button key={d} onClick={() => setRange(d)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${range === d ? 'bg-primary text-dark' : 'dark:bg-dark-surface bg-light-surface dark:text-dark-muted text-light-muted'}`}>
            {d}d
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingBlock rows={4} />
      ) : byReferrer.length === 0 ? (
        <EmptyState icon={Globe} title="No traffic data yet" description="Referrer data is captured when someone visits your store or product link." />
      ) : (
        <div className="space-y-2">
          {byReferrer.map((r) => (
            <div key={r.ref} className="card">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium dark:text-dark-text text-light-text">{r.ref}</span>
                <span className="text-sm dark:text-dark-muted text-light-muted">{r.count} · {r.pct}%</span>
              </div>
              <div className="h-1.5 rounded-full dark:bg-dark-surface bg-light-surface overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${r.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SellerReports() {
  const { profile } = useAuth();
  const { store } = useSellerStore();
  const [rows, setRows] = useState<{ month: string; revenue: number; orders: number; views: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const currency = store?.currency || 'XAF';

  useEffect(() => {
    if (!profile || !store) return;
    (async () => {
      const since = startOfMonth(subDays(new Date(), 180)).toISOString();
      const [salesRes, viewsRes] = await Promise.all([
        supabase.from('analytics_sales').select('amount, date').eq('seller_id', profile.id).gte('created_at', since),
        supabase.from('analytics_views').select('created_at').eq('store_id', store.id).gte('created_at', since),
      ]);
      const months: Record<string, { revenue: number; orders: number; views: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const key = format(startOfMonth(subDays(new Date(), i * 30)), 'MMM yyyy');
        months[key] = { revenue: 0, orders: 0, views: 0 };
      }
      (salesRes.data || []).forEach((s: any) => {
        const key = format(startOfMonth(parseISO(s.date)), 'MMM yyyy');
        if (months[key]) {
          months[key].revenue += Number(s.amount);
          months[key].orders += 1;
        }
      });
      (viewsRes.data || []).forEach((v: any) => {
        const key = format(startOfMonth(parseISO(v.created_at)), 'MMM yyyy');
        if (months[key]) months[key].views += 1;
      });
      setRows(Object.entries(months).map(([month, v]) => ({ month, ...v })));
      setLoading(false);
    })();
  }, [profile?.id, store?.id]);

  const exportCsv = () => {
    const header = 'Month,Revenue,Orders,Views\n';
    const body = rows.map((r) => `${r.month},${r.revenue},${r.orders},${r.views}`).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sellizi-report.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report downloaded');
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader
        title="Reports"
        subtitle="Last 6 months"
        back
        action={
          <button onClick={exportCsv} className="btn-outline text-sm px-3 py-2">
            <FileDown className="w-4 h-4" /> CSV
          </button>
        }
      />
      {loading ? (
        <LoadingBlock rows={4} />
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.month} className="card">
              <p className="text-sm font-semibold dark:text-dark-text text-light-text mb-2">{r.month}</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><p className="text-xs dark:text-dark-muted text-light-muted">Revenue</p><p className="text-sm font-medium dark:text-dark-text text-light-text">{fmtMoney(r.revenue, currency)}</p></div>
                <div><p className="text-xs dark:text-dark-muted text-light-muted">Orders</p><p className="text-sm font-medium dark:text-dark-text text-light-text">{r.orders}</p></div>
                <div><p className="text-xs dark:text-dark-muted text-light-muted">Views</p><p className="text-sm font-medium dark:text-dark-text text-light-text">{r.views}</p></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
