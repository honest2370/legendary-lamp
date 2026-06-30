import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { MARKETPLACE_CATEGORIES } from '@/lib/config';
import { LoadingBlock, EmptyState, fmtMoney } from '@/components/shared/ui';

interface ProductCard {
  id: string;
  name: string;
  price: number;
  compare_price: number | null;
  currency: string;
  image_url: string | null;
  category: string | null;
  rating_avg: number;
  rating_count: number;
  total_sales: number;
  stores: { name: string } | null;
}

export function BuyerShop() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    supabase
      .from('products')
      .select('id, name, price, compare_price, currency, image_url, category, rating_avg, rating_count, total_sales, stores(name)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setProducts((data as any) || []);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (category !== 'all' && p.category !== category) return false;
      if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [products, query, category]);

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <h1 className="text-xl font-bold dark:text-dark-text text-light-text mb-4">Shop</h1>

      <div className="relative mb-3">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 dark:text-dark-muted text-light-muted" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products..." className="input-field pl-9 text-sm" />
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar">
        <button onClick={() => setCategory('all')} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${category === 'all' ? 'bg-primary text-dark' : 'dark:bg-dark-surface bg-light-surface dark:text-dark-muted text-light-muted'}`}>
          All
        </button>
        {MARKETPLACE_CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => setCategory(c.id)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${category === c.id ? 'bg-primary text-dark' : 'dark:bg-dark-surface bg-light-surface dark:text-dark-muted text-light-muted'}`}>
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingBlock rows={4} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Package} title={products.length === 0 ? 'No products yet' : 'No matches'} description="Check back soon, or try a different search." />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((p) => (
            <button key={p.id} onClick={() => navigate(`/buyer/product/${p.id}`)} className="card text-left p-0 overflow-hidden">
              <div className="w-full aspect-square dark:bg-dark-surface bg-light-surface flex items-center justify-center overflow-hidden">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-8 h-8 dark:text-dark-muted text-light-muted" />
                )}
              </div>
              <div className="p-2.5">
                <p className="text-sm font-medium dark:text-dark-text text-light-text truncate">{p.name}</p>
                <p className="text-xs dark:text-dark-muted text-light-muted truncate mb-1">{p.stores?.name}</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold dark:text-dark-text text-light-text">{fmtMoney(p.price, p.currency)}</p>
                  {p.rating_count > 0 && (
                    <span className="flex items-center gap-0.5 text-xs dark:text-dark-muted text-light-muted">
                      <Star className="w-3 h-3 fill-warning text-warning" /> {p.rating_avg.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
