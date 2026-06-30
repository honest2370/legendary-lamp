// SELLIZI Configuration
// All keys come from Vercel environment variables
// Ashtechpay key is stored in Supabase Edge Function secrets

export const APP_CONFIG = {
  name: 'SELLIZI',
  tagline: 'Your Digital Commerce Platform',
  description: 'Sell and buy digital products across Africa with seamless mobile money payments',
  url: import.meta.env.VITE_APP_URL || 'https://sellizi.vercel.app',
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || 'honestansah@gmail.com',
  version: '1.0.0',
  adminPaths: ['/adminentry', '/admin'],
  sellerPaths: ['/seller'],
  buyerPaths: ['/buyer'],
};

export const ASHTECHPAY_CONFIG = {
  baseUrl: 'https://ashtechpay.top',
  // API key is NOT stored here - it lives in Supabase Edge Function secrets
  // All payment operations go through Edge Functions for security
  endpoints: {
    countries: '/v1/countries',
    collect: '/v1/collect',
    transaction: '/v1/transaction',
    fees: '/v1/fees',
  },
};

export const COUNTRIES = [
  { code: 'BJ', name: 'Benin', currency: 'XOF', operators: ['Moov Money', 'MTN Mobile Money'] },
  { code: 'BF', name: 'Burkina Faso', currency: 'XOF', operators: ['Moov Money', 'Orange Money'] },
  { code: 'CM', name: 'Cameroon', currency: 'XAF', operators: ['MTN Mobile Money', 'Orange Money'] },
  { code: 'CF', name: 'Central African Republic', currency: 'XAF', operators: ['Orange Money'] },
  { code: 'CG', name: 'Congo', currency: 'XAF', operators: ['Airtel Money', 'MTN Mobile Money'] },
  { code: 'CI', name: "Cote d'Ivoire", currency: 'XOF', operators: ['Moov Money', 'MTN', 'Orange Money', 'Wave'] },
  { code: 'GA', name: 'Gabon', currency: 'XAF', operators: ['Airtel Money', 'Moov Money'] },
  { code: 'GN', name: 'Guinea Conakry', currency: 'GNF', operators: ['MTN Mobile Money', 'Orange Money'] },
  { code: 'GQ', name: 'Equatorial Guinea', currency: 'XAF', operators: ['Orange Money'] },
  { code: 'GW', name: 'Guinea-Bissau', currency: 'XOF', operators: ['Orange Money'] },
  { code: 'ML', name: 'Mali', currency: 'XOF', operators: ['Moov Money', 'Orange Money'] },
  { code: 'NE', name: 'Niger', currency: 'XOF', operators: ['Airtel Money'] },
  { code: 'CD', name: 'DR Congo', currency: 'CDF', operators: ['Afrimoney', 'Airtel', 'Orange Money', 'Vodacom M-Pesa'] },
  { code: 'SN', name: 'Senegal', currency: 'XOF', operators: ['Free Money', 'Orange Money', 'Wave'] },
  { code: 'TD', name: 'Chad', currency: 'XAF', operators: ['Airtel Money', 'Moov Money'] },
  { code: 'TG', name: 'Togo', currency: 'XOF', operators: ['Flooz', 'T-Money'] },
];

export const PRODUCT_TYPES = [
  { id: 'ebook', name: 'E-Book', icon: 'book', description: 'Digital books and PDFs', fields: ['title', 'author', 'isbn', 'pages', 'file_url', 'cover_image', 'preview_url', 'format'] },
  { id: 'account_proxy', name: 'Account (Proxy)', icon: 'server', description: 'Proxy accounts with protocol, server, port', fields: ['protocol', 'server', 'port', 'username_optional', 'password_optional', 'expiry', 'bandwidth'] },
  { id: 'account_auth', name: 'Account (Authenticated)', icon: 'key', description: 'Authenticated accounts with credentials', fields: ['account_name', 'username', 'password', 'server', 'expiry', 'extra_fields'] },
  { id: 'account_other', name: 'Account (Other)', icon: 'user', description: 'Custom accounts with flexible slots', fields: ['account_name', 'description', 'custom_slots', 'image_url'] },
  { id: 'video_course', name: 'Video Course', icon: 'video', description: 'Chapters and modules with video content', fields: ['title', 'description', 'chapters', 'modules', 'total_duration', 'preview_video', 'thumbnail'] },
  { id: 'single_link', name: 'Single Link', icon: 'link', description: 'Single access link to content', fields: ['url', 'description', 'expiry'] },
  { id: 'software', name: 'Software/App', icon: 'download', description: 'Software or app downloads', fields: ['name', 'version', 'platform', 'file_url', 'license_type', 'system_requirements'] },
  { id: 'template', name: 'Template/Theme', icon: 'layout', description: 'Design templates and themes', fields: ['name', 'type', 'file_url', 'preview_url', 'compatible_with'] },
  { id: 'music', name: 'Music/Audio', icon: 'music', description: 'Audio files and music', fields: ['title', 'artist', 'album', 'duration', 'file_url', 'format', 'preview_url'] },
  { id: 'graphic', name: 'Graphic Design', icon: 'image', description: 'Graphics, logos, illustrations', fields: ['title', 'type', 'file_url', 'preview_url', 'dimensions', 'format'] },
  { id: 'license_key', name: 'License Key', icon: 'shield', description: 'Software license keys', fields: ['product_name', 'license_type', 'keys_list', 'instructions'] },
  { id: 'subscription', name: 'Subscription Access', icon: 'repeat', description: 'Time-limited access credentials', fields: ['service_name', 'duration', 'credentials', 'instructions', 'renewal_info'] },
  { id: 'document', name: 'Document/Notes', icon: 'file-text', description: 'Study notes, documents', fields: ['title', 'subject', 'file_url', 'pages', 'preview_url'] },
  { id: 'bundle', name: 'Product Bundle', icon: 'package', description: 'Multiple products in one package', fields: ['bundle_name', 'description', 'included_products', 'savings'] },
  { id: 'service', name: 'Digital Service', icon: 'tool', description: 'Freelance or digital services', fields: ['service_name', 'description', 'delivery_time', 'revisions', 'requirements'] },
];

export const NOTIFICATION_TYPES = {
  ORDER_RECEIVED: 'order_received',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  BROADCAST: 'broadcast',
  NEW_MESSAGE: 'new_message',
  SYSTEM: 'system',
  PRICE_DROP: 'price_drop',
  PROMO: 'promo',
  NEW_FOLLOWER: 'new_follower',
  REVIEW: 'review',
  PAYOUT: 'payout',
};

// Chariow-like marketplace features
export const MARKETPLACE_CATEGORIES = [
  { id: 'ebooks', name: 'E-Books', icon: 'book' },
  { id: 'courses', name: 'Courses', icon: 'video' },
  { id: 'software', name: 'Software', icon: 'download' },
  { id: 'accounts', name: 'Accounts', icon: 'key' },
  { id: 'templates', name: 'Templates', icon: 'layout' },
  { id: 'graphics', name: 'Graphics', icon: 'image' },
  { id: 'music', name: 'Music', icon: 'music' },
  { id: 'services', name: 'Services', icon: 'tool' },
  { id: 'bundles', name: 'Bundles', icon: 'package' },
  { id: 'licenses', name: 'Licenses', icon: 'shield' },
];
