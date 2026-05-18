# StableCrypto Market Data (merit-systems)

Crypto + DeFi data wrapper exposing CoinGecko (markets/coins/prices) + DefiLlama (TVL/yields/stablecoins/protocols) through a single x402 paid gateway. All endpoints are POST with $0.01 USDC per call (Solana mainnet), multi-chain offer with both `solana:` and `base:` legs (we always pick the Solana leg).

Service URL base: `https://stablecrypto.dev`

21 catalogued endpoints across CoinGecko + DefiLlama sub-APIs:

### CoinGecko endpoints (10)
- [`coingecko-price`](#coingecko-price) — current spot price for a coin
- [`coingecko-markets`](#coingecko-markets) — top coins by market cap
- [`coingecko-chart`](#coingecko-chart) — historical price chart
- [`coingecko-ohlc`](#coingecko-ohlc) — OHLC candles
- [`coingecko-top-movers`](#coingecko-top-movers) — 24h gainers/losers
- [`coingecko-trending`](#coingecko-trending) — top-searched coins
- [`coingecko-categories`](#coingecko-categories) — coin categories with market caps
- [`coingecko-onchain-pool`](#coingecko-onchain-pool) — specific DEX pool data
- [`coingecko-onchain-trending`](#coingecko-onchain-trending) — trending on-chain pools
- [`coingecko-onchain-new-pools`](#coingecko-onchain-new-pools) — newly-created DEX pools _(pre-existing entry, kept)_

### DefiLlama endpoints (11)
- [`defillama-protocols`](#defillama-protocols) — full DeFi protocol list with TVL
- [`defillama-protocol`](#defillama-protocol) — single protocol detail
- [`defillama-chains`](#defillama-chains) — TVL per chain
- [`defillama-chain-tvl`](#defillama-chain-tvl) — single chain TVL history
- [`defillama-yields-pools`](#defillama-yields-pools) — yield-farming pools (APY)
- [`defillama-yields-perps`](#defillama-yields-perps) — perps funding-rate yields
- [`defillama-stablecoins`](#defillama-stablecoins) — stablecoin market caps + peg health
- [`defillama-dex-overview`](#defillama-dex-overview) — aggregate DEX volume
- [`defillama-fees-overview`](#defillama-fees-overview) — protocol fees + revenue
- [`defillama-derivatives-overview`](#defillama-derivatives-overview) — derivatives volume
- [`defillama-coins-prices-historical`](#defillama-coins-prices-historical) — historical prices by timestamp

## Body construction — read this first

All endpoints are POST with a JSON body. **Use the field names + types listed for each endpoint below**, NOT the shapes you'd infer from CoinGecko / DefiLlama public REST docs. The gateway diverges from upstream in three ways that matter:

1. **Arrays where upstream uses comma-separated strings.** CoinGecko's public API takes `?ids=bitcoin,ethereum&vs_currencies=usd`. The gateway takes `{"ids":["bitcoin","ethereum"],"vs_currencies":["usd"]}` — arrays, not strings. Sending a string returns HTTP 400 _after_ payment is settled.
2. **String types where you'd expect numbers.** `days` for `chart`/`ohlc` is a string (`"7"`), not a number (`7`). The gateway rejects numbers.
3. **Renamed fields.** `pool_address` → `address`, `protocol` → `name`. Use the gateway's name from the table below, not the upstream's.

Empty body `{}` is fine when the "Required" line says `(none)`. When required params are present, sending `{}` returns 422 after payment.

## When to use vs free alternatives

- **Use stablecrypto** when the user wants live crypto/DeFi data and the free `solana_*` / `jupiter_*` tools don't cover it (those are Solana-native + Jupiter-routed; stablecrypto covers cross-chain CoinGecko/DefiLlama).
- **Don't use stablecrypto** for trivia ("what is Bitcoin"), historical narratives, or anything in training data. Use it for CURRENT numbers.

---

<a id="coingecko-price"></a>
## `coingecko-price` — current spot price

`POST /api/coingecko/price`

| Field | Type | Required | Notes |
|---|---|---|---|
| `ids` | `array<string>` | ✓ | Coin IDs, e.g. `["bitcoin"]` or `["solana","ethereum"]` |
| `vs_currencies` | `array<string>` | ✓ | Target currencies, e.g. `["usd"]` or `["usd","eur"]` |
| `include_market_cap` | boolean | | Append market cap per (coin, currency) |
| `include_24hr_vol` | boolean | | Append 24h volume |
| `include_24hr_change` | boolean | | Append 24h % change |
| `include_last_updated_at` | boolean | | Append last-updated unix timestamp |
| `precision` | string | | Decimal precision, "0".."18" |

Example: `{ "ids": ["bitcoin"], "vs_currencies": ["usd"] }` → `{ "bitcoin": { "usd": 67234.12 } }`.

<a id="coingecko-markets"></a>
## `coingecko-markets` — top coins by market cap

`POST /api/coingecko/markets`

| Field | Type | Required | Notes |
|---|---|---|---|
| `vs_currency` | string | ✓ | Single currency, e.g. `"usd"` |
| `ids` | `array<string>` | | Filter to specific coin IDs |
| `category` | string | | CoinGecko category slug |
| `order` | string | | e.g. `"market_cap_desc"` |
| `per_page` | number | | Max 250 |
| `page` | number | | 1-indexed |
| `sparkline` | boolean | | Include 7d sparkline array |
| `price_change_percentage` | string | | Comma-separated intervals: `"1h,24h,7d"` |

Example: `{ "vs_currency": "usd", "per_page": 10 }`. Surface top N with name + price + market cap + 24h change. Don't dump sparkline arrays.

<a id="coingecko-chart"></a>
## `coingecko-chart` — historical price chart

`POST /api/coingecko/chart`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | ✓ | Coin ID, e.g. `"bitcoin"` |
| `vs_currency` | string | ✓ | e.g. `"usd"` |
| `days` | **string** | ✓ | `"1"`, `"7"`, `"14"`, `"30"`, `"90"`, `"180"`, `"365"`, `"max"` — quoted string, not number |
| `interval` | string | | e.g. `"daily"` |
| `precision` | string | | Decimal precision |

Example: `{ "id": "bitcoin", "vs_currency": "usd", "days": "7" }`. Returns price points; summarize for Telegram replies ("opened at $X, closed at $Y, range $low–$high, ±Z%").

<a id="coingecko-ohlc"></a>
## `coingecko-ohlc` — OHLC candles

`POST /api/coingecko/ohlc`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | ✓ | Coin ID |
| `vs_currency` | string | ✓ | e.g. `"usd"` |
| `days` | **string** | ✓ | `"1"`, `"7"`, `"14"`, `"30"`, `"90"`, `"180"`, `"365"` — quoted string |
| `precision` | string | | Decimal precision |

Example: `{ "id": "bitcoin", "vs_currency": "usd", "days": "7" }`. Use only when user explicitly asks for candle data.

<a id="coingecko-top-movers"></a>
## `coingecko-top-movers` — 24h gainers/losers

`POST /api/coingecko/top-movers`

| Field | Type | Required | Notes |
|---|---|---|---|
| `vs_currency` | string | | Default `"usd"` |
| `duration` | string | | Window, e.g. `"24h"` |
| `top_coins` | string | | Filter to top-N coin universe, e.g. `"1000"` |

Empty body `{}` works (all params optional). Returns top gainers + losers — surface as two short lists.

<a id="coingecko-trending"></a>
## `coingecko-trending` — top-searched coins

`POST /api/coingecko/trending`

No body params. Send `{}`. Returns top-7 trending coins on CoinGecko by search volume.

<a id="coingecko-categories"></a>
## `coingecko-categories` — coin categories

`POST /api/coingecko/categories`

| Field | Type | Required | Notes |
|---|---|---|---|
| `order` | string | | e.g. `"market_cap_desc"` |

Empty body `{}` works. Returns categories (DeFi, Memes, Layer-1, AI, etc.) with aggregated market cap. Surface top 10.

<a id="coingecko-onchain-pool"></a>
## `coingecko-onchain-pool` — specific DEX pool

`POST /api/coingecko/onchain/pool`

| Field | Type | Required | Notes |
|---|---|---|---|
| `network` | string | ✓ | `"eth"`, `"solana"`, `"base"`, `"arbitrum"`, etc. |
| `address` | string | ✓ | Pool contract address (note: field is `address`, NOT `pool_address`) |
| `include` | string | | Additional data, e.g. `"base_token,quote_token,dex"` |

Example: `{ "network": "solana", "address": "<poolAddr>" }`. Returns pool TVL, volume, recent trades, reserves.

<a id="coingecko-onchain-trending"></a>
## `coingecko-onchain-trending` — trending on-chain pools

`POST /api/coingecko/onchain/trending`

| Field | Type | Required | Notes |
|---|---|---|---|
| `include` | string | | e.g. `"base_token,quote_token,dex,network"` |
| `page` | number | | 1-indexed |
| `duration` | string | | Trending window, e.g. `"24h"` |

No network filter — returns trending pools across all chains. Empty body `{}` works.

<a id="coingecko-onchain-new-pools"></a>
## `coingecko-onchain-new-pools` — newly-created DEX pools

`POST /api/coingecko/onchain/new-pools`

| Field | Type | Required | Notes |
|---|---|---|---|
| `include` | string | | e.g. `"base_token,quote_token,dex"` |
| `page` | number | | 1-indexed |

Empty body `{}` works. Recently-deployed token pairs across DEXes. Legacy "StableCrypto New Pools" intent from BAT-699.

---

<a id="defillama-protocols"></a>
## `defillama-protocols` — full protocol list

`POST /api/defillama/protocols`

No body params. Send `{}`. Returns ~2000 DeFi protocols with TVL, 1d/7d change, chains. Surface top N by TVL or filter to the user's chain interest client-side.

<a id="defillama-protocol"></a>
## `defillama-protocol` — single protocol detail

`POST /api/defillama/protocol`

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | ✓ | Protocol slug (note: field is `name`, NOT `protocol`) |

Slug examples: `"raydium"`, `"marinade-finance"`, `"jito-liquid-staking"`, `"uniswap-v3"`, `"aave"`. Returns TVL history, chain breakdown, token addresses.

<a id="defillama-chains"></a>
## `defillama-chains` — TVL per chain

`POST /api/defillama/chains`

No body params. Send `{}`. Returns TVL for every chain DefiLlama tracks. Surface top 10–15 by TVL or filter to the chain the user named.

<a id="defillama-chain-tvl"></a>
## `defillama-chain-tvl` — single chain TVL history

`POST /api/defillama/chain-tvl`

| Field | Type | Required | Notes |
|---|---|---|---|
| `chain` | string | ✓ | Chain name, e.g. `"Solana"`, `"Ethereum"`, `"Base"`, `"Arbitrum"` |

Returns daily TVL history. Surface current, change vs N days ago, ATH.

<a id="defillama-yields-pools"></a>
## `defillama-yields-pools` — yield-farming pools

`POST /api/defillama/yields/pools`

No body params. Send `{}`. Returns ALL yield pools — large response. Filter client-side (by chain / project / APY range / stablecoin-only) and surface top-N. Describe the filter in your reply so the user knows what you cut.

<a id="defillama-yields-perps"></a>
## `defillama-yields-perps` — perps funding rates

`POST /api/defillama/yields/perps`

No body params. Send `{}`. Funding rates across perp protocols. Use for delta-neutral / funding-rate-arbitrage queries.

<a id="defillama-stablecoins"></a>
## `defillama-stablecoins` — stablecoin market caps

`POST /api/defillama/stablecoins`

| Field | Type | Required | Notes |
|---|---|---|---|
| `includePrices` | boolean | | If true, append live peg price per stablecoin |

Empty body `{}` works. Returns all stablecoins with circulating supply per chain, peg health, market cap. Surface top 5 by market cap + flag any with > 1% peg deviation.

<a id="defillama-dex-overview"></a>
## `defillama-dex-overview` — aggregate DEX volume

`POST /api/defillama/dex-overview`

| Field | Type | Required | Notes |
|---|---|---|---|
| `excludeTotalDataChart` | boolean | | Strip the per-day total time-series array |
| `excludeTotalDataChartBreakdown` | boolean | | Strip the per-chain breakdown series |
| `dataType` | string | | `"dailyVolume"` or `"totalVolume"` |

Empty body `{}` works. 24h/7d/30d DEX volume across chains. Pass `excludeTotalDataChart: true` to keep response small when you only need headline totals.

<a id="defillama-fees-overview"></a>
## `defillama-fees-overview` — protocol fees / revenue

`POST /api/defillama/fees-overview`

| Field | Type | Required | Notes |
|---|---|---|---|
| `excludeTotalDataChart` | boolean | | Strip per-day total time-series |
| `excludeTotalDataChartBreakdown` | boolean | | Strip per-protocol breakdown series |
| `dataType` | string | | `"dailyFees"`, `"dailyRevenue"`, etc. |

Empty body `{}` works. Surface top N protocols by 24h fees or revenue.

<a id="defillama-derivatives-overview"></a>
## `defillama-derivatives-overview` — derivatives volume

`POST /api/defillama/derivatives-overview`

| Field | Type | Required | Notes |
|---|---|---|---|
| `excludeTotalDataChart` | boolean | | Strip per-day total time-series |
| `excludeTotalDataChartBreakdown` | boolean | | Strip per-venue breakdown series |
| `dataType` | string | | Derivatives volume slice |

Empty body `{}` works. Perp DEX + centralized derivatives volume. Surface aggregate + top venues.

<a id="defillama-coins-prices-historical"></a>
## `defillama-coins-prices-historical` — historical price snapshot

`POST /api/defillama/coins/prices-historical`

| Field | Type | Required | Notes |
|---|---|---|---|
| `timestamp` | **number** | ✓ | Unix seconds — number, not string |
| `coins` | string | ✓ | Comma-separated `<chain>:<address>` or `coingecko:<id>` identifiers |
| `searchWidth` | string | | Tolerance window for matching the timestamp, e.g. `"4h"` |

Example: `{ "coins": "coingecko:bitcoin", "timestamp": 1640995200 }` (BTC on 2022-01-01). Returns price at that timestamp ± searchWidth. Useful for backtesting or "what was X worth on date Y" queries.

## Other stablecrypto endpoints on pay.sh (not catalogued)

The BAT-706 audit confirmed 105 total endpoints. The 21 catalogued here cover the highest-intent slice for SeekerClaw users. Additional endpoints exist (e.g. `/api/coingecko/coin`, `/api/coingecko/history`, `/api/coingecko/global`, `/api/coingecko/exchange*`, additional `/api/coingecko/onchain/*` and `/api/defillama/*` variants) — most are niche, redundant with what we catalog, or specialized analytics. Deferred; future BAT can promote any specific endpoint users actually need.
