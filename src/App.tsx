import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/store/appStore';
import { Toaster } from 'react-hot-toast';

// Layouts
import BuyerLayout from '@/layouts/BuyerLayout';
import SellerLayout from '@/layouts/SellerLayout';
import AdminLayout from '@/layouts/AdminLayout';

// Auth pages
import WelcomePage from '@/pages/WelcomePage';
import LoginPage from '@/pages/auth/LoginPage';
import SignUpPage from '@/pages/auth/SignUpPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import BuyerAccessPage from '@/pages/BuyerAccessPage';
import BuyerDashboard from '@/pages/buyer/BuyerDashboard';

// Real seller pages (implemented)
import { SellerDashboard } from '@/pages/seller/Dashboard';
import { SellerProducts, SellerBulkActions, SellerInventory } from '@/pages/seller/Products';
import { SellerAddProduct } from '@/pages/seller/AddProduct';
import { SellerOrders } from '@/pages/seller/Orders';
import {
  SellerAnalytics, SellerSalesChart, SellerVisitors, SellerConversionRate, SellerLinkTraffic, SellerReports,
} from '@/pages/seller/Analytics';
import { SellerCustomers } from '@/pages/seller/Customers';
import { SellerMarketing, SellerCoupons, SellerAffiliates, SellerBroadcasts } from '@/pages/seller/Marketing';
import { SellerPayouts, SellerRevenue } from '@/pages/seller/Finance';
import { SellerReviews } from '@/pages/seller/Reviews';
import { SellerSupport, SellerNotifications } from '@/pages/seller/Support';
import { SellerMessages } from '@/pages/seller/Messages';
import {
  SellerStoreSettings, SellerProfileSettings, SellerEmailSettings, SellerDeliverySettings,
  SellerDesignSettings, SellerDomainSettings, SellerChargeSettings, SellerCurrencySettings,
  SellerSEO, SellerSupportChannels, SellerSecurity, SellerChangePassword,
} from '@/pages/seller/Settings';
import { SellerLegalPages, SellerHelp } from '@/pages/seller/Help';
import { SellerTemplates } from '@/pages/seller/Templates';
import { SellerTeam, SellerWebhooks, SellerIntegrations, SellerAutomations } from '@/pages/seller/Automation';
import { BuyerShop } from '@/pages/buyer/Shop';
import { BuyerProductView } from '@/pages/buyer/ProductView';
import { BuyerOrders } from '@/pages/buyer/Orders';
import { BuyerMyProducts } from '@/pages/buyer/MyProducts';
import { BuyerProductAccess } from '@/pages/buyer/ProductAccess';
import { BuyerSupport } from '@/pages/buyer/Support';
import { BuyerNotifications } from '@/pages/buyer/Notifications';
import { BuyerProfile } from '@/pages/buyer/Profile';

// Real admin pages
import { AdminDashboard } from '@/pages/admin/Dashboard';
import { AdminUsers } from '@/pages/admin/Users';
import { AdminStores } from '@/pages/admin/Stores';
import { AdminProducts, AdminOrders } from '@/pages/admin/Commerce';
import { AdminPayments, AdminPayouts } from '@/pages/admin/Finance';
import { AdminAnalytics, AdminReports, AdminSystemHealth, AdminActivityLogs } from '@/pages/admin/Analytics';
import {
  AdminTickets, AdminBroadcasts, AdminSettings, AdminAIConfigs, AdminCountries,
  AdminSubscriptions, AdminLegalPages, AdminHelpTopics, AdminNotifications,
  AdminSecurity, AdminMaintenance, AdminPushNotifications, AdminTemplates,
  AdminAffiliates, AdminCoupons, AdminReviews, AdminDomainSettings,
  AdminSupportEmail,
} from '@/pages/admin/Management';

// Remaining stubs - only the public-facing legal/help pages (no data, just content)
import {
  AdminEntry,
  TermsPage, PrivacyPage, HelpPage, HelpTopicPage
} from '@/lib/pageStubs';

function ProgressBar() {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    setProgress(30);
    const t1 = setTimeout(() => setProgress(70), 100);
    const t2 = setTimeout(() => setProgress(100), 300);
    const t3 = setTimeout(() => { setVisible(false); setProgress(0); }, 500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [location.pathname]);

  if (!visible) return null;
  return <div className="progress-bar" style={{ width: `${progress}%` }} />;
}

// Seller/Auth guard - requires login
function SellerRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-dark bg-light">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm dark:text-dark-muted text-light-muted">Loading SELLIZI...</span>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location, role: 'seller' }} replace />;
  return <>{children}</>;
}

// Admin guard - requires admin role
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-dark bg-light">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Verifying admin access...</span>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/adminentry" replace />;
  if (profile && profile.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useAppStore();
  useEffect(() => {
    document.documentElement.className = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0A0A0F' : '#F8F9FC');
  }, [theme]);
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <>
      <ProgressBar />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/buyer-access" element={<BuyerAccessPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/help/:slug" element={<HelpTopicPage />} />

        {/* BUYER ROUTES - NO AUTH REQUIRED */}
        <Route path="/buyer" element={<BuyerLayout />}>
          <Route index element={<BuyerDashboard />} />
          <Route path="dashboard" element={<BuyerDashboard />} />
          <Route path="shop" element={<BuyerShop />} />
          <Route path="orders" element={<BuyerOrders />} />
          <Route path="product/:id" element={<BuyerProductView />} />
          <Route path="my-products" element={<BuyerMyProducts />} />
          <Route path="access" element={<BuyerProductAccess />} />
          <Route path="support" element={<BuyerSupport />} />
          <Route path="notifications" element={<BuyerNotifications />} />
          <Route path="profile" element={<BuyerProfile />} />
        </Route>

        {/* SELLER ROUTES - AUTH REQUIRED */}
        <Route path="/seller" element={<SellerRoute><SellerLayout /></SellerRoute>}>
          <Route index element={<SellerDashboard />} />
          <Route path="dashboard" element={<SellerDashboard />} />
          <Route path="products" element={<SellerProducts />} />
          <Route path="products/add" element={<SellerAddProduct />} />
          <Route path="products/edit/:id" element={<SellerAddProduct />} />
          <Route path="orders" element={<SellerOrders />} />
          <Route path="analytics" element={<SellerAnalytics />} />
          <Route path="customers" element={<SellerCustomers />} />
          <Route path="marketing" element={<SellerMarketing />} />
          <Route path="coupons" element={<SellerCoupons />} />
          <Route path="affiliates" element={<SellerAffiliates />} />
          <Route path="payouts" element={<SellerPayouts />} />
          <Route path="revenue" element={<SellerRevenue />} />
          <Route path="reviews" element={<SellerReviews />} />
          <Route path="sales" element={<SellerSalesChart />} />
          <Route path="visitors" element={<SellerVisitors />} />
          <Route path="conversion" element={<SellerConversionRate />} />
          <Route path="traffic" element={<SellerLinkTraffic />} />
          <Route path="broadcasts" element={<SellerBroadcasts />} />
          <Route path="messages" element={<SellerMessages />} />
          <Route path="automations" element={<SellerAutomations />} />
          <Route path="integrations" element={<SellerIntegrations />} />
          <Route path="reports" element={<SellerReports />} />
          <Route path="team" element={<SellerTeam />} />
          <Route path="inventory" element={<SellerInventory />} />
          <Route path="bulk-actions" element={<SellerBulkActions />} />
          <Route path="webhooks" element={<SellerWebhooks />} />
          <Route path="templates" element={<SellerTemplates />} />
          <Route path="seo" element={<SellerSEO />} />
          <Route path="store-settings" element={<SellerStoreSettings />} />
          <Route path="profile-settings" element={<SellerProfileSettings />} />
          <Route path="email-settings" element={<SellerEmailSettings />} />
          <Route path="delivery-settings" element={<SellerDeliverySettings />} />
          <Route path="design-settings" element={<SellerDesignSettings />} />
          <Route path="domain-settings" element={<SellerDomainSettings />} />
          <Route path="charge-settings" element={<SellerChargeSettings />} />
          <Route path="currency-settings" element={<SellerCurrencySettings />} />
          <Route path="support-channels" element={<SellerSupportChannels />} />
          <Route path="legal-pages" element={<SellerLegalPages />} />
          <Route path="security" element={<SellerSecurity />} />
          <Route path="change-password" element={<SellerChangePassword />} />
          <Route path="support" element={<SellerSupport />} />
          <Route path="notifications" element={<SellerNotifications />} />
          <Route path="help" element={<SellerHelp />} />
        </Route>

        {/* ADMIN ROUTES */}
        <Route path="/adminentry" element={<AdminEntry />} />
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="broadcasts" element={<AdminBroadcasts />} />
          <Route path="tickets" element={<AdminTickets />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="support-email" element={<AdminSupportEmail />} />
          <Route path="ai-configs" element={<AdminAIConfigs />} />
          <Route path="countries" element={<AdminCountries />} />
          <Route path="stores" element={<AdminStores />} />
          <Route path="subscriptions" element={<AdminSubscriptions />} />
          <Route path="payouts" element={<AdminPayouts />} />
          <Route path="legal-pages" element={<AdminLegalPages />} />
          <Route path="help-topics" element={<AdminHelpTopics />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="security" element={<AdminSecurity />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="domains" element={<AdminDomainSettings />} />
          <Route path="activity-logs" element={<AdminActivityLogs />} />
          <Route path="system-health" element={<AdminSystemHealth />} />
          <Route path="maintenance" element={<AdminMaintenance />} />
          <Route path="push-notifications" element={<AdminPushNotifications />} />
          <Route path="templates" element={<AdminTemplates />} />
          <Route path="affiliates" element={<AdminAffiliates />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeWrapper>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1A1A2E',
                color: '#E8E8F0',
                borderRadius: '12px',
                border: '1px solid #2D2D44',
                fontSize: '0.875rem',
              },
              success: { iconTheme: { primary: '#00D4AA', secondary: '#0A0A0F' } },
              error: { iconTheme: { primary: '#FF7675', secondary: '#0A0A0F' } },
            }}
          />
        </AuthProvider>
      </ThemeWrapper>
    </BrowserRouter>
  );
}
