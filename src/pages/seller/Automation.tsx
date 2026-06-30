import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Users, Plus, Trash2, Webhook, Plug, Zap, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useSellerStore } from '@/hooks/useSellerStore';
import { PageHeader, LoadingBlock, EmptyState, fmtDate } from '@/components/seller/ui';

function NeedsMigrationNotice({ table }: { table: string }) {
  return (
    <div className="card border-warning/40 mb-4 flex items-start gap-2">
      <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
      <p className="text-xs dark:text-dark-muted text-light-muted">
        This needs the <span className="font-mono">{table}</span> table from migration <span className="font-mono">003_seller_extra_features.sql</span>. If you see a database error below, that migration hasn't been run yet.
      </p>
    </div>
  );
}

/* ----------------------------------- Team -------------------------------------- */

export function SellerTeam() {
  const { profile } = useAuth();
  const { store } = useSellerStore();
  const [members, setMembers] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('staff');
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (!store) return;
    supabase.from('team_members').select('*').eq('store_id', store.id).order('created_at', { ascending: false }).then(({ data, error }) => {
      if (error) setErrored(true);
      setMembers(data || []);
      setLoading(false);
    });
  }, [store?.id]);

  const invite = async () => {
    if (!profile || !store || !email.trim()) return toast.error('Enter an email');
    setInviting(true);
    const { data, error } = await supabase
      .from('team_members')
      .insert({ store_id: store.id, owner_id: profile.id, invited_email: email.trim().toLowerCase(), role })
      .select()
      .single();
    setInviting(false);
    if (error) return toast.error('Could not invite — has the migration been run?');
    setMembers((m) => [data, ...m]);
    setEmail('');
    toast.success('Invite recorded');
  };

  const remove = async (id: string) => {
    await supabase.from('team_members').delete().eq('id', id);
    setMembers((m) => m.filter((x) => x.id !== id));
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Team" subtitle="Collaborators on your store" back />
      <p className="text-xs dark:text-dark-muted text-light-muted mb-4">
        This records who you've invited and their intended role. Logging in to actually use those permissions isn't wired up yet — your app's login still only recognizes the store owner.
      </p>
      {errored && <NeedsMigrationNotice table="team_members" />}

      <div className="card mb-4 space-y-2">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@email.com" className="input-field text-sm" />
        <div className="flex gap-2">
          <select value={role} onChange={(e) => setRole(e.target.value)} className="input-field text-sm flex-1">
            <option value="manager">Manager</option>
            <option value="staff">Staff</option>
            <option value="support">Support</option>
          </select>
          <button onClick={invite} disabled={inviting} className="btn-primary text-sm px-4"><Plus className="w-4 h-4" /></button>
        </div>
      </div>

      {loading ? (
        <LoadingBlock rows={3} />
      ) : members.length === 0 ? (
        <EmptyState icon={Users} title="No team members yet" />
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="card flex items-center justify-between">
              <div>
                <p className="text-sm font-medium dark:text-dark-text text-light-text">{m.invited_email}</p>
                <p className="text-xs dark:text-dark-muted text-light-muted capitalize">{m.role} · {m.status}</p>
              </div>
              <button onClick={() => remove(m.id)}><Trash2 className="w-4 h-4 text-danger" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* --------------------------------- Webhooks ------------------------------------ */

export function SellerWebhooks() {
  const { profile } = useAuth();
  const { store } = useSellerStore();
  const [hooks, setHooks] = useState<any[]>([]);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (!store) return;
    supabase.from('webhooks').select('*').eq('store_id', store.id).then(({ data, error }) => {
      if (error) setErrored(true);
      setHooks(data || []);
      setLoading(false);
    });
  }, [store?.id]);

  const add = async () => {
    if (!profile || !store || !url.trim()) return toast.error('Enter a webhook URL');
    setSaving(true);
    const { data, error } = await supabase.from('webhooks').insert({ store_id: store.id, owner_id: profile.id, url: url.trim() }).select().single();
    setSaving(false);
    if (error) return toast.error('Could not add webhook — has the migration been run?');
    setHooks((h) => [data, ...h]);
    setUrl('');
  };

  const remove = async (id: string) => {
    await supabase.from('webhooks').delete().eq('id', id);
    setHooks((h) => h.filter((x) => x.id !== id));
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Webhooks" subtitle="Send order events to your own server" back />
      <p className="text-xs dark:text-dark-muted text-light-muted mb-4">
        Webhooks are stored here but nothing dispatches them yet — that needs a background worker triggered on order completion, which doesn't exist in this codebase. Saving a URL here won't receive real events until that's built.
      </p>
      {errored && <NeedsMigrationNotice table="webhooks" />}

      <div className="card mb-4 flex gap-2">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://yourserver.com/webhook" className="input-field text-sm flex-1" />
        <button onClick={add} disabled={saving} className="btn-primary text-sm px-4"><Plus className="w-4 h-4" /></button>
      </div>

      {loading ? (
        <LoadingBlock rows={2} />
      ) : hooks.length === 0 ? (
        <EmptyState icon={Webhook} title="No webhooks configured" />
      ) : (
        <div className="space-y-2">
          {hooks.map((h) => (
            <div key={h.id} className="card flex items-center justify-between">
              <p className="text-sm dark:text-dark-text text-light-text truncate">{h.url}</p>
              <button onClick={() => remove(h.id)}><Trash2 className="w-4 h-4 text-danger" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Integrations ---------------------------------- */

const PROVIDERS = ['Google Analytics', 'Facebook Pixel', 'Mailchimp', 'Zapier'];

export function SellerIntegrations() {
  const { profile } = useAuth();
  const { store } = useSellerStore();
  const [items, setItems] = useState<any[]>([]);
  const [provider, setProvider] = useState(PROVIDERS[0]);
  const [configValue, setConfigValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (!store) return;
    supabase.from('integrations').select('*').eq('store_id', store.id).then(({ data, error }) => {
      if (error) setErrored(true);
      setItems(data || []);
      setLoading(false);
    });
  }, [store?.id]);

  const add = async () => {
    if (!profile || !store) return;
    const { data, error } = await supabase.from('integrations').insert({ store_id: store.id, owner_id: profile.id, provider, config: { key: configValue } }).select().single();
    if (error) return toast.error('Could not add — has the migration been run?');
    setItems((i) => [data, ...i]);
    setConfigValue('');
  };

  const remove = async (id: string) => {
    await supabase.from('integrations').delete().eq('id', id);
    setItems((i) => i.filter((x) => x.id !== id));
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Integrations" subtitle="Connect external tools" back />
      <p className="text-xs dark:text-dark-muted text-light-muted mb-4">
        These keys/IDs are saved against your store, but no code in this app currently reads them to actually fire pixel events or sync contacts — that wiring would need to be added per provider.
      </p>
      {errored && <NeedsMigrationNotice table="integrations" />}

      <div className="card mb-4 space-y-2">
        <select value={provider} onChange={(e) => setProvider(e.target.value)} className="input-field text-sm">
          {PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <input value={configValue} onChange={(e) => setConfigValue(e.target.value)} placeholder="API key / tracking ID" className="input-field text-sm" />
        <button onClick={add} className="btn-primary w-full text-sm py-2"><Plus className="w-4 h-4" /> Add integration</button>
      </div>

      {loading ? (
        <LoadingBlock rows={2} />
      ) : items.length === 0 ? (
        <EmptyState icon={Plug} title="No integrations connected" />
      ) : (
        <div className="space-y-2">
          {items.map((i) => (
            <div key={i.id} className="card flex items-center justify-between">
              <div><p className="text-sm font-medium dark:text-dark-text text-light-text">{i.provider}</p><p className="text-xs dark:text-dark-muted text-light-muted">{fmtDate(i.created_at)}</p></div>
              <button onClick={() => remove(i.id)}><Trash2 className="w-4 h-4 text-danger" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------- Automations ----------------------------------- */

const TRIGGERS = ['order_completed', 'new_customer', 'product_out_of_stock', 'cart_abandoned'];
const ACTIONS = ['send_notification', 'send_email', 'apply_coupon'];

export function SellerAutomations() {
  const { profile } = useAuth();
  const { store } = useSellerStore();
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState(TRIGGERS[0]);
  const [action, setAction] = useState(ACTIONS[0]);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (!store) return;
    supabase.from('automations').select('*').eq('store_id', store.id).then(({ data, error }) => {
      if (error) setErrored(true);
      setItems(data || []);
      setLoading(false);
    });
  }, [store?.id]);

  const add = async () => {
    if (!profile || !store || !name.trim()) return toast.error('Name your automation');
    const { data, error } = await supabase.from('automations').insert({ store_id: store.id, owner_id: profile.id, name, trigger_type: trigger, action_type: action }).select().single();
    if (error) return toast.error('Could not add — has the migration been run?');
    setItems((i) => [data, ...i]);
    setName('');
  };

  const toggle = async (a: any) => {
    await supabase.from('automations').update({ is_active: !a.is_active }).eq('id', a.id);
    setItems((prev) => prev.map((x) => (x.id === a.id ? { ...x, is_active: !x.is_active } : x)));
  };

  const remove = async (id: string) => {
    await supabase.from('automations').delete().eq('id', id);
    setItems((i) => i.filter((x) => x.id !== id));
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Automations" subtitle="If this happens, do that" back />
      <p className="text-xs dark:text-dark-muted text-light-muted mb-4">
        Rules save here, but nothing currently runs them — there's no background job watching for these triggers yet. This is the configuration layer; the execution engine is a separate build.
      </p>
      {errored && <NeedsMigrationNotice table="automations" />}

      <div className="card mb-4 space-y-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Automation name" className="input-field text-sm" />
        <select value={trigger} onChange={(e) => setTrigger(e.target.value)} className="input-field text-sm">
          {TRIGGERS.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={action} onChange={(e) => setAction(e.target.value)} className="input-field text-sm">
          {ACTIONS.map((a) => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
        </select>
        <button onClick={add} className="btn-primary w-full text-sm py-2"><Plus className="w-4 h-4" /> Create automation</button>
      </div>

      {loading ? (
        <LoadingBlock rows={2} />
      ) : items.length === 0 ? (
        <EmptyState icon={Zap} title="No automations yet" />
      ) : (
        <div className="space-y-2">
          {items.map((a) => (
            <div key={a.id} className="card">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium dark:text-dark-text text-light-text">{a.name}</p>
                <span className={`badge ${a.is_active ? 'badge-success' : 'badge-warning'}`}>{a.is_active ? 'On' : 'Off'}</span>
              </div>
              <p className="text-xs dark:text-dark-muted text-light-muted capitalize mb-2">{a.trigger_type.replace(/_/g, ' ')} → {a.action_type.replace(/_/g, ' ')}</p>
              <div className="flex gap-3">
                <button onClick={() => toggle(a)} className="text-xs text-primary font-medium">{a.is_active ? 'Turn off' : 'Turn on'}</button>
                <button onClick={() => remove(a.id)} className="text-xs text-danger font-medium">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
