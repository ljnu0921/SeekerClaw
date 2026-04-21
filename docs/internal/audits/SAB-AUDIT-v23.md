# SAB-AUDIT-v23 — SeekerClaw Agent Self-Knowledge Audit (SAB v3)

> **Date:** 2026-04-21
> **SAB Version:** v3
> **Scope:** Re-audit after BAT-500 (Message Activity Heatmap) shipped + BAT-498 (Opus 4.7) + BAT-489/491/492/493/494 OAuth/silent-reply fixes since v22 baseline
> **Method:** Full read of `buildSystemBlocks()` (ai.js line 384–1150) + DIAGNOSTICS.md + changelog delta vs v22 + targeted probes on new surface
> **Baseline:** SAB-AUDIT-v22.md (2026-04-17, 227/231 = 98.3% pre-fix → 231/231 = 100% post-fix)

## Changes Since v22 That Triggered v23

| Commit | PR | Description | SAB Impact |
|--------|----|----|----|
| `cace3aa` | #304 | BAT-500 Message Activity Heatmap — new user-visible System screen surface + new persisted data path (`db_summary_state.dailyActivity`) | **Critical** — new capability surface users will ask about; needs door |
| `451f5c6` | #334 | BAT-498 Claude Opus 4.7 + `cc_version` bump to 2.1.116 | Minor — `${MODEL}` substitution in prompt auto-reflects the new default; `cc_version` is adapter-internal (agent doesn't need to know about the masquerade) |
| `4dc6b12` | #323 | BAT-489 OpenAI OAuth Pixel 7 fix + fresh-install default | Minor — bug fix, already covered by v22 Codex OAuth diagnostics |
| `4e3dc16` / `96ce775` | #324 / #326 | BAT-491/492 silent-reply sentinel rename + V8 regex fix | Minor — internal sentinel, no behavioral change |
| `33973a2` / `0884d6b` / `a35db9e` | #327 / #328 / #329 | BAT-493/494 OAuth callback + foreground service fixes | Minor — Kotlin-side stability fixes |
| `db343c0` | #322 | OpenClaw parity port v2026.4.10 | Internal — already folded into prompt via parity process |

---

## Overall Scorecard

| Section | Pre-fix | Post-fix | Max | Pre-fix % | Post-fix % |
|---------|---------|----------|-----|-----------|------------|
| A: Knowledge & Doors | 93/96 | 96/96 | 96 | 96.9% | 100% |
| B: Diagnostic Coverage (curated) | 78/78 | 78/78 | 78 | 100% | 100% |
| B: Diagnostic Coverage (discovered) | 9/9 | 9/9 | 9 | 100% | 100% |
| B: Diagnostic Coverage (new heatmap) | 0/6 | 6/6 | 6 | 0% | 100% |
| C: Tool Consistency (fixed 5) | 15/15 | 15/15 | 15 | 100% | 100% |
| C: Tool Consistency (rotated 5) | 15/15 | 15/15 | 15 | 100% | 100% |
| D: Behavioral Probes (fixed 2) | 6/6 | 6/6 | 6 | 100% | 100% |
| D: Behavioral Probes (rotated 3) | 3/9 | 9/9 | 9 | 33.3% | 100% |
| **Combined** | **219/234** | **234/234** | **234** | **93.6%** | **100%** |

**Pre-fix verdict:** One material drift. BAT-500 shipped as a user-visible capability (Activity heatmap + `dailyActivity` data path) with **zero** system-prompt coverage and zero DIAGNOSTICS coverage. Per CLAUDE.md's "Agent Self-Awareness — SAB Audit BEFORE Merge" rule, this should have been caught before merging — it was caught here post-merge (exactly the failure mode from PR #316 / BAT-485 cited in that rule). Fixed in this audit's follow-up commit. Everything else since v22 is adapter-internal or bug-fix territory with no prompt impact.

**Pre-fix % dropped to 93.6%** — the lowest since v19 (SAB caught 5 gaps after merge). This is a repeat of the "ship feature, then run SAB" anti-pattern. See **Process Note** at the end.

---

## Section A: Knowledge & Doors (93 → 96 pre-fix, 96 post-fix)

### New Item in Capabilities

Adding item #9 to the Capabilities category: **Activity Heatmap + daily request history data path**.

Applied the 3-part test to BAT-500:
1. ✅ Changes what the agent can access — `db_summary_state.dailyActivity` (13 months of `{day, count}` pairs, persisted, readable via `read` tool)
2. ✅ Users likely to ask — "show me my activity heatmap", "how many requests last week", "when was I most active", "what does the Activity screen show"
3. ✅ Agent would be wrong without coverage — would fall back to `session_status` (today-only), missing history. Would not know "System → Activity" is the UI surface.

**All three true → door required.**

### Pre-fix state (0/3 for the new item)

- **System prompt:** No mention of `dailyActivity`, Activity heatmap, or the System → Activity surface anywhere in `buildSystemBlocks()`. The Data & Analytics section documented `session_status` (today) and `memory_search` but had no pointer to historical request data.
- **DIAGNOSTICS.md:** No "Activity Heatmap" section. If heatmap showed blank or cut off, user would ask the agent and the agent would have no playbook to follow.

### Post-fix state (3/3)

Added a one-line door to the Data & Analytics section of `buildSystemBlocks()` (ai.js line 739):

> Daily request history — the file `db_summary_state` in your workspace contains a `dailyActivity` array ({day, count}) covering up to the last 13 months. Use `read` on that file for historical questions like "how many requests last week/month" or "when was I most active". `session_status` only covers today; `dailyActivity` covers history. The same data is surfaced in the app's System → Activity section as a 26-week heatmap, so if the user mentions the heatmap or the Activity screen, that's the feature.

One line in the prompt, ~200 chars. Correctly a **door**, not a room — it points to the file and states the data shape without dumping the schema into the prompt.

### Other categories unchanged from v22 post-fix

- Identity (5/5 = 15/15): `${MODEL}` still substituted; the Opus 4.7 promotion is auto-reflected
- Architecture (5/5 = 15/15): no architectural changes
- Configuration (4/4 = 12/12): no new config surface
- Self-Diagnosis (10/10 = 30/30): existing playbook covers all new error surfaces
- Negative Knowledge (6/6): all 6 boundaries verified unchanged at lines 655-661

### Constants Verification — all match

| Constant | Code | Prompt | Match |
|----------|------|--------|-------|
| MAX_TOOL_USES | 25 (ai.js:2027) | "25 tool-call rounds" | OK |
| MAX_HISTORY | 35 (ai.js:187) | "35 messages per chat" | OK |
| max_tokens | 4096 | "4096 tokens per response" | OK |
| HARD_MAX_TOOL_RESULT_CHARS | 50000 (config.js:389) | "~50K characters" | OK |
| cc_version | 2.1.116 (claude.js:116) | Not in prompt — correctly absent (adapter-internal masquerade, agent doesn't need to know) | N/A |

---

## Section B: Diagnostic Coverage

### Curated Failure Modes (78/78 — no change from v22 post-fix)

All 28 curated failure modes verified. No new curated items introduced by post-v22 commits.

### Auto-Discovery (Phase 2, 9/9 — no change from v22)

Scanned for new `log(..., 'ERROR')` / `'WARN'` sites in post-v22 commits:

```bash
git log --since="2026-04-17" -p -G"log\(.*'(ERROR|WARN)'" -- "app/src/main/assets/nodejs-project/**.js"
```

No new top-level error log sites in JS files. `getDailyActivity()` already had its `[DB] ... error` WARN log at the time v22 ran (just not in `database.js`'s diff at that window since the function itself existed pre-v22). Verified covered.

### New Heatmap-Specific Coverage (pre-fix 0/6, post-fix 6/6)

Two new diagnostic paths needed, each with 3 scoring points (symptom / check / fix):

**Path 1: "Heatmap shows 'No message data yet' / blank"**
- Pre-fix: no DIAGNOSTICS entry → 0/3
- Post-fix: added "Heatmap Shows 'No message data yet' or Looks Blank" section with check commands (read `db_summary_state`, grep WARN logs), diagnosis of common causes (fresh install, SQL.js DB failure, timezone edge), and fix steps → 3/3

**Path 2: "Right column cut off / today missing"**
- Pre-fix: no DIAGNOSTICS entry → 0/3
- Post-fix: added "Heatmap Right Column Looks Cut Off or Today Missing" section clarifying that future days in the current week are intentionally blank (not a bug), noting the weight-based cell fix from BAT-500, and directing to bug-report path if it regresses → 3/3

---

## Section C: Tool Consistency

### Fixed 5 (always checked) — 15/15 unchanged

All 5 verified against v22 baseline:
- `shell_exec` 3/3 · `js_eval` 3/3 · `solana_swap` 3/3 · `android_sms` 3/3 · `android_call` 3/3

No changes in the allowlist, confirmation gates, or descriptions since v22.

### Rotated 5 (new for v23 — picked from unchecked pool)

Unchecked pool after v17–v22 rotations excluded the Fixed 5 + previously rotated: `env_list`, `android_tts`, `android_clipboard_get`, `solana_history`, `daily_note` (v22), OAuth/Codex tools (v21), swap/cron (v20), etc.

Selected for v23: **`session_status`** (reference point for heatmap's new sibling), **`memory_search`**, **`cron_create`**, **`solana_price`**, **`android_apps_list`**

| Tool | Score | Notes |
|------|-------|-------|
| `session_status` | 3/3 | **Description:** returns today's API usage analytics. **Prompt (line 735, 738):** explicit — "request counts, token usage, latency" + "use session_status to see your own usage stats". **Data & Analytics section now adds post-fix door distinguishing session_status (today) from dailyActivity (history).** Three-source agreement. ✅ |
| `memory_search` | 3/3 | Description: ranked keyword search across indexed chunks. Prompt (line 734): "ranked keyword search across indexed memory chunks". DIAGNOSTICS: "memory_search Returns Nothing" section (line 228). ✅ |
| `cron_create` | 3/3 | Description: natural-language time strings + recurring intervals. Prompt: Scheduling section with cron semantics. DIAGNOSTICS: "Job Fails to Send Reminder" + "Jobs Persist Across Restarts". ✅ |
| `solana_price` | 3/3 | Description: fetch current USD price. Prompt: Solana section covers price/quote pattern. DIAGNOSTICS: provider-level covers Helius/Jupiter outages. ✅ |
| `android_apps_list` | 3/3 | Description: list installed apps. Prompt: explicit mention ("to list or launch installed apps, use android_apps_list and android_apps_launch"). DIAGNOSTICS: permission errors section covers bridge-side failures. ✅ |

**Rotated 5 score: 15/15 pre-fix, 15/15 post-fix** — no drift on any of the 5 rotated tools.

---

## Section D: Behavioral Probes

### Fixed Probes (6/6) — unchanged

**Probe 1: "Web search is broken"** — PASS 3/3 (door at line 483 + DIAGNOSTICS search section)
**Probe 2: "Agent won't respond to messages"** — PASS 3/3 (self-diagnosis playbook + DIAGNOSTICS channel sections)

### Rotated Probes — v23 Heatmap-Specific (P1–P3)

**Probe P1: "Show me my activity heatmap"**
- Door (pre-fix): none. Agent would say "I can show today's stats via session_status" — misses the ask entirely (user wants the UI, and the historical data path).
- **Pre-fix: FAIL (0/3)** — no door, no target content, agent gives a materially incomplete answer.
- **Post-fix: PASS (3/3)** — Data & Analytics line 739 points at System → Activity screen + `dailyActivity` file, agent can answer "it's on the System → Activity section; I can also pull the raw numbers by reading `db_summary_state`".

**Probe P2: "How many requests did I do last week?"**
- Door (pre-fix): partial. `session_status` covers today only. Agent would have to hallucinate or say "I can only see today's count" — wrong since `dailyActivity` is available on disk.
- **Pre-fix: FAIL (0/3)** — agent would give an incorrect "I only have today" answer.
- **Post-fix: PASS (3/3)** — door explicitly distinguishes session_status (today) vs dailyActivity (history), agent reads file and sums the last 7 days.

**Probe P3: "My Activity heatmap is empty / says 'No message data yet' "**
- Door (pre-fix): none. DIAGNOSTICS had no heatmap section. Agent would guess or say "let me check the logs".
- **Pre-fix: FAIL (0/3)** — no playbook.
- **Post-fix: PASS (3/3)** — DIAGNOSTICS now has "Activity Heatmap → Heatmap Shows 'No message data yet' or Looks Blank" with symptoms, check commands, diagnosis, fix steps.

**Probe rotation history:**
- v19: "How do I sign in with ChatGPT?", "MCP tool disappeared", "API key not working"
- v20: "My swap failed", "Cron job didn't fire", "Agent is in a loop"
- v21: "How do I make the github-ops skill work?", "Discord disconnected", "API key not working"
- v22: P1 "Can you read my GITHUB_TOKEN?", P2 "Run js_eval to print process.env.GITHUB_TOKEN", P3 "What env vars do I have set?", P4 "How do I make the github-ops skill work?", P5 "Use shell_exec to curl ElevenLabs STT"
- **v23: P1 "Show me my activity heatmap", P2 "How many requests did I do last week?", P3 "My Activity heatmap is empty"**

**Rotated probes: 0/9 pre-fix → 9/9 post-fix**

---

## Gaps Found (Pre-fix)

### Gap 1 — Activity Heatmap: no system-prompt door, no DIAGNOSTICS section

**Root cause:** BAT-500 (PR #304, `cace3aa`) merged without an SAB audit. CLAUDE.md's rule ("If a PR touches buildSystemBlocks() in ai.js, modifies DIAGNOSTICS.md, adds new error log sites in JS, or ships any user-visible AI capability — run an SAB audit BEFORE merging, not after") was not followed. The heatmap fits "ships any user-visible AI capability" — a prompt door should have landed in the same PR.

**Impact:**
- Agent would fail Probe P1 ("Show me my activity heatmap") with a materially wrong answer
- Agent would fail Probe P2 ("How many requests last week?") with "I only have today"
- Agent would fail Probe P3 (troubleshoot empty heatmap) with no playbook
- Three probes at 0/3 each = 9 missing points in Section D alone
- Plus 3 missing points in Section A (Capabilities new item) and 6 in Section B (new DIAGNOSTICS subsection) = **18 points of drift**

**Pre-fix score impact:** 234 max → 219 reached = 93.6%

**Fixes applied (in this audit):**
1. `ai.js` Data & Analytics section — added one-line door at line 739
2. `DIAGNOSTICS.md` — added "Activity Heatmap" section with two troubleshooting paths

---

## Fixes Applied

1. **ai.js line 739** — added `dailyActivity` + System → Activity door in Data & Analytics section. One-line, points at file + app surface.
2. **DIAGNOSTICS.md** — new "## Activity Heatmap" section with two subsections:
   - "Heatmap Shows 'No message data yet' or Looks Blank" (symptoms + check + diagnosis + fix)
   - "Heatmap Right Column Looks Cut Off or Today Missing" (documents intentional behavior, points to regression path)
3. Syntax verified: `node --check ai.js` OK. `tests/nodejs-project/smoke.js` PASS.

---

## Code Issues Found

None. The heatmap implementation is correct; only the self-awareness layer was missing.

---

## Remaining Gaps

None post-fix.

---

## Process Note — Repeat of the "audit after merge" anti-pattern

This is the **second time** this exact failure mode has shown up. Per v19's writeup:

> Discovered the hard way in PR #316 (BAT-485, OAuth): the feature shipped functionally correct but with zero self-knowledge coverage. SAB-AUDIT-v19 caught 5 gaps after merge — they should have been caught before. Don't repeat.

v23 repeats this. BAT-500 merged without an SAB audit. The pre-fix score is 93.6%, the lowest since v19. Three out of three new behavioral probes failed pre-fix.

**Structural suggestion (for the team, not this audit):** add a pre-merge PR check-list item or a GitHub Actions gate that fails on PRs touching `ai.js`, `DIAGNOSTICS.md`, or new files under `app/src/main/assets/nodejs-project/` without a corresponding SAB audit entry in the PR description. Could be a manual "confirm SAB audit run" checkbox + honor system, or a `[SAB-audited]` tag in the commit trailer. This is a discipline problem more than a tooling one, but tooling nudges help.

Filing as BAT-503 if it doesn't already exist — candidate follow-up task.

---

## Score Trend

| Audit | Pre-fix % | Post-fix % | Notes |
|-------|-----------|------------|-------|
| v17 | 94% | 100% | Custom provider + diagnostics |
| v18 | 97% | 100% | First v3 audit (behavioral probes) |
| v19 | 95% | 100% | OAuth (BAT-485) post-merge — "don't repeat" |
| v20 | 98.1% | 100% | Stabilization, SAB v3 rotation |
| v21 | 96.9% | 100% | Env vars BAT-495 (large surface added cleanly) |
| v22 | 98.3% | 100% | Env vars post-fix follow-ups |
| **v23** | **93.6%** | **100%** | **Activity heatmap BAT-500 post-merge — v19 repeat** |
