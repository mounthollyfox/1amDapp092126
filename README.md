# Night Atlas

A Midnight observatory built on the **1AM wallet stack**. Night Atlas turns a connected wallet into a deterministic constellation: the address seeds the map, balances shape the central star, and each submitted NIGHT transfer becomes a temporary signal.

> Original assignment: **Build a dApp using the 1AM stack. The project should be structured so that another developer can read, run, or extend it.**

This repository is intentionally structured as a builder handoff. It demonstrates a complete wallet flow and a distinctive visual concept that can be extended with indexer data, Compact contracts, or richer identity mechanics.

## Concept

Night Atlas treats wallet activity as a personal sky map:

- The unshielded address becomes a stable constellation seed.
- The native NIGHT balance influences the central anchor star.
- Additional token entries add mapped stars.
- DUST is reported as an observability/fuel metric.
- Transfers are branded as **signals** and appear as pulsing stars for the current session.
- The address is visually shortened in the UI; the full value remains available only inside the local wallet state.

The current constellation is illustrative. It is deterministic and wallet-derived, but it is not a cryptographic proof, anonymity system, or canonical on-chain identity.

## Current status

- [x] Detects an injected Midnight wallet through `window.midnight`
- [x] Connects to the 1AM wallet on a configurable network
- [x] Displays a deterministic atlas identity and masked unshielded address
- [x] Displays unshielded NIGHT and DUST balance information
- [x] Generates an SVG constellation from local wallet state
- [x] Builds and submits an unshielded NIGHT transfer as a signal
- [x] Adds submitted transaction references to the current atlas session
- [x] Includes the Vite/WASM configuration required by Midnight ledger packages
- [ ] Does not currently load historical transactions from the indexer
- [ ] Does not currently call a Compact contract
- [ ] Does not currently persist signals after reload
- [ ] Does not currently include automated tests

## Stack

- React 18 + Vite + TypeScript
- Tailwind CSS
- [`@midnight-ntwrk/dapp-connector-api`](https://www.npmjs.com/package/@midnight-ntwrk/dapp-connector-api)
- [`@midnight-ntwrk/ledger-v8`](https://www.npmjs.com/package/@midnight-ntwrk/ledger-v8)
- `vite-plugin-wasm` and `vite-plugin-top-level-await` for Midnight WASM compatibility
- `lucide-react` for UI icons

## Prerequisites

- Node.js 20+
- npm
- A Chromium-based browser
- The [1AM browser wallet extension](https://1am.xyz/)
- A wallet configured for `preprod` or another supported Midnight network
- Test NIGHT funds if you want to submit a signal

The wallet connection is browser-only. Server-side rendering, automated tests, or a headless terminal cannot provide `window.midnight`.

## Quick start

```bash
git clone https://github.com/mounthollyfox/1amDapp092126.git
cd 1amDapp092126
npm ci
cp .env.example .env
npm run dev
```

Open `http://localhost:5173` in the browser where the 1AM extension is installed, then select **Connect 1AM Wallet**.

## Environment variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `VITE_1AM_NETWORK` | No | `preprod` | Network name passed to `wallet.connect(network)` |
| `VITE_MIDNIGHT_API_KEY` | No | empty | Reserved for a future indexer or hosted Midnight data provider; currently unused |

Only `VITE_*` variables are exposed to browser code. Do not put private keys, seed phrases, or other wallet secrets in `.env`. The `.env` file is ignored by Git.

## NPM scripts

```bash
npm run dev      # Start the Vite development server on port 5173
npm run build    # Type-check and produce a static production build in dist/
npm run preview  # Serve the production build locally
npm run lint     # Run TypeScript's no-emit check
```

## Project structure

```text
src/
  main.tsx                    React entry point
  App.tsx                     Application state and page composition
  index.css                   Global Midnight/Night Atlas styling
  lib/
    wallet.ts                 1AM connector and transaction helpers
    atlas.ts                  Deterministic constellation model
  components/
    AtlasMap.tsx              SVG atlas, balance metrics, and signal display
    WalletCard.tsx            Wallet uplink, identity, and balance UI
    TransferForm.tsx          NIGHT signal broadcast form
vite.config.ts               React, WASM, and Midnight dependency configuration
.env.example                 Browser-visible environment template
```

## Architecture

```text
React components
      |                    \
      v                     v
src/lib/wallet.ts      src/lib/atlas.ts
      |                     |
      v                     v
window.midnight         local UI model
      |
      v
1AM browser extension
      |
      v
Midnight network
```

The React layer owns UI state only. Wallet detection, connection, balance loading, transaction construction, and transaction submission are isolated in `src/lib/wallet.ts`. The visual model is isolated in `src/lib/atlas.ts`, so the atlas can be tested or replaced without changing wallet code.

## How the atlas is generated

`buildAtlas()` in `src/lib/atlas.ts`:

1. Uses the unshielded address, or a standby seed when disconnected, as deterministic input.
2. Converts that input into a 32-bit FNV-style hash.
3. Uses a seeded `mulberry32`-style generator for reproducible coordinates.
4. Creates a backdrop field, wallet-derived stars, and optional signal stars.
5. Connects stars into a constellation with lightweight SVG lines.
6. Returns a callsign such as `VELA-9F3A` derived from the same seed.

The NIGHT balance increases the central star radius. The number of token entries increases the constellation density. Successful transfers append references to the `signals` array and appear as pulsing signal nodes.

## Wallet connection flow

`connectWallet()` in `src/lib/wallet.ts`:

1. Reads the injected `window.midnight` object.
2. Prefers `window.midnight['1am']`, falling back to the first injected wallet provider.
3. Calls `wallet.connect(network)`.
4. Loads wallet configuration, unshielded address, unshielded balances, DUST balance, and connection status in parallel.
5. Returns a `WalletState` plus the connected API object used for future wallet calls.

## Signal transfer flow

`sendUnshieldedTransfer()`:

1. Converts a decimal NIGHT amount into base units using `1 NIGHT = 1_000_000` units.
2. Calls `api.makeTransfer()` with an unshielded native-token output.
3. Calls `api.submitTransaction(tx)` so the wallet can sign and submit it.
4. Returns the first 64 characters of the serialized transaction as a UI reference.
5. `App.tsx` prepends that reference to the session-local `signals` array.

The displayed transaction reference is not guaranteed to be a canonical explorer transaction hash. Treat it as a demo reference unless the wallet API is checked for a dedicated transaction-id field.

## Important Vite/WASM configuration

Midnight ledger packages use ESM `.wasm` imports and top-level await patterns that Vite does not handle correctly by default. `vite.config.ts` therefore includes:

- `vite-plugin-wasm`
- `vite-plugin-top-level-await`
- `build.target: 'esnext'`
- `resolve.dedupe` for Midnight ledger/runtime packages
- `optimizeDeps.exclude` for the same packages
- npm `overrides` pinning `@swc/core` and `@swc/wasm` to `1.15.47` for `vite-plugin-top-level-await` compatibility

Keep these settings when upgrading Vite or Midnight dependencies. Removing them can bring back browser errors around WASM initialization, while newer SWC `1.16.x` releases can make the production build fail with `missing field 'type'`.

## Manual verification checklist

Use this checklist after changing wallet, atlas, or transaction code:

1. Run `npm run lint`.
2. Run `npm run build`.
3. Run `npm run dev`.
4. Open `http://localhost:5173` in a Chromium browser with 1AM installed.
5. Confirm the disconnected atlas renders with a standby callsign and overlay.
6. Connect the wallet and confirm the callsign, masked address, network, and balances appear.
7. Submit a small self-signal on a test network.
8. Confirm a pulsing signal star appears and balances refresh.
9. Disconnect and confirm the atlas returns to standby and signals clear.
10. Open the browser console and confirm there are no WASM or top-level-await errors.

## Extension guide

### Add real transaction history

Use `@midnight-ntwrk/midnight-js-indexer-public-data-provider` to replace the session-local `signals` array with indexed transactions for the connected address. The reserved `VITE_MIDNIGHT_API_KEY` variable can hold a provider credential if the selected endpoint requires one.

Good first additions:

- Confirmed signal history
- Canonical transaction IDs and statuses
- Token metadata
- Address activity timeline
- Persistent constellation nodes based on historical transactions

Keep provider setup in `src/lib/` so React components do not depend on a specific indexer implementation.

### Persist the atlas

Store the callsign and submitted signal references in `localStorage` keyed by a non-sensitive wallet identifier. Do not store seed phrases, private keys, or complete address data unless the product explicitly requires it.

### Add a Compact contract

Suggested structure:

```text
src/
  contracts/                  Contract addresses, types, and generated artifacts
  lib/
    atlas.ts                  Existing visual model
    contract.ts               Contract connection and circuit calls
    wallet.ts                 Existing 1AM wallet helpers
  components/
    AtlasMap.tsx              Existing constellation
    ContractPanel.tsx         Feature-specific UI
```

Use `@midnight-ntwrk/midnight-js-contracts` for contract interaction patterns. Possible contract-backed features include public beacon registration, sealed signals, private attestations, or commit/reveal events.

### Add a shareable atlas card

Render the current constellation to a standalone SVG or canvas export. A share card should contain the callsign and visual map, not the full unshielded address.

### Add automated tests

The atlas model is deterministic and can be tested without a wallet. Good first tests:

- Same address produces the same callsign and star coordinates.
- Different addresses produce different models.
- Signals are capped and ordered correctly.
- Empty wallet state produces the standby map.

Mock `ConnectedAPI` separately for wallet helper tests.

## Known limitations

- Night Atlas currently uses wallet-provided unshielded state; it is not a private identity or zero-knowledge proof system.
- Signals are session-local and disappear on reload or disconnect.
- Transaction history is not indexed yet.
- There is no backend, persistence layer, routing, or multi-page state.
- Wallet disconnect clears local React state; it does not revoke permissions inside the extension.
- Address input is checked only for a non-empty string.
- Amount parsing uses `parseFloat`; production code should use decimal-safe parsing to avoid floating-point precision issues.
- The transfer result displayed to the user is derived from the serialized transaction payload, not a dedicated transaction hash API.
- `VITE_MIDNIGHT_API_KEY` is currently a placeholder until an indexer or hosted data provider is added.
- There is no automated test suite yet.

## Dependency audit

`npm audit --omit=dev` reports zero production-dependency vulnerabilities. The full audit currently reports development-chain advisories involving Vite 5/esbuild and `uuid` through `vite-plugin-top-level-await`; fixing them requires major dependency changes and should be evaluated deliberately rather than applying `npm audit fix --force`.

## Troubleshooting

### “No Midnight wallet detected”

Install or enable the 1AM extension, reload the page, and make sure the browser profile allows the extension on `localhost`.

### Wallet connects to the wrong network

Check `VITE_1AM_NETWORK` in `.env` and restart the dev server after editing it.

### WASM or top-level-await errors

Confirm `vite.config.ts` still contains the WASM plugins and the Midnight `dedupe`/`optimizeDeps` settings.

### A signal does not appear

Check whether `sendUnshieldedTransfer()` completed successfully. Only successful submissions are appended to the session `signals` array.

## Definition of done for future changes

A pull request or handoff commit should:

- Keep all wallet access behind `src/lib/wallet.ts` or a similarly isolated module
- Keep deterministic visual logic in `src/lib/atlas.ts` or a similarly isolated model
- Preserve the Midnight WASM Vite configuration
- Document any new environment variables in `.env.example` and this README
- Run `npm run lint` and `npm run build`
- Include a manual wallet verification note for transaction-related changes

## References

- [1AM](https://1am.xyz/)
- [1AM developer docs](https://1am.xyz/developers)
- [Midnight](https://midnight.network)
- [Midnight DApp Connector API](https://docs.midnight.network/api-reference/dapp-connector)
