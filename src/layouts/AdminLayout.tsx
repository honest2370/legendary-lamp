import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/store/appStore';

const DashboardIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>;
const UsersIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const ProductIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
const OrderIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
const DollarIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ChartIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const MegaphoneIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>;
const TicketIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>;
const SettingsIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const BellIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
const LogoutIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const ShieldIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
const AIIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const GlobeIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const SwitchIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
const SunIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const MoonIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
const StoreIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
const ActivityIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;

const adminMenuSections = [
  {
    title: 'Overview',
    items: [
      { path: '/admin/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
      { path: '/admin/analytics', label: 'Analytics', icon: <ChartIcon /> },
      { path: '/admin/system-health', label: 'System Health', icon: <ActivityIcon /> },
      { path: '/admin/activity-logs', label: 'Activity Logs', icon: <ActivityIcon /> },
    ]
  },
  {
    title: 'User Management',
    items: [
      { path: '/admin/users', label: 'All Users', icon: <UsersIcon /> },
      { path: '/admin/stores', label: 'Stores', icon: <StoreIcon /> },
      { path: '/admin/subscriptions', label: 'Subscriptions', icon: <DollarIcon /> },
      { path: '/admin/affiliates', label: 'Affiliates', icon: <GlobeIcon /> },
    ]
  },
  {
    title: 'Commerce',
    items: [
      { path: '/admin/products', label: 'Products', icon: <ProductIcon /> },
      { path: '/admin/orders', label: 'Orders', icon: <OrderIcon /> },
      { path: '/admin/payments', label: 'Payments', icon: <DollarIcon /> },
      { path: '/admin/payouts', label: 'Payouts', icon: <DollarIcon /> },
      { path: '/admin/coupons', label: 'Coupons', icon: <DollarIcon /> },
      { path: '/admin/reviews', label: 'Reviews', icon: <ChartIcon /> },
    ]
  },
  {
    title: 'Communication',
    items: [
      { path: '/admin/broadcasts', label: 'Broadcasts', icon: <MegaphoneIcon /> },
      { path: '/admin/tickets', label: 'Support Tickets', icon: <TicketIcon /> },
      { path: '/admin/notifications', label: 'Notifications', icon: <BellIcon /> },
      { path: '/admin/push-notifications', label: 'Push Notifications', icon: <BellIcon /> },
    ]
  },
  {
    title: 'Configuration',
    items: [
      { path: '/admin/settings', label: 'App Settings', icon: <SettingsIcon /> },
      { path: '/admin/support-email', label: 'Support Email', icon: <SettingsIcon /> },
      { path: '/admin/ai-configs', label: 'AI Configurations', icon: <AIIcon /> },
      { path: '/admin/countries', label: 'Countries & Ops', icon: <GlobeIcon /> },
      { path: '/admin/domains', label: 'Domain Settings', icon: <GlobeIcon /> },
      { path: '/admin/templates', label: 'Store Templates', icon: <StoreIcon /> },
    ]
  },
  {
    title: 'Legal & Help',
    items: [
      { path: '/admin/legal-pages', label: 'Legal Pages', icon: <ShieldIcon /> },
      { path: '/admin/help-topics', label: 'Help Topics', icon: <TicketIcon /> },
    ]
  },
  {
    title: 'System',
    items: [
      { path: '/admin/security', label: 'Security', icon: <ShieldIcon /> },
      { path: '/admin/reports', label: 'Reports', icon: <ChartIcon /> },
      { path: '/admin/maintenance', label: 'Maintenance', icon: <SettingsIcon /> },
    ]
  },
];

export default function AdminLayout() {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useAppStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('Overview');

  return (
    <div className="min-h-screen dark:bg-dark bg-light">
      {/* Top Header - Admin themed */}
      <header className="fixed top-0 left-0 right-0 z-40 safe-top bg-gradient-to-r from-red-900/95 to-purple-900/95 backdrop-blur-xl border-b border-red-500/20">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-xl text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {sidebarOpen ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div>
              <span className="font-bold text-white">SELLIZI</span>
              <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded bg-red-500/30 text-red-300 font-medium">Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/admin/notifications')} className="relative p-2 rounded-xl text-white">
              <BellIcon />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-400 rounded-full" />
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-xl text-white">
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed top-0 left-0 bottom-0 w-80 z-50 bg-gray-950 animate-slide-left overflow-y-auto hide-scrollbar border-r border-red-500/20">
            <div className="p-4 safe-top">
              <div className="flex items-center gap-3 mb-6 pt-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold">S</span>
                </div>
                <div>
                  <h2 className="font-bold text-white">Admin Panel</h2>
                  <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
                </div>
              </div>

              {adminMenuSections.map((section) => (
                <div key={section.title} className="mb-2">
                  <button
                    onClick={() => setExpandedSection(expandedSection === section.title ? null : section.title)}
                    className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    {section.title}
                    <svg className={`w-4 h-4 transition-transform ${expandedSection === section.title ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedSection === section.title && (
                    <div className="space-y-0.5">
                      {section.items.map((item) => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                              isActive
                                ? 'bg-red-500/10 text-red-400 font-medium'
                                : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
                            }`
                          }
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="border-t border-gray-800 my-4" />

              <button
                onClick={() => { navigate('/seller/dashboard'); setSidebarOpen(false); }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg w-full text-sm text-purple-400 hover:bg-purple-500/10 transition-all"
              >
                <SwitchIcon />
                <span className="font-medium">Switch to Seller</span>
              </button>

              <button
                onClick={async () => { await signOut(); navigate('/'); setSidebarOpen(false); }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg w-full text-sm text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogoutIcon />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="pt-14 pb-6">
        <Outlet />
      </main>
    </div>
  );
}
