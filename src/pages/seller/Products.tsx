import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Package, Search, MoreVertical, Eye, EyeOff, Trash2, Pencil, CheckSquare, Square, Boxes } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { PageHeader, LoadingBlock, EmptyState, ErrorState, fmtMoney } from '@/components/seller/ui';

interface ProductRow {
  id: string;
  name: string;
  type: string;
  price: number;
  currency: string;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  stock_count: number;
  total_sales: number;
  total_views: number;
  created_at: string;
}

function useSellerProducts() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('products')
      .select('id, name, type, price, currency, image_url, is_active, is_featured, stock_count, total_sales, total_views, created_at')
      .eq('seller_id', profile.id)
      .order('created_at', { ascending: false });
    if (err) setError(err.message);
    else setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [profile?.id]);

  return { products, setProducts, loading, error, reload: load };
}

export function SellerProducts() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { products, setProducts, loading, error, reload } = useSellerProducts();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (filter === 'active' && !p.is_active) return false;
      if (filter === 'inactive' && p.is_active) return false;
      if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [products, query, filter]);

  const toggleActive = async (p: ProductRow) => {
    const { error: err } = await supabase.from('products').update({ is_active: !p.is_active }).eq('id', p.id);
    if (err) return toast.error('Could not update product');
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_active: !x.is_active } : x)));
    toast.success(p.is_active ? 'Product unpublished' : 'Product published');
    setMenuFor(null);
  };

  const deleteProduct = async (p: ProductRow) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    const { error: err } = await supabase.from('products').delete().eq('id', p.id);
    if (err) return toast.error('Could not delete product');
    setProducts((prev) => prev.filter((x) => x.id !== p.id));
    if (profile) {
      const { count } = await supabase.from('products').select('id', { count: 'exact', head: true }).eq('seller_id', profile.id);
      await supabase.from('sellers').update({ total_products: count || 0 }).eq('user_id', profile.id);
    }
    toast.success('Product deleted');
    setMenuFor(null);
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader
        title="Products"
        subtitle={`${products.length} total`}
        action={
          <button onClick={() => navigate('/seller/products/add')} className="btn-primary text-sm px-4 py-2">
            <Plus className="w-4 h-4" /> Add
          </button>
        }
      />

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 dark:text-dark-muted text-light-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="input-field pl-9 text-sm"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar">
        {(['all', 'active', 'inactive'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap ${
              filter === f ? 'bg-primary text-dark' : 'dark:bg-dark-surface bg-light-surface dark:text-dark-muted text-light-muted'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingBlock rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title={products.length === 0 ? 'No products yet' : 'No matches'}
          description={
            products.length === 0
              ? 'Choose from 15 product types and create your first listing.'
              : 'Try a different search or filter.'
          }
          action={
            products.length === 0 && (
              <button onClick={() => navigate('/seller/products/add')} className="btn-primary text-sm px-4 py-2">
                <Plus className="w-4 h-4" /> Add your first product
              </button>
            )
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <div key={p.id} className="card flex items-center gap-3 relative">
              <div className="w-12 h-12 rounded-lg dark:bg-dark-surface bg-light-surface flex items-center justify-center shrink-0 overflow-hidden">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-5 h-5 dark:text-dark-muted text-light-muted" />
                )}
              </div>
              <div className="min-w-0 flex-1" onClick={() => navigate(`/seller/products/edit/${p.id}`)}>
                <p className="text-sm font-medium dark:text-dark-text text-light-text truncate">{p.name}</p>
                <p className="text-xs dark:text-dark-muted text-light-muted capitalize">
                  {p.type.replace(/_/g, ' ')} · {fmtMoney(p.price, p.currency)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`badge ${p.is_active ? 'badge-success' : 'badge-warning'}`}>
                    {p.is_active ? 'Active' : 'Draft'}
                  </span>
                  <span className="text-xs dark:text-dark-muted text-light-muted">
                    {p.total_sales} sold · {p.total_views} views
                  </span>
                </div>
              </div>
              <button onClick={() => setMenuFor(menuFor === p.id ? null : p.id)} className="p-2 shrink-0">
                <MoreVertical className="w-4 h-4 dark:text-dark-muted text-light-muted" />
              </button>

              {menuFor === p.id && (
                <div className="absolute right-2 top-12 z-10 dark:bg-dark-surface bg-light shadow-lg rounded-xl border dark:border-dark-border border-light-border overflow-hidden w-44">
                  <button
                    onClick={() => navigate(`/seller/products/edit/${p.id}`)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm dark:text-dark-text text-light-text hover:bg-primary/10 text-left"
                  >
                    <Pencil className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => toggleActive(p)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm dark:text-dark-text text-light-text hover:bg-primary/10 text-left"
                  >
                    {p.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {p.is_active ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => deleteProduct(p)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-danger/10 text-left"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
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

export function SellerBulkActions() {
  const { profile } = useAuth();
  const { products, setProducts, loading } = useSellerProducts();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(selected.size === products.length ? new Set() : new Set(products.map((p) => p.id)));
  };

  const bulkSetActive = async (active: boolean) => {
    if (selected.size === 0) return toast.error('Select at least one product');
    const ids = Array.from(selected);
    const { error } = await supabase.from('products').update({ is_active: active }).in('id', ids);
    if (error) return toast.error('Bulk update failed');
    setProducts((prev) => prev.map((p) => (selected.has(p.id) ? { ...p, is_active: active } : p)));
    toast.success(`${ids.length} product${ids.length > 1 ? 's' : ''} ${active ? 'published' : 'unpublished'}`);
    setSelected(new Set());
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return toast.error('Select at least one product');
    if (!window.confirm(`Delete ${selected.size} product(s)? This cannot be undone.`)) return;
    const ids = Array.from(selected);
    const { error } = await supabase.from('products').delete().in('id', ids);
    if (error) return toast.error('Bulk delete failed');
    setProducts((prev) => prev.filter((p) => !selected.has(p.id)));
    if (profile) {
      const { count } = await supabase.from('products').select('id', { count: 'exact', head: true }).eq('seller_id', profile.id);
      await supabase.from('sellers').update({ total_products: count || 0 }).eq('user_id', profile.id);
    }
    toast.success(`${ids.length} product${ids.length > 1 ? 's' : ''} deleted`);
    setSelected(new Set());
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Bulk Actions" subtitle="Mass operations on your products" back />

      {loading ? (
        <LoadingBlock rows={4} />
      ) : products.length === 0 ? (
        <EmptyState icon={Package} title="No products to manage" description="Add products first, then come back here for bulk operations." />
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <button onClick={selectAll} className="flex items-center gap-2 text-sm dark:text-dark-text text-light-text">
              {selected.size === products.length ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
              Select all ({selected.size}/{products.length})
            </button>
          </div>

          <div className="space-y-2 mb-4 max-h-[50vh] overflow-y-auto">
            {products.map((p) => (
              <button key={p.id} onClick={() => toggle(p.id)} className="w-full card flex items-center gap-3 text-left">
                {selected.has(p.id) ? (
                  <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                ) : (
                  <Square className="w-4 h-4 dark:text-dark-muted text-light-muted shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium dark:text-dark-text text-light-text truncate">{p.name}</p>
                  <p className="text-xs dark:text-dark-muted text-light-muted">{fmtMoney(p.price, p.currency)}</p>
                </div>
                <span className={`badge ${p.is_active ? 'badge-success' : 'badge-warning'}`}>{p.is_active ? 'Active' : 'Draft'}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => bulkSetActive(true)} className="btn-outline text-sm py-2.5">Publish</button>
            <button onClick={() => bulkSetActive(false)} className="btn-secondary text-sm py-2.5">Unpublish</button>
            <button onClick={bulkDelete} className="text-sm py-2.5 rounded-xl bg-danger/10 text-danger font-semibold">Delete</button>
          </div>
        </>
      )}
    </div>
  );
}

export function SellerInventory() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('products')
      .select('id, name, type, price, currency, image_url, is_active, is_featured, stock_count, total_sales, total_views, created_at')
      .eq('seller_id', profile.id)
      .order('name', { ascending: true })
      .then(({ data }) => {
        setProducts(data || []);
        setLoading(false);
      });
  }, [profile?.id]);

  const updateStock = async (id: string, value: number) => {
    setSavingId(id);
    const { error } = await supabase.from('products').update({ stock_count: value }).eq('id', id);
    setSavingId(null);
    if (error) return toast.error('Could not update stock');
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stock_count: value } : p)));
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Inventory" subtitle="Stock management" back />
      <p className="text-xs dark:text-dark-muted text-light-muted mb-4">
        Set stock to <span className="font-semibold">-1</span> for unlimited (digital) stock, or a number to track limited inventory.
      </p>

      {loading ? (
        <LoadingBlock rows={4} />
      ) : products.length === 0 ? (
        <EmptyState icon={Boxes} title="No products yet" description="Add products to manage their stock levels here." />
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} className="card flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium dark:text-dark-text text-light-text truncate">{p.name}</p>
                <p className="text-xs dark:text-dark-muted text-light-muted">
                  {p.stock_count === -1 ? 'Unlimited' : p.stock_count <= 0 ? 'Out of stock' : `${p.stock_count} in stock`}
                </p>
              </div>
              <input
                type="number"
                defaultValue={p.stock_count}
                disabled={savingId === p.id}
                onBlur={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v) && v !== p.stock_count) updateStock(p.id, v);
                }}
                className="input-field w-24 text-sm text-center"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
