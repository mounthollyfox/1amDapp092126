import { Wallet, Loader2, Unlink } from 'lucide-react';
import { formatNight, nativeNightBalance, type WalletState } from '../lib/wallet';

interface WalletCardProps {
  wallet: WalletState;
  onConnect: () => void;
  onDisconnect: () => void;
  loading?: boolean;
}

export const WalletCard = ({
  wallet,
  onConnect,
  onDisconnect,
  loading = false,
}: WalletCardProps) => {
  const balance = nativeNightBalance(wallet.unshieldedBalances);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Wallet</h2>
        {wallet.connected ? (
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            {wallet.networkId}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-slate-700/30 px-3 py-1 text-xs text-slate-400">
            disconnected
          </span>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {wallet.connected ? (
          <>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Unshielded Address
              </p>
              <p className="mt-1 break-all font-mono text-sm text-slate-200">
                {wallet.unshieldedAddress}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-slate-950 p-3">
                <p className="text-xs text-slate-500">Unshielded NIGHT</p>
                <p className="mt-1 text-xl font-semibold text-white">
                  {formatNight(balance)} N
                </p>
              </div>
              <div className="rounded-xl bg-slate-950 p-3">
                <p className="text-xs text-slate-500">DUST</p>
                <p className="mt-1 text-xl font-semibold text-white">
                  {wallet.dust
                    ? (Number(wallet.dust.balance) / 1e15).toFixed(4)
                    : '0.0000'}
                </p>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-400">
            Connect a 1AM wallet to see your balances.
          </p>
        )}
      </div>

      <button
        onClick={wallet.connected ? onDisconnect : onConnect}
        disabled={loading}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : wallet.connected ? (
          <>
            <Unlink className="h-4 w-4" /> Disconnect
          </>
        ) : (
          <>
            <Wallet className="h-4 w-4" /> Connect 1AM Wallet
          </>
        )}
      </button>
    </div>
  );
};
