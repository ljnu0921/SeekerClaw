# Rentcast (paysponge)

US real-estate data — market rent/price stats, property values, property records, active for-sale/rental listings. Five catalogued endpoints:

- **[`markets`](#markets)** — rental market trends by ZIP ($0.01)
- **[`avm-value`](#avm-value)** — property value estimate (Zestimate-style) for an address ($0.01)
- **[`properties`](#properties)** — property record search (size, beds, baths, tax history) ($0.01)
- **[`listings-sale`](#listings-sale)** — active for-sale listings in a market ($0.01)
- **[`listings-rental`](#listings-rental)** — active long-term rental listings in a market ($0.01)

Service URL base: `https://rentcast.x402.paysponge.com`

## Param tables come from the openapi — do NOT extrapolate from Rentcast public docs

Every param table below is derived from the gateway's `openapi.json`. The fields, names, types, and enums match the gateway exactly. **Do not invent params** based on what feels like it should exist — if it's not in the table, the gateway will return 400 after payment is settled and the call burns USDC for nothing.

Examples of params that DO NOT exist on these endpoints (despite seeming intuitive):

- `/markets` — no `city`, `state`, or `bedrooms`. Only `zipCode` + `dataType` + `historyRange`.
- `/properties` — no `id` query param. Per-id lookup is a different (uncatalogued) endpoint `GET /properties/{id}`.
- `/listings/sale` and `/listings/rental/long-term` — no `priceMin`/`priceMax`. Use the single `price` param with Rentcast's numeric-range syntax.

## When to use vs free alternatives

- **Use Rentcast** for current US property/market data, valuations, or listing inventory that training data can't have.
- **Don't use Rentcast** for non-US markets (US-only), or for ad-hoc browsing on a specific listing site (use that site's search).

## Numeric ranges

Several params (`bedrooms`, `bathrooms`, `squareFootage`, `lotSize`, `yearBuilt`, `price`, `daysOld` on the `/listings/*` and `/properties` endpoints) are typed `string` and accept Rentcast's numeric-range syntax. The simplest forms work as quoted strings — exact match (`"price=500000"`), open-ended (`"price=400000-"` or `"price=-600000"`), or closed range (`"price=400000-600000"`). See [Rentcast's numeric-ranges reference](https://developers.rentcast.io/reference/numeric-ranges) for the full grammar.

<a id="markets"></a>
## `markets` — rental market trends

`GET /markets?<query-string>`

| Param | Type | Required | Notes |
|---|---|---|---|
| `zipCode` | string | ✓ | 5-digit US ZIP |
| `dataType` | enum | | `All` \| `Sale` \| `Rental` (default `All`) |
| `historyRange` | integer | | Months of trend history (default ~12) |

Example: `?zipCode=78701&historyRange=12&dataType=Rental`. Returns median rent, YoY %, sample size, plus sale-market analogues when `dataType=All`.

> Note: there is no `city`/`state`/`bedrooms` filter on this endpoint. If the user asks for a city, resolve to a representative ZIP first (training data or `web_search`).

<a id="avm-value"></a>
## `avm-value` — automated valuation (estimated sale price)

`GET /avm/value?<query-string>` — Zestimate-style for any US address.

| Param | Type | Required | Notes |
|---|---|---|---|
| `address` | string | ✓ \* | Full street address, format `"Street, City, State, Zip"`, URL-encoded |
| `latitude` | number | ✓ \* | Alternative to `address`: lat/long pair |
| `longitude` | number | ✓ \* | Alternative to `address`: lat/long pair |
| `propertyType` | enum | | `Single Family` \| `Condo` \| `Townhouse` \| `Manufactured` \| `Multi-Family` \| `Apartment` \| `Land` |
| `bedrooms` | number | | Use `0` for studio |
| `bathrooms` | number | | Fractions supported (e.g. `1.5`) |
| `squareFootage` | number | | Living area, sq ft |
| `maxRadius` | number | | Max distance for comparables, miles |
| `daysOld` | integer | | Max age of comparable listings, days (min 1) |
| `compCount` | integer | | Number of comps to use (5–25, default 15) |
| `lookupSubjectAttributes` | boolean | | Try to fetch subject attributes automatically (default `true`) |

\* Either `address` OR (`latitude` + `longitude`) is required.

Returns `{price, priceRangeLow, priceRangeHigh, comparables[]}`. Surface the price + range, not the full comparables list.

<a id="properties"></a>
## `properties` — property record search

`GET /properties?<query-string>` — non-valuation data: size, beds, baths, year built, tax records, ownership. All params are optional but you should send at least one geographic or address filter or you'll get a giant unfiltered list.

| Param | Type | Required | Notes |
|---|---|---|---|
| `address` | string | | Full street address — exact property lookup |
| `city` | string | | Case-sensitive |
| `state` | string | | 2-letter, case-sensitive (e.g. `TX`) |
| `zipCode` | string | | 5-digit US ZIP |
| `latitude` | number | | Combine with `longitude` + `radius` for area search |
| `longitude` | number | | |
| `radius` | number | | Search radius in miles, max 100 |
| `propertyType` | enum | | Same enum as `/avm/value` |
| `bedrooms` | string | | Numeric or range syntax (see "Numeric ranges" above); `0` = studio |
| `bathrooms` | string | | Numeric or range; fractions supported |
| `squareFootage` | string | | Numeric or range, sq ft |
| `lotSize` | string | | Numeric or range, sq ft |
| `yearBuilt` | string | | Numeric or range (e.g. `"2000-2020"`) |
| `saleDateRange` | string | | Days-since-last-sale filter (min 1) |
| `limit` | integer | | 1–500, default 50 |
| `offset` | integer | | Pagination offset |
| `includeTotalCount` | boolean | | Sets `X-Total-Count` response header |

> There is no `?id=` query param on this endpoint. Per-id lookup uses a different (uncatalogued) path `GET /properties/{id}`. If the user has a Rentcast property ID and wants exact lookup, fall back to `address`-based lookup or tell them this isn't in the catalog yet.

Returns property records + tax history. Filter to the fields the user asked about.

<a id="listings-sale"></a>
## `listings-sale` — active for-sale listings

`GET /listings/sale?<query-string>`

| Param | Type | Required | Notes |
|---|---|---|---|
| `address` | string | | Full street address — single-listing lookup |
| `city` | string | | Case-sensitive |
| `state` | string | | 2-letter, case-sensitive |
| `zipCode` | string | | 5-digit US ZIP |
| `latitude` | number | | Combine with `longitude` + `radius` |
| `longitude` | number | | |
| `radius` | number | | Miles, max 100 |
| `propertyType` | enum | | Same enum as `/avm/value` |
| `bedrooms` | string | | Numeric or range; `0` = studio |
| `bathrooms` | string | | Numeric or range; fractions supported |
| `squareFootage` | string | | Numeric or range, sq ft |
| `lotSize` | string | | Numeric or range, sq ft |
| `yearBuilt` | string | | Numeric or range |
| `status` | enum | | `Active` \| `Inactive` (default `Active`) |
| `price` | string | | Listed price; numeric or range (e.g. `"400000-600000"`) |
| `daysOld` | string | | Days since listed; numeric or range |
| `limit` | integer | | 1–500, default 50 |
| `offset` | integer | | Pagination offset |
| `includeTotalCount` | boolean | | Sets `X-Total-Count` response header |

> Note: the price filter is `price` (single param with range syntax), NOT `priceMin`/`priceMax`. The bedrooms/bathrooms/squareFootage filters are typed `string` and accept the same range syntax — `bedrooms=2-4` not `bedrooms=2,3,4`.

Returns listings array. Don't dump all 50 — surface the top 5–10 with key fields (price, beds/baths, address).

<a id="listings-rental"></a>
## `listings-rental` — active long-term rental listings

`GET /listings/rental/long-term?<query-string>`

Same query-param shape as `/listings/sale` (see table above), with two small differences from the openapi:

- `propertyType` enum drops `Land` (rental listings can't be undeveloped land): `Single Family` \| `Condo` \| `Townhouse` \| `Manufactured` \| `Multi-Family` \| `Apartment`
- `price` here is monthly rent, not sale price

Path includes `/long-term` — short-term (vacation) rentals are a separate Rentcast tier not exposed via this paysponge gateway endpoint.

Returns listings array. Same surfacing guidance as `listings-sale`.

## Other Rentcast endpoints on pay.sh (not catalogued)

BAT-706 audit found additional sibling endpoints:
- `GET /properties/{id}` — per-id property lookup (counterpart to `/properties` search)
- `GET /properties/random` — sample property records
- `GET /avm/rent/long-term` — rent valuation analogue to `/avm/value`
- `GET /listings/sale/{id}` — single sale listing by Rentcast ID
- `GET /listings/rental/long-term/{id}` — single rental listing by Rentcast ID

Deferred — none have been promoted yet. If a user repeatedly needs per-id lookup, the `/properties/{id}` / `/listings/.../{id}` endpoints are the right ones to add in a follow-up BAT.
