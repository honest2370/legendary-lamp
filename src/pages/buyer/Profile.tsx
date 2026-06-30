import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogIn, LogOut, Store, Save, Heart, ShoppingBag, Bell, LifeBuoy, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export function BuyerProfile() {
  const navigate = useNavigate();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [form, setForm] = useState({ full_name: '', phone: '', country: '' });
  const [saving, setSaving] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name || '', phone: profile.phone || '', country: profile.country || '' });
  }, [profile?.id]);

  if (!profile) {
    return (
      <div className="p-4 max-w-lg mx-auto animate-fade-in flex flex-col items-center justify-center min-h-[70vh] text-center">
        <LogIn className="w-10 h-10 text-primary mb-3" />
        <p className="text-base font-semibold dark:text-dark-text text-light-text mb-1">Sign in to manage your profile</p>
        <button onClick={() => navigate('/login')} className="btn-primary text-sm px-4 py-2 mt-2">Sign in</button>
      </div>
    );
  }

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('profiles').update(form).eq('id', profile.id);
    setSaving(false);
    if (error) return toast.error('Could not save profile');
    toast.success('Profile updated');
    refreshProfile();
  };

  const switchToSeller = async () => {
    setSwitching(true);
    const { error } = await supabase.rpc('switch_user_role', { user_id: profile.id, new_role: 'seller' });
    setSwitching(false);
    if (error) return toast.error('Could not switch — has migration 006 been run?');
    await refreshProfile();
    toast.success('Switched to Seller account!');
    navigate('/seller/dashboard');
  };

  const links = [
    { label: 'My Orders', icon: ShoppingBag, path: '/buyer/orders' },
    { label: 'Wishlist & Purchases', icon: Heart, path: '/buyer/my-products' },
    { label: 'Notifications', icon: Bell, path: '/buyer/notifications' },
    { label: 'Support', icon: LifeBuoy, path: '/buyer/support' },
    { label: 'Product Access', icon: Lock, path: '/buyer/access' },
  ];

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <h1 className="text-xl font-bold dark:text-dark-text text-light-text mb-4">Profile</h1>

      <div className="card mb-4 space-y-3">
        <div><label className="text-xs dark:text-dark-muted text-light-muted block mb-1">Full name</label><input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} className="input-field text-sm" /></div>
        <div><label className="text-xs dark:text-dark-muted text-light-muted block mb-1">Email</label><input value={user?.email || ''} disabled className="input-field text-sm opacity-60" /></div>
        <div><label className="text-xs dark:text-dark-muted text-light-muted block mb-1">Phone</label><input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="input-field text-sm" /></div>
        <div><label className="text-xs dark:text-dark-muted text-light-muted block mb-1">Country</label><input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} className="input-field text-sm" /></div>
        <button onClick={save} disabled={saving} className="btn-primary w-full text-sm py-2.5"><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save changes'}</button>
      </div>

      <div className="space-y-2 mb-4">
        {links.map((l) => (
          <button key={l.path} onClick={() => navigate(l.path)} className="w-full card card-hover flex items-center gap-3 text-left">
            <l.icon className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium dark:text-dark-text text-light-text">{l.label}</span>
          </button>
        ))}
      </div>

      <button onClick={switchToSeller} disabled={switching} className="w-full card card-hover flex items-center gap-3 mb-2 text-left">
        <Store className="w-4 h-4 text-secondary" />
        <span className="text-sm font-medium dark:text-dark-text text-light-text">{switching ? 'Switching...' : 'Switch to Seller account'}</span>
      </button>

      <button onClick={signOut} className="w-full flex items-center justify-center gap-2 text-sm text-danger font-medium py-3">
        <LogOut className="w-4 h-4" /> Sign out
      </button>
    </div>
  );
}
