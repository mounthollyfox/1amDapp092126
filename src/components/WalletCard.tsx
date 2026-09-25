import { Fingerprint, Loader2, Unlink, Wallet } from 'lucide-react';
import { atlasCallsign, maskAddress } from '../lib/atlas';
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
  const seed = wallet.unshieldedAddress || wallet.networkId || 'night-atlas';

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Wallet uplink</h2>
        {wallet.connected ? (
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
            {wallet.networkId}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-slate-700/30 px-3 py-1 text-xs text-slate-400">
            standby
          </span>
        )}
      </div>

      <div className="mt-5 space-y-4">
        {wallet.connected ? (
          <>
            <div className="rounded-2xl border border-indigo-900/70 bg-indigo-950/30 p-4">
              <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-indigo-300">
                <Fingerprint className="h-3.5 w-3.5" /> Atlas identity
              </p>
              <p className="mt-2 font-mono text-lg font-semibold text-white">
                {atlasCallsign(seed)}
              </p>
              <p className="mt-1 break-all font-mono text-xs text-slate-400">
                {maskAddress(wallet.unshieldedAddress)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-slate-950/80 p-4">
                <p className="text-xs text-slate-500">Unshielded NIGHT</p>
                <p className="mt-1 text-xl font-semibold text-white">
                  {formatNight(balance)} N
                </p>
              </div>
              <div className="rounded-2xl bg-slate-950/80 p-4">
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
          <p className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/50 p-4 text-sm leading-6 text-slate-400">
            Connect a 1AM wallet to derive a local constellation from your
            address, balances, and broadcast signals.
          </p>
        )}
      </div>

      <button
        onClick={wallet.connected ? onDisconnect : onConnect}
        disabled={loading}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : wallet.connected ? (
          <>
            <Unlink className="h-4 w-4" /> Close uplink
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
