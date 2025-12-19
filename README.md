# SyncTrade

**SyncTrade** is a copy-trading platform inspired by GMX perpetuals, where users can follow on-chain trading strategies created by leaders and mirror their positions proportionally.

This project focuses on **protocol architecture, execution flow, and data indexing**, rather than deploying a full perpetuals exchange from scratch.



## What SyncTrade Does

- Leaders create trading strategies on specific markets (ETH-USD, BTC-USD, etc.)
- Followers subscribe to leaders and mirror their trades proportionally
- Leader trade actions are emitted on-chain
- A backend indexer listens to events and builds a real-time trading dashboard
- Frontend shows a GMX-style interface with charts, positions, fees, and execution controls

> **Important:**  
> This project is **not a GMX fork** and does **not custody user collateral**.  
> It demonstrates how a **copy-trading coordination layer** works on top of existing liquidity venues.


## Components

### 1. Smart Contracts (Solidity)
- Stores **leader registration**
- Stores **open/close trade signals**
- Mirrors trades to followers proportionally
- Emits events for backend indexing
- Does **not** execute real trades or hold collateral

### 2. Backend (Node.js + Fastify)
- Indexes on-chain events using **viem**
- Stores normalized state in **PostgreSQL (Prisma)**
- Fetches real-time price data from **Binance public APIs**
- Exposes REST APIs for frontend consumption

### 3. Frontend (Next.js + Wagmi)
- GMX-style trading dashboard
- Live candlestick charts (Binance data)
- Strategy creation & management
- Subscribe / execute trades UI
- Wallet-connected actions

## Why Trades Are Simulated (By Design)

Building a real perpetuals exchange requires:
- Liquidity pools
- Funding rate logic
- Liquidation engines
- Risk management
- Oracle security

Instead, SyncTrade focuses on the **copy-trading layer**, which is:

- How leaders signal trades
- How followers mirror positions
- How fees are calculated
- How execution state is indexed
- How UX feels like a real protocol

This mirrors how **real DeFi products are built incrementally**.

> In production, SyncTrade would:
> - Route execution to GMX, Vertex, dYdX, etc.
> - Or use account abstraction / intent-based execution

---

## Position Model (Current)

Positions are **logical positions**, not custody-based.

Stored per position:
- Market (ETH-USD, BTC-USD)
- Direction (Long / Short)
- Size (USD)
- Entry price
- Leader & follower mapping
- Status (Open / Closed)

Calculated off-chain:
- PnL
- Fees
- Exposure
- Performance metrics

---

## Fees Model

Currently implemented:
- **Performance fee (bps)** set by leader
- Accrued fees tracked per leader
- Fees calculated on profitable closes

Planned / extensible:
- Funding rate simulation
- Execution fees
- Referral fees

---

## Price Data

- Candlestick charts powered by **Binance public APIs**
- No API keys required
- Real OHLCV data
- Supports multiple timeframes

Used for:
- Chart rendering
- Entry price visualization
- PnL calculation
- UX realism

---

## Tech Stack

### Smart Contracts
- Solidity
- Hardhat
- OpenZeppelin
- Chainlink (oracle interface ready)

### Backend
- Node.js
- TypeScript
- Fastify
- Prisma
- PostgreSQL
- viem

### Frontend
- Next.js (App Router)
- React Query
- Wagmi
- RainbowKit
- Recharts
- Tailwind / custom styles




