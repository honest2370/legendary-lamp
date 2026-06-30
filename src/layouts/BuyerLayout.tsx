// Buyer Layout - No auth required for browsing
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/store/appStore';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

const HomeIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const ShopIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
const BagIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
const BoxIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
const UserIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const BellIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
const MoonIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
const SunIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const SwitchIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
const HelpIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const LogoutIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const LoginIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>;

export default function BuyerLayout() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { theme, toggleTheme, setSidebarOpen, sidebarOpen } = useAppStore();
  const navigate = useNavigate();

  const switchToSeller = async () => {
    if (!user) {
      navigate('/signup?role=seller');
      setSidebarOpen(false);
      return;
    }
    try {
      await supabase.rpc('switch_user_role', {
        user_id: user.id,
        new_role: 'seller',
      });
      await refreshProfile();
      toast.success('Switched to Seller account!');
      setSidebarOpen(false);
      navigate('/seller/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Failed to switch role');
    }
  };

  const navItems = [
    { path: '/buyer/dashboard', label: 'Home', icon: <HomeIcon /> },
    { path: '/buyer/shop', label: 'Shop', icon: <ShopIcon /> },
    { path: '/buyer/my-products', label: 'Products', icon: <BoxIcon /> },
    { path: '/buyer/orders', label: 'Orders', icon: <BagIcon /> },
    { path: '/buyer/profile', label: 'Profile', icon: <UserIcon /> },
  ];

  const sidebarItems = [
    { path: '/buyer/notifications', label: 'Notifications', icon: <BellIcon /> },
    { path: '/buyer/support', label: 'Support', icon: <HelpIcon /> },
    { path: '/buyer/access', label: 'Product Access', icon: <BoxIcon /> },
  ];

  return (
    <div className="min-h-screen dark:bg-dark bg-light">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-40 safe-top dark:bg-dark/95 bg-light/95 backdrop-blur-xl dark:border-dark-border border-light-border border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-xl dark:text-dark-text text-light-text">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-lg gradient-text">SELLIZI</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => user ? navigate('/buyer/notifications') : navigate('/login')} className="relative p-2 rounded-xl dark:text-dark-text text-light-text">
              <BellIcon />
              {user && <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />}
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-xl dark:text-dark-text text-light-text">
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar Drawer */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed top-0 left-0 bottom-0 w-72 z-50 dark:bg-dark-card bg-light-card animate-slide-left overflow-y-auto hide-scrollbar">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <span className="text-white font-bold text-xl">S</span>
                </div>
                <div>
                  <h2 className="font-bold dark:text-dark-text text-light-text">SELLIZI</h2>
                  <p className="text-xs dark:text-dark-muted text-light-muted">Buyer Space</p>
                </div>
              </div>
              
              {/* User info or Login prompt */}
              {user && profile ? (
                <div className="mb-6 p-4 rounded-xl dark:bg-dark-surface bg-light-surface">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <span className="text-white font-semibold">{profile.full_name?.[0] || 'U'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium dark:text-dark-text text-light-text truncate">{profile.full_name || 'User'}</p>
                      <p className="text-xs dark:text-dark-muted text-light-muted truncate">{profile.email}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 rounded-xl dark:bg-dark-surface bg-light-surface">
                  <p className="text-sm dark:text-dark-text text-light-text font-medium mb-3">Browse as guest</p>
                  <div className="flex gap-2">
                    <button onClick={() => { navigate('/login'); setSidebarOpen(false); }} className="flex-1 py-2 px-3 rounded-lg bg-primary text-dark text-xs font-semibold">Sign In</button>
                    <button onClick={() => { navigate('/signup?role=buyer'); setSidebarOpen(false); }} className="flex-1 py-2 px-3 rounded-lg dark:bg-dark-border bg-light-border dark:text-dark-text text-light-text text-xs font-semibold">Sign Up</button>
                  </div>
                </div>
              )}

              {/* Nav items */}
              <nav className="space-y-1">
                {[...navItems, ...sidebarItems].map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'dark:text-dark-muted text-light-muted hover:dark:bg-dark-surface hover:bg-light-surface'
                      }`
                    }
                  >
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                ))}
                
                <button
                  onClick={() => { navigate('/help'); setSidebarOpen(false); }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl w-full dark:text-dark-muted text-light-muted hover:dark:bg-dark-surface hover:bg-light-surface transition-all"
                >
                  <HelpIcon />
                  <span className="font-medium">Help Center</span>
                </button>

                <button
                  onClick={switchToSeller}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-secondary hover:bg-secondary/10 transition-all"
                >
                  <SwitchIcon />
                  <span className="font-medium">Switch to Seller</span>
                </button>

                {user && (
                  <>
                    <div className="border-t dark:border-dark-border border-light-border my-4" />
                    <button
                      onClick={async () => { await signOut(); navigate('/'); setSidebarOpen(false); }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-danger hover:bg-danger/10 transition-all"
                    >
                      <LogoutIcon />
                      <span className="font-medium">Sign Out</span>
                    </button>
                  </>
                )}
              </nav>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="pt-14 pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <div className="flex items-center justify-around py-2 px-2 max-w-lg mx-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all min-w-[60px] ${
                  isActive ? 'text-primary' : 'dark:text-dark-muted text-light-muted'
                }`
              }
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
