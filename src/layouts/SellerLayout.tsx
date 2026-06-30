import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/store/appStore';

const DashboardIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>;
const ProductIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
const OrderIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const ChartIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const MegaphoneIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>;
const SettingsIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const BellIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
const MessageIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const UsersIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const DollarIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const LinkIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>;
const StarIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
const SwitchIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
const SunIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const MoonIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
const LogoutIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const GridIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;

const sellerNavItems = [
  { path: '/seller/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { path: '/seller/products', label: 'Products', icon: <ProductIcon /> },
  { path: '/seller/orders', label: 'Orders', icon: <OrderIcon /> },
  { path: '/seller/analytics', label: 'Analytics', icon: <ChartIcon /> },
  { path: '/seller/messages', label: 'Messages', icon: <MessageIcon /> },
];

const sellerMenuSections = [
  {
    title: 'Commerce',
    items: [
      { path: '/seller/products', label: 'Products', icon: <ProductIcon /> },
      { path: '/seller/products/add', label: 'Add Product', icon: <ProductIcon /> },
      { path: '/seller/orders', label: 'Orders', icon: <OrderIcon /> },
      { path: '/seller/customers', label: 'Customers', icon: <UsersIcon /> },
      { path: '/seller/inventory', label: 'Inventory', icon: <GridIcon /> },
      { path: '/seller/reviews', label: 'Reviews', icon: <StarIcon /> },
    ]
  },
  {
    title: 'Analytics',
    items: [
      { path: '/seller/analytics', label: 'Overview', icon: <ChartIcon /> },
      { path: '/seller/sales', label: 'Sales Chart', icon: <ChartIcon /> },
      { path: '/seller/visitors', label: 'Visitors', icon: <UsersIcon /> },
      { path: '/seller/conversion', label: 'Conversion Rate', icon: <ChartIcon /> },
      { path: '/seller/traffic', label: 'Link Traffic', icon: <LinkIcon /> },
      { path: '/seller/revenue', label: 'Revenue', icon: <DollarIcon /> },
      { path: '/seller/reports', label: 'Reports', icon: <ChartIcon /> },
    ]
  },
  {
    title: 'Marketing',
    items: [
      { path: '/seller/marketing', label: 'Marketing Hub', icon: <MegaphoneIcon /> },
      { path: '/seller/coupons', label: 'Coupons', icon: <DollarIcon /> },
      { path: '/seller/affiliates', label: 'Affiliates', icon: <LinkIcon /> },
      { path: '/seller/broadcasts', label: 'Broadcasts', icon: <MegaphoneIcon /> },
      { path: '/seller/automations', label: 'Automations', icon: <GridIcon /> },
      { path: '/seller/seo', label: 'SEO', icon: <LinkIcon /> },
      { path: '/seller/bulk-actions', label: 'Bulk Actions', icon: <GridIcon /> },
      { path: '/seller/templates', label: 'Templates', icon: <GridIcon /> },
    ]
  },
  {
    title: 'Finance',
    items: [
      { path: '/seller/payouts', label: 'Payouts', icon: <DollarIcon /> },
      { path: '/seller/charge-settings', label: 'Custom Charges', icon: <DollarIcon /> },
      { path: '/seller/currency-settings', label: 'Currencies', icon: <DollarIcon /> },
    ]
  },
  {
    title: 'Communication',
    items: [
      { path: '/seller/messages', label: 'Messages', icon: <MessageIcon /> },
      { path: '/seller/notifications', label: 'Notifications', icon: <BellIcon /> },
      { path: '/seller/support', label: 'Support Tickets', icon: <MessageIcon /> },
      { path: '/seller/support-channels', label: 'Support Channels', icon: <LinkIcon /> },
      { path: '/seller/team', label: 'Team', icon: <UsersIcon /> },
    ]
  },
  {
    title: 'Store Settings',
    items: [
      { path: '/seller/store-settings', label: 'General Settings', icon: <SettingsIcon /> },
      { path: '/seller/profile-settings', label: 'Profile', icon: <UsersIcon /> },
      { path: '/seller/email-settings', label: 'Email Preferences', icon: <MessageIcon /> },
      { path: '/seller/delivery-settings', label: 'Delivery', icon: <GridIcon /> },
      { path: '/seller/design-settings', label: 'Design & Templates', icon: <GridIcon /> },
      { path: '/seller/domain-settings', label: 'Custom Domain', icon: <LinkIcon /> },
      { path: '/seller/integrations', label: 'Integrations', icon: <LinkIcon /> },
      { path: '/seller/webhooks', label: 'Webhooks', icon: <LinkIcon /> },
      { path: '/seller/security', label: 'Security', icon: <SettingsIcon /> },
      { path: '/seller/change-password', label: 'Change Password', icon: <SettingsIcon /> },
      { path: '/seller/legal-pages', label: 'Legal Pages', icon: <GridIcon /> },
      { path: '/seller/help', label: 'Help', icon: <GridIcon /> },
    ]
  },
];

export default function SellerLayout() {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useAppStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('Commerce');

  return (
    <div className="min-h-screen dark:bg-dark bg-light">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-40 safe-top dark:bg-dark/95 bg-light/95 backdrop-blur-xl dark:border-dark-border border-light-border border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-xl dark:text-dark-text text-light-text">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {sidebarOpen ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div>
              <span className="font-bold gradient-text">SELLIZI</span>
              <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded bg-secondary/20 text-secondary font-medium">Seller</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/seller/notifications')} className="relative p-2 rounded-xl dark:text-dark-text text-light-text">
              <BellIcon />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-xl dark:text-dark-text text-light-text">
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed top-0 left-0 bottom-0 w-80 z-50 dark:bg-dark-card bg-light-card animate-slide-left overflow-y-auto hide-scrollbar">
            <div className="p-4 safe-top">
              <div className="flex items-center gap-3 mb-6 pt-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
                  <span className="text-white font-bold">S</span>
                </div>
                <div>
                  <h2 className="font-bold dark:text-dark-text text-light-text">Seller Panel</h2>
                  <p className="text-xs dark:text-dark-muted text-light-muted truncate">{profile?.username || profile?.email}</p>
                </div>
              </div>

              {sellerMenuSections.map((section) => (
                <div key={section.title} className="mb-2">
                  <button
                    onClick={() => setExpandedSection(expandedSection === section.title ? null : section.title)}
                    className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider dark:text-dark-muted text-light-muted"
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
                                ? 'bg-secondary/10 text-secondary font-medium'
                                : 'dark:text-dark-muted text-light-muted hover:dark:bg-dark-surface hover:bg-light-surface'
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

              <div className="border-t dark:border-dark-border border-light-border my-4" />

              <button
                onClick={() => { navigate('/buyer/dashboard'); setSidebarOpen(false); }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg w-full text-sm text-primary hover:bg-primary/10 transition-all"
              >
                <SwitchIcon />
                <span className="font-medium">Switch to Buyer</span>
              </button>

              <button
                onClick={async () => { await signOut(); navigate('/'); setSidebarOpen(false); }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg w-full text-sm text-danger hover:bg-danger/10 transition-all"
              >
                <LogoutIcon />
                <span className="font-medium">Sign Out</span>
              </button>
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
        <div className="flex items-center justify-around py-2 px-2">
          {sellerNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all min-w-[56px] ${
                  isActive ? 'text-secondary' : 'dark:text-dark-muted text-light-muted'
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
