import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save, Plus, Trash2, Lock, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useSellerStore } from '@/hooks/useSellerStore';
import { PageHeader, LoadingBlock, EmptyState, fmtDateTime } from '@/components/seller/ui';

function SaveBtn({ onClick, saving, label = 'Save changes' }: { onClick: () => void; saving: boolean; label?: string }) {
  return (
    <button onClick={onClick} disabled={saving} className="btn-primary w-full text-sm py-2.5 mt-2">
      <Save className="w-4 h-4" /> {saving ? 'Saving...' : label}
    </button>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${checked ? 'bg-primary' : 'dark:bg-dark-border bg-light-border'}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

/* ------------------------------- Store Settings ------------------------------ */

export function SellerStoreSettings() {
  const { store, refreshStore, loading } = useSellerStore();
  const [form, setForm] = useState({ name: '', description: '', logo_url: '', banner_url: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (store) setForm({ name: store.name || '', description: store.description || '', logo_url: store.logo_url || '', banner_url: store.banner_url || '' });
  }, [store?.id]);

  const save = async () => {
    if (!store) return;
    setSaving(true);
    const { error } = await supabase.from('stores').update(form).eq('id', store.id);
    setSaving(false);
    if (error) return toast.error('Could not save store settings');
    toast.success('Store updated');
    refreshStore();
  };

  if (loading) return <div className="p-4 max-w-lg mx-auto"><LoadingBlock rows={4} /></div>;

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Store Settings" back />
      <div className="space-y-3">
        <div><label className="text-xs dark:text-dark-muted text-light-muted block mb-1">Store name</label><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field text-sm" /></div>
        <div><label className="text-xs dark:text-dark-muted text-light-muted block mb-1">Description</label><textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="input-field text-sm resize-none" /></div>
        <div><label className="text-xs dark:text-dark-muted text-light-muted block mb-1">Logo URL</label><input value={form.logo_url} onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))} placeholder="https://..." className="input-field text-sm" /></div>
        <div><label className="text-xs dark:text-dark-muted text-light-muted block mb-1">Banner URL</label><input value={form.banner_url} onChange={(e) => setForm((f) => ({ ...f, banner_url: e.target.value }))} placeholder="https://..." className="input-field text-sm" /></div>
      </div>
      <SaveBtn onClick={save} saving={saving} />
    </div>
  );
}

/* ------------------------------ Profile Settings ----------------------------- */

export function SellerProfileSettings() {
  const { profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({ full_name: '', username: '', phone: '', country: '', bio: '', whatsapp: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name || '', username: profile.username || '', phone: profile.phone || '', country: profile.country || '', bio: profile.bio || '', whatsapp: profile.whatsapp || '' });
  }, [profile?.id]);

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update(form).eq('id', profile.id);
    setSaving(false);
    if (error) return toast.error(error.message.includes('duplicate') ? 'That username is taken' : 'Could not save profile');
    toast.success('Profile updated');
    refreshProfile?.();
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Profile Settings" back />
      <div className="space-y-3">
        <div><label className="text-xs dark:text-dark-muted text-light-muted block mb-1">Full name</label><input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} className="input-field text-sm" /></div>
        <div><label className="text-xs dark:text-dark-muted text-light-muted block mb-1">Username</label><input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} className="input-field text-sm" /></div>
        <div><label className="text-xs dark:text-dark-muted text-light-muted block mb-1">Phone</label><input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="input-field text-sm" /></div>
        <div><label className="text-xs dark:text-dark-muted text-light-muted block mb-1">WhatsApp</label><input value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} className="input-field text-sm" /></div>
        <div><label className="text-xs dark:text-dark-muted text-light-muted block mb-1">Country</label><input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} className="input-field text-sm" /></div>
        <div><label className="text-xs dark:text-dark-muted text-light-muted block mb-1">Bio</label><textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} rows={3} className="input-field text-sm resize-none" /></div>
      </div>
      <SaveBtn onClick={save} saving={saving} />
    </div>
  );
}

/* ------------------------------- Email Settings ------------------------------ */

export function SellerEmailSettings() {
  const { profile } = useAuth();
  const [prefs, setPrefs] = useState({ order_notifications: true, price_drop_alerts: true, promotions_news: true, security_alerts: true, weekly_digest: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    supabase.from('email_preferences').select('*').eq('user_id', profile.id).maybeSingle().then(({ data }) => {
      if (data) setPrefs(data);
      setLoading(false);
    });
  }, [profile?.id]);

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from('email_preferences').upsert({ user_id: profile.id, ...prefs }, { onConflict: 'user_id' });
    setSaving(false);
    if (error) return toast.error('Could not save preferences');
    toast.success('Preferences saved');
  };

  const rows: { key: keyof typeof prefs; label: string; desc: string }[] = [
    { key: 'order_notifications', label: 'Order notifications', desc: 'New orders and delivery updates' },
    { key: 'price_drop_alerts', label: 'Price drop alerts', desc: 'When products you follow drop in price' },
    { key: 'promotions_news', label: 'Promotions & news', desc: 'Platform updates and offers' },
    { key: 'security_alerts', label: 'Security alerts', desc: 'Login attempts and account changes' },
    { key: 'weekly_digest', label: 'Weekly digest', desc: 'Summary of your store performance' },
  ];

  if (loading) return <div className="p-4 max-w-lg mx-auto"><LoadingBlock rows={4} /></div>;

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Email Settings" back />
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.key} className="card flex items-center justify-between">
            <div><p className="text-sm font-medium dark:text-dark-text text-light-text">{r.label}</p><p className="text-xs dark:text-dark-muted text-light-muted">{r.desc}</p></div>
            <Toggle checked={prefs[r.key]} onChange={(v) => setPrefs((p) => ({ ...p, [r.key]: v }))} />
          </div>
        ))}
      </div>
      <SaveBtn onClick={save} saving={saving} />
    </div>
  );
}

/* ----------------------------- Delivery Settings ----------------------------- */

export function SellerDeliverySettings() {
  const { store, refreshStore, loading } = useSellerStore();
  const [auto, setAuto] = useState(true);
  const [instructions, setInstructions] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (store) {
      const ds = store.delivery_settings || {};
      setAuto(ds.auto_delivery ?? true);
      setInstructions(ds.instructions || '');
    }
  }, [store?.id]);

  const save = async () => {
    if (!store) return;
    setSaving(true);
    const { error } = await supabase.from('stores').update({ delivery_settings: { auto_delivery: auto, instructions } }).eq('id', store.id);
    setSaving(false);
    if (error) return toast.error('Could not save');
    toast.success('Delivery settings saved');
    refreshStore();
  };

  if (loading) return <div className="p-4 max-w-lg mx-auto"><LoadingBlock rows={3} /></div>;

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Delivery Settings" back />
      <div className="card flex items-center justify-between mb-3">
        <div><p className="text-sm font-medium dark:text-dark-text text-light-text">Auto-deliver digital products</p><p className="text-xs dark:text-dark-muted text-light-muted">Deliver instantly once payment completes</p></div>
        <Toggle checked={auto} onChange={setAuto} />
      </div>
      <label className="text-xs dark:text-dark-muted text-light-muted block mb-1">Delivery instructions shown to buyers</label>
      <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={4} placeholder="e.g. Check your email for access details within 5 minutes." className="input-field text-sm resize-none" />
      <SaveBtn onClick={save} saving={saving} />
    </div>
  );
}

/* ------------------------------ Design Settings ------------------------------ */

export function SellerDesignSettings() {
  const { store, refreshStore, loading } = useSellerStore();
  const [theme, setTheme] = useState('default');
  const [templates, setTemplates] = useState<any[]>([]);
  const [template, setTemplate] = useState('modern');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (store) {
      setTheme(store.theme || 'default');
      setTemplate(store.template || 'modern');
    }
    supabase.from('store_templates').select('*').then(({ data }) => setTemplates(data || []));
  }, [store?.id]);

  const save = async () => {
    if (!store) return;
    setSaving(true);
    const { error } = await supabase.from('stores').update({ theme, template }).eq('id', store.id);
    setSaving(false);
    if (error) return toast.error('Could not save');
    toast.success('Design updated');
    refreshStore();
  };

  if (loading) return <div className="p-4 max-w-lg mx-auto"><LoadingBlock rows={3} /></div>;

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Design Settings" back />
      <div className="mb-4">
        <label className="text-xs dark:text-dark-muted text-light-muted block mb-1">Color theme</label>
        <select value={theme} onChange={(e) => setTheme(e.target.value)} className="input-field text-sm">
          <option value="default">Default</option>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="vibrant">Vibrant</option>
        </select>
      </div>
      <p className="text-xs dark:text-dark-muted text-light-muted mb-2">Storefront template</p>
      {templates.length === 0 ? (
        <div className="grid grid-cols-2 gap-2 mb-2">
          {['modern', 'minimal', 'bold', 'classic'].map((t) => (
            <button key={t} onClick={() => setTemplate(t)} className={`card text-sm capitalize ${template === t ? 'border-primary' : ''}`}>{t}</button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 mb-2">
          {templates.map((t) => (
            <button key={t.id} onClick={() => setTemplate(t.name)} className={`card text-left ${template === t.name ? 'border-primary' : ''}`}>
              <p className="text-sm font-medium dark:text-dark-text text-light-text">{t.name}</p>
              {t.is_premium && <span className="badge badge-warning mt-1">Premium</span>}
            </button>
          ))}
        </div>
      )}
      <SaveBtn onClick={save} saving={saving} />
    </div>
  );
}

/* ------------------------------ Domain Settings ------------------------------ */

export function SellerDomainSettings() {
  const { store, refreshStore, loading } = useSellerStore();
  const [domain, setDomain] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (store) setDomain(store.custom_domain || '');
  }, [store?.id]);

  const save = async () => {
    if (!store) return;
    setSaving(true);
    const { error } = await supabase.from('stores').update({ custom_domain: domain.trim() || null }).eq('id', store.id);
    setSaving(false);
    if (error) return toast.error('Could not save domain');
    toast.success('Domain saved');
    refreshStore();
  };

  if (loading) return <div className="p-4 max-w-lg mx-auto"><LoadingBlock rows={2} /></div>;

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Domain Settings" back />
      <p className="text-xs dark:text-dark-muted text-light-muted mb-3">
        Your store is always reachable at <span className="font-mono">sellizi.vercel.app/{store?.slug}</span>. Add a custom domain below — you'll still need to point its DNS to this platform separately; saving it here only records your intent.
      </p>
      <label className="text-xs dark:text-dark-muted text-light-muted block mb-1">Custom domain</label>
      <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="shop.yourbrand.com" className="input-field text-sm" />
      <SaveBtn onClick={save} saving={saving} />
    </div>
  );
}

/* ------------------------------- Charge Settings ------------------------------ */

export function SellerChargeSettings() {
  const { store, loading } = useSellerStore();
  const [charges, setCharges] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', type: 'fixed', value: '' });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!store) return;
    supabase.from('custom_charges').select('*').eq('store_id', store.id).then(({ data }) => setCharges(data || []));
  }, [store?.id]);

  const add = async () => {
    if (!store) return;
    if (!form.name.trim() || !form.value) return toast.error('Fill in name and value');
    const { data, error } = await supabase.from('custom_charges').insert({ store_id: store.id, name: form.name, type: form.type, value: Number(form.value) }).select().single();
    if (error) return toast.error('Could not add charge');
    setCharges((c) => [...c, data]);
    setForm({ name: '', type: 'fixed', value: '' });
    setShowForm(false);
  };

  const toggle = async (c: any) => {
    await supabase.from('custom_charges').update({ is_active: !c.is_active }).eq('id', c.id);
    setCharges((prev) => prev.map((x) => (x.id === c.id ? { ...x, is_active: !x.is_active } : x)));
  };

  const remove = async (c: any) => {
    await supabase.from('custom_charges').delete().eq('id', c.id);
    setCharges((prev) => prev.filter((x) => x.id !== c.id));
  };

  if (loading) return <div className="p-4 max-w-lg mx-auto"><LoadingBlock rows={3} /></div>;

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Charge Settings" subtitle="Extra fees applied at checkout" back action={<button onClick={() => setShowForm((s) => !s)} className="btn-primary text-sm px-3 py-2"><Plus className="w-4 h-4" /></button>} />

      {showForm && (
        <div className="card mb-4 space-y-2">
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Charge name (e.g. Service fee)" className="input-field text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="input-field text-sm">
              <option value="fixed">Fixed</option>
              <option value="percentage">Percentage</option>
            </select>
            <input type="number" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} placeholder="Value" className="input-field text-sm" />
          </div>
          <button onClick={add} className="btn-primary w-full text-sm py-2">Add charge</button>
        </div>
      )}

      {charges.length === 0 ? (
        <EmptyState icon={Plus} title="No custom charges" description="Add extra fees like service charges that apply at checkout." />
      ) : (
        <div className="space-y-2">
          {charges.map((c) => (
            <div key={c.id} className="card flex items-center justify-between">
              <div>
                <p className="text-sm font-medium dark:text-dark-text text-light-text">{c.name}</p>
                <p className="text-xs dark:text-dark-muted text-light-muted">{c.type === 'percentage' ? `${c.value}%` : c.value}</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => toggle(c)} className={`badge ${c.is_active ? 'badge-success' : 'badge-warning'}`}>{c.is_active ? 'Active' : 'Off'}</button>
                <button onClick={() => remove(c)}><Trash2 className="w-4 h-4 text-danger" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------------------- Currency Settings ----------------------------- */

export function SellerCurrencySettings() {
  const { store, refreshStore, loading } = useSellerStore();
  const [currency, setCurrency] = useState('XAF');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (store) setCurrency(store.currency || 'XAF');
  }, [store?.id]);

  const save = async () => {
    if (!store) return;
    setSaving(true);
    const { error } = await supabase.from('stores').update({ currency }).eq('id', store.id);
    setSaving(false);
    if (error) return toast.error('Could not save currency');
    toast.success('Currency updated. Existing product prices keep their numeric value — update them manually if you need to convert.');
    refreshStore();
  };

  if (loading) return <div className="p-4 max-w-lg mx-auto"><LoadingBlock rows={2} /></div>;

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Currency Settings" back />
      <p className="text-xs dark:text-dark-muted text-light-muted mb-3">
        Changing your store currency does not convert existing product prices — it only changes the label going forward. Update prices manually after switching.
      </p>
      <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="input-field text-sm">
        {['XAF', 'USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR'].map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <SaveBtn onClick={save} saving={saving} />
    </div>
  );
}

/* ----------------------------------- SEO -------------------------------------- */

export function SellerSEO() {
  const { store, refreshStore, loading } = useSellerStore();
  const [form, setForm] = useState({ title: '', description: '', keywords: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (store) {
      const m = store.seo_meta || {};
      setForm({ title: m.title || '', description: m.description || '', keywords: m.keywords || '' });
    }
  }, [store?.id]);

  const save = async () => {
    if (!store) return;
    setSaving(true);
    const { error } = await supabase.from('stores').update({ seo_meta: form }).eq('id', store.id);
    setSaving(false);
    if (error) return toast.error('Could not save SEO settings');
    toast.success('SEO settings saved');
    refreshStore();
  };

  if (loading) return <div className="p-4 max-w-lg mx-auto"><LoadingBlock rows={3} /></div>;

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="SEO" subtitle="How your store appears in search" back />
      <div className="space-y-3">
        <div><label className="text-xs dark:text-dark-muted text-light-muted block mb-1">Page title</label><input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="input-field text-sm" /></div>
        <div><label className="text-xs dark:text-dark-muted text-light-muted block mb-1">Meta description</label><textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="input-field text-sm resize-none" /></div>
        <div><label className="text-xs dark:text-dark-muted text-light-muted block mb-1">Keywords (comma separated)</label><input value={form.keywords} onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))} className="input-field text-sm" /></div>
      </div>
      <SaveBtn onClick={save} saving={saving} />
    </div>
  );
}

/* ------------------------------ Support Channels ------------------------------ */

export function SellerSupportChannels() {
  const { store, refreshStore, loading } = useSellerStore();
  const [form, setForm] = useState({ whatsapp: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (store) {
      const c = store.support_channels || {};
      setForm({ whatsapp: c.whatsapp || '', email: c.email || '', phone: c.phone || '' });
    }
  }, [store?.id]);

  const save = async () => {
    if (!store) return;
    setSaving(true);
    const { error } = await supabase.from('stores').update({ support_channels: form }).eq('id', store.id);
    setSaving(false);
    if (error) return toast.error('Could not save');
    toast.success('Support channels saved');
    refreshStore();
  };

  if (loading) return <div className="p-4 max-w-lg mx-auto"><LoadingBlock rows={3} /></div>;

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Support Channels" subtitle="How buyers can reach you" back />
      <div className="space-y-3">
        <div><label className="text-xs dark:text-dark-muted text-light-muted block mb-1">WhatsApp number</label><input value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} className="input-field text-sm" /></div>
        <div><label className="text-xs dark:text-dark-muted text-light-muted block mb-1">Support email</label><input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="input-field text-sm" /></div>
        <div><label className="text-xs dark:text-dark-muted text-light-muted block mb-1">Support phone</label><input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="input-field text-sm" /></div>
      </div>
      <SaveBtn onClick={save} saving={saving} />
    </div>
  );
}

/* ---------------------------------- Security ---------------------------------- */

export function SellerSecurity() {
  const { profile, user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [alertsOn, setAlertsOn] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    Promise.all([
      supabase.from('activity_logs').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('email_preferences').select('security_alerts').eq('user_id', profile.id).maybeSingle(),
    ]).then(([logsRes, prefsRes]) => {
      setLogs(logsRes.data || []);
      if (prefsRes.data) setAlertsOn(prefsRes.data.security_alerts);
      setLoading(false);
    });
  }, [profile?.id]);

  const toggleAlerts = async (v: boolean) => {
    if (!profile) return;
    setAlertsOn(v);
    await supabase.from('email_preferences').upsert({ user_id: profile.id, security_alerts: v }, { onConflict: 'user_id' });
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Security" back />

      <div className="card flex items-center gap-3 mb-3">
        <ShieldCheck className="w-5 h-5 text-success" />
        <div>
          <p className="text-sm font-medium dark:text-dark-text text-light-text">{user?.email}</p>
          <p className="text-xs dark:text-dark-muted text-light-muted">Email verified via Supabase Auth</p>
        </div>
      </div>

      <div className="card flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-warning" /><p className="text-sm font-medium dark:text-dark-text text-light-text">Security alert emails</p></div>
        <Toggle checked={alertsOn} onChange={toggleAlerts} />
      </div>

      <p className="text-sm font-semibold dark:text-dark-muted text-light-muted uppercase tracking-wider mb-3">Recent activity</p>
      {loading ? (
        <LoadingBlock rows={3} />
      ) : logs.length === 0 ? (
        <EmptyState icon={Lock} title="No activity recorded yet" />
      ) : (
        <div className="space-y-2">
          {logs.map((l) => (
            <div key={l.id} className="card">
              <p className="text-sm dark:text-dark-text text-light-text capitalize">{l.action.replace(/_/g, ' ')}</p>
              <p className="text-xs dark:text-dark-muted text-light-muted">{fmtDateTime(l.created_at)}{l.ip_address ? ` · ${l.ip_address}` : ''}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Change Password ------------------------------ */

export function SellerChangePassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    if (password !== confirm) return toast.error('Passwords do not match');
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('Password updated');
    setPassword('');
    setConfirm('');
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Change Password" back />
      <div className="space-y-3">
        <div><label className="text-xs dark:text-dark-muted text-light-muted block mb-1">New password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field text-sm" /></div>
        <div><label className="text-xs dark:text-dark-muted text-light-muted block mb-1">Confirm new password</label><input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input-field text-sm" /></div>
      </div>
      <SaveBtn onClick={save} saving={saving} label="Update password" />
    </div>
  );
}
