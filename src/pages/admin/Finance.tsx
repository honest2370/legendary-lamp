import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { DollarSign, Wallet, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageHeader, LoadingBlock, EmptyState, ErrorState, StatusBadge, fmtMoney, fmtDateTime } from '@/components/shared/ui';

/* ------------------------------------ Payments ------------------------------------ */

export function AdminPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'success' | 'pending' | 'failed'>('all');

  const load = async () => {
    setLoading(true);
    const { data, error: err } = await supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(200);
    if (err) setError(err.message);
    else setPayments(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => (filter === 'all' ? payments : payments.filter((p) => p.status === filter)), [payments, filter]);
  const totalVolume = payments.filter((p) => p.status === 'success').reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Payments" subtitle={`${fmtMoney(totalVolume)} processed`} />
      <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar">
        {(['all', 'success', 'pending', 'failed'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap ${filter === f ? 'bg-primary text-dark' : 'dark:bg-dark-surface bg-light-surface dark:text-dark-muted text-light-muted'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingBlock rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={DollarSign} title="No payments yet" />
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <div key={p.id} className="card">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium dark:text-dark-text text-light-text">{fmtMoney(p.amount, p.currency)}</p>
                <StatusBadge status={p.status} />
              </div>
              <p className="text-xs dark:text-dark-muted text-light-muted">{p.operator || p.phone || '—'} · {fmtDateTime(p.created_at)}</p>
              {p.transaction_id && <p className="text-xs dark:text-dark-muted text-light-muted font-mono mt-1">{p.transaction_id}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------- Payouts ------------------------------------- */

export function AdminPayouts() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [users, setUsers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [processing, setProcessing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error: err } = await supabase.from('payouts').select('*').order('created_at', { ascending: false }).limit(200);
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setPayouts(data || []);
    const userIds = Array.from(new Set((data || []).map((p: any) => p.user_id)));
    if (userIds.length) {
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', userIds);
      const map: Record<string, string> = {};
      (profiles || []).forEach((p: any) => (map[p.id] = p.full_name || p.email));
      setUsers(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => (filter === 'all' ? payouts : payouts.filter((p) => p.status === filter)), [payouts, filter]);

  const updateStatus = async (id: string, status: string) => {
    setProcessing(id);
    const payload: any = { status };
    if (status === 'completed') payload.completed_at = new Date().toISOString();
    const { error: err } = await supabase.from('payouts').update(payload).eq('id', id);
    setProcessing(null);
    if (err) return toast.error('Could not update payout');
    setPayouts((prev) => prev.map((p) => (p.id === id ? { ...p, ...payload } : p)));
    toast.success(`Payout marked ${status}`);
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Payouts" subtitle={`${payouts.filter((p) => p.status === 'pending').length} pending review`} />
      <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar">
        {(['pending', 'processing', 'completed', 'failed', 'all'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap ${filter === f ? 'bg-primary text-dark' : 'dark:bg-dark-surface bg-light-surface dark:text-dark-muted text-light-muted'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingBlock rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Wallet} title="No payout requests" />
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <div key={p.id} className="card">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium dark:text-dark-text text-light-text">{users[p.user_id] || 'User'}</p>
                <StatusBadge status={p.status} />
              </div>
              <p className="text-lg font-bold dark:text-dark-text text-light-text mb-1">{fmtMoney(p.amount, p.currency)}</p>
              <p className="text-xs dark:text-dark-muted text-light-muted mb-2 capitalize">{p.method?.replace('_', ' ')} · {fmtDateTime(p.created_at)}</p>
              {p.status === 'pending' && (
                <div className="flex gap-2">
                  <button disabled={processing === p.id} onClick={() => updateStatus(p.id, 'completed')} className="flex-1 py-2 rounded-lg text-xs font-medium bg-success/10 text-success flex items-center justify-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button disabled={processing === p.id} onClick={() => updateStatus(p.id, 'failed')} className="flex-1 py-2 rounded-lg text-xs font-medium bg-danger/10 text-danger flex items-center justify-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
