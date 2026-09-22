# 1AM dApp

A minimal, runnable dApp for the [Midnight](https://midnight.network) ecosystem, built around the **1AM browser wallet**. It demonstrates wallet detection, connection, balance display, and an unshielded `NIGHT` transfer.

## Stack

- **React 18** + **Vite** + **TypeScript**
- **Tailwind CSS**
- **1AM wallet** via `@midnight-ntwrk/dapp-connector-api`
- **Midnight ledger** via `@midnight-ntwrk/ledger-v8`

## Prerequisites

- Node.js 20+
- A Chromium-based browser with the [1AM extension](https://1am.xyz/) installed
- 1AM configured to the desired network (`preview` or `preprod`) and funded with tNIGHT

## Quick start

```bash
cd /Users/lisafox/CascadeProjects/1am-dapp
npm install
npm run dev
```

Open `http://localhost:5173` in a browser with the 1AM wallet.

## Configuration

Copy `.env.example` to `.env` and set the network:

```bash
cp .env.example .env
```

- `VITE_1AM_NETWORK` — `preview`, `preprod` or `mainnet` (default: `preprod`)

## Project structure

- `src/lib/wallet.ts` — 1AM connector logic (detect, connect, transfer)
- `src/App.tsx` — main page UI
- `src/components/` — reusable UI components

## Next steps / extension ideas

- Swap `makeTransfer` for `makeIntent` to build atomic swaps.
- Add an indexer-backed read-only view with `@midnight-ntwrk/midnight-js-indexer-public-data-provider`.
- Integrate a Compact contract using `@midnight-ntwrk/midnight-js-contracts`.

## References

- [1AM Developer Docs](https://1am.xyz/developers)
- [Midnight DApp Connector API](https://docs.midnight.network/api-reference/dapp-connector)
