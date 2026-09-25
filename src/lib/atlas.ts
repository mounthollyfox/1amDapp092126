import { nativeNightBalance, type WalletState } from './wallet';

export interface AtlasPoint {
  x: number;
  y: number;
}

export interface AtlasStar extends AtlasPoint {
  id: string;
  kind: 'anchor' | 'token' | 'signal';
  label: string;
  opacity: number;
  radius: number;
}

export interface AtlasBackdrop extends AtlasPoint {
  id: string;
  opacity: number;
}

export interface AtlasLink {
  from: AtlasPoint;
  to: AtlasPoint;
  opacity: number;
}

export interface AtlasModel {
  backdrop: AtlasBackdrop[];
  callsign: string;
  links: AtlasLink[];
  stars: AtlasStar[];
}

const CALLSIGNS = [
  'Umbra',
  'Nocturne',
  'Lyra',
  'Vela',
  'Corvus',
  'Monoceros',
  'Auriga',
  'Hydra',
];

const hashSeed = (value: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  }
  return hash >>> 0;
};

const createRandom = (seed: number) => {
  let state = seed;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const round = (value: number): number => Number(value.toFixed(2));

export const atlasCallsign = (source: string): string => {
  const hash = hashSeed(source || 'night-atlas');
  return `${CALLSIGNS[hash % CALLSIGNS.length]}-${hash
    .toString(16)
    .padStart(8, '0')
    .slice(0, 4)
    .toUpperCase()}`;
};

export const maskAddress = (address: string): string => {
  if (address.length <= 20) return address;
  return `${address.slice(0, 12)}…${address.slice(-8)}`;
};

export const buildAtlas = (
  wallet: WalletState,
  signals: string[],
): AtlasModel => {
  const seedSource =
    wallet.unshieldedAddress || wallet.networkId || 'night-atlas';
  const seed = hashSeed(seedSource);
  const random = createRandom(seed);
  const backdrop = Array.from({ length: 72 }, (_, index) => ({
    id: `backdrop-${index}`,
    opacity: round(0.12 + random() * 0.55),
    x: round(random() * 100),
    y: round(random() * 72),
  }));

  const tokenIds = Object.keys(wallet.unshieldedBalances);
  const balanceDigits = nativeNightBalance(wallet.unshieldedBalances)
    .toString()
    .length;
  const baseCount = Math.min(18, Math.max(11, 9 + tokenIds.length));
  const baseRadius = 2.6 + Math.min(2.2, balanceDigits / 6);

  const stars: AtlasStar[] = Array.from({ length: baseCount }, (_, index) => {
    const angle = (index / baseCount) * Math.PI * 2 + random() * 0.42;
    const distance = index === 0 ? 0 : 14 + random() * 22;
    const x = clamp(50 + Math.cos(angle) * distance, 8, 92);
    const y = clamp(36 + Math.sin(angle) * distance * 0.62, 8, 64);
    const kind = index === 0 ? 'anchor' : index <= tokenIds.length ? 'token' : 'anchor';

    return {
      id: `star-${index}`,
      kind,
      label: index === 0 ? 'CORE' : `N-${index}`,
      opacity: round(0.55 + random() * 0.45),
      radius: round(index === 0 ? baseRadius : 0.9 + random() * 1.5),
      x: round(x),
      y: round(y),
    };
  });

  const signalStars = signals.slice(0, 6).map((signal, index) => {
    const signalRandom = createRandom(hashSeed(signal));
    return {
      id: `signal-${signal}-${index}`,
      kind: 'signal' as const,
      label: `S-${index + 1}`,
      opacity: 0.95,
      radius: round(1.8 + signalRandom() * 1.4),
      x: round(12 + signalRandom() * 76),
      y: round(9 + signalRandom() * 54),
    };
  });

  const allStars = [...stars, ...signalStars];
  const links = stars.slice(1).map((star, index) => ({
    from: stars[index],
    to: star,
    opacity: round(0.16 + random() * 0.28),
  }));

  signalStars.forEach((star, index) => {
    links.push({
      from: stars[index % stars.length],
      to: star,
      opacity: 0.48,
    });
  });

  return {
    backdrop,
    callsign: atlasCallsign(seedSource),
    links,
    stars: allStars,
  };
};
