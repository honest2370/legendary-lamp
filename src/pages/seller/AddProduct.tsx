import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Book, Server, Key, User, Video, Link2, Download, LayoutTemplate, Music, Image as ImageIcon,
  Shield, Repeat, FileText, Package, Wrench, ArrowLeft, Check,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSellerStore } from '@/hooks/useSellerStore';
import { supabase } from '@/lib/supabase';
import { PRODUCT_TYPES, MARKETPLACE_CATEGORIES } from '@/lib/config';
import { LoadingBlock } from '@/components/seller/ui';

const ICONS: Record<string, any> = {
  book: Book,
  server: Server,
  key: Key,
  user: User,
  video: Video,
  link: Link2,
  download: Download,
  layout: LayoutTemplate,
  music: Music,
  image: ImageIcon,
  shield: Shield,
  repeat: Repeat,
  'file-text': FileText,
  package: Package,
  tool: Wrench,
};

const SKIP_FIELDS = new Set(['title', 'name', 'description']);
const URL_FIELDS = new Set(['file_url', 'cover_image', 'preview_url', 'image_url', 'url', 'thumbnail']);

function fieldLabel(key: string) {
  return key
    .replace(/_optional$/, ' (optional)')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function SellerAddProduct() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const { profile } = useAuth();
  const { store, loading: storeLoading } = useSellerStore();

  const [step, setStep] = useState<'type' | 'details'>(editId ? 'details' : 'type');
  const [typeId, setTypeId] = useState<string>('');
  const [loadingExisting, setLoadingExisting] = useState(!!editId);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    compare_price: '',
    currency: store?.currency || 'XAF',
    category: '',
    image_url: '',
    is_active: true,
    is_featured: false,
  });
  const [extra, setExtra] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!store) return;
    setForm((f) => ({ ...f, currency: f.currency || store.currency }));
  }, [store]);

  useEffect(() => {
    if (!editId) return;
    (async () => {
      const { data, error } = await supabase.from('products').select('*').eq('id', editId).single();
      if (error || !data) {
        toast.error('Product not found');
        navigate('/seller/products');
        return;
      }
      setTypeId(data.type);
      setForm({
        name: data.name || '',
        description: data.description || '',
        price: String(data.price ?? ''),
        compare_price: data.compare_price != null ? String(data.compare_price) : '',
        currency: data.currency || 'XAF',
        category: data.category || '',
        image_url: data.image_url || '',
        is_active: data.is_active,
        is_featured: data.is_featured,
      });
      setExtra(data.content_data || {});
      setLoadingExisting(false);
    })();
  }, [editId]);

  const selectedType = PRODUCT_TYPES.find((t) => t.id === typeId);
  const dynamicFields = (selectedType?.fields || []).filter((f) => !SKIP_FIELDS.has(f));

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));
  const updateExtra = (key: string, value: string) => setExtra((e) => ({ ...e, [key]: value }));

  const handleSave = async () => {
    if (!profile) return;
    if (!form.name.trim()) return toast.error('Product name is required');
    if (!form.price || isNaN(Number(form.price))) return toast.error('Enter a valid price');
    if (!typeId) return toast.error('Choose a product type');

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      type: typeId,
      price: Number(form.price),
      compare_price: form.compare_price ? Number(form.compare_price) : null,
      currency: form.currency,
      category: form.category || null,
      image_url: form.image_url || null,
      is_active: form.is_active,
      is_featured: form.is_featured,
      content_data: extra,
    };

    try {
      if (editId) {
        const { error } = await supabase.from('products').update(payload).eq('id', editId);
        if (error) throw error;
        toast.success('Product updated');
      } else {
        const { error } = await supabase.from('products').insert({
          ...payload,
          seller_id: profile.id,
          store_id: store?.id || null,
        });
        if (error) throw error;
        // keep sellers.total_products in sync with the real count
        const { count } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('seller_id', profile.id);
        await supabase.from('sellers').update({ total_products: count || 0 }).eq('user_id', profile.id);
        toast.success('Product created');
      }
      navigate('/seller/products');
    } catch (e: any) {
      toast.error(e.message || 'Could not save product');
    } finally {
      setSaving(false);
    }
  };

  if (loadingExisting || storeLoading) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <LoadingBlock rows={4} />
      </div>
    );
  }

  // STEP 1: choose type
  if (step === 'type') {
    return (
      <div className="p-4 max-w-lg mx-auto animate-fade-in">
        <h1 className="text-xl font-bold dark:text-dark-text text-light-text mb-1">Add Product</h1>
        <p className="text-sm dark:text-dark-muted text-light-muted mb-5">
          Choose from 15 product types. Each type has its own form for filling details and delivery content.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {PRODUCT_TYPES.map((t) => {
            const Icon = ICONS[t.icon] || Package;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setTypeId(t.id);
                  setStep('details');
                }}
                className="card card-hover flex flex-col items-start gap-2 text-left py-4"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm font-semibold dark:text-dark-text text-light-text">{t.name}</p>
                <p className="text-xs dark:text-dark-muted text-light-muted line-clamp-2">{t.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // STEP 2: details form
  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in pb-24">
      <div className="flex items-center gap-2 mb-5">
        {!editId && (
          <button onClick={() => setStep('type')} className="p-1 -ml-1">
            <ArrowLeft className="w-5 h-5 dark:text-dark-muted text-light-muted" />
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold dark:text-dark-text text-light-text">
            {editId ? 'Edit Product' : selectedType?.name}
          </h1>
          <p className="text-sm dark:text-dark-muted text-light-muted">{selectedType?.description}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium dark:text-dark-muted text-light-muted block mb-1.5">Product name</label>
          <input
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="e.g. Complete React Mastery Course"
            className="input-field"
          />
        </div>

        <div>
          <label className="text-xs font-medium dark:text-dark-muted text-light-muted block mb-1.5">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            rows={3}
            placeholder="Tell buyers what they're getting..."
            className="input-field resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium dark:text-dark-muted text-light-muted block mb-1.5">Price</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => update('price', e.target.value)}
              placeholder="0.00"
              className="input-field"
            />
          </div>
          <div>
            <label className="text-xs font-medium dark:text-dark-muted text-light-muted block mb-1.5">Currency</label>
            <input
              value={form.currency}
              onChange={(e) => update('currency', e.target.value.toUpperCase())}
              placeholder="XAF"
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium dark:text-dark-muted text-light-muted block mb-1.5">
            Compare-at price <span className="opacity-60">(optional, shows a strikethrough)</span>
          </label>
          <input
            type="number"
            value={form.compare_price}
            onChange={(e) => update('compare_price', e.target.value)}
            placeholder="0.00"
            className="input-field"
          />
        </div>

        <div>
          <label className="text-xs font-medium dark:text-dark-muted text-light-muted block mb-1.5">Category</label>
          <select value={form.category} onChange={(e) => update('category', e.target.value)} className="input-field">
            <option value="">Select category</option>
            {MARKETPLACE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium dark:text-dark-muted text-light-muted block mb-1.5">Cover image URL</label>
          <input
            value={form.image_url}
            onChange={(e) => update('image_url', e.target.value)}
            placeholder="https://..."
            className="input-field"
          />
        </div>

        {dynamicFields.length > 0 && (
          <>
            <div className="pt-2 pb-1">
              <p className="text-xs font-semibold dark:text-dark-muted text-light-muted uppercase tracking-wider">
                {selectedType?.name} details
              </p>
            </div>
            {dynamicFields.map((f) => (
              <div key={f}>
                <label className="text-xs font-medium dark:text-dark-muted text-light-muted block mb-1.5">{fieldLabel(f)}</label>
                {f === 'custom_slots' || f === 'extra_fields' || f === 'included_products' || f === 'keys_list' ? (
                  <textarea
                    value={extra[f] || ''}
                    onChange={(e) => updateExtra(f, e.target.value)}
                    rows={3}
                    placeholder="One per line"
                    className="input-field resize-none"
                  />
                ) : (
                  <input
                    value={extra[f] || ''}
                    onChange={(e) => updateExtra(f, e.target.value)}
                    placeholder={URL_FIELDS.has(f) ? 'https://...' : ''}
                    className="input-field"
                  />
                )}
              </div>
            ))}
          </>
        )}

        <div className="flex items-center justify-between card">
          <div>
            <p className="text-sm font-medium dark:text-dark-text text-light-text">Publish immediately</p>
            <p className="text-xs dark:text-dark-muted text-light-muted">Off saves as a draft, only visible to you</p>
          </div>
          <button
            onClick={() => update('is_active', !form.is_active)}
            className={`w-11 h-6 rounded-full transition-colors relative ${form.is_active ? 'bg-primary' : 'dark:bg-dark-border bg-light-border'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 dark:bg-dark bg-light border-t dark:border-dark-border border-light-border">
        <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
          {saving ? (
            <div className="w-5 h-5 border-2 border-dark/30 border-t-dark rounded-full animate-spin" />
          ) : (
            <>
              <Check className="w-4 h-4" /> {editId ? 'Save changes' : 'Create product'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
