import { useCallback, useState } from 'react';
import { AtlasMap } from './components/AtlasMap';
import { WalletCard } from './components/WalletCard';
import { TransferForm } from './components/TransferForm';
import { connectWallet, loadBalances, type WalletState } from './lib/wallet';

const initialWallet: WalletState = {
  connected: false,
  api: null,
  unshieldedAddress: '',
  networkId: '',
  unshieldedBalances: {},
  dust: null,
};

const network =
  (import.meta.env.VITE_1AM_NETWORK as string | undefined) ?? 'preprod';

export default function App() {
  const [wallet, setWallet] = useState<WalletState>(initialWallet);
  const [signals, setSignals] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleConnect = useCallback(async () => {
    setLoading(true);
    setStatus(null);
    try {
      const connected = await connectWallet(network);
      setWallet(connected);
    } catch (err) {
      setStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to connect',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    setWallet(initialWallet);
    setSignals([]);
    setStatus(null);
  }, []);

  const handleRefresh = useCallback(async () => {
    if (!wallet.api) return;
    try {
      const { unshieldedBalances, dust } = await loadBalances(wallet.api);
      setWallet((w) => ({ ...w, unshieldedBalances, dust }));
    } catch (err) {
      setStatus({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Failed to refresh balances',
      });
    }
  }, [wallet.api]);

  return (
    <div className="min-h-screen overflow-hidden px-6 py-8 md:px-10 md:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.35em] text-indigo-300">
              1AM / Midnight
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-white md:text-5xl">
              Night Atlas
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
              A Midnight observatory that turns your 1AM wallet into a living
              constellation. Balances shape the map; transfers leave signals.
            </p>
          </div>
          <div className="rounded-full border border-indigo-900/80 bg-indigo-950/40 px-4 py-2 text-xs font-medium text-indigo-200">
            {wallet.connected ? wallet.networkId : 'awaiting uplink'}
          </div>
        </header>

        <main className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <AtlasMap signals={signals} wallet={wallet} />
          </div>

          <div className="space-y-6 lg:col-span-5">
            <WalletCard
              wallet={wallet}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              loading={loading}
            />

            {wallet.connected && (
              <TransferForm
                api={wallet.api}
                defaultAddress={wallet.unshieldedAddress}
                onSuccess={(txId) => {
                  setSignals((current) => [txId, ...current].slice(0, 6));
                  setStatus({
                    type: 'success',
                    message: `Signal broadcast. Reference: ${txId}`,
                  });
                }}
                onError={(message) => setStatus({ type: 'error', message })}
                onRefresh={handleRefresh}
              />
            )}

            {status && (
              <div
                className={`rounded-2xl border p-4 text-sm ${
                  status.type === 'success'
                    ? 'border-emerald-800 bg-emerald-950/40 text-emerald-300'
                    : 'border-rose-800 bg-rose-950/40 text-rose-300'
                }`}
              >
                {status.message}
              </div>
            )}
          </div>
        </main>

        <footer className="mt-10 text-center text-xs text-slate-600">
          Night Atlas — built with the 1AM stack
        </footer>
      </div>
    </div>
  );
}
