// SELLIZI Page Stubs - All pages with Chariow features integrated
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageStub from '@/components/PageStub';
import { supabase } from '@/lib/supabase';
import { MARKETPLACE_CATEGORIES } from '@/lib/config';
import { useAuth } from '@/contexts/AuthContext';

// ============================================
// BUYER PAGES - with Chariow marketplace features
// ============================================

export function BuyerShop() {
  const [products, setProducts] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, [selectedCategory]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      let query = supabase.from('products').select('*, stores(name, logo_url), profiles(full_name, avatar_url)').eq('is_active', true).order('created_at', { ascending: false }).limit(50);
      if (selectedCategory !== 'all') query = query.eq('category', selectedCategory);
      if (search) query = query.ilike('name', `%${search}%`);
      const { data } = await query;
      setProducts(data || []);

      const { data: feat } = await supabase.from('products').select('*, stores(name)').eq('is_active', true).eq('is_featured', true).limit(6);
      setFeatured(feat || []);

      const { data: trend } = await supabase.from('products').select('*, stores(name)').eq('is_active', true).order('total_sales', { ascending: false }).limit(6);
      setTrending(trend || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 dark:text-dark-muted text-light-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadProducts()} placeholder="Search products..." className="input-field pl-10" />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-4 pb-1">
        <button onClick={() => setSelectedCategory('all')} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${selectedCategory === 'all' ? 'bg-primary text-dark' : 'dark:bg-dark-surface bg-light-surface dark:text-dark-muted text-light-muted'}`}>All</button>
        {MARKETPLACE_CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${selectedCategory === cat.id ? 'bg-primary text-dark' : 'dark:bg-dark-surface bg-light-surface dark:text-dark-muted text-light-muted'}`}>{cat.name}</button>
        ))}
      </div>

      {/* Featured */}
      {featured.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold dark:text-dark-muted text-light-muted uppercase tracking-wider mb-3">Featured</h2>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
            {featured.map((p: any) => (
              <div key={p.id} className="min-w-[160px] card card-hover cursor-pointer" onClick={() => window.location.href = `/buyer/product/${p.id}`}>
                <div className="w-full h-24 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 mb-2 flex items-center justify-center">
                  {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover rounded-lg" /> : <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                </div>
                <p className="text-xs font-semibold dark:text-dark-text text-light-text truncate">{p.name}</p>
                <p className="text-xs text-primary font-bold">{p.price} {p.currency}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending */}
      {trending.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold dark:text-dark-muted text-light-muted uppercase tracking-wider mb-3">Trending</h2>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
            {trending.map((p: any) => (
              <div key={p.id} className="min-w-[140px] card card-hover cursor-pointer" onClick={() => window.location.href = `/buyer/product/${p.id}`}>
                <div className="w-full h-20 rounded-lg bg-gradient-to-br from-accent/20 to-primary/20 mb-2 flex items-center justify-center">
                  <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
                <p className="text-xs font-semibold dark:text-dark-text text-light-text truncate">{p.name}</p>
                <p className="text-[10px] dark:text-dark-muted text-light-muted">{p.total_sales} sales</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Products */}
      <h2 className="text-sm font-semibold dark:text-dark-muted text-light-muted uppercase tracking-wider mb-3">
        {selectedCategory === 'all' ? 'All Products' : MARKETPLACE_CATEGORIES.find(c => c.id === selectedCategory)?.name}
      </h2>
      {loading ? (
        <div className="grid grid-cols-2 gap-3">{[1,2,3,4].map(i => <div key={i} className="card skeleton h-48" />)}</div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {products.map((p: any) => (
            <div key={p.id} className="card card-hover cursor-pointer" onClick={() => window.location.href = `/buyer/product/${p.id}`}>
              <div className="w-full h-28 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 mb-2 flex items-center justify-center overflow-hidden">
                {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <svg className="w-8 h-8 dark:text-dark-muted text-light-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
              </div>
              <p className="text-xs font-semibold dark:text-dark-text text-light-text truncate">{p.name}</p>
              <p className="text-[10px] dark:text-dark-muted text-light-muted truncate">{p.stores?.name || 'Store'}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm text-primary font-bold">{p.price} {p.currency}</p>
                {p.rating_avg > 0 && <p className="text-[10px] dark:text-dark-muted text-light-muted">{p.rating_avg}</p>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <svg className="w-12 h-12 mx-auto dark:text-dark-muted text-light-muted mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          <p className="text-sm dark:text-dark-muted text-light-muted">No products found</p>
          <p className="text-xs dark:text-dark-muted text-light-muted mt-1">Products will appear here once sellers add them</p>
        </div>
      )}
    </div>
  );
}

export function BuyerOrders() {
  return <PageStub title="My Orders" subtitle="Track your purchases" description="View all your orders, payment status, and delivery details." />;
}

export function BuyerProductView() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      supabase.from('products').select('*, stores(name, logo_url, slug), profiles(full_name)').eq('id', id).single()
        .then(({ data }) => { setProduct(data); setLoading(false); });
    }
  }, [id]);

  if (loading) return <div className="p-4 max-w-lg mx-auto"><div className="card skeleton h-64" /></div>;
  if (!product) return <div className="p-4 max-w-lg mx-auto"><PageStub title="Product not found" /></div>;

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <div className="w-full h-48 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 mb-4 flex items-center justify-center overflow-hidden">
        {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" /> : <svg className="w-12 h-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
      </div>
      <h1 className="text-xl font-bold dark:text-dark-text text-light-text mb-1">{product.name}</h1>
      <p className="text-xs dark:text-dark-muted text-light-muted mb-3">by {product.stores?.name || product.profiles?.full_name || 'Seller'}</p>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl font-bold text-primary">{product.price} {product.currency}</span>
        {product.compare_price && <span className="text-sm dark:text-dark-muted text-light-muted line-through">{product.compare_price}</span>}
      </div>
      <p className="text-sm dark:text-dark-muted text-light-muted mb-6">{product.description}</p>
      <button className="btn-primary w-full py-3.5 text-base">Buy Now</button>
    </div>
  );
}

export function BuyerMyProducts() {
  return <PageStub title="My Products" subtitle="Access purchased products" description="All your purchased digital products are here. Access downloads, courses, and accounts." />;
}

export function BuyerProductAccess() {
  return <PageStub title="Product Access" subtitle="Enter your access credentials" description="Use your email and PIN to access purchased products." />;
}

export function BuyerSupport() {
  const { profile } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      supabase.from('support_tickets').select('*').eq('user_id', profile.id).order('created_at', { ascending: false })
        .then(({ data }) => setTickets(data || []));
    }
  }, [profile]);

  const createTicket = async () => {
    if (!subject || !description) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('support_tickets').insert({ user_id: profile?.id, subject, description, status: 'open' });
      if (error) throw error;
      setShowNew(false);
      setSubject('');
      setDescription('');
      const { data } = await supabase.from('support_tickets').select('*').eq('user_id', profile?.id).order('created_at', { ascending: false });
      setTickets(data || []);
    } catch (e: any) { console.error(e.message); }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold dark:text-dark-text text-light-text">Support</h1>
        <button onClick={() => setShowNew(!showNew)} className="btn-primary py-2 px-4 text-sm">{showNew ? 'Cancel' : 'New Ticket'}</button>
      </div>

      {showNew && (
        <div className="card mb-4 animate-fade-in">
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" className="input-field mb-3" />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your issue..." className="input-field h-24 resize-none mb-3" />
          <button onClick={createTicket} disabled={loading} className="btn-primary w-full py-2.5 text-sm disabled:opacity-50">{loading ? 'Sending...' : 'Submit Ticket'}</button>
        </div>
      )}

      {tickets.length > 0 ? (
        <div className="space-y-2">
          {tickets.map(t => (
            <div key={t.id} className="card card-hover">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold dark:text-dark-text text-light-text">{t.subject}</p>
                <span className={`badge ${t.status === 'open' ? 'badge-warning' : t.status === 'resolved' ? 'badge-success' : 'badge-info'}`}>{t.status}</span>
              </div>
              <p className="text-xs dark:text-dark-muted text-light-muted mt-1">{new Date(t.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-8">
          <p className="text-sm dark:text-dark-muted text-light-muted">No support tickets yet</p>
          <p className="text-xs dark:text-dark-muted text-light-muted mt-1">Contact: honestansah@gmail.com</p>
        </div>
      )}
    </div>
  );
}

export function BuyerNotifications() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (profile) {
      supabase.from('notifications').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(50)
        .then(({ data }) => setNotifications(data || []));
    }
  }, [profile]);

  const markAllRead = async () => {
    if (!profile) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold dark:text-dark-text text-light-text">Notifications</h1>
        <button onClick={markAllRead} className="text-xs text-primary font-medium">Mark all read</button>
      </div>
      {notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n.id} className={`card ${!n.is_read ? 'border-l-2 border-l-primary' : ''}`}>
              <p className="text-sm font-medium dark:text-dark-text text-light-text">{n.title}</p>
              <p className="text-xs dark:text-dark-muted text-light-muted mt-1">{n.message}</p>
              <p className="text-[10px] dark:text-dark-muted text-light-muted mt-1">{new Date(n.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-8"><p className="text-sm dark:text-dark-muted text-light-muted">No notifications</p></div>
      )}
    </div>
  );
}

export function BuyerProfile() {
  const { profile, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', phone: '', bio: '', whatsapp: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name || '', phone: profile.phone || '', bio: profile.bio || '', whatsapp: profile.whatsapp || '' });
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try { await updateProfile(form); } catch (e: any) { console.error(e.message); }
    setSaving(false);
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <h1 className="text-xl font-bold dark:text-dark-text text-light-text mb-4">Profile</h1>
      <div className="card mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <span className="text-white text-xl font-bold">{profile?.full_name?.[0] || 'U'}</span>
          </div>
          <div>
            <p className="font-semibold dark:text-dark-text text-light-text">{profile?.full_name}</p>
            <p className="text-xs dark:text-dark-muted text-light-muted">{profile?.email}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div><label className="text-xs font-medium dark:text-dark-muted text-light-muted mb-1 block">Name</label><input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} className="input-field" /></div>
          <div><label className="text-xs font-medium dark:text-dark-muted text-light-muted mb-1 block">Phone</label><input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="input-field" /></div>
          <div><label className="text-xs font-medium dark:text-dark-muted text-light-muted mb-1 block">WhatsApp</label><input value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} className="input-field" /></div>
          <div><label className="text-xs font-medium dark:text-dark-muted text-light-muted mb-1 block">Bio</label><textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} className="input-field h-20 resize-none" /></div>
          <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-2.5 text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </div>
      <button onClick={async () => { await signOut(); navigate('/'); }} className="w-full py-3 rounded-xl text-sm font-medium text-danger bg-danger/10 hover:bg-danger/20 transition-all">Sign Out</button>
    </div>
  );
}

// ============================================
// SELLER PAGES (keeping as stubs with enhanced descriptions)
// ============================================
export function SellerDashboard() {
  return <PageStub title="Seller Dashboard" subtitle="Your store overview" description="Welcome to your seller dashboard. Monitor sales, manage products, and grow your business."
    stats={[{ label: 'Revenue', value: '0 XAF', color: 'text-primary' }, { label: 'Orders', value: '0', color: 'text-secondary' }, { label: 'Products', value: '0', color: 'text-accent' }, { label: 'Views', value: '0', color: 'text-warning' }]}
    actions={[{ label: 'Add Product', path: '/seller/products/add' }, { label: 'View Orders', path: '/seller/orders', variant: 'secondary' }, { label: 'Analytics', path: '/seller/analytics', variant: 'accent' }, { label: 'Marketing', path: '/seller/marketing' }]}
  />;
}
export function SellerProducts() {
  return <PageStub title="Products" subtitle="Manage your catalog" actions={[{ label: 'Add Product', path: '/seller/products/add' }, { label: 'Bulk Import', path: '/seller/bulk-actions', variant: 'secondary' }]} />;
}
export function SellerAddProduct() {
  return <PageStub title="Add Product" subtitle="Create a new product listing" description="Choose from 15 product types. Each type has its own form for filling details and delivery content." />;
}
export function SellerOrders() {
  return <PageStub title="Orders" subtitle="Manage customer orders" description="View and manage all orders. Track payments and delivery status." />;
}
export function SellerAnalytics() {
  return <PageStub title="Analytics" subtitle="Store performance" description="Track views, sales, conversion rates, and revenue trends." stats={[{ label: 'Total Views', value: '0' }, { label: 'Conversion', value: '0%' }, { label: 'Revenue', value: '0 XAF' }, { label: 'Avg Order', value: '0 XAF' }]} />;
}
export function SellerCustomers() {
  return <PageStub title="Customers" subtitle="Your customer base" description="View customer profiles, purchase history, and engagement metrics." />;
}
export function SellerMarketing() {
  return <PageStub title="Marketing Hub" subtitle="Grow your business" description="Create campaigns, set up email marketing, manage affiliates, and boost your sales."
    actions={[{ label: 'Coupons', path: '/seller/coupons' }, { label: 'Affiliates', path: '/seller/affiliates', variant: 'secondary' }, { label: 'Broadcasts', path: '/seller/broadcasts', variant: 'accent' }, { label: 'SEO Tools', path: '/seller/seo' }, { label: 'Automations', path: '/seller/automations', variant: 'secondary' }, { label: 'Templates', path: '/seller/templates' }]}
  />;
}
export function SellerCoupons() { return <PageStub title="Coupons" subtitle="Discount management" actions={[{ label: 'Create Coupon', path: '#' }]} />; }
export function SellerAffiliates() { return <PageStub title="Affiliates" subtitle="Affiliate program" description="Manage your affiliate partners, track clicks, conversions, and earnings." />; }
export function SellerPayouts() { return <PageStub title="Payouts" subtitle="Withdraw earnings" stats={[{ label: 'Available', value: '0 XAF' }, { label: 'Pending', value: '0 XAF' }, { label: 'Total Paid', value: '0 XAF' }]} />; }
export function SellerStoreSettings() { return <PageStub title="Store Settings" subtitle="General configuration" description="Configure your store name, logo, description, currency, and social links." />; }
export function SellerProfileSettings() { return <PageStub title="Profile Settings" subtitle="Personal information" description="Update your display name, avatar, bio, phone, and WhatsApp number." />; }
export function SellerSupport() { return <PageStub title="Support Tickets" subtitle="Get help" actions={[{ label: 'New Ticket', path: '#' }]} />; }
export function SellerNotifications() { return <PageStub title="Notifications" subtitle="Stay informed" />; }
export function SellerEmailSettings() { return <PageStub title="Email Preferences" subtitle="Notification preferences" />; }
export function SellerDeliverySettings() { return <PageStub title="Delivery Settings" subtitle="Product delivery" />; }
export function SellerDesignSettings() { return <PageStub title="Store Design" subtitle="Customize appearance" />; }
export function SellerDomainSettings() { return <PageStub title="Custom Domain" subtitle="Brand your store URL" />; }
export function SellerChargeSettings() { return <PageStub title="Custom Charges" subtitle="Additional fees" />; }
export function SellerCurrencySettings() { return <PageStub title="Store Currencies" subtitle="Multi-currency" />; }
export function SellerLegalPages() { return <PageStub title="Legal Pages" subtitle="Terms and policies" />; }
export function SellerHelp() { return <PageStub title="Help Center" subtitle="Learn SELLIZI" />; }
export function SellerSEO() { return <PageStub title="SEO Settings" subtitle="Search optimization" />; }
export function SellerBulkActions() { return <PageStub title="Bulk Actions" subtitle="Mass operations" />; }
export function SellerRevenue() { return <PageStub title="Revenue" subtitle="Financial overview" stats={[{ label: 'Gross', value: '0 XAF' }, { label: 'Fees', value: '0 XAF' }, { label: 'Net', value: '0 XAF' }]} />; }
export function SellerReviews() { return <PageStub title="Reviews" subtitle="Customer feedback" />; }
export function SellerAutomations() { return <PageStub title="Automations" subtitle="Workflow automation" />; }
export function SellerIntegrations() { return <PageStub title="Integrations" subtitle="Third-party services" />; }
export function SellerReports() { return <PageStub title="Reports" subtitle="Detailed analytics" />; }
export function SellerTeam() { return <PageStub title="Team" subtitle="Manage team" />; }
export function SellerInventory() { return <PageStub title="Inventory" subtitle="Stock management" />; }
export function SellerSecurity() { return <PageStub title="Security" subtitle="Account security" />; }
export function SellerChangePassword() { return <PageStub title="Change Password" subtitle="Update password" />; }
export function SellerSupportChannels() { return <PageStub title="Support Channels" subtitle="Customer support" />; }
export function SellerSalesChart() { return <PageStub title="Sales Chart" subtitle="Sales over time" />; }
export function SellerVisitors() { return <PageStub title="Visitors" subtitle="Store traffic" />; }
export function SellerConversionRate() { return <PageStub title="Conversion Rate" subtitle="Views to purchases" />; }
export function SellerLinkTraffic() { return <PageStub title="Link Traffic" subtitle="Referrer breakdown" />; }
export function SellerBroadcasts() { return <PageStub title="Broadcasts" subtitle="Send messages" />; }
export function SellerMessages() { return <PageStub title="Messages" subtitle="Communication" />; }
export function SellerWebhooks() { return <PageStub title="Webhooks" subtitle="Event notifications" />; }
export function SellerTemplates() { return <PageStub title="Templates" subtitle="Store templates" />; }

// ============================================
// ADMIN PAGES
// ============================================
export function AdminEntry() {
  const navigate = useNavigate();
  const { signIn, profile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/admin/dashboard');
    } catch (e: any) { console.error(e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen dark:bg-dark bg-light flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Access</h1>
          <p className="text-sm text-gray-400 mt-1">Restricted area - authorized personnel only</p>
        </div>
        <div className="space-y-4">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Admin email" className="input-field" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="input-field" />
          <button onClick={handleLogin} disabled={loading} className="w-full py-3.5 rounded-xl font-semibold bg-gradient-to-r from-red-500 to-purple-600 text-white disabled:opacity-50">{loading ? 'Verifying...' : 'Access Admin Panel'}</button>
        </div>
      </div>
    </div>
  );
}

export function AdminDashboard() { return <PageStub title="Admin Dashboard" subtitle="Platform overview" stats={[{ label: 'Users', value: '0' }, { label: 'Orders', value: '0' }, { label: 'Revenue', value: '0 XAF' }, { label: 'Stores', value: '0' }]} />; }
export function AdminUsers() { return <PageStub title="Users" subtitle="User management" />; }
export function AdminProducts() { return <PageStub title="Products" subtitle="Product management" />; }
export function AdminOrders() { return <PageStub title="Orders" subtitle="Order management" />; }
export function AdminPayments() { return <PageStub title="Payments" subtitle="Payment management" />; }
export function AdminAnalytics() { return <PageStub title="Analytics" subtitle="Platform analytics" />; }
export function AdminBroadcasts() { return <PageStub title="Broadcasts" subtitle="Platform messages" />; }
export function AdminTickets() { return <PageStub title="Support Tickets" subtitle="Manage support" />; }
export function AdminSettings() { return <PageStub title="App Settings" subtitle="Configuration" />; }
export function AdminSupportEmail() { return <PageStub title="Support Email" subtitle="honestansah@gmail.com" description="Editable by admin. Configure the support contact email." />; }
export function AdminAIConfigs() { return <PageStub title="AI Configurations" subtitle="Grok, Gemini, Claude" description="Configure AI providers, add API keys, and manage models for the platform." />; }
export function AdminCountries() { return <PageStub title="Countries & Operators" subtitle="16 African countries" description="Ashtechpay countries and mobile money operators." />; }
export function AdminStores() { return <PageStub title="Stores" subtitle="Store management" />; }
export function AdminSubscriptions() { return <PageStub title="Subscriptions" subtitle="Subscription management" />; }
export function AdminPayouts() { return <PageStub title="Payouts" subtitle="Payout management" />; }
export function AdminLegalPages() { return <PageStub title="Legal Pages" subtitle="Terms and policies" />; }
export function AdminHelpTopics() { return <PageStub title="Help Topics" subtitle="Help content" />; }
export function AdminNotifications() { return <PageStub title="Notifications" subtitle="System notifications" />; }
export function AdminSecurity() { return <PageStub title="Security" subtitle="Platform security" />; }
export function AdminReports() { return <PageStub title="Reports" subtitle="Generate reports" />; }
export function AdminCoupons() { return <PageStub title="Coupons" subtitle="Platform coupons" />; }
export function AdminReviews() { return <PageStub title="Reviews" subtitle="Review moderation" />; }
export function AdminDomainSettings() { return <PageStub title="Domain Settings" subtitle="Platform domains" />; }
export function AdminActivityLogs() { return <PageStub title="Activity Logs" subtitle="Audit trail" />; }
export function AdminSystemHealth() { return <PageStub title="System Health" subtitle="Platform status" />; }
export function AdminMaintenance() { return <PageStub title="Maintenance" subtitle="System maintenance" />; }
export function AdminPushNotifications() { return <PageStub title="Push Notifications" subtitle="VAPID setup" />; }
export function AdminTemplates() { return <PageStub title="Store Templates" subtitle="Template management" />; }
export function AdminAffiliates() { return <PageStub title="Affiliates" subtitle="Affiliate management" />; }

// ============================================
// LEGAL & HELP
// ============================================
export function TermsPage() {
  return (
    <div className="min-h-screen dark:bg-dark bg-light p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold dark:text-dark-text text-light-text mb-4">Terms of Service</h1>
      <div className="card space-y-4">
        <p className="text-sm dark:text-dark-muted text-light-muted leading-relaxed">Welcome to SELLIZI. By using our platform, you agree to these Terms of Service.</p>
        <h2 className="text-base font-bold dark:text-dark-text text-light-text">1. Acceptance of Terms</h2>
        <p className="text-sm dark:text-dark-muted text-light-muted">By accessing SELLIZI, you agree to be bound by these Terms and our Privacy Policy.</p>
        <h2 className="text-base font-bold dark:text-dark-text text-light-text">2. User Accounts</h2>
        <p className="text-sm dark:text-dark-muted text-light-muted">You are responsible for maintaining the security of your account.</p>
        <h2 className="text-base font-bold dark:text-dark-text text-light-text">3. Digital Products</h2>
        <p className="text-sm dark:text-dark-muted text-light-muted">Sellers are responsible for their content and delivery. SELLIZI facilitates transactions.</p>
        <h2 className="text-base font-bold dark:text-dark-text text-light-text">4. Payments</h2>
        <p className="text-sm dark:text-dark-muted text-light-muted">All payments processed via Ashtechpay. Fees deducted automatically.</p>
        <h2 className="text-base font-bold dark:text-dark-text text-light-text">5. Contact</h2>
        <p className="text-sm dark:text-dark-muted text-light-muted">honestansah@gmail.com</p>
      </div>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <div className="min-h-screen dark:bg-dark bg-light p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold dark:text-dark-text text-light-text mb-4">Privacy Policy</h1>
      <div className="card space-y-4">
        <p className="text-sm dark:text-dark-muted text-light-muted leading-relaxed">SELLIZI is committed to protecting your privacy.</p>
        <h2 className="text-base font-bold dark:text-dark-text text-light-text">Information We Collect</h2>
        <p className="text-sm dark:text-dark-muted text-light-muted">Name, email, phone, country, payment information, and usage data.</p>
        <h2 className="text-base font-bold dark:text-dark-text text-light-text">Data Sharing</h2>
        <p className="text-sm dark:text-dark-muted text-light-muted">With payment processors (Ashtechpay), cloud providers (Supabase), and as required by law.</p>
        <h2 className="text-base font-bold dark:text-dark-text text-light-text">Contact</h2>
        <p className="text-sm dark:text-dark-muted text-light-muted">honestansah@gmail.com</p>
      </div>
    </div>
  );
}

export function HelpPage() {
  return (
    <div className="min-h-screen dark:bg-dark bg-light p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold dark:text-dark-text text-light-text mb-4">Help Center</h1>
      <div className="space-y-2">
        {['Getting Started', 'How to Buy', 'How to Sell', 'Payments', 'Account Settings', 'Troubleshooting'].map(topic => (
          <div key={topic} className="card card-hover cursor-pointer">
            <h3 className="font-semibold text-sm dark:text-dark-text text-light-text">{topic}</h3>
            <p className="text-xs dark:text-dark-muted text-light-muted mt-0.5">Learn about {topic.toLowerCase()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HelpTopicPage() { return <PageStub title="Help Topic" />; }
