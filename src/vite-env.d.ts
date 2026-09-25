/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_1AM_NETWORK?: string;
  readonly VITE_MIDNIGHT_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
