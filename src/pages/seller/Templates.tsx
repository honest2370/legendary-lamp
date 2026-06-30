import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LayoutTemplate, Crown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSellerStore } from '@/hooks/useSellerStore';
import { PageHeader, LoadingBlock, EmptyState } from '@/components/seller/ui';

export function SellerTemplates() {
  const navigate = useNavigate();
  const { store, refreshStore } = useSellerStore();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('store_templates').select('*').then(({ data }) => {
      setTemplates(data || []);
      setLoading(false);
    });
  }, []);

  const apply = async (t: any) => {
    if (!store) return;
    setApplying(t.id);
    const { error } = await supabase.from('stores').update({ template: t.name }).eq('id', store.id);
    setApplying(null);
    if (error) return toast.error('Could not apply template');
    toast.success(`Applied "${t.name}" template`);
    refreshStore();
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Templates" subtitle="Storefront layouts" back />
      {loading ? (
        <LoadingBlock rows={3} />
      ) : templates.length === 0 ? (
        <EmptyState
          icon={LayoutTemplate}
          title="No templates published yet"
          description="Until templates are added by the platform, you can still pick a basic layout from Design Settings."
          action={
            <button onClick={() => navigate('/seller/design-settings')} className="btn-primary text-sm px-4 py-2">
              Go to Design Settings
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {templates.map((t) => (
            <button key={t.id} disabled={applying === t.id} onClick={() => apply(t)} className={`card text-left ${store?.template === t.name ? 'border-primary' : ''}`}>
              {t.preview_url ? (
                <img src={t.preview_url} alt={t.name} className="w-full h-24 object-cover rounded-lg mb-2" />
              ) : (
                <div className="w-full h-24 rounded-lg dark:bg-dark-surface bg-light-surface flex items-center justify-center mb-2">
                  <LayoutTemplate className="w-6 h-6 dark:text-dark-muted text-light-muted" />
                </div>
              )}
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium dark:text-dark-text text-light-text">{t.name}</p>
                {t.is_premium && <Crown className="w-3.5 h-3.5 text-warning" />}
              </div>
              {store?.template === t.name && <span className="badge badge-success mt-1">Current</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
