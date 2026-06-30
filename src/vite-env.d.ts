/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SUPABASE_SERVICE_ROLE: string;
  readonly VITE_VAPID_KEY: string;
  readonly VITE_ASHTECHPAY_API_KEY: string;
  readonly VITE_ASHTECHPAY_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
