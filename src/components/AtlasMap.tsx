import { useMemo } from 'react';
import { Fingerprint, Moon, Radio } from 'lucide-react';
import { buildAtlas } from '../lib/atlas';
import {
  formatNight,
  nativeNightBalance,
  type WalletState,
} from '../lib/wallet';

interface AtlasMapProps {
  signals: string[];
  wallet: WalletState;
}

const starColor = (kind: 'anchor' | 'signal' | 'token'): string => {
  if (kind === 'signal') return '#f0abfc';
  if (kind === 'token') return '#67e8f9';
  return '#c7d2fe';
};

export const AtlasMap = ({ signals, wallet }: AtlasMapProps) => {
  const atlas = useMemo(() => buildAtlas(wallet, signals), [wallet, signals]);
  const night = nativeNightBalance(wallet.unshieldedBalances);
  const dustPercent =
    wallet.dust && wallet.dust.cap > 0n
      ? Number((wallet.dust.balance * 10_000n) / wallet.dust.cap) / 100
      : 0;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-indigo-950/80 bg-slate-950/80 p-5 shadow-2xl shadow-indigo-950/30">
      <div className="absolute -left-20 -top-24 h-64 w-64 rounded-full bg-indigo-600/10 blur-3xl" />
      <div className="absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-fuchsia-600/10 blur-3xl" />

      <header className="relative flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.3em] text-indigo-300">
            <Moon className="h-3.5 w-3.5" /> Night Atlas
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Your Midnight constellation
          </h2>
        </div>
        <span className="rounded-full border border-indigo-800/70 bg-indigo-950/50 px-3 py-1 font-mono text-xs text-indigo-200">
          {atlas.callsign}
        </span>
      </header>

      <div className="relative mt-5 aspect-[100/72] overflow-hidden rounded-2xl border border-slate-800/80 bg-[radial-gradient(circle_at_top,rgba(79,70,229,0.2),transparent_42%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]">
        <svg
          viewBox="0 0 100 72"
          className="h-full w-full"
          role="img"
          aria-label="Wallet constellation map"
        >
          <defs>
            <filter id="atlas-glow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="1.6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {atlas.backdrop.map((star) => (
            <circle
              key={star.id}
              cx={star.x}
              cy={star.y}
              fill="#e0e7ff"
              opacity={star.opacity}
              r={star.opacity > 0.45 ? 0.24 : 0.14}
            />
          ))}

          {atlas.links.map((link, index) => (
            <line
              key={`${link.from.x}-${link.from.y}-${link.to.x}-${link.to.y}-${index}`}
              x1={link.from.x}
              y1={link.from.y}
              x2={link.to.x}
              y2={link.to.y}
              stroke="#818cf8"
              strokeDasharray={index % 5 === 0 ? '0.7 1.2' : undefined}
              strokeOpacity={link.opacity}
              strokeWidth="0.18"
            />
          ))}

          {atlas.stars.map((star) => (
            <g key={star.id}>
              {star.kind === 'anchor' && (
                <circle
                  cx={star.x}
                  cy={star.y}
                  fill="none"
                  opacity="0.28"
                  r={star.radius + 2.8}
                  stroke="#818cf8"
                  strokeWidth="0.18"
                />
              )}
              {star.kind === 'signal' && (
                <circle
                  cx={star.x}
                  cy={star.y}
                  fill="none"
                  opacity="0.5"
                  r={star.radius + 2.4}
                  stroke="#f0abfc"
                  strokeWidth="0.18"
                >
                  <animate
                    attributeName="r"
                    dur="2.4s"
                    repeatCount="indefinite"
                    values={`${star.radius + 1};${star.radius + 4};${star.radius + 1}`}
                  />
                  <animate
                    attributeName="opacity"
                    dur="2.4s"
                    repeatCount="indefinite"
                    values="0.55;0.05;0.55"
                  />
                </circle>
              )}
              <circle
                cx={star.x}
                cy={star.y}
                fill={starColor(star.kind)}
                filter="url(#atlas-glow)"
                opacity={star.opacity}
                r={star.radius}
              />
              <text
                x={star.x + star.radius + 1}
                y={star.y - star.radius - 0.8}
                fill="#94a3b8"
                fontSize="2"
                opacity="0.72"
              >
                {star.label}
              </text>
            </g>
          ))}
        </svg>

        {!wallet.connected && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/35 p-6 text-center backdrop-blur-[1px]">
            <div>
              <Fingerprint className="mx-auto h-8 w-8 text-indigo-300" />
              <p className="mt-3 text-sm font-medium text-white">
                Connect 1AM to reveal your atlas
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Your wallet data stays in the browser and shapes the map locally.
              </p>
            </div>
          </div>
        )}
      </div>

      <footer className="relative mt-5 grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
          <p className="text-xs text-slate-500">NIGHT</p>
          <p className="mt-1 font-semibold text-white">{formatNight(night)}</p>
        </div>
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
          <p className="text-xs text-slate-500">DUST</p>
          <p className="mt-1 font-semibold text-white">
            {dustPercent.toFixed(1)}%
          </p>
        </div>
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
          <p className="flex items-center gap-1 text-xs text-slate-500">
            <Radio className="h-3 w-3" /> Signals
          </p>
          <p className="mt-1 font-semibold text-white">{signals.length}</p>
        </div>
      </footer>
    </section>
  );
};
