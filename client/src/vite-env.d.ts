/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_FORCE_DEMO_DATA?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_STRIPE_PUBLIC_KEY?: string;
  readonly NODE_ENV?: string;
  readonly MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 