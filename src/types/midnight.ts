import type { InitialAPI } from '@midnight-ntwrk/dapp-connector-api';

declare global {
  interface Window {
    midnight?: Record<string, InitialAPI>;
  }
}

export type { InitialAPI };
