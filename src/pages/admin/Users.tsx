import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Users, Search, ShieldCheck, ShieldOff, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageHeader, LoadingBlock, EmptyState, ErrorState, fmtDate } from '@/components/shared/ui';

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  total_sales: number;
  created_at: string;
  country: string | null;
}

export function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'buyer' | 'seller' | 'admin'>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error: err } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(200);
    if (err) setError(err.message);
    else setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (query && !(u.email.toLowerCase().includes(query.toLowerCase()) || (u.full_name || '').toLowerCase().includes(query.toLowerCase()))) return false;
      return true;
    });
  }, [users, query, roleFilter]);

  const toggleActive = async (u: UserRow) => {
    const { error: err } = await supabase.from('profiles').update({ is_active: !u.is_active }).eq('id', u.id);
    if (err) return toast.error('Could not update user');
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_active: !x.is_active } : x)));
    toast.success(u.is_active ? 'User suspended' : 'User reactivated');
  };

  const toggleVerified = async (u: UserRow) => {
    const { error: err } = await supabase.from('profiles').update({ is_verified: !u.is_verified }).eq('id', u.id);
    if (err) return toast.error('Could not update user');
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_verified: !x.is_verified } : x)));
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Users" subtitle={`${users.length} total`} />

      <div className="relative mb-3">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 dark:text-dark-muted text-light-muted" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or email..." className="input-field pl-9 text-sm" />
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar">
        {(['all', 'buyer', 'seller', 'admin'] as const).map((r) => (
          <button key={r} onClick={() => setRoleFilter(r)} className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap ${roleFilter === r ? 'bg-primary text-dark' : 'dark:bg-dark-surface bg-light-surface dark:text-dark-muted text-light-muted'}`}>
            {r}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingBlock rows={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No users found" />
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => {
            const isOpen = openId === u.id;
            return (
              <div key={u.id} className="card">
                <button onClick={() => setOpenId(isOpen ? null : u.id)} className="w-full flex items-center justify-between gap-3 text-left">
                  <div className="min-w-0">
                    <p className="text-sm font-medium dark:text-dark-text text-light-text truncate">{u.full_name || u.email}</p>
                    <p className="text-xs dark:text-dark-muted text-light-muted truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="badge badge-info capitalize">{u.role}</span>
                    {!u.is_active && <span className="badge badge-danger">Suspended</span>}
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-3 pt-3 border-t dark:border-dark-border border-light-border space-y-2 text-sm">
                    <div className="flex justify-between"><span className="dark:text-dark-muted text-light-muted">Joined</span><span className="dark:text-dark-text text-light-text">{fmtDate(u.created_at)}</span></div>
                    <div className="flex justify-between"><span className="dark:text-dark-muted text-light-muted">Country</span><span className="dark:text-dark-text text-light-text">{u.country || '—'}</span></div>
                    <div className="flex justify-between"><span className="dark:text-dark-muted text-light-muted">Sales</span><span className="dark:text-dark-text text-light-text">{u.total_sales}</span></div>
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => toggleActive(u)} className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 ${u.is_active ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                        {u.is_active ? <ShieldOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                        {u.is_active ? 'Suspend' : 'Reactivate'}
                      </button>
                      <button onClick={() => toggleVerified(u)} className="flex-1 py-2 rounded-lg text-xs font-medium dark:bg-dark-surface bg-light-surface dark:text-dark-text text-light-text">
                        {u.is_verified ? 'Unverify' : 'Verify'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
