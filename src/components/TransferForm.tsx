import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { sendUnshieldedTransfer } from '../lib/wallet';

interface TransferFormProps {
  api: ConnectedAPI | null;
  defaultAddress: string;
  onSuccess: (txId: string) => void;
  onError: (message: string) => void;
  onRefresh: () => Promise<void>;
}

export const TransferForm = ({
  api,
  defaultAddress,
  onSuccess,
  onError,
  onRefresh,
}: TransferFormProps) => {
  const [recipient, setRecipient] = useState(defaultAddress);
  const [amount, setAmount] = useState('1');
  const [submitting, setSubmitting] = useState(false);

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
    if (!recipient.trim()) {
      onError('Enter a recipient address');
      return;
    }

    setSubmitting(true);
    try {
      const txId = await sendUnshieldedTransfer(api, recipient.trim(), value);
      onSuccess(txId);
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
      className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl"
    >
      <h2 className="text-lg font-semibold text-white">Transfer NIGHT</h2>
      <p className="text-sm text-slate-400">
        Send an unshielded NIGHT transfer through 1AM. The wallet handles fees.
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">
            Recipient
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="mn_addr1..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500"
          />
          {defaultAddress && (
            <button
              type="button"
              onClick={() => setRecipient(defaultAddress)}
              className="mt-2 text-xs text-indigo-400 hover:text-indigo-300"
            >
              Use my address (self-transfer)
            </button>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">
            Amount (NIGHT)
          </label>
          <input
            type="number"
            min="0.000001"
            step="0.000001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!api || submitting}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Send className="h-4 w-4" /> Send
          </>
        )}
      </button>
    </form>
  );
};
