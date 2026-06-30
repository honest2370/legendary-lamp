import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Wallet, TrendingUp, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useSellerStore } from '@/hooks/useSellerStore';
import { PageHeader, LoadingBlock, EmptyState, StatusBadge, fmtMoney, fmtDate } from '@/components/seller/ui';

interface PayoutRow {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string | null;
  created_at: string;
  completed_at: string | null;
}

interface PayoutSettings {
  id?: string;
  method: string;
  account_name: string;
  account_number: string;
  provider: string;
  country: string;
}

export function SellerPayouts() {
  const { profile } = useAuth();
  const { seller, store } = useSellerStore();
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [settings, setSettings] = useState<PayoutSettings>({ method: 'mobile_money', account_name: '', account_number: '', provider: '', country: '' });
  const [hasSettings, setHasSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [paidOut, setPaidOut] = useState(0);

  const currency = store?.currency || 'XAF';
  const available = (seller?.total_revenue || 0) - paidOut;

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const [payoutsRes, settingsRes] = await Promise.all([
        supabase.from('payouts').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
        supabase.from('payout_settings').select('*').eq('user_id', profile.id).maybeSingle(),
      ]);
      const list = payoutsRes.data || [];
      setPayouts(list);
      setPaidOut(list.filter((p: any) => p.status !== 'failed').reduce((s: number, p: any) => s + Number(p.amount), 0));
      if (settingsRes.data) {
        setSettings({
          id: settingsRes.data.id,
          method: settingsRes.data.method,
          account_name: settingsRes.data.account_name || '',
          account_number: settingsRes.data.account_number || '',
          provider: settingsRes.data.provider || '',
          country: settingsRes.data.country || '',
        });
        setHasSettings(true);
      } else {
        setShowSettings(true);
      }
      setLoading(false);
    })();
  }, [profile?.id]);

  const saveSettings = async () => {
    if (!profile) return;
    if (!settings.account_number.trim()) return toast.error('Enter your payout account number');
    const payload = { user_id: profile.id, ...settings, is_default: true };
    const { error } = await supabase.from('payout_settings').upsert(payload, { onConflict: 'user_id' });
    if (error) return toast.error('Could not save payout settings');
    setHasSettings(true);
    setShowSettings(false);
    toast.success('Payout method saved');
  };

  const requestPayout = async () => {
    if (!profile) return;
    if (!hasSettings) return toast.error('Add a payout method first');
    const amt = Number(requestAmount);
    if (!amt || amt <= 0) return toast.error('Enter a valid amount');
    if (amt > available) return toast.error('Amount exceeds your available balance');

    setRequesting(true);
    const { data, error } = await supabase
      .from('payouts')
      .insert({ user_id: profile.id, amount: amt, currency, method: settings.method })
      .select('*')
      .single();
    setRequesting(false);
    if (error) return toast.error('Could not submit payout request');
    setPayouts((prev) => [data, ...prev]);
    setPaidOut((p) => p + amt);
    setRequestAmount('');
    toast.success('Payout requested');
  };

  if (loading) return <div className="p-4 max-w-lg mx-auto"><LoadingBlock rows={4} /></div>;

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Payouts" subtitle="Withdraw your earnings" />

      <div className="card stat-card stat-card-primary mb-4">
        <p className="text-xs dark:text-dark-muted text-light-muted mb-1">Available balance</p>
        <p className="text-2xl font-bold dark:text-dark-text text-light-text">{fmtMoney(available, currency)}</p>
      </div>

      {!showSettings && hasSettings && (
        <div className="card mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium dark:text-dark-text text-light-text capitalize">{settings.method.replace('_', ' ')}</p>
            <p className="text-xs dark:text-dark-muted text-light-muted">{settings.account_number}</p>
          </div>
          <button onClick={() => setShowSettings(true)} className="text-xs text-primary font-medium">Edit</button>
        </div>
      )}

      {showSettings && (
        <div className="card mb-4 space-y-3">
          <p className="text-sm font-medium dark:text-dark-text text-light-text">Payout method</p>
          <select value={settings.method} onChange={(e) => setSettings((s) => ({ ...s, method: e.target.value }))} className="input-field text-sm">
            <option value="mobile_money">Mobile Money</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="crypto">Crypto</option>
          </select>
          <input value={settings.account_name} onChange={(e) => setSettings((s) => ({ ...s, account_name: e.target.value }))} placeholder="Account holder name" className="input-field text-sm" />
          <input value={settings.account_number} onChange={(e) => setSettings((s) => ({ ...s, account_number: e.target.value }))} placeholder="Account / phone number" className="input-field text-sm" />
          <input value={settings.provider} onChange={(e) => setSettings((s) => ({ ...s, provider: e.target.value }))} placeholder="Provider (e.g. MTN, Orange)" className="input-field text-sm" />
          <input value={settings.country} onChange={(e) => setSettings((s) => ({ ...s, country: e.target.value }))} placeholder="Country" className="input-field text-sm" />
          <button onClick={saveSettings} className="btn-primary w-full text-sm py-2.5">Save payout method</button>
        </div>
      )}

      <div className="card mb-6 space-y-3">
        <p className="text-sm font-medium dark:text-dark-text text-light-text">Request a payout</p>
        <input type="number" value={requestAmount} onChange={(e) => setRequestAmount(e.target.value)} placeholder={`Amount (max ${fmtMoney(available, currency)})`} className="input-field text-sm" />
        <button onClick={requestPayout} disabled={requesting} className="btn-primary w-full text-sm py-2.5">
          <Plus className="w-4 h-4" /> {requesting ? 'Submitting...' : 'Request payout'}
        </button>
      </div>

      <p className="text-sm font-semibold dark:text-dark-muted text-light-muted uppercase tracking-wider mb-3">History</p>
      {payouts.length === 0 ? (
        <EmptyState icon={Wallet} title="No payouts yet" description="Your withdrawal requests and their status will appear here." />
      ) : (
        <div className="space-y-2">
          {payouts.map((p) => (
            <div key={p.id} className="card flex items-center justify-between">
              <div>
                <p className="text-sm font-medium dark:text-dark-text text-light-text">{fmtMoney(p.amount, p.currency)}</p>
                <p className="text-xs dark:text-dark-muted text-light-muted">{fmtDate(p.created_at)}</p>
              </div>
              <StatusBadge status={p.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SellerRevenue() {
  const { profile } = useAuth();
  const { seller, store } = useSellerStore();
  const [monthly, setMonthly] = useState<{ month: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const currency = store?.currency || 'XAF';

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('analytics_sales')
      .select('amount, date')
      .eq('seller_id', profile.id)
      .then(({ data }) => {
        const totals: Record<string, number> = {};
        (data || []).forEach((r: any) => {
          const month = new Date(r.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          totals[month] = (totals[month] || 0) + Number(r.amount);
        });
        setMonthly(Object.entries(totals).map(([month, amount]) => ({ month, amount })).slice(-6));
        setLoading(false);
      });
  }, [profile?.id]);

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Revenue" subtitle="Lifetime earnings" />
      <div className="card stat-card stat-card-primary mb-4">
        <p className="text-xs dark:text-dark-muted text-light-muted mb-1">Total revenue</p>
        <p className="text-2xl font-bold dark:text-dark-text text-light-text">{fmtMoney(seller?.total_revenue, currency)}</p>
      </div>
      <p className="text-sm font-semibold dark:text-dark-muted text-light-muted uppercase tracking-wider mb-3">By month</p>
      {loading ? (
        <LoadingBlock rows={3} />
      ) : monthly.length === 0 ? (
        <EmptyState icon={TrendingUp} title="No revenue yet" description="Completed sales will be broken down by month here." />
      ) : (
        <div className="space-y-2">
          {monthly.map((m) => (
            <div key={m.month} className="card flex items-center justify-between">
              <span className="text-sm dark:text-dark-text text-light-text">{m.month}</span>
              <span className="text-sm font-semibold dark:text-dark-text text-light-text">{fmtMoney(m.amount, currency)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
