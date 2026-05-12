# SAB-AUDIT-v26 — SeekerClaw Agent Self-Knowledge Audit (SAB v3)

> **Date:** 2026-05-12
> **SAB Version:** v3
> **Scope:** Pre-merge audit for BAT-664 (`agent_pay` POST + body support) and two same-session device-test fixes (PR #370 schema regression, BAT-582-R9 / BAT-664 gate-inclusion regression). Branch `feature/BAT-582-burner-wallet`, HEAD `6957604c`.
> **Method:** Targeted delta audit since SAB-AUDIT-v25 (BAT-582 pre-merge audit). Covers: `buildSystemBlocks()` Wallets section (line 704), agent_pay tool description, DIAGNOSTICS coverage of new error modes, and the device-test findings (cap-vs-max_usdc semantic, POST-only burner_not_configured false positive, invalid input_schema kill).
> **Baseline:** SAB-AUDIT-v25.md (2026-05-08, 276/282 = 97.9% pre-fix → 282/282 = 100% post-fix).

## Changes Since v25 That Triggered v26

| Commit | PR | Description | SAB Impact |
|--------|----|----|----|
| `fd3929b4` | #366 | BAT-582 v1.4 + v1.6 detect/build (merged 2026-05-09) | covered by v25 |
| `041de8c7` | #367 | BAT-582 v2 settle path + PAYMENT-SIGNATURE | covered by v25 (Phase 5) |
| `d7e18759` | #368 | Layer 2.5 mocked-settle tests | infra-only, no agent surface |
| `516e3501` | #369 | Layer 3 live-pay + memo fix | bug fix in protocol, no agent surface |
| `7dc2db97` | #370 | **BAT-664: agent_pay POST + body** | **Critical** — new agent-facing capability (POST, body, confirmation gating semantics) |
| `66ad6886` | #371 | Layer 3-prod live verify | infra-only |
| `4c971e9a` | (no PR) | pay.sh catalog probe + 33 MPP captures | infra-only, dev tooling |
| `e9afc5e5` | (no PR) | Extend live-pay-curated to 6 services | infra-only |
| `36e54b1a` | (no PR) | **Fix agent_pay input_schema (body type array missing items)** | **Bug fix** — schema took down ALL agent turns; new regression test + pre-push + CI |
| `98469ec5` | (no PR) | Wire tool-schemas + smoke into CI | infra-only |
| `6957604c` | (no PR) | **Fix BAT-664 gate-inclusion regression** | **Bug fix** — agent_pay POST returned `burner_not_configured` even when configured; new regression test |

Three changes have agent-facing impact: BAT-664 (the new capability) and the two device-test fixes (which exposed self-awareness gaps).

---

## Pre-fix Findings (5 gaps)

### Section A — Knowledge & Doors

1. **Cap-vs-max_usdc semantic missing from prompt.** The system prompt at `ai.js:704` describes `max_usdc` ("the tool rejects if the 402 demand exceeds it") but never tells the agent that *both* `max_usdc` AND the burner cap bound the actual server demand — not max_usdc itself. Observed live on device 2026-05-12: user set per-tx cap to $0.10 expecting a `max_usdc: "1.00"` call to be rejected; the agent paid the $0.01 demand without explaining the semantic. The error wasn't a bug (call was within both ceilings) but the agent's mental model was incomplete — DIAGNOSTICS:650-651 has the right explanation but the agent never consulted it because the call succeeded.

   **Impact:** ⚠ — agent looks "ignoring cap" to users testing it.

2. **agent_pay tool description doesn't surface the two-ceiling semantic.** Same gap, propagated. The tool description lives in `tools/agent_pay.js` and is loaded on every API call alongside the prompt; semantics expressed there are seen at every dispatch decision. Missing the cap-vs-max_usdc distinction lets the model accept `max_usdc: "1.00"` from a user even when cap is $0.10 without flagging the mismatch.

   **Impact:** ⚠ — same UX class as gap 1, different surface.

### Section B — Diagnostic Coverage

3. **No DIAGNOSTICS entry for the invalid-schema kill-switch class.** When BAT-664 shipped a schema with `type: ['object', 'array', 'string']` minus `items`, the Anthropic API returned 400 on EVERY agent turn before any tool dispatched. The error message ("Invalid schema for function 'agentpay'") is precise but DIAGNOSTICS.md had zero coverage of this failure class — a Claude session encountering this in the future would have to discover it from scratch.

   **Impact:** ❌ — agent dead state, no diagnostic guidance for self-repair.

4. **No DIAGNOSTICS entry for the POST-only `burner_not_configured` false-positive.** The BAT-582-R9 vs BAT-664 integration bug surfaced as `agent_pay POST returns burner_not_configured while same-session GET works`. The existing DIAGNOSTICS entry for `burner_not_configured` (line 636-639) assumes the diagnosis is "no burner configured" — true for v1.4 but misleading for v1.6+ where the gate inclusion bug can manifest identical symptoms. A future Claude session debugging this would chase the false trail ("re-import the burner key") indefinitely.

   **Impact:** ❌ — root cause hidden behind same error code as a real configuration issue.

### Section C — Tool Consistency (rotated 5)

Rotated set this audit: `agent_pay`, `wallet_status`, `wallet_set_caps`, `web_fetch`, `solana_send`.

5. **agent_pay tool description lacks BAT-664 POST + body specifics in prompt.** Prompt covers POST ("POST always asks for user confirmation"), tool description covers POST too. Both correctly reflect the BAT-664 change. **No drift.** ✓

   (Other 4 rotated tools: descriptions match runtime behavior, no drift.)

### Section D — Behavioral Probes

Probes this audit (3 rotated):
- **"How does the cap interact with max_usdc?"** — FAIL pre-fix. Agent would have to consult DIAGNOSTICS:650-651, but the door to that section isn't in the prompt. Gap 1.
- **"agent_pay POST keeps saying burner not configured but GET works"** — FAIL pre-fix. DIAGNOSTICS entry says "import a key," doesn't mention the gate-inclusion bug. Gap 4.
- **"Why is every agent turn failing with API error 400?"** — FAIL pre-fix. No DIAGNOSTICS entry for the schema-kill class. Gap 3.

---

## Overall Scorecard

| Section | Pre-fix | Post-fix | Max | Pre-fix % | Post-fix % |
|---------|---------|----------|-----|-----------|------------|
| A: Knowledge & Doors (2 BAT-664 deltas) | 2/6 | 6/6 | 6 | 33% | 100% |
| B: Diagnostic Coverage (2 new failure modes) | 0/6 | 6/6 | 6 | 0% | 100% |
| C: Tool Consistency (5 rotated) | 15/15 | 15/15 | 15 | 100% | 100% |
| D: Behavioral Probes (3 rotated) | 0/9 | 9/9 | 9 | 0% | 100% |
| **Delta combined** | **17/36** | **36/36** | **36** | **47.2%** | **100%** |

Note: "combined" here scores only the BAT-664 + fix deltas. The full SAB surface (all 282 points from v25) is presumed unchanged.

**Pre-fix verdict:** Significant drift — features shipped without prompt/diagnostics coverage. This is exactly the pattern the BAT-503 SAB-before-merge rule was designed to prevent. BAT-664 (PR #370) merged without an SAB audit; the gaps were caught only when device test surfaced the symptoms.

## Pre-fix Trend
| Audit | Pre-fix % | Post-fix % | Notes |
|-------|-----------|------------|-------|
| v22 | 92.6% | 100% | BAT-475 Cron self-awareness |
| v23 | 93.6% | 100% | BAT-500 Activity Heatmap shipped without coverage |
| v24 | 89.7% | 100% | BAT-525 + BAT-504 + MAX_STEPS post-merge gap fix |
| v25 | 97.9% | 100% | BAT-582 burner — Section C tool-description drift on routed Solana/Jupiter tools |
| **v26** | **47.2%** | **100%** | **BAT-664 shipped without SAB; surfaced via device test** |

47.2% is by far the lowest pre-fix score recorded. Context: this measures only the BAT-664 delta, not the full corpus — the full corpus would dilute it. But the underlying truth is the same: a new capability shipped without an audit and the agent didn't know about its own new surface.

## Fixes Applied

### Section A (Knowledge & Doors)

- **`tools/agent_pay.js` tool description** — added two-ceiling explanation: *"TWO INDEPENDENT CEILINGS apply: `max_usdc` is YOUR willingness ceiling (set per-call); the BURNER CAP (per-tx + daily, configured by the user in Settings) is the user's hard ceiling. BOTH bound the ACTUAL demand the server returns, NOT max_usdc itself..."* with explicit example.
- **`ai.js` Wallets section (line 704)** — same explanation, prompt-side. Agent now sees the distinction at dispatch time AND at general-prompt time. Includes the suggestion to *"explain this before paying — to actually exercise cap rejection, they need a service whose demand exceeds the cap."*

### Section B (Diagnostic Coverage)

- **DIAGNOSTICS.md `Invalid Tool Schema (400 Error)` (new entry under LLM API section)** — documents the symptom (every turn fails with `Invalid schema for function 'X'`), the cause class (JSON Schema validation rules, e.g., `array` in type union without `items`), and the path to fix (`tests/nodejs-project/tool-schemas.test.js` + CI gate). Future Claude session encountering this can self-diagnose in one read.
- **DIAGNOSTICS.md `agent_pay: burner not configured` extension** — added the BAT-664 device-test false-positive scenario: *"`burner_not_configured` was returned only for POST, while same-session GET worked fine ... root cause was NOT the burner — `_BURNER_STATUS_GATE_TOOLS` had `agent_pay` excluded..."* with a pointer to the regression test in `wallet-registry.test.js`. Future operators see both the real diagnosis ("import a key") AND the false-positive scenario ("check gate inclusion") side by side.

### Section D (Behavioral Probes)

All three failed probes pass post-fix via the Section A + B changes above. No additional fixes needed.

## Code Issues Found (out of band)

None. The two underlying bugs (schema, gate inclusion) were already fixed in this branch (`36e54b1a`, `6957604c`) before this audit ran — they were discovered during device test, fixed, then audited. The audit's role here was self-awareness coverage, not bug discovery.

## Remaining Gaps

None at v26 post-fix. The full corpus from v25 (282 points) is presumed unchanged — no source files in that scope were touched by BAT-664 or the fixes. A full re-audit of the v25 corpus is a future-BAT consideration but not urgent.

## Process Note

BAT-664 (PR #370) merged on 2026-05-11 without an SAB audit. The CLAUDE.md `## SAB Audit BEFORE Merge (NEVER SKIP)` rule says SAB must run on any PR that touches `buildSystemBlocks()`, modifies `DIAGNOSTICS.md`, adds new error log sites, or ships any user-visible AI capability. BAT-664 added a user-visible AI capability (POST + body support) and added new error codes (`body_required_for_post`, `body_not_json`, `body_too_large`, `method_not_allowed`) — should have triggered SAB.

The PR template's Self-Awareness Checklist exists for exactly this purpose. Recommendation: enforce the checklist via the same CI mechanism we just wired in for input_schema validation — fail the PR if the checklist is unchecked and the changed files include `buildSystemBlocks()`, DIAGNOSTICS.md, or new tool definitions. That's a separate BAT-XXX (graduate from honor-system gate to mechanical gate), not in scope here.
