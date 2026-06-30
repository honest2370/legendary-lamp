import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  LifeBuoy, Megaphone, Settings, Key, Globe, CreditCard, FileText, HelpCircle,
  Bell, Shield, Wrench, Radio, LayoutTemplate, Users2, Tag, Star, ArrowLeft,
  Send, Plus, Trash2, Save, ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageHeader, LoadingBlock, EmptyState, StatusBadge, fmtDateTime, fmtDate, fmtMoney } from '@/components/shared/ui';

/* ============================================================
   SUPPORT TICKETS
   ============================================================ */
export function AdminTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'open' | 'in_progress' | 'resolved' | 'all'>('open');

  const load = async () => {
    const q = supabase.from('support_tickets').select('*, profiles(full_name, email)').order('created_at', { ascending: false }).limit(100);
    if (filter !== 'all') q.eq('status', filter);
    const { data } = await q;
    setTickets(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  if (openId) return <AdminTicketThread ticketId={openId} onBack={() => { setOpenId(null); load(); }} />;

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Support Tickets" />
      <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar">
        {(['open', 'in_progress', 'resolved', 'all'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap ${filter === f ? 'bg-primary text-dark' : 'dark:bg-dark-surface bg-light-surface dark:text-dark-muted text-light-muted'}`}>
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>
      {loading ? <LoadingBlock rows={4} /> : tickets.length === 0 ? <EmptyState icon={LifeBuoy} title="No tickets" /> : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <button key={t.id} onClick={() => setOpenId(t.id)} className="w-full card text-left">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium dark:text-dark-text text-light-text">{t.subject}</p>
                <StatusBadge status={t.status} />
              </div>
              <p className="text-xs dark:text-dark-muted text-light-muted">{t.profiles?.full_name || t.profiles?.email || 'User'} · {fmtDateTime(t.created_at)}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminTicketThread({ ticketId, onBack }: { ticketId: string; onBack: () => void }) {
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const [t, m] = await Promise.all([
        supabase.from('support_tickets').select('*, profiles(full_name, email)').eq('id', ticketId).single(),
        supabase.from('ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true }),
      ]);
      setTicket(t.data);
      setStatus(t.data?.status || 'open');
      setMessages(m.data || []);
    })();
    const channel = supabase.channel(`admin-ticket-${ticketId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${ticketId}` }, (p) => {
        setMessages((prev) => [...prev, p.new]);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ticketId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    await supabase.functions.invoke('send-ticket-message', { body: { ticket_id: ticketId, sender_id: null, message: text.trim(), is_admin: true } });
    setSending(false);
    setText('');
  };

  const updateStatus = async (newStatus: string) => {
    await supabase.from('support_tickets').update({ status: newStatus }).eq('id', ticketId);
    setStatus(newStatus);
    toast.success('Status updated');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-lg mx-auto">
      <div className="p-4 border-b dark:border-dark-border border-light-border flex items-center gap-3">
        <button onClick={onBack}><ArrowLeft className="w-5 h-5 dark:text-dark-muted text-light-muted" /></button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold dark:text-dark-text text-light-text truncate">{ticket?.subject}</p>
          <p className="text-xs dark:text-dark-muted text-light-muted">{ticket?.profiles?.full_name || ticket?.profiles?.email}</p>
        </div>
        <select value={status} onChange={(e) => updateStatus(e.target.value)} className="text-xs dark:bg-dark-surface bg-light-surface dark:text-dark-text text-light-text rounded-lg px-2 py-1 border dark:border-dark-border border-light-border">
          {['open', 'in_progress', 'resolved', 'closed'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {ticket?.description && <div className="card text-sm dark:text-dark-text text-light-text">{ticket.description}</div>}
        {messages.map((m) => (
          <div key={m.id} className={`max-w-[80%] p-3 rounded-xl text-sm ${m.is_admin ? 'bg-primary text-dark ml-auto' : 'dark:bg-dark-surface bg-light-surface dark:text-dark-text text-light-text'}`}>
            {m.message}
            <p className={`text-xs mt-1 ${m.is_admin ? 'text-dark/60' : 'dark:text-dark-muted text-light-muted'}`}>{fmtDateTime(m.created_at)}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="p-4 border-t dark:border-dark-border border-light-border flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Reply as admin..." className="input-field text-sm flex-1" />
        <button onClick={send} disabled={sending} className="btn-primary px-4"><Send className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

/* ============================================================
   BROADCASTS
   ============================================================ */
export function AdminBroadcasts() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<'all' | 'sellers' | 'buyers'>('all');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    supabase.from('broadcasts').select('*').order('created_at', { ascending: false }).limit(20).then(({ data }) => {
      setHistory(data || []);
      setLoadingHistory(false);
    });
  }, []);

  const send = async () => {
    if (!title.trim() || !message.trim()) return toast.error('Add a title and message');
    setSending(true);
    const { data, error } = await supabase.from('broadcasts').insert({
      title: title.trim(),
      message: message.trim(),
      type: 'notification',
      target,
    }).select().single();
    if (error || !data) { setSending(false); return toast.error('Could not save broadcast'); }

    const { error: fnErr } = await supabase.functions.invoke('send-broadcast', { body: { broadcast_id: data.id } });
    setSending(false);
    if (fnErr) return toast.error('Saved but failed to send — check Edge Function logs');
    toast.success('Broadcast sent');
    setHistory((prev) => [data, ...prev]);
    setTitle(''); setMessage('');
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Broadcasts" subtitle="Platform-wide messages" />
      <div className="card mb-4 space-y-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Broadcast title" className="input-field text-sm" />
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Message..." className="input-field text-sm resize-none" />
        <div className="flex gap-2">
          {(['all', 'sellers', 'buyers'] as const).map((t) => (
            <button key={t} onClick={() => setTarget(t)} className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize ${target === t ? 'bg-primary text-dark' : 'dark:bg-dark-surface bg-light-surface dark:text-dark-muted text-light-muted'}`}>{t}</button>
          ))}
        </div>
        <button onClick={send} disabled={sending} className="btn-primary w-full text-sm py-2.5">
          <Megaphone className="w-4 h-4" /> {sending ? 'Sending...' : 'Send broadcast'}
        </button>
      </div>
      <p className="text-sm font-semibold dark:text-dark-muted text-light-muted uppercase tracking-wider mb-3">History</p>
      {loadingHistory ? <LoadingBlock rows={2} /> : history.length === 0 ? <EmptyState icon={Megaphone} title="No broadcasts yet" /> : (
        <div className="space-y-2">
          {history.map((h) => (
            <div key={h.id} className="card">
              <p className="text-sm font-medium dark:text-dark-text text-light-text">{h.title}</p>
              <p className="text-xs dark:text-dark-muted text-light-muted">{h.message}</p>
              <p className="text-xs dark:text-dark-muted text-light-muted mt-1 capitalize">{h.target} · {fmtDate(h.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   PLATFORM SETTINGS
   ============================================================ */
export function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('admin_settings').select('*').then(({ data }) => {
      const map: Record<string, any> = {};
      (data || []).forEach((r: any) => (map[r.key] = r.value));
      setSettings(map);
      setLoading(false);
    });
  }, []);

  const save = async (key: string, value: any) => {
    setSaving(true);
    await supabase.from('admin_settings').upsert({ key, value }, { onConflict: 'key' });
    setSaving(false);
    toast.success('Saved');
  };

  const fields = [
    { key: 'platform_name', label: 'Platform name', type: 'text', placeholder: 'SELLIZI' },
    { key: 'support_email', label: 'Support email', type: 'text', placeholder: 'support@sellizi.com' },
    { key: 'default_currency', label: 'Default currency', type: 'text', placeholder: 'XAF' },
    { key: 'commission_rate', label: 'Platform commission %', type: 'number', placeholder: '10' },
    { key: 'maintenance_mode', label: 'Maintenance mode', type: 'toggle' },
  ];

  if (loading) return <div className="p-4 max-w-lg mx-auto"><LoadingBlock rows={4} /></div>;

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Platform Settings" />
      <div className="space-y-3">
        {fields.map((f) => (
          <div key={f.key} className="card">
            <label className="text-xs dark:text-dark-muted text-light-muted block mb-1.5">{f.label}</label>
            {f.type === 'toggle' ? (
              <div className="flex items-center justify-between">
                <span className="text-sm dark:text-dark-text text-light-text">{settings[f.key] ? 'Enabled' : 'Disabled'}</span>
                <button onClick={() => { const v = !settings[f.key]; setSettings((s) => ({ ...s, [f.key]: v })); save(f.key, v); }}
                  className={`w-11 h-6 rounded-full transition-colors relative ${settings[f.key] ? 'bg-danger' : 'dark:bg-dark-border bg-light-border'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${settings[f.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input type={f.type} defaultValue={settings[f.key] || ''} placeholder={f.placeholder} className="input-field text-sm flex-1"
                  onBlur={(e) => save(f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)} />
                {saving && <span className="text-xs text-primary self-center">Saving...</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   AI CONFIGS
   ============================================================ */
export function AdminAIConfigs() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ provider: 'openai', model: '', api_key: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    supabase.from('ai_configs').select('id, provider, model, is_active, created_at').then(({ data }) => {
      setConfigs(data || []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.model.trim() || !form.api_key.trim()) return toast.error('Fill in all fields');
    setSaving(true);
    const { error } = await supabase.from('ai_configs').insert({ provider: form.provider, model: form.model.trim(), api_key: form.api_key.trim(), is_active: true });
    setSaving(false);
    if (error) return toast.error('Could not save');
    toast.success('AI config added');
    setForm({ provider: 'openai', model: '', api_key: '' });
    load();
  };

  const toggle = async (c: any) => {
    await supabase.from('ai_configs').update({ is_active: !c.is_active }).eq('id', c.id);
    setConfigs((prev) => prev.map((x) => (x.id === c.id ? { ...x, is_active: !x.is_active } : x)));
  };

  const remove = async (id: string) => {
    await supabase.from('ai_configs').delete().eq('id', id);
    setConfigs((prev) => prev.filter((x) => x.id !== id));
    toast.success('Removed');
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="AI Configs" subtitle="Provider API keys — admin only" />
      <p className="text-xs dark:text-dark-muted text-light-muted mb-4">API keys are stored encrypted-at-rest by Supabase but are readable by any admin. Only add keys you're comfortable with admins accessing.</p>
      <div className="card mb-4 space-y-2">
        <select value={form.provider} onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))} className="input-field text-sm">
          {['openai', 'anthropic', 'google', 'cohere', 'mistral'].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <input value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} placeholder="Model (e.g. gpt-4o)" className="input-field text-sm" />
        <input value={form.api_key} onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))} type="password" placeholder="API key" className="input-field text-sm" />
        <button onClick={save} disabled={saving} className="btn-primary w-full text-sm py-2"><Plus className="w-4 h-4" /> Add config</button>
      </div>
      {loading ? <LoadingBlock rows={2} /> : configs.length === 0 ? <EmptyState icon={Key} title="No AI configs yet" /> : (
        <div className="space-y-2">
          {configs.map((c) => (
            <div key={c.id} className="card flex items-center justify-between">
              <div>
                <p className="text-sm font-medium dark:text-dark-text text-light-text capitalize">{c.provider} — {c.model}</p>
                <p className="text-xs dark:text-dark-muted text-light-muted">{fmtDate(c.created_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggle(c)} className={`badge ${c.is_active ? 'badge-success' : 'badge-warning'}`}>{c.is_active ? 'Active' : 'Off'}</button>
                <button onClick={() => remove(c.id)}><Trash2 className="w-4 h-4 text-danger" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   COUNTRIES
   ============================================================ */
export function AdminCountries() {
  const [countries, setCountries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', code: '', currency: '', phone_prefix: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    supabase.from('countries').select('*').order('name').then(({ data }) => {
      setCountries(data || []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.name.trim() || !form.code.trim() || !form.currency.trim()) return toast.error('Fill in name, code and currency');
    setSaving(true);
    const { error } = await supabase.from('countries').insert({ ...form, code: form.code.toUpperCase(), currency: form.currency.toUpperCase() });
    setSaving(false);
    if (error) return toast.error(error.message.includes('duplicate') ? 'Country code already exists' : 'Could not add country');
    toast.success('Country added');
    setForm({ name: '', code: '', currency: '', phone_prefix: '' });
    load();
  };

  const toggle = async (c: any) => {
    await supabase.from('countries').update({ is_active: !c.is_active }).eq('id', c.id);
    setCountries((prev) => prev.map((x) => (x.id === c.id ? { ...x, is_active: !x.is_active } : x)));
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Countries & Ops" subtitle="Supported payment regions" />
      <div className="card mb-4 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Country name" className="input-field text-sm" />
          <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="Code (e.g. CM)" className="input-field text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} placeholder="Currency (XAF)" className="input-field text-sm" />
          <input value={form.phone_prefix} onChange={(e) => setForm((f) => ({ ...f, phone_prefix: e.target.value }))} placeholder="Phone prefix (+237)" className="input-field text-sm" />
        </div>
        <button onClick={add} disabled={saving} className="btn-primary w-full text-sm py-2"><Plus className="w-4 h-4" /> Add country</button>
      </div>
      {loading ? <LoadingBlock rows={3} /> : (
        <div className="space-y-2">
          {countries.map((c) => (
            <div key={c.id} className="card flex items-center justify-between">
              <div>
                <p className="text-sm font-medium dark:text-dark-text text-light-text">{c.name} ({c.code})</p>
                <p className="text-xs dark:text-dark-muted text-light-muted">{c.currency} · {c.phone_prefix}</p>
              </div>
              <button onClick={() => toggle(c)} className={`badge ${c.is_active ? 'badge-success' : 'badge-warning'}`}>{c.is_active ? 'Active' : 'Off'}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SUBSCRIPTIONS
   ============================================================ */
export function AdminSubscriptions() {
  const [subs, setSubs] = useState<any[]>([]);
  const [users, setUsers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('subscriptions').select('*').order('created_at', { ascending: false }).limit(100).then(async ({ data }) => {
      setSubs(data || []);
      const ids = Array.from(new Set((data || []).map((s: any) => s.user_id)));
      if (ids.length) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', ids);
        const map: Record<string, string> = {};
        (profiles || []).forEach((p: any) => (map[p.id] = p.full_name || p.email));
        setUsers(map);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Subscriptions" />
      {loading ? <LoadingBlock rows={4} /> : subs.length === 0 ? <EmptyState icon={CreditCard} title="No subscriptions yet" /> : (
        <div className="space-y-2">
          {subs.map((s) => (
            <div key={s.id} className="card">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium dark:text-dark-text text-light-text">{users[s.user_id] || 'User'}</p>
                <StatusBadge status={s.status} />
              </div>
              <p className="text-xs dark:text-dark-muted text-light-muted capitalize">{s.plan} · {fmtMoney(s.amount, s.currency)} · Expires {fmtDate(s.ends_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   LEGAL PAGES
   ============================================================ */
export function AdminLegalPages() {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    supabase.from('legal_pages').select('*').order('type').then(({ data }) => { setPages(data || []); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    if (editing.id) {
      await supabase.from('legal_pages').update({ title: editing.title, content: editing.content, is_published: editing.is_published }).eq('id', editing.id);
    } else {
      await supabase.from('legal_pages').insert({ type: editing.type, title: editing.title, content: editing.content, is_published: editing.is_published });
    }
    setSaving(false);
    toast.success('Saved');
    setEditing(null);
    load();
  };

  const types = ['terms', 'privacy', 'refund', 'cookie', 'disclaimer'];

  if (editing) return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in pb-24">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setEditing(null)}><ArrowLeft className="w-5 h-5 dark:text-dark-muted text-light-muted" /></button>
        <p className="text-lg font-bold dark:text-dark-text text-light-text">Edit: {editing.title}</p>
      </div>
      <div className="space-y-3">
        <input value={editing.title} onChange={(e) => setEditing((p: any) => ({ ...p, title: e.target.value }))} className="input-field text-sm" />
        <textarea value={editing.content || ''} onChange={(e) => setEditing((p: any) => ({ ...p, content: e.target.value }))} rows={12} className="input-field text-sm resize-none" />
        <div className="flex items-center justify-between card">
          <p className="text-sm dark:text-dark-text text-light-text">Published</p>
          <button onClick={() => setEditing((p: any) => ({ ...p, is_published: !p.is_published }))}
            className={`w-11 h-6 rounded-full relative ${editing.is_published ? 'bg-primary' : 'dark:bg-dark-border bg-light-border'}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${editing.is_published ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-4 dark:bg-dark bg-light border-t dark:border-dark-border border-light-border">
        <button onClick={save} disabled={saving} className="btn-primary w-full py-2.5 text-sm"><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}</button>
      </div>
    </div>
  );

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Legal Pages" action={
        <button onClick={() => setEditing({ type: 'terms', title: 'New Page', content: '', is_published: false })} className="btn-primary text-sm px-3 py-2"><Plus className="w-4 h-4" /></button>
      } />
      {loading ? <LoadingBlock rows={3} /> : (
        <div className="space-y-2">
          {types.map((type) => {
            const page = pages.find((p) => p.type === type);
            return (
              <button key={type} onClick={() => setEditing(page || { type, title: type.charAt(0).toUpperCase() + type.slice(1) + ' Policy', content: '', is_published: false })} className="w-full card flex items-center justify-between text-left">
                <div>
                  <p className="text-sm font-medium dark:text-dark-text text-light-text capitalize">{type} Policy</p>
                  <p className="text-xs dark:text-dark-muted text-light-muted">{page ? (page.is_published ? 'Published' : 'Draft') : 'Not created yet'}</p>
                </div>
                <ChevronRight className="w-4 h-4 dark:text-dark-muted text-light-muted" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   HELP TOPICS
   ============================================================ */
export function AdminHelpTopics() {
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    supabase.from('help_topics').select('*').order('order_index').then(({ data }) => { setTopics(data || []); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    if (editing.id) {
      await supabase.from('help_topics').update({ title: editing.title, content: editing.content, category: editing.category, is_published: editing.is_published }).eq('id', editing.id);
    } else {
      await supabase.from('help_topics').insert({ title: editing.title, content: editing.content, category: editing.category || 'General', is_published: editing.is_published });
    }
    setSaving(false);
    toast.success('Saved');
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from('help_topics').delete().eq('id', id);
    setTopics((prev) => prev.filter((t) => t.id !== id));
  };

  if (editing) return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in pb-24">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setEditing(null)}><ArrowLeft className="w-5 h-5 dark:text-dark-muted text-light-muted" /></button>
        <p className="text-lg font-bold dark:text-dark-text text-light-text">{editing.id ? 'Edit' : 'New'} Topic</p>
      </div>
      <div className="space-y-3">
        <input value={editing.title} onChange={(e) => setEditing((p: any) => ({ ...p, title: e.target.value }))} placeholder="Title" className="input-field text-sm" />
        <input value={editing.category || ''} onChange={(e) => setEditing((p: any) => ({ ...p, category: e.target.value }))} placeholder="Category (e.g. Payments)" className="input-field text-sm" />
        <textarea value={editing.content || ''} onChange={(e) => setEditing((p: any) => ({ ...p, content: e.target.value }))} rows={10} placeholder="Article content..." className="input-field text-sm resize-none" />
        <div className="flex items-center justify-between card">
          <p className="text-sm dark:text-dark-text text-light-text">Published</p>
          <button onClick={() => setEditing((p: any) => ({ ...p, is_published: !p.is_published }))}
            className={`w-11 h-6 rounded-full relative ${editing.is_published ? 'bg-primary' : 'dark:bg-dark-border bg-light-border'}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${editing.is_published ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-4 dark:bg-dark bg-light border-t dark:border-dark-border border-light-border">
        <button onClick={save} disabled={saving} className="btn-primary w-full py-2.5 text-sm"><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}</button>
      </div>
    </div>
  );

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Help Topics" action={
        <button onClick={() => setEditing({ title: '', content: '', category: 'General', is_published: false })} className="btn-primary text-sm px-3 py-2"><Plus className="w-4 h-4" /> New</button>
      } />
      {loading ? <LoadingBlock rows={3} /> : topics.length === 0 ? <EmptyState icon={HelpCircle} title="No help topics yet" /> : (
        <div className="space-y-2">
          {topics.map((t) => (
            <div key={t.id} className="card flex items-center justify-between">
              <button onClick={() => setEditing(t)} className="min-w-0 text-left flex-1">
                <p className="text-sm font-medium dark:text-dark-text text-light-text truncate">{t.title}</p>
                <p className="text-xs dark:text-dark-muted text-light-muted">{t.category} · {t.is_published ? 'Published' : 'Draft'}</p>
              </button>
              <button onClick={() => remove(t.id)}><Trash2 className="w-4 h-4 text-danger" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   NOTIFICATIONS
   ============================================================ */
export function AdminNotifications() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!title.trim() || !message.trim() || !userId.trim()) return toast.error('Fill all fields');
    setSending(true);
    const { error } = await supabase.from('notifications').insert({ user_id: userId.trim(), type: 'admin', title: title.trim(), message: message.trim() });
    setSending(false);
    if (error) return toast.error('Could not send — check user ID is valid');
    toast.success('Notification sent');
    setTitle(''); setMessage(''); setUserId('');
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Push Notifications" subtitle="Send to a specific user" />
      <p className="text-xs dark:text-dark-muted text-light-muted mb-4">For platform-wide messages, use Broadcasts instead. This sends to a single user by their profile UUID.</p>
      <div className="card space-y-3">
        <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="User profile UUID" className="input-field text-sm font-mono" />
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notification title" className="input-field text-sm" />
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Message..." className="input-field text-sm resize-none" />
        <button onClick={send} disabled={sending} className="btn-primary w-full text-sm py-2.5"><Bell className="w-4 h-4" /> {sending ? 'Sending...' : 'Send notification'}</button>
      </div>
    </div>
  );
}

/* ============================================================
   SECURITY
   ============================================================ */
export function AdminSecurity() {
  const [logs, setLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(50).then(async ({ data }) => {
      setLogs(data || []);
      const ids = Array.from(new Set((data || []).map((l: any) => l.user_id).filter(Boolean)));
      if (ids.length) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', ids);
        const map: Record<string, string> = {};
        (profiles || []).forEach((p: any) => (map[p.id] = p.full_name || p.email));
        setUsers(map);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Security" subtitle="Recent activity logs" />
      {loading ? <LoadingBlock rows={5} /> : logs.length === 0 ? <EmptyState icon={Shield} title="No activity logged yet" /> : (
        <div className="space-y-2">
          {logs.map((l) => (
            <div key={l.id} className="card">
              <p className="text-sm dark:text-dark-text text-light-text capitalize">{l.action?.replace(/_/g, ' ')}</p>
              <p className="text-xs dark:text-dark-muted text-light-muted">{users[l.user_id] || 'System'}{l.ip_address ? ` · ${l.ip_address}` : ''} · {fmtDateTime(l.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   MAINTENANCE
   ============================================================ */
export function AdminMaintenance() {
  const [maintenanceOn, setMaintenanceOn] = useState(false);
  const [msg, setMsg] = useState('We are performing scheduled maintenance. Back soon!');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('admin_settings').select('value').eq('key', 'maintenance_mode').maybeSingle().then(({ data }) => {
      if (data) setMaintenanceOn(data.value === true || data.value === 'true');
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    await supabase.from('admin_settings').upsert([
      { key: 'maintenance_mode', value: maintenanceOn },
      { key: 'maintenance_message', value: msg },
    ], { onConflict: 'key' });
    setSaving(false);
    toast.success('Maintenance settings saved');
  };

  if (loading) return <div className="p-4 max-w-lg mx-auto"><LoadingBlock rows={2} /></div>;

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Maintenance" />
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium dark:text-dark-text text-light-text">Maintenance mode</p>
            <p className="text-xs dark:text-dark-muted text-light-muted">Shows a banner to all users</p>
          </div>
          <button onClick={() => setMaintenanceOn((v) => !v)} className={`w-11 h-6 rounded-full relative transition-colors ${maintenanceOn ? 'bg-danger' : 'dark:bg-dark-border bg-light-border'}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${maintenanceOn ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
        <div>
          <label className="text-xs dark:text-dark-muted text-light-muted block mb-1">Maintenance message</label>
          <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={2} className="input-field text-sm resize-none" />
        </div>
        <button onClick={save} disabled={saving} className="btn-primary w-full text-sm py-2.5"><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save settings'}</button>
      </div>
    </div>
  );
}

/* ============================================================
   PUSH NOTIFICATIONS CONFIG (Admin side)
   ============================================================ */
export function AdminPushNotifications() {
  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Push Notifications" subtitle="Web push configuration" />
      <p className="text-xs dark:text-dark-muted text-light-muted mb-4">
        Web push requires VAPID keys and a service worker — these aren't configured in this codebase yet. The <code className="font-mono">push_subscriptions</code> table exists and is ready, but the browser subscription flow and delivery worker need to be added as a separate feature. Use Broadcasts for in-app notifications in the meantime.
      </p>
      <div className="card space-y-2">
        {['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT'].map((k) => (
          <div key={k}>
            <label className="text-xs dark:text-dark-muted text-light-muted block mb-1">{k}</label>
            <input placeholder="Not configured" disabled className="input-field text-sm opacity-50" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   STORE TEMPLATES
   ============================================================ */
export function AdminTemplates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', description: '', preview_url: '', is_premium: false });
  const [saving, setSaving] = useState(false);

  const load = () => {
    supabase.from('store_templates').select('*').order('name').then(({ data }) => { setTemplates(data || []); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.name.trim()) return toast.error('Enter a template name');
    setSaving(true);
    const { error } = await supabase.from('store_templates').insert({ name: form.name.trim(), description: form.description.trim() || null, preview_url: form.preview_url.trim() || null, is_premium: form.is_premium });
    setSaving(false);
    if (error) return toast.error('Could not save');
    toast.success('Template added');
    setForm({ name: '', description: '', preview_url: '', is_premium: false });
    load();
  };

  const remove = async (id: string) => {
    await supabase.from('store_templates').delete().eq('id', id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Store Templates" />
      <div className="card mb-4 space-y-2">
        <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Template name" className="input-field text-sm" />
        <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description" className="input-field text-sm" />
        <input value={form.preview_url} onChange={(e) => setForm((f) => ({ ...f, preview_url: e.target.value }))} placeholder="Preview image URL" className="input-field text-sm" />
        <div className="flex items-center justify-between card">
          <p className="text-sm dark:text-dark-text text-light-text">Premium template</p>
          <button onClick={() => setForm((f) => ({ ...f, is_premium: !f.is_premium }))} className={`w-11 h-6 rounded-full relative ${form.is_premium ? 'bg-warning' : 'dark:bg-dark-border bg-light-border'}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.is_premium ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
        <button onClick={add} disabled={saving} className="btn-primary w-full text-sm py-2"><Plus className="w-4 h-4" /> Add template</button>
      </div>
      {loading ? <LoadingBlock rows={2} /> : templates.length === 0 ? <EmptyState icon={LayoutTemplate} title="No templates yet" /> : (
        <div className="space-y-2">
          {templates.map((t) => (
            <div key={t.id} className="card flex items-center justify-between">
              <div>
                <p className="text-sm font-medium dark:text-dark-text text-light-text">{t.name}</p>
                {t.is_premium && <span className="badge badge-warning mt-0.5">Premium</span>}
              </div>
              <button onClick={() => remove(t.id)}><Trash2 className="w-4 h-4 text-danger" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   AFFILIATES (admin view)
   ============================================================ */
export function AdminAffiliates() {
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('affiliates').select('*').order('created_at', { ascending: false }).limit(100).then(async ({ data }) => {
      setAffiliates(data || []);
      const ids = Array.from(new Set((data || []).map((a: any) => a.user_id)));
      if (ids.length) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', ids);
        const map: Record<string, string> = {};
        (profiles || []).forEach((p: any) => (map[p.id] = p.full_name || p.email));
        setNames(map);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Affiliates" subtitle="All affiliate accounts" />
      {loading ? <LoadingBlock rows={4} /> : affiliates.length === 0 ? <EmptyState icon={Users2} title="No affiliates yet" /> : (
        <div className="space-y-2">
          {affiliates.map((a) => (
            <div key={a.id} className="card">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium dark:text-dark-text text-light-text">{names[a.user_id] || 'Affiliate'}</p>
                <span className={`badge ${a.is_active ? 'badge-success' : 'badge-warning'}`}>{a.is_active ? 'Active' : 'Off'}</span>
              </div>
              <p className="text-xs dark:text-dark-muted text-light-muted">Code: {a.code} · {a.commission_pct}%</p>
              <div className="grid grid-cols-3 gap-1 mt-1 text-center">
                <div><p className="text-xs dark:text-dark-muted text-light-muted">Clicks</p><p className="text-sm font-medium dark:text-dark-text text-light-text">{a.total_clicks}</p></div>
                <div><p className="text-xs dark:text-dark-muted text-light-muted">Sales</p><p className="text-sm font-medium dark:text-dark-text text-light-text">{a.total_conversions}</p></div>
                <div><p className="text-xs dark:text-dark-muted text-light-muted">Earned</p><p className="text-sm font-medium dark:text-dark-text text-light-text">{fmtMoney(a.total_earnings)}</p></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   COUPONS (admin view)
   ============================================================ */
export function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [stores, setStores] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('coupons').select('*').order('created_at', { ascending: false }).limit(100).then(async ({ data }) => {
      setCoupons(data || []);
      const ids = Array.from(new Set((data || []).map((c: any) => c.store_id)));
      if (ids.length) {
        const { data: storeRows } = await supabase.from('stores').select('id, name').in('id', ids);
        const map: Record<string, string> = {};
        (storeRows || []).forEach((s: any) => (map[s.id] = s.name));
        setStores(map);
      }
      setLoading(false);
    });
  }, []);

  const remove = async (id: string) => {
    await supabase.from('coupons').delete().eq('id', id);
    setCoupons((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Coupons" subtitle="All platform coupons" />
      {loading ? <LoadingBlock rows={4} /> : coupons.length === 0 ? <EmptyState icon={Tag} title="No coupons yet" /> : (
        <div className="space-y-2">
          {coupons.map((c) => (
            <div key={c.id} className="card flex items-center justify-between">
              <div>
                <p className="text-sm font-medium dark:text-dark-text text-light-text font-mono">{c.code}</p>
                <p className="text-xs dark:text-dark-muted text-light-muted">{stores[c.store_id] || 'Store'} · {c.discount_type === 'percentage' ? `${c.discount_value}%` : fmtMoney(c.discount_value)} · {c.used_count} used</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge ${c.is_active ? 'badge-success' : 'badge-warning'}`}>{c.is_active ? 'On' : 'Off'}</span>
                <button onClick={() => remove(c.id)}><Trash2 className="w-4 h-4 text-danger" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   REVIEWS (admin view)
   ============================================================ */
export function AdminReviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    supabase.from('reviews').select('*, products(name), profiles(full_name, email)').order('created_at', { ascending: false }).limit(100).then(({ data }) => {
      setReviews((data as any) || []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!window.confirm('Remove this review?')) return;
    await supabase.from('reviews').delete().eq('id', id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
    toast.success('Review removed');
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Reviews" subtitle={`${reviews.length} total`} />
      {loading ? <LoadingBlock rows={4} /> : reviews.length === 0 ? <EmptyState icon={Star} title="No reviews yet" /> : (
        <div className="space-y-2">
          {reviews.map((r) => (
            <div key={r.id} className="card">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium dark:text-dark-text text-light-text">{r.profiles?.full_name || r.profiles?.email || 'Buyer'}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs dark:text-dark-muted text-light-muted">{'★'.repeat(r.rating)}</span>
                  <button onClick={() => remove(r.id)}><Trash2 className="w-4 h-4 text-danger" /></button>
                </div>
              </div>
              <p className="text-xs dark:text-dark-muted text-light-muted">{r.products?.name} · {fmtDate(r.created_at)}</p>
              {r.comment && <p className="text-sm dark:text-dark-text text-light-text mt-1">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   DOMAIN SETTINGS (admin)
   ============================================================ */
export function AdminDomainSettings() {
  const [domain, setDomain] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('admin_settings').select('value').eq('key', 'platform_domain').maybeSingle().then(({ data }) => {
      if (data) setDomain(data.value || '');
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    await supabase.from('admin_settings').upsert({ key: 'platform_domain', value: domain.trim() }, { onConflict: 'key' });
    setSaving(false);
    toast.success('Domain saved');
  };

  if (loading) return <div className="p-4 max-w-lg mx-auto"><LoadingBlock rows={1} /></div>;

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Domain Settings" subtitle="Platform-level domain config" />
      <p className="text-xs dark:text-dark-muted text-light-muted mb-3">Records your intended custom domain for the platform. Actual DNS and Vercel domain config still need to be done in your hosting provider.</p>
      <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="sellizi.com" className="input-field text-sm mb-2" />
      <button onClick={save} disabled={saving} className="btn-primary w-full text-sm py-2.5"><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save domain'}</button>
    </div>
  );
}

/* ============================================================
   SUPPORT EMAIL SETTINGS (admin)
   ============================================================ */
export function AdminSupportEmail() {
  const [email, setEmail] = useState('');
  const [signature, setSignature] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('admin_settings').select('*').in('key', ['support_email', 'email_signature']).then(({ data }) => {
      (data || []).forEach((r: any) => {
        if (r.key === 'support_email') setEmail(r.value || '');
        if (r.key === 'email_signature') setSignature(r.value || '');
      });
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    await supabase.from('admin_settings').upsert([
      { key: 'support_email', value: email.trim() },
      { key: 'email_signature', value: signature.trim() },
    ], { onConflict: 'key' });
    setSaving(false);
    toast.success('Email settings saved');
  };

  if (loading) return <div className="p-4 max-w-lg mx-auto"><LoadingBlock rows={2} /></div>;

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Support Email" />
      <div className="space-y-3">
        <div><label className="text-xs dark:text-dark-muted text-light-muted block mb-1">Support email address</label><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="support@sellizi.com" className="input-field text-sm" /></div>
        <div><label className="text-xs dark:text-dark-muted text-light-muted block mb-1">Email signature</label><textarea value={signature} onChange={(e) => setSignature(e.target.value)} rows={3} placeholder="The SELLIZI Team" className="input-field text-sm resize-none" /></div>
      </div>
      <button onClick={save} disabled={saving} className="btn-primary w-full text-sm py-2.5 mt-3"><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}</button>
    </div>
  );
}
