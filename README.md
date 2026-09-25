# 1AM dApp

A minimal, runnable browser dApp built on the **1AM wallet stack** for the [Midnight](https://midnight.network) ecosystem.

> Original assignment: **Build a dApp using the 1AM stack. The project should be structured so that another developer can read, run, or extend it.**

This repository is intentionally scoped as a builder handoff. It demonstrates the wallet integration end to end and documents the implementation details needed to extend it into a richer Midnight application.

## Current status

- [x] Detects an injected Midnight wallet through `window.midnight`
- [x] Connects to the 1AM wallet on a configurable network
- [x] Displays the wallet network, unshielded address, unshielded NIGHT balance, and DUST balance
- [x] Disconnects the local UI state
- [x] Builds and submits an unshielded NIGHT transfer through the wallet API
- [x] Includes the Vite/WASM configuration required by Midnight ledger packages
- [ ] Does not currently call a Compact contract
- [ ] Does not currently include indexer-backed reads
- [ ] Does not currently include automated tests

## Stack

- React 18 + Vite + TypeScript
- Tailwind CSS
- [`@midnight-ntwrk/dapp-connector-api`](https://www.npmjs.com/package/@midnight-ntwrk/dapp-connector-api)
- [`@midnight-ntwrk/ledger-v8`](https://www.npmjs.com/package/@midnight-ntwrk/ledger-v8)
- `vite-plugin-wasm` and `vite-plugin-top-level-await` for Midnight WASM compatibility

## Prerequisites

- Node.js 20+
- npm
- A Chromium-based browser
- The [1AM browser wallet extension](https://1am.xyz/)
- A wallet configured for `preprod` or another supported Midnight network
- Test NIGHT funds if you want to submit a transfer

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
  index.css                   Tailwind entry styles
  lib/
    wallet.ts                 1AM connector and transaction helpers
  components/
    WalletCard.tsx            Wallet status and connect/disconnect UI
    TransferForm.tsx          Unshielded NIGHT transfer form
vite.config.ts               React, WASM, and Midnight dependency configuration
.env.example                 Browser-visible environment template
```

## Architecture

```text
React components
      |
      v
src/lib/wallet.ts
      |
      v
window.midnight injected provider
      |
      v
1AM browser extension
      |
      v
Midnight network
```

The React layer owns UI state only. Wallet detection, connection, balance loading, transaction construction, and transaction submission are isolated in `src/lib/wallet.ts` so they can be replaced or extended without rewriting the components.

### Wallet connection flow

`connectWallet()` in `src/lib/wallet.ts`:

1. Reads the injected `window.midnight` object.
2. Prefers `window.midnight['1am']`, falling back to the first injected wallet provider.
3. Calls `wallet.connect(network)`.
4. Loads wallet configuration, unshielded address, unshielded balances, DUST balance, and connection status in parallel.
5. Returns a serializable `WalletState` plus the connected API object used for future wallet calls.

### Balance loading

`loadBalances()` refreshes the unshielded token map and DUST balance without reconnecting the wallet. `nativeNightBalance()` extracts the native-token balance for display.

### Transfer flow

`sendUnshieldedTransfer()`:

1. Converts a decimal NIGHT amount into base units using `1 NIGHT = 1_000_000` units.
2. Calls `api.makeTransfer()` with an unshielded native-token output.
3. Calls `api.submitTransaction(tx)` so the wallet can sign and submit it.
4. Returns the first 64 characters of the serialized transaction as a UI reference.

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

Use this checklist after changing wallet or transaction code:

1. Run `npm run lint`.
2. Run `npm run build`.
3. Run `npm run dev`.
4. Open `http://localhost:5173` in a Chromium browser with 1AM installed.
5. Confirm the wallet connects and displays the expected network and address.
6. Confirm unshielded NIGHT and DUST balances render without `NaN` or blank values.
7. Submit a small self-transfer on a test network.
8. Confirm the success message appears and balances refresh.
9. Confirm disconnect returns the UI to the disconnected state.
10. Open the browser console and confirm there are no WASM or top-level-await errors.

## Extension guide

### Add a new wallet action

1. Add a typed helper to `src/lib/wallet.ts`.
2. Accept the existing `ConnectedAPI` instead of reconnecting.
3. Return plain data to the component layer.
4. Add or update a component under `src/components/`.
5. Pass callbacks through `src/App.tsx` rather than putting wallet API calls directly in presentational components.

### Add indexer-backed reads

Use Midnight's public-data provider package and the reserved `VITE_MIDNIGHT_API_KEY` variable. Good first use cases include:

- Transaction history for the connected address
- Indexed contract state
- Token metadata
- A canonical transaction confirmation/status lookup

Keep provider creation in `src/lib/` so the UI remains independent of the data-source implementation.

### Add a Compact contract

Suggested structure:

```text
src/
  contracts/                  Contract addresses, types, and generated artifacts
  lib/
    contract.ts               Contract connection and circuit calls
    wallet.ts                 Existing 1AM wallet helpers
  components/
    ContractPanel.tsx         Feature-specific UI
```

Use `@midnight-ntwrk/midnight-js-contracts` for deployment/interaction patterns and keep contract-specific state separate from wallet connection state.

### Add an atomic intent or swap

The current transfer uses `makeTransfer`. For multi-step or atomic flows, inspect `ConnectedAPI.makeIntent` and build a separate helper rather than overloading `sendUnshieldedTransfer`.

## Known limitations

- The app is a wallet/transfer starter, not a complete private-voting application.
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

### Transaction fails in the wallet

Check the wallet network, recipient format, available NIGHT balance, and DUST/fee balance. Use a small self-transfer first.

## Definition of done for future changes

A pull request or handoff commit should:

- Keep all wallet access behind `src/lib/wallet.ts` or a similarly isolated module
- Preserve the Midnight WASM Vite configuration
- Document any new environment variables in `.env.example` and this README
- Run `npm run lint` and `npm run build`
- Include a manual wallet verification note for transaction-related changes

## References

- [1AM](https://1am.xyz/)
- [1AM developer docs](https://1am.xyz/developers)
- [Midnight](https://midnight.network)
- [Midnight DApp Connector API](https://docs.midnight.network/api-reference/dapp-connector)
