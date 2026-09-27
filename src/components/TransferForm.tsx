import { useState } from 'react';
import { Eye, EyeOff, Loader2, Send } from 'lucide-react';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { sendTransfer, type TransferKind } from '../lib/wallet';

interface TransferFormProps {
  api: ConnectedAPI | null;
  unshieldedAddress: string;
  shieldedAddress: string;
  onSuccess: (txId: string, kind: TransferKind) => void;
  onError: (message: string) => void;
  onRefresh: () => Promise<void>;
}

export const TransferForm = ({
  api,
  unshieldedAddress,
  shieldedAddress,
  onSuccess,
  onError,
  onRefresh,
}: TransferFormProps) => {
  const [mode, setMode] = useState<TransferKind>('unshielded');
  const [recipient, setRecipient] = useState(unshieldedAddress);
  const [amount, setAmount] = useState('1');
  const [submitting, setSubmitting] = useState(false);

  const shielded = mode === 'shielded';
  const defaultAddress = shielded ? shieldedAddress : unshieldedAddress;
  const recipientTrimmed = recipient.trim();
  const expectedPrefix = shielded ? 'mn_shield-addr' : 'mn_addr';
  const recipientMismatch =
    recipientTrimmed.length > 0 && !recipientTrimmed.startsWith(expectedPrefix);

  const selectMode = (nextMode: TransferKind) => {
    setMode(nextMode);
    setRecipient(
      nextMode === 'shielded' ? shieldedAddress : unshieldedAddress,
    );
  };

  const handleRecipientChange = (value: string) => {
    setRecipient(value);
    const normalized = value.trim();
    if (normalized.startsWith('mn_shield-addr')) {
      setMode('shielded');
    } else if (normalized.startsWith('mn_addr')) {
      setMode('unshielded');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!api) {
      onError('Wallet not connected');
      return;
    }
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      onError('Enter a positive amount');
      return;
    }
    if (!recipientTrimmed) {
      onError(
        shielded
          ? 'Enter a shielded recipient address'
          : 'Enter a public recipient address',
      );
      return;
    }
    if (recipientMismatch) {
      onError(
        shielded
          ? 'That looks like a public address. Paste a mn_shield-addr recipient.'
          : 'That looks like a shielded address. Paste an mn_addr recipient.',
      );
      return;
    }

    setSubmitting(true);
    try {
      const txId = await sendTransfer(api, recipientTrimmed, value, mode);
      onSuccess(txId, mode);
      await onRefresh();
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Broadcast a signal</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            {shielded
              ? 'Send privately with a shielded Midnight address.'
              : 'Send a visible NIGHT transfer through 1AM.'}
          </p>
        </div>
        {shielded ? (
          <EyeOff className="h-5 w-5 text-teal-300" />
        ) : (
          <Eye className="h-5 w-5 text-fuchsia-300" />
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 rounded-2xl border border-slate-800 bg-slate-950/70 p-1">
        <button
          type="button"
          aria-pressed={!shielded}
          onClick={() => selectMode('unshielded')}
          className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
            shielded
              ? 'text-slate-400 hover:text-slate-200'
              : 'bg-fuchsia-500/15 text-fuchsia-200'
          }`}
        >
          Public
        </button>
        <button
          type="button"
          aria-pressed={shielded}
          onClick={() => selectMode('shielded')}
          className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
            shielded
              ? 'bg-teal-500/15 text-teal-200'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Private
        </button>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">
            {shielded ? 'Shielded receiver' : 'Public receiver'}
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => handleRecipientChange(e.target.value)}
            placeholder={shielded ? 'mn_shield-addr...' : 'mn_addr...'}
            className={`w-full rounded-2xl border bg-slate-950 px-4 py-3 font-mono text-sm text-white placeholder-slate-600 outline-none ${
              recipientMismatch
                ? 'border-rose-700 focus:border-rose-500'
                : 'border-slate-700 focus:border-indigo-500'
            }`}
          />
          {recipientMismatch && (
            <p className="mt-2 text-xs text-rose-300">
              {shielded
                ? 'This looks public. Use a mn_shield-addr address for private mode.'
                : 'This looks shielded. Use an mn_addr address for public mode.'}
            </p>
          )}
          {defaultAddress && (
            <button
              type="button"
              onClick={() => setRecipient(defaultAddress)}
              className="mt-2 text-xs text-indigo-300 hover:text-indigo-200"
            >
              Use my {shielded ? 'shielded' : 'public'} beacon
            </button>
          )}
          {shielded && !shieldedAddress && (
            <p className="mt-2 text-xs text-slate-500">
              1AM did not expose a shielded address; paste one manually.
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">
            Signal weight (NIGHT)
          </label>
          <input
            type="number"
            min="0.000001"
            step="0.000001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!api || submitting}
        className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
          shielded
            ? 'bg-teal-600 hover:bg-teal-500'
            : 'bg-fuchsia-600 hover:bg-fuchsia-500'
        }`}
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Send className="h-4 w-4" />
            Broadcast {shielded ? 'private' : 'public'} signal
          </>
        )}
      </button>
    </form>
  );
};
