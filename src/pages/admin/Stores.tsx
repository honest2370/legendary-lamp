import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Store, Search, Star, Power } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageHeader, LoadingBlock, EmptyState, ErrorState, fmtDate } from '@/components/shared/ui';

interface StoreRow {
  id: string;
  name: string;
  slug: string | null;
  is_active: boolean;
  is_featured: boolean;
  total_views: number;
  total_followers: number;
  currency: string;
  created_at: string;
  owner_id: string;
}

export function AdminStores() {
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [owners, setOwners] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = async () => {
    setLoading(true);
    const { data, error: err } = await supabase.from('stores').select('*').order('created_at', { ascending: false }).limit(200);
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setStores(data || []);
    const ownerIds = Array.from(new Set((data || []).map((s: any) => s.owner_id)));
    if (ownerIds.length) {
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', ownerIds);
      const map: Record<string, string> = {};
      (profiles || []).forEach((p: any) => (map[p.id] = p.full_name || p.email));
      setOwners(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => stores.filter((s) => !query || s.name.toLowerCase().includes(query.toLowerCase())),
    [stores, query]
  );

  const toggleActive = async (s: StoreRow) => {
    const { error: err } = await supabase.from('stores').update({ is_active: !s.is_active }).eq('id', s.id);
    if (err) return toast.error('Could not update store');
    setStores((prev) => prev.map((x) => (x.id === s.id ? { ...x, is_active: !x.is_active } : x)));
  };

  const toggleFeatured = async (s: StoreRow) => {
    const { error: err } = await supabase.from('stores').update({ is_featured: !s.is_featured }).eq('id', s.id);
    if (err) return toast.error('Could not update store');
    setStores((prev) => prev.map((x) => (x.id === s.id ? { ...x, is_featured: !x.is_featured } : x)));
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Stores" subtitle={`${stores.length} total`} />
      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 dark:text-dark-muted text-light-muted" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search stores..." className="input-field pl-9 text-sm" />
      </div>

      {loading ? (
        <LoadingBlock rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Store} title="No stores yet" />
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => (
            <div key={s.id} className="card">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium dark:text-dark-text text-light-text">{s.name}</p>
                <div className="flex gap-1">
                  {s.is_featured && <span className="badge badge-warning">Featured</span>}
                  <span className={`badge ${s.is_active ? 'badge-success' : 'badge-danger'}`}>{s.is_active ? 'Active' : 'Disabled'}</span>
                </div>
              </div>
              <p className="text-xs dark:text-dark-muted text-light-muted mb-2">{owners[s.owner_id] || 'Unknown owner'} · {s.total_views} views · {fmtDate(s.created_at)}</p>
              <div className="flex gap-2">
                <button onClick={() => toggleActive(s)} className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 ${s.is_active ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                  <Power className="w-3.5 h-3.5" /> {s.is_active ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => toggleFeatured(s)} className="flex-1 py-2 rounded-lg text-xs font-medium dark:bg-dark-surface bg-light-surface dark:text-dark-text text-light-text flex items-center justify-center gap-1.5">
                  <Star className="w-3.5 h-3.5" /> {s.is_featured ? 'Unfeature' : 'Feature'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
