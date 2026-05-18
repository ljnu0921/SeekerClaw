# SAB-AUDIT-v27 — SeekerClaw Agent Self-Knowledge Audit (SAB v3)

> **Date:** 2026-05-18
> **SAB Version:** v3
> **Scope:** Pre-merge gate for `feature/BAT-582-burner-wallet` → `main` + tag `v2.0.0-rc1`. HEAD `6afb3c74` (after PR #382 stablecrypto fix and PR #383 rentcast fix).
> **Method:** Delta audit since SAB-AUDIT-v26. Covers the post-#370/#371 catalog wave (BAT-704 opt-in policy, BAT-705/706 textbelt + audit crawler, BAT-761 v2 schema, BAT-769 perplexity, BAT-768/766 Tier 1 catalog expansion 11→44, PR #382/#383 doc body-shape fixes), plus a Section D probe class that surfaced during today's device tests (Test 2 burned $0.02 on stablecrypto HTTP 400 retries before #382 landed).
> **Baseline:** SAB-AUDIT-v26.md (2026-05-12, 17/36 = 47.2% pre-fix delta → 36/36 = 100% post-fix).

## Changes Since v26 That Triggered v27

| PR / Commit | Description | SAB Impact |
|---|---|---|
| #377 | BAT-704: paysh-catalog OPT-IN policy | Critical — new prompt door (Wallets section); explicit keyword list for skill activation |
| #378 | BAT-705 textbelt + BAT-706 audit crawler (824 endpoints discovered across 72 services audited; 384 parsed as Solana-USDC 402) | Content — catalog grew, unsupported set grew |
| #379 | BAT-761: paysh-catalog v2 schema + maintenance tooling (probe-catalog --audit/--drift/--refresh) | Schema — per-endpoint catalog entries, upstream_ref + verification metadata; prompt door now mentions SCHEMA.md |
| #380 | BAT-769: perplexity entries (search + agent) | Content — 2 new entries; prompt-door count bumped to 11 |
| #381 | BAT-768/766: Tier 1 expansion to 44 endpoints across 10 services | Content — door count bumped to 44; service-grouping hint added to skill body |
| #382 | Stablecrypto body shapes fix (openapi-derived) | **Critical** — fixes the failure class: doc body shapes inferred from upstream REST instead of gateway openapi. Test 2 (2026-05-18) burned $0.02 on HTTP 400 retries before this PR. |
| #383 | Rentcast query params fix (openapi-derived, same class) | **Critical** — same class as #382; audit-driven follow-up |

Two of these (#382, #383) ship as bug-fixes for a failure class that the agent had no DIAGNOSTICS guidance for. The user's Test 3 retro also revealed a "paid more than catalog says" cost-discrepancy class with no diagnosis path.

---

## Pre-fix Findings

### Section A — Knowledge & Doors (delta)

1. **Catalog count claim is current.** ✅ Wallets section's "Covers 44 supported endpoints across 10 services" matches `catalog.json` (44 entries, 10 unique `service_id`s) and `unsupported.json` (63 entries — also matches the door's "63 known-but-not-usable" claim). Per-service breakdown ("stablecrypto-market-data has 21... tripadvisor 5, rentcast 5, crushrewards 4, perplexity 2, wolframalpha 2, reducto 2, plus singletons") also accurate. (3/3)

2. **OPT-IN keyword list is intact.** ✅ The "Paysh-catalog is OPT-IN" paragraph lists all BAT-704 trigger keywords and the capability-ask phrases. Negative phrase ("NEVER call agent_pay autonomously to answer a question the user did not explicitly authorize paying for") is present. (3/3)

3. **Multi-call composition cost transparency missing.** ⚠️ Today's Test 3 (rentcast `/markets`) returned a rich response that the agent assembled from 2 paid calls (`/markets` + `/listings/rental/long-term`) for $0.02 total, but reported it as "$0.02 USDC" with no per-call breakdown. The user asked "is the catalog stale?" — the agent had no hint to surface the multi-call composition transparently. Soft gap. (1/3)

   **Impact:** ⚠ — UX class (user can't tell why they paid more than `cost_usdc` per-endpoint).

**Section A delta: 7/9 = 77.8%.**

### Section B — Diagnostic Coverage (3 new failure modes since v26)

The curated 24-item baseline from v26 is unchanged ✅. Three new paysh-catalog failure modes have no DIAGNOSTICS coverage:

4. **No DIAGNOSTICS entry for doc-vs-gateway divergence.** ❌ The bug class behind #382 and #383 — agent constructs body/params from upstream public REST docs that diverge from the gateway openapi.json — has no diagnosis path. When stablecrypto burned $0.02 in Test 2, a future Claude session would have to rediscover from scratch that openapi.json is the source of truth for body shapes. The fix lesson (saved as a feedback memory `catalog-body-shapes-from-openapi`) lives in user-memory, not in the agent-readable DIAGNOSTICS.md.

   **Impact:** ❌ — USDC-burning class with no self-repair path.

5. **No DIAGNOSTICS entry for paysh-catalog opt-in regression.** ❌ The prompt door has the prevention (BAT-704 OPT-IN keyword list), but if the agent ever does autonomously activate paysh — because the SKILL.md was corrupted, because a non-pay keyword over-matched, or because the prompt door was edited and lost the negative-knowledge anchor — there's no diagnosis path. The user would say "you paid for trivia I didn't ask for" and the agent would have nothing to consult.

   **Impact:** ❌ — silent UX failure; no path back to the rule.

6. **No DIAGNOSTICS entry for cost discrepancy.** ❌ The Test 3 retro question ("catalog says $0.01 but I paid $0.02 — is the catalog stale?") has no diagnosis path. The agent has no documented procedure for distinguishing (a) multi-call composition (common, correct), (b) stale catalog cost_usdc (probe-the-402 verification), (c) gateway tiered pricing (rare). This is exactly the kind of question users WILL ask post-call.

   **Impact:** ❌ — discoverability class; agent can't explain its own behavior.

**Section B delta: 0/9 = 0%.**

### Section C — Tool Consistency

#### Fixed 5

| Tool | Description matches behavior? | Prompt coverage? | DIAGNOSTICS? | Score |
|---|---|---|---|---|
| `shell_exec` | ✅ Allowlist matches code (line 747 prompt + line 1049 playbook + ALLOWED_COMMANDS) | ✅ Tooling section | ✅ Self-diagnosis playbook | 3 |
| `js_eval` | ✅ Sandboxed VM, 30s timeout, blocked modules list matches | ✅ Tooling section | ✅ Self-diagnosis playbook | 3 |
| `solana_swap` (replaces retired `jupiter_swap`) | ✅ BAT-582 routing semantics in description match Tool Confirmation Gates list | ✅ Tool Confirmation Gates (line 870) | ✅ Self-diagnosis: wallet-config check | 3 |
| `android_sms` | ✅ Confirmation-gated per line 870 | ✅ Tool Confirmation Gates | ✅ Permission-Specific Errors entry | 3 |
| `android_call` | ✅ Confirmation-gated per line 870 | ✅ Tool Confirmation Gates | ✅ Permission-Specific Errors entry | 3 |

**Note on fixed-5 rotation:** the audit's documented "jupiter_swap" doesn't exist as a separate tool — Jupiter Ultra was merged into `solana_swap` long ago. v27 substitutes `solana_swap` (which is the real high-risk financial swap tool) and recommends the SAB skill drop "jupiter_swap" from the fixed-5 list permanently. Tracking as audit-procedure cleanup, not a code/prompt bug.

**Fixed 5: 15/15 ✅.**

#### Rotated 5 (this audit: cron_create, memory_save, skill_install, telegram_send, jupiter_dca_create)

| Tool | Finding | Score |
|---|---|---|
| `cron_create` | ✅ Description correctly distinguishes agentTurn vs reminder, 15-min minimum, natural-language times; matches code | 3 |
| `memory_save` | ⚠️ Description is one generic sentence — doesn't mirror the prompt's negative-knowledge anchor about secrets. The prompt at line 882 says "NEVER write API keys, passwords, seed phrases, private keys, or auth tokens to memory files." But the tool description (which is loaded on every tool-dispatch decision) doesn't repeat the rule, so a model could fail-to-look at the prompt body and call memory_save with a secret. | 1 |
| `skill_install` | ✅ Atomic write, redacted return, full content never enters conversation — all accurate | 3 |
| `telegram_send` | ✅ Buttons + callback flow correctly described, returns shape matches code | 3 |
| `jupiter_dca_create` | ✅ Confirmation-gated, BAT-582 routing semantics correct, requires Jupiter API key, minimums noted | 3 |

**Rotated 5: 13/15 = 86.7%.**

**Section C combined: 28/30 = 93.3%.**

### Section D — Behavioral Probes

#### Fixed 2

1. **"Web search is broken"** → ✅ Prompt mentions search provider in Settings (line 745); DIAGNOSTICS has Search Provider Not Configured + Provider API Error + Provider-Specific Notes. (3/3)
2. **"Agent won't respond to messages"** → ✅ Prompt mentions Telegram polling / Discord gateway; DIAGNOSTICS covers both. (3/3)

**Fixed 2: 6/6 ✅.**

#### Rotated 3 (this audit)

3. **"I paid for stablecrypto and got HTTP 400 — burned $0.02 in retries"** → ❌ FAIL pre-fix. Door: `agent_pay` section in Wallets prompt + DIAGNOSTICS agent_pay section. Neither covers doc-vs-gateway divergence. A future Claude session would have to discover from scratch (or burn more USDC blindly retrying). Same probe shape that surfaced in Test 2. (0/3)

4. **"You paid for trivia I didn't ask you to pay for"** → ❌ FAIL pre-fix. Door: Wallets section's "Paysh-catalog is OPT-IN" paragraph. DIAGNOSTICS has no entry for "opt-in violated" diagnosis — agent can't explain what went wrong or how to prevent recurrence. (0/3)

5. **"Catalog says $0.01 but I paid $0.02 — is the catalog stale?"** → ❌ FAIL pre-fix. Door: agent_pay description + Wallets section. DIAGNOSTICS has no entry for "cost discrepancy" — no procedure for the agent to distinguish multi-call composition from stale catalog from tiered pricing. The Test 3 retro question that prompted this audit. (0/3)

**Rotated 3: 0/9 = 0%.**

**Section D combined: 6/15 = 40%.**

---

## Overall Scorecard

| Section | Pre-fix | Post-fix | Max | Pre-fix % | Post-fix % |
|---------|---------|----------|-----|-----------|------------|
| A: Knowledge & Doors (3 deltas) | 7/9 | 9/9 | 9 | 77.8% | 100% |
| B: Diagnostic Coverage (3 new failure modes) | 0/9 | 9/9 | 9 | 0% | 100% |
| C: Tool Consistency (fixed 5) | 15/15 | 15/15 | 15 | 100% | 100% |
| C: Tool Consistency (rotated 5) | 13/15 | 15/15 | 15 | 86.7% | 100% |
| D: Behavioral Probes (fixed 2) | 6/6 | 6/6 | 6 | 100% | 100% |
| D: Behavioral Probes (rotated 3) | 0/9 | 9/9 | 9 | 0% | 100% |
| **Combined** | **41/63** | **63/63** | **63** | **65.1%** | **100%** |

**Pre-fix verdict:** Significant drift (below 90% threshold). The catalog ecosystem grew through 6 PRs without DIAGNOSTICS coverage of the failure classes that surfaced (doc-vs-gateway divergence in #382/#383, cost discrepancy in Test 3 retro). Same pattern v26 caught with BAT-664: when a capability cluster ships, DIAGNOSTICS must grow with it.

## Pre-fix Trend

| Audit | Pre-fix % | Post-fix % | Notes |
|-------|-----------|------------|-------|
| v22 | 92.6% | 100% | BAT-475 Cron self-awareness |
| v23 | 93.6% | 100% | BAT-500 Activity Heatmap shipped without coverage |
| v24 | 89.7% | 100% | BAT-525 + BAT-504 + MAX_STEPS post-merge gap fix |
| v25 | 97.9% | 100% | BAT-582 burner — Section C tool-description drift on routed Solana/Jupiter tools |
| v26 | 47.2% | 100% | BAT-664 shipped without SAB; surfaced via device test |
| **v27** | **65.1%** | **100%** | **Catalog wave shipped without DIAGNOSTICS for the failure classes; surfaced via Test 2/3 + audit follow-up** |

v27's pre-fix (65.1%) is better than v26's (47.2%) but still well below the 90% drift threshold. The pattern is consistent: capability shipped → device test surfaces failure class → SAB catches it post-hoc → DIAGNOSTICS gains the entry. Tightening the loop means running SAB *as part of every catalog-expansion PR*, not just at major version gates.

---

## Fixes Applied

### Section A (Knowledge & Doors)

- **`ai.js` Wallets section** — added multi-call composition transparency hint and explicit "DO NOT auto-retry with permuted shapes on HTTP 400/422 — consult DIAGNOSTICS first" guidance. Inline with existing two-ceiling and insufficient-balance paragraphs (single contiguous paid-APIs block).

### Section B (Diagnostic Coverage)

Three new entries in `DIAGNOSTICS.md` under a new `## paysh-catalog (BAT-704/761/768/766/769)` section:

- **`agent_pay 200/400/422 after settle — gateway rejected the body/params (doc-vs-gateway divergence)`** — symptom patterns, the three gateway divergence classes (arrays vs strings, string-typed numbers, renamed fields), curl recipe for fetching openapi.json, the "tripadvisor/wolfram/2captcha/reducto declare no params but accept passthrough" exception. Fix steps cover both runtime workaround (re-issue with correct shape) and maintainer fix (rewrite doc + bump SKILL.md version).

- **`agent autonomously paid for trivia / activated paysh-catalog without an explicit pay-intent keyword`** — symptom (USDC burned on a trivia question), diagnosis (BAT-704 OPT-IN regression — list of trigger keywords + common over-match causes), fix (verify SKILL.md version, verify prompt door is intact, refund/apologize to user, report mis-matched trigger phrase).

- **`paid more than the catalog cost_usdc said (cost discrepancy)`** — three possibilities (multi-call composition / stale `cost_usdc` / tiered pricing), curl recipe for live-probing the 402 to extract `accepts[].amount` in atomic USDC units, fix steps (transparent multi-call reporting, flag-for-maintainer if catalog is stale, maintainer-side update procedure).

### Section C (Tool Consistency)

- **`tools/memory.js` memory_save description** — added explicit "NEVER pass secrets through this tool" sentence with the full secret class list (API keys, OAuth tokens, seed phrases, private keys, passwords, auth headers) and the safer alternative path (agent_settings.json apiKeys.*). Mirrors the prompt's negative-knowledge anchor at line 882 so the rule lives on the dispatch surface, not just in the prompt body.

### Syntax check

```
node --check app/src/main/assets/nodejs-project/ai.js → OK
node --check app/src/main/assets/nodejs-project/tools/memory.js → OK
```

---

## Code Issues Found

None — all gaps were prompt/diagnostics drift, not code bugs. Two procedural notes:

1. **SAB skill's "fixed 5" includes the retired `jupiter_swap` tool.** Recommend updating `.claude/skills/sab-audit/SKILL.md` to substitute `solana_swap` (which is what Jupiter Ultra actually is post-merge). Not blocking; flagged as audit-procedure maintenance.

2. **SAB-before-catalog-PR enforcement gap.** v26 caught BAT-664 post-hoc; v27 catches the BAT-768/766 wave post-hoc. Pattern repeating. Consider adding paysh-catalog touches to the BAT-503 SAB-before-merge trigger list explicitly (currently only "user-visible AI capability" — catalog content edits don't trip the gate even though they grow the surface).

---

## Remaining Gaps

None. Post-fix 100% on all sections.

---

## Verification

- Reasoning traced via `buildSystemBlocks()` (ai.js:587–1156)
- Catalog/unsupported counts verified live: `node -e "..."` → 44 entries / 10 services / 63 unsupported
- DIAGNOSTICS map verified: `grep "^##\|^###"` → all new entries present
- Tool descriptions verified via direct grep against `tools/*.js`
- All edited files pass `node --check`
