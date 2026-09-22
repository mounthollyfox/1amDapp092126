import { useCallback, useState } from 'react';
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
    setStatus(null);
  }, []);

  const handleRefresh = useCallback(async () => {
    if (!wallet.api) return;
    const { unshieldedBalances, dust } = await loadBalances(wallet.api);
    setWallet((w) => ({ ...w, unshieldedBalances, dust }));
  }, [wallet.api]);

  return (
    <div className="min-h-screen p-6 md:p-12">
      <div className="mx-auto max-w-xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">1AM dApp</h1>
          <p className="mt-2 text-slate-400">A minimal Midnight wallet dApp</p>
        </header>

        <WalletCard
          wallet={wallet}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          loading={loading}
        />

        {wallet.connected && (
          <div className="mt-6">
            <TransferForm
              api={wallet.api}
              defaultAddress={wallet.unshieldedAddress}
              onSuccess={(txId) =>
                setStatus({
                  type: 'success',
                  message: `Transaction submitted. Reference: ${txId}`,
                })
              }
              onError={(message) => setStatus({ type: 'error', message })}
              onRefresh={handleRefresh}
            />
          </div>
        )}

        {status && (
          <div
            className={`mt-6 rounded-xl border p-4 text-sm ${
              status.type === 'success'
                ? 'border-emerald-800 bg-emerald-900/20 text-emerald-300'
                : 'border-rose-800 bg-rose-900/20 text-rose-300'
            }`}
          >
            {status.message}
          </div>
        )}

        <footer className="mt-12 text-center text-xs text-slate-600">
          Built with the 1AM stack
        </footer>
      </div>
    </div>
  );
}
