import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Tag, Users2, Megaphone, Plus, Trash2, Copy, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useSellerStore } from '@/hooks/useSellerStore';
import { PageHeader, LoadingBlock, EmptyState, fmtMoney, fmtDate } from '@/components/seller/ui';

/* ----------------------------- Marketing Hub ----------------------------- */

export function SellerMarketing() {
  const navigate = useNavigate();
  const { store } = useSellerStore();
  const [stats, setStats] = useState({ coupons: 0, affiliates: 0, customers: 0 });

  useEffect(() => {
    if (!store) return;
    Promise.all([
      supabase.from('coupons').select('id', { count: 'exact', head: true }).eq('store_id', store.id),
      supabase.from('affiliates').select('id', { count: 'exact', head: true }).eq('store_id', store.id),
    ]).then(([c, a]) => setStats((s) => ({ ...s, coupons: c.count || 0, affiliates: a.count || 0 })));
  }, [store?.id]);

  const cards = [
    { label: 'Coupons', desc: `${stats.coupons} active codes`, icon: Tag, path: '/seller/coupons', color: 'primary' },
    { label: 'Affiliates', desc: `${stats.affiliates} promoters`, icon: Users2, path: '/seller/affiliates', color: 'secondary' },
    { label: 'Broadcasts', desc: 'Message your customers', icon: Megaphone, path: '/seller/broadcasts', color: 'accent' },
  ];

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Marketing" subtitle="Grow your store" />
      <div className="space-y-3">
        {cards.map((c) => (
          <button key={c.path} onClick={() => navigate(c.path)} className="card card-hover w-full flex items-center gap-3 text-left">
            <div className={`w-11 h-11 rounded-xl bg-${c.color}/10 flex items-center justify-center shrink-0`}>
              <c.icon className={`w-5 h-5 text-${c.color}`} />
            </div>
            <div>
              <p className="text-sm font-semibold dark:text-dark-text text-light-text">{c.label}</p>
              <p className="text-xs dark:text-dark-muted text-light-muted">{c.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------- Coupons -------------------------------- */

interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  min_order_amount: number | null;
  valid_until: string | null;
  is_active: boolean;
}

export function SellerCoupons() {
  const { store } = useSellerStore();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', discount_type: 'percentage' as const, discount_value: '', max_uses: '', min_order_amount: '', valid_until: '' });

  const load = async () => {
    if (!store) return;
    setLoading(true);
    const { data } = await supabase.from('coupons').select('*').eq('store_id', store.id).order('created_at', { ascending: false });
    setCoupons(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [store?.id]);

  const createCoupon = async () => {
    if (!store) return;
    if (!form.code.trim()) return toast.error('Enter a coupon code');
    if (!form.discount_value || isNaN(Number(form.discount_value))) return toast.error('Enter a valid discount value');

    const { error } = await supabase.from('coupons').insert({
      store_id: store.id,
      code: form.code.trim().toUpperCase(),
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : null,
      valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
    });
    if (error) return toast.error(error.message.includes('duplicate') ? 'That code already exists' : 'Could not create coupon');
    toast.success('Coupon created');
    setShowForm(false);
    setForm({ code: '', discount_type: 'percentage', discount_value: '', max_uses: '', min_order_amount: '', valid_until: '' });
    load();
  };

  const toggleActive = async (c: Coupon) => {
    const { error } = await supabase.from('coupons').update({ is_active: !c.is_active }).eq('id', c.id);
    if (error) return toast.error('Could not update');
    setCoupons((prev) => prev.map((x) => (x.id === c.id ? { ...x, is_active: !x.is_active } : x)));
  };

  const remove = async (c: Coupon) => {
    if (!window.confirm(`Delete coupon "${c.code}"?`)) return;
    const { error } = await supabase.from('coupons').delete().eq('id', c.id);
    if (error) return toast.error('Could not delete');
    setCoupons((prev) => prev.filter((x) => x.id !== c.id));
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied');
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader
        title="Coupons"
        subtitle={`${coupons.length} created`}
        back
        action={
          <button onClick={() => setShowForm((s) => !s)} className="btn-primary text-sm px-4 py-2">
            <Plus className="w-4 h-4" /> New
          </button>
        }
      />

      {showForm && (
        <div className="card mb-4 space-y-3">
          <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="CODE (e.g. SAVE20)" className="input-field text-sm uppercase" />
          <div className="grid grid-cols-2 gap-2">
            <select value={form.discount_type} onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value as any }))} className="input-field text-sm">
              <option value="percentage">Percentage %</option>
              <option value="fixed">Fixed amount</option>
            </select>
            <input type="number" value={form.discount_value} onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))} placeholder="Value" className="input-field text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" value={form.max_uses} onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))} placeholder="Max uses (optional)" className="input-field text-sm" />
            <input type="number" value={form.min_order_amount} onChange={(e) => setForm((f) => ({ ...f, min_order_amount: e.target.value }))} placeholder="Min order (optional)" className="input-field text-sm" />
          </div>
          <div>
            <label className="text-xs dark:text-dark-muted text-light-muted block mb-1">Expires (optional)</label>
            <input type="date" value={form.valid_until} onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))} className="input-field text-sm" />
          </div>
          <button onClick={createCoupon} className="btn-primary w-full text-sm py-2.5">Create coupon</button>
        </div>
      )}

      {loading ? (
        <LoadingBlock rows={3} />
      ) : coupons.length === 0 ? (
        <EmptyState icon={Tag} title="No coupons yet" description="Create discount codes to encourage purchases." />
      ) : (
        <div className="space-y-2">
          {coupons.map((c) => (
            <div key={c.id} className="card">
              <div className="flex items-center justify-between mb-1">
                <button onClick={() => copyCode(c.code)} className="flex items-center gap-1.5 text-sm font-semibold dark:text-dark-text text-light-text">
                  {c.code} <Copy className="w-3 h-3 opacity-50" />
                </button>
                <span className={`badge ${c.is_active ? 'badge-success' : 'badge-warning'}`}>{c.is_active ? 'Active' : 'Off'}</span>
              </div>
              <p className="text-xs dark:text-dark-muted text-light-muted mb-2">
                {c.discount_type === 'percentage' ? `${c.discount_value}% off` : fmtMoney(c.discount_value, store?.currency) + ' off'}
                {c.min_order_amount ? ` · min ${fmtMoney(c.min_order_amount, store?.currency)}` : ''}
                {c.valid_until ? ` · expires ${fmtDate(c.valid_until)}` : ''}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-xs dark:text-dark-muted text-light-muted">{c.used_count}{c.max_uses ? `/${c.max_uses}` : ''} used</p>
                <div className="flex gap-3">
                  <button onClick={() => toggleActive(c)} className="text-xs text-primary font-medium">{c.is_active ? 'Disable' : 'Enable'}</button>
                  <button onClick={() => remove(c)} className="text-xs text-danger font-medium">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------- Affiliates ------------------------------- */

interface Affiliate {
  id: string;
  user_id: string;
  code: string;
  commission_pct: number;
  total_clicks: number;
  total_conversions: number;
  total_earnings: number;
  is_active: boolean;
}

export function SellerAffiliates() {
  const { store } = useSellerStore();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [commission, setCommission] = useState('10');
  const [inviting, setInviting] = useState(false);

  const load = async () => {
    if (!store) return;
    setLoading(true);
    const { data } = await supabase.from('affiliates').select('*').eq('store_id', store.id).order('created_at', { ascending: false });
    setAffiliates(data || []);
    if (data && data.length) {
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', data.map((a: any) => a.user_id));
      const map: Record<string, string> = {};
      (profiles || []).forEach((p: any) => (map[p.id] = p.full_name || p.email));
      setNames(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [store?.id]);

  const invite = async () => {
    if (!store || !email.trim()) return toast.error('Enter the affiliate\'s email');
    setInviting(true);
    const { data: profile, error: findErr } = await supabase.from('profiles').select('id').eq('email', email.trim().toLowerCase()).maybeSingle();
    if (findErr || !profile) {
      setInviting(false);
      return toast.error('No SELLIZI account found with that email');
    }
    const code = `${store.slug?.split('-')[0] || 'aff'}-${Math.random().toString(36).slice(2, 7)}`.toUpperCase();
    const { error } = await supabase.from('affiliates').insert({
      user_id: profile.id,
      store_id: store.id,
      code,
      commission_pct: Number(commission) || 10,
    });
    setInviting(false);
    if (error) return toast.error(error.message.includes('duplicate') ? 'That user is already an affiliate' : 'Could not add affiliate');
    toast.success('Affiliate added');
    setEmail('');
    load();
  };

  const toggleActive = async (a: Affiliate) => {
    const { error } = await supabase.from('affiliates').update({ is_active: !a.is_active }).eq('id', a.id);
    if (error) return toast.error('Could not update');
    setAffiliates((prev) => prev.map((x) => (x.id === a.id ? { ...x, is_active: !x.is_active } : x)));
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Affiliates" subtitle={`${affiliates.length} promoters`} back />

      <div className="card mb-4 space-y-2">
        <p className="text-sm font-medium dark:text-dark-text text-light-text">Add an affiliate</p>
        <p className="text-xs dark:text-dark-muted text-light-muted">They must already have a SELLIZI account.</p>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="affiliate@email.com" className="input-field text-sm" />
        <div className="flex gap-2">
          <input type="number" value={commission} onChange={(e) => setCommission(e.target.value)} placeholder="Commission %" className="input-field text-sm flex-1" />
          <button onClick={invite} disabled={inviting} className="btn-primary text-sm px-4">{inviting ? '...' : 'Add'}</button>
        </div>
      </div>

      {loading ? (
        <LoadingBlock rows={3} />
      ) : affiliates.length === 0 ? (
        <EmptyState icon={Users2} title="No affiliates yet" description="Invite people to promote your store and earn commission on sales they refer." />
      ) : (
        <div className="space-y-2">
          {affiliates.map((a) => (
            <div key={a.id} className="card">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium dark:text-dark-text text-light-text">{names[a.user_id] || 'Affiliate'}</p>
                <span className={`badge ${a.is_active ? 'badge-success' : 'badge-warning'}`}>{a.is_active ? 'Active' : 'Off'}</span>
              </div>
              <p className="text-xs dark:text-dark-muted text-light-muted mb-2">Code: {a.code} · {a.commission_pct}% commission</p>
              <div className="grid grid-cols-3 gap-2 text-center mb-2">
                <div><p className="text-xs dark:text-dark-muted text-light-muted">Clicks</p><p className="text-sm font-medium dark:text-dark-text text-light-text">{a.total_clicks}</p></div>
                <div><p className="text-xs dark:text-dark-muted text-light-muted">Sales</p><p className="text-sm font-medium dark:text-dark-text text-light-text">{a.total_conversions}</p></div>
                <div><p className="text-xs dark:text-dark-muted text-light-muted">Earned</p><p className="text-sm font-medium dark:text-dark-text text-light-text">{fmtMoney(a.total_earnings, store?.currency)}</p></div>
              </div>
              <button onClick={() => toggleActive(a)} className="text-xs text-primary font-medium">{a.is_active ? 'Deactivate' : 'Reactivate'}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------- Broadcasts ------------------------------- */

export function SellerBroadcasts() {
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<'all' | 'one'>('all');
  const [searchEmail, setSearchEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('notifications')
      .select('id, title, message, created_at, data')
      .contains('data', { seller_broadcast: true, seller_id: profile.id })
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        // de-dupe by title+created minute since one broadcast = many notification rows
        const seen = new Set<string>();
        const unique = (data || []).filter((d: any) => {
          const key = `${d.title}-${d.created_at?.slice(0, 16)}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setHistory(unique);
        setLoadingHistory(false);
      });
  }, [profile?.id]);

  const send = async () => {
    if (!profile) return;
    if (!title.trim() || !message.trim()) return toast.error('Add a title and message');
    setSending(true);

    let buyerIds: string[] = [];
    if (target === 'all') {
      const { data } = await supabase.from('orders').select('buyer_id').eq('seller_id', profile.id).eq('status', 'completed').not('buyer_id', 'is', null);
      buyerIds = Array.from(new Set((data || []).map((o: any) => o.buyer_id)));
    } else {
      if (!searchEmail.trim()) {
        setSending(false);
        return toast.error('Enter a customer email');
      }
      const { data } = await supabase.from('orders').select('buyer_id').eq('seller_id', profile.id).eq('buyer_email', searchEmail.trim().toLowerCase()).not('buyer_id', 'is', null).limit(1);
      buyerIds = (data || []).map((o: any) => o.buyer_id);
    }

    if (buyerIds.length === 0) {
      setSending(false);
      return toast.error('No customers with a SELLIZI account found to notify. Guest buyers without an account cannot receive in-app notifications.');
    }

    const rows = buyerIds.map((id) => ({
      user_id: id,
      type: 'promo',
      title: title.trim(),
      message: message.trim(),
      data: { seller_broadcast: true, seller_id: profile.id },
    }));
    const { error } = await supabase.from('notifications').insert(rows);
    setSending(false);
    if (error) return toast.error('Could not send broadcast');
    toast.success(`Sent to ${rows.length} customer${rows.length > 1 ? 's' : ''}`);
    setTitle('');
    setMessage('');
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Broadcasts" subtitle="Message your customers" back />
      <p className="text-xs dark:text-dark-muted text-light-muted mb-4">
        Delivered as an in-app notification. Only customers with a registered SELLIZI account can receive it — guest buyers cannot.
      </p>

      <div className="card mb-4 space-y-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="input-field text-sm" />
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Your message..." rows={3} className="input-field text-sm resize-none" />
        <div className="flex gap-2">
          <button onClick={() => setTarget('all')} className={`flex-1 py-2 rounded-lg text-xs font-medium ${target === 'all' ? 'bg-primary text-dark' : 'dark:bg-dark-surface bg-light-surface dark:text-dark-muted text-light-muted'}`}>All customers</button>
          <button onClick={() => setTarget('one')} className={`flex-1 py-2 rounded-lg text-xs font-medium ${target === 'one' ? 'bg-primary text-dark' : 'dark:bg-dark-surface bg-light-surface dark:text-dark-muted text-light-muted'}`}>One customer</button>
        </div>
        {target === 'one' && (
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 dark:text-dark-muted text-light-muted" />
            <input value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} placeholder="customer@email.com" className="input-field pl-9 text-sm" />
          </div>
        )}
        <button onClick={send} disabled={sending} className="btn-primary w-full text-sm py-2.5">
          <Megaphone className="w-4 h-4" /> {sending ? 'Sending...' : 'Send broadcast'}
        </button>
      </div>

      <p className="text-sm font-semibold dark:text-dark-muted text-light-muted uppercase tracking-wider mb-3">Recent</p>
      {loadingHistory ? (
        <LoadingBlock rows={2} />
      ) : history.length === 0 ? (
        <EmptyState icon={Megaphone} title="No broadcasts sent yet" />
      ) : (
        <div className="space-y-2">
          {history.map((h) => (
            <div key={h.id} className="card">
              <p className="text-sm font-medium dark:text-dark-text text-light-text">{h.title}</p>
              <p className="text-xs dark:text-dark-muted text-light-muted">{h.message}</p>
              <p className="text-xs dark:text-dark-muted text-light-muted mt-1">{fmtDate(h.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
