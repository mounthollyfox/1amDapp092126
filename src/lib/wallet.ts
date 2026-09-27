import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import { nativeToken, shieldedToken } from '@midnight-ntwrk/ledger-v8';

export type TransferKind = 'unshielded' | 'shielded';

export interface WalletState {
  connected: boolean;
  api: ConnectedAPI | null;
  unshieldedAddress: string;
  shieldedAddress: string;
  networkId: string;
  unshieldedBalances: Record<string, bigint>;
  shieldedBalances: Record<string, bigint>;
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
    shieldedBalances,
    shieldedAddress,
    dust,
    connectionStatus,
  ] = await Promise.all([
    api.getConfiguration(),
    api.getUnshieldedAddress(),
    api.getUnshieldedBalances(),
    api.getShieldedBalances().catch(() => ({})),
    api
      .getShieldedAddresses()
      .then((addresses) => addresses.shieldedAddress)
      .catch(() => ''),
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
    shieldedAddress,
    networkId: config.networkId,
    unshieldedBalances,
    shieldedBalances,
    dust,
  };
};

export const loadBalances = async (
  api: ConnectedAPI,
): Promise<
  Pick<WalletState, 'unshieldedBalances' | 'shieldedBalances' | 'dust'>
> => {
  const [unshieldedBalances, shieldedBalances, dust] = await Promise.all([
    api.getUnshieldedBalances(),
    api.getShieldedBalances().catch(() => ({})),
    api.getDustBalance().catch(() => null),
  ]);
  return { unshieldedBalances, shieldedBalances, dust };
};

export const sendTransfer = async (
  api: ConnectedAPI,
  recipient: string,
  amountNight: number,
  kind: TransferKind,
): Promise<string> => {
  const value = BigInt(Math.round(amountNight * 1_000_000));
  const type = kind === 'shielded' ? shieldedToken().raw : nativeToken().raw;

  const { tx } = await api.makeTransfer([
    {
      kind,
      type,
      value,
      recipient,
    },
  ]);

  await api.submitTransaction(tx);
  return tx.slice(0, 64);
};

export const sendUnshieldedTransfer = async (
  api: ConnectedAPI,
  recipient: string,
  amountNight: number,
): Promise<string> => sendTransfer(api, recipient, amountNight, 'unshielded');

export const formatNight = (raw: bigint | undefined): string => {
  if (raw === undefined) return '0.000000';
  return (Number(raw) / 1_000_000).toFixed(6);
};

export const nativeNightBalance = (
  balances: Record<string, bigint>,
): bigint => {
  return balances[NATIVE_TOKEN_ID] ?? 0n;
};

export const shieldedNightBalance = (
  balances: Record<string, bigint>,
): bigint => {
  return balances[shieldedToken().raw] ?? 0n;
};
