import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import { nativeToken } from '@midnight-ntwrk/ledger-v8';

export interface WalletState {
  connected: boolean;
  api: ConnectedAPI | null;
  unshieldedAddress: string;
  networkId: string;
  unshieldedBalances: Record<string, bigint>;
  dust: { cap: bigint; balance: bigint } | null;
}

const NATIVE_TOKEN_ID =
  '0000000000000000000000000000000000000000000000000000000000000000';

const find1amWallet = (): InitialAPI | undefined => {
  const injected = window.midnight;
  if (!injected) return undefined;
  return injected['1am'] ?? Object.values(injected)[0];
};

export const select1amWallet = (): InitialAPI => {
  const wallet = find1amWallet();
  if (!wallet) {
    throw new Error(
      'No Midnight wallet detected. Install the 1AM extension from https://1am.xyz.',
    );
  }
  return wallet;
};

export const connectWallet = async (
  network = 'preprod',
): Promise<WalletState> => {
  const wallet = select1amWallet();
  const api = await wallet.connect(network);

  const [
    config,
    { unshieldedAddress },
    unshieldedBalances,
    dust,
    connectionStatus,
  ] = await Promise.all([
    api.getConfiguration(),
    api.getUnshieldedAddress(),
    api.getUnshieldedBalances(),
    api.getDustBalance().catch(() => null),
    api.getConnectionStatus(),
  ]);

  if (connectionStatus.status !== 'connected') {
    throw new Error(
      `Wallet not connected. Current status: ${connectionStatus.status}`,
    );
  }

  return {
    connected: true,
    api,
    unshieldedAddress,
    networkId: config.networkId,
    unshieldedBalances,
    dust,
  };
};

export const loadBalances = async (
  api: ConnectedAPI,
): Promise<Pick<WalletState, 'unshieldedBalances' | 'dust'>> => {
  const [unshieldedBalances, dust] = await Promise.all([
    api.getUnshieldedBalances(),
    api.getDustBalance().catch(() => null),
  ]);
  return { unshieldedBalances, dust };
};

export const sendUnshieldedTransfer = async (
  api: ConnectedAPI,
  recipient: string,
  amountNight: number,
): Promise<string> => {
  const value = BigInt(Math.round(amountNight * 1_000_000));

  const { tx } = await api.makeTransfer([
    {
      kind: 'unshielded',
      type: nativeToken().raw,
      value,
      recipient,
    },
  ]);

  await api.submitTransaction(tx);
  return tx.slice(0, 64);
};

export const formatNight = (raw: bigint | undefined): string => {
  if (raw === undefined) return '0.000000';
  return (Number(raw) / 1_000_000).toFixed(6);
};

export const nativeNightBalance = (
  balances: Record<string, bigint>,
): bigint => {
  return balances[NATIVE_TOKEN_ID] ?? 0n;
};
