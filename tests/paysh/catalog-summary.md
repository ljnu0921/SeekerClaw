# pay.sh catalog probe — summary

Generated: 2026-05-12T11:03:45.399Z
Source catalog: solana-foundation/pay-skills (72 services)
Probed: 15 (concurrency 6)

## Aggregate

| Metric | Count |
|--------|-------|
| Total probed | 15 |
| **Parser OK** (built x402 tx) | 0 |
| Parser rejected (returned 402 we can't pay) | 3 |
| Non-402 HTTP response | 12 |
| Fetch failed (DNS / TLS / timeout) | 0 |
| Discovery failed (no service_url) | 0 |
| Solana offered | 0 |
| x402 v2 | 0 |
| x402 v1 | 0 |
| Requirements via body | 0 |
| Requirements via `payment-required` header | 0 |

### Rejects by reason

| Reason | Count |
|--------|-------|
| `mpp_protocol` | 3 |

## Per-service

| Service | HTTP | x402 | Chains | Asset | Amount | Result |
|---------|------|------|--------|-------|--------|--------|
| solana-foundation/google/addressvalidation | 404 | — | — | — | — | `http_404` |
| solana-foundation/google/airquality | 404 | — | — | — | — | `http_404` |
| solana-foundation/google/bigquery | 404 | — | — | — | — | `http_404` |
| solana-foundation/google/civicinfo | 400 | — | — | — | — | `http_400` |
| solana-foundation/google/documentai | 404 | — | — | — | — | `http_404` |
| solana-foundation/google/factchecktools | 400 | — | — | — | — | `http_400` |
| solana-foundation/google/generativelanguage | 404 | — | — | — | — | `http_404` |
| solana-foundation/google/kgsearch | 400 | — | — | — | — | `http_400` |
| solana-foundation/google/language | 402 | — | — | — | — | `reject:mpp_protocol` |
| solana-foundation/google/places | 400 | — | — | — | — | `http_400` |
| solana-foundation/google/speech | 402 | — | — | — | — | `reject:mpp_protocol` |
| solana-foundation/google/texttospeech | 200 | — | — | — | — | `http_200` |
| solana-foundation/google/translate | 404 | — | — | — | — | `http_404` |
| solana-foundation/google/videointelligence | 402 | — | — | — | — | `reject:mpp_protocol` |
| solana-foundation/google/vision | 400 | — | — | — | — | `http_400` |

## What "parser OK" means

The service returned a 402 with x402 payment requirements that our `X402Protocol.detect() + build()` accepted: Solana mainnet offer, scheme=exact, USDC asset, valid payTo, amount within max. The script does NOT sign or settle — `parsed_ok` proves only that we *could* construct a payment, not that the upstream facilitator would accept it.

## What rejections mean

| Reject code | Meaning |
|-------------|---------|
| `no_solana_offer` | Service offers only EVM chains (Base) — our wallet is Solana-only |
| `non_usdc_asset` | Service asks for an asset that isn't the canonical USDC mint |
| `unsupported_version` | x402Version is 3+ (forward-compat block) |
| `invalid_demand` | amount = 0 (pay.sh sometimes uses 402 + amount=0 to advertise free) |
| `demand_exceeds_max_usdc` | amount > our 100 USDC probe ceiling |
| `invalid_402_body` | 402 body shape we don't recognize (likely new pay.sh dialect) |
| `mpp_protocol` | non-x402 paywall (Alibaba/Google `gateway-402.com` services use MPP) |
| `siwx_auth_required` | requires Sign-In-With-X auth flow first (merit-systems stable* services) |
| `no_payment_requirements` | 402 with no `accepts` / no `paymentRequirements` and no recognised alt-protocol |

## Refreshing the catalog inventory

The list of PAY.md paths is snapshotted in `PAY_MD_PATHS` inside `probe-catalog.js`. To refresh:

```
curl -s "https://api.github.com/repos/solana-foundation/pay-skills/git/trees/main?recursive=1" | jq -r '.tree[].path | select(endswith("PAY.md"))'
```

Paste the result over `PAY_MD_PATHS` and re-run.
