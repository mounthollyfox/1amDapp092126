/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_1AM_NETWORK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
