#!/usr/bin/env node
// agent-pay-preflight-balance.test.js — R-pr373-r3-1.
//
// Targeted branch coverage for `_checkBurnerUsdcBalance` in
// tools/agent_pay.js. Pre-fix (BAT-664 device-test 2026-05-12), this
// pre-flight path classified every Solana-RPC error as
// "ATA missing → balance 0 → insufficient_burner_balance", which would
// have wrongly blocked legitimate payments during a transient RPC
// hiccup. After R1+R2 review iterations, the function distinguishes:
//
//   1. ATA not found on chain      → fail-CLOSED: insufficient_burner_balance with have=0
//   2. Sufficient balance          → ok: true
//   3. Insufficient balance        → fail-CLOSED: insufficient_burner_balance with have/short
//   4. Transient RPC error/timeout → fail-OPEN: preflight_balance_rpc_failed (caller proceeds)
//   5. Malformed RPC response      → fail-OPEN: preflight_balance_rpc_malformed_response
//   6. Empty RPC result            → fail-OPEN: preflight_balance_rpc_empty_response
//
// Copilot R3 (PR #373) flagged the lack of automated coverage for these
// branches as a regression risk for financial-flow code. This test pins
// every branch via direct call to the exported helper with mocked
// solanaRpc returns.
//
// Run: node tests/nodejs-project/agent-pay-preflight-balance.test.js

'use strict';

const assert = require('assert');
const path = require('path');

const BUNDLE = path.resolve(__dirname, '..', '..', 'app', 'src', 'main', 'assets', 'nodejs-project');

// ── Mock config.js so security.js doesn't choke at module load ──────────────
const configPath = require.resolve(path.join(BUNDLE, 'config.js'));
require.cache[configPath] = {
    id: configPath,
    filename: configPath,
    loaded: true,
    exports: { BRIDGE_TOKEN: 't', log: () => {}, config: {}, workDir: '/tmp/seekerclaw-test' },
};

// ── Mock bridge.js (agent_pay.js requires it at module load) ────────────────
const bridgePath = require.resolve(path.join(BUNDLE, 'bridge.js'));
require.cache[bridgePath] = {
    id: bridgePath,
    filename: bridgePath,
    loaded: true,
    exports: { androidBridgeCall: async () => ({}) },
};

// ── Mock solana.js — settable per-test responder for solanaRpc ──────────────
// _checkBurnerUsdcBalance derives the burner's USDC ATA, then calls
// `solanaRpc('getTokenAccountBalance', [ata])`. We control the return to
// exercise each branch.
let rpcResponder = async () => ({ error: 'unmocked' });
const solanaPath = require.resolve(path.join(BUNDLE, 'solana.js'));
require.cache[solanaPath] = {
    id: solanaPath,
    filename: solanaPath,
    loaded: true,
    exports: {
        solanaRpc: async (method, params) => rpcResponder(method, params),
        base58Encode: require('crypto').createHash, // overridden below
        getConnectedWalletAddress: () => { throw new Error('not connected'); },
    },
};
// Use the REAL base58Encode (we need the actual ATA derivation to work).
// Re-require the real module via a side path to grab the function, then
// monkey-patch our stub. NB: we can't `require('../../app/.../solana')`
// because we've already cached the stub. Instead we inline a known-good
// base58Encode (mirrors the one in solana.js).
require.cache[solanaPath].exports.base58Encode = function base58Encode(buf) {
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let n = 0n;
    for (let i = 0; i < buf.length; i++) n = (n << 8n) | BigInt(buf[i]);
    let s = '';
    while (n > 0n) {
        s = ALPHABET[Number(n % 58n)] + s;
        n = n / 58n;
    }
    // Preserve leading-zero bytes as leading '1's.
    for (let i = 0; i < buf.length && buf[i] === 0; i++) s = '1' + s;
    return s || '1';
};

// ── Load the target under test ──────────────────────────────────────────────
const { _checkBurnerUsdcBalance } = require(path.join(BUNDLE, 'tools', 'agent_pay'));

// A real, base58-valid Solana pubkey for the burner (32 bytes on-curve —
// same fake test pubkey used elsewhere in the test suite).
const TEST_BURNER_PUBKEY = '7xKXTg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';

let failures = 0;
async function check(label, fn) {
    try {
        await fn();
        console.log(`  ✓ ${label}`);
    } catch (e) {
        failures++;
        console.error(`  ✗ ${label}\n    ${e.message}`);
    }
}

(async () => {
    // ── BRANCH 1: ATA truly doesn't exist on chain ──────────────────────────
    // Solana RPC's getTokenAccountBalance returns "could not find account"
    // (-32004) when the account at the derived ATA address doesn't exist.
    // This is a DEFINITE not-found state — fail-closed with balance=0.
    await check('ATA not found ("could not find account") → insufficient_burner_balance with have=0', async () => {
        rpcResponder = async () => ({ error: 'could not find account at address: ...' });
        const r = await _checkBurnerUsdcBalance(TEST_BURNER_PUBKEY, 20000n);
        assert.strictEqual(r.error, 'insufficient_burner_balance');
        assert.strictEqual(r.haveAtomic, '0');
        assert.strictEqual(r.haveDecimal, '0');
        assert.strictEqual(r.needAtomic, '20000');
        assert.strictEqual(r.shortAtomic, '20000');
        assert.ok(r.reason && r.reason.toLowerCase().includes('no ata'),
            `reason should mention no-ATA: got "${r.reason}"`);
    });
    await check('ATA not found (alt phrase "account not found") → insufficient_burner_balance', async () => {
        rpcResponder = async () => ({ error: 'account not found' });
        const r = await _checkBurnerUsdcBalance(TEST_BURNER_PUBKEY, 50000n);
        assert.strictEqual(r.error, 'insufficient_burner_balance');
        assert.strictEqual(r.haveAtomic, '0');
    });
    await check('ATA not found (-32004 RPC code in message) → insufficient_burner_balance', async () => {
        rpcResponder = async () => ({ error: 'RPC -32004: Account index not found' });
        const r = await _checkBurnerUsdcBalance(TEST_BURNER_PUBKEY, 10000n);
        assert.strictEqual(r.error, 'insufficient_burner_balance');
        assert.strictEqual(r.haveAtomic, '0');
    });

    // ── BRANCH 2: sufficient balance ────────────────────────────────────────
    await check('sufficient balance (have ≥ demand) → ok=true', async () => {
        rpcResponder = async () => ({
            value: { amount: '1000000', decimals: 6, uiAmountString: '1.0' },
        });
        const r = await _checkBurnerUsdcBalance(TEST_BURNER_PUBKEY, 20000n);
        assert.strictEqual(r.ok, true);
        assert.strictEqual(r.haveAtomic, '1000000');
        assert.strictEqual(r.error, undefined);
    });
    await check('exactly equal balance (have == demand) → ok=true (boundary)', async () => {
        rpcResponder = async () => ({
            value: { amount: '20000', decimals: 6, uiAmountString: '0.02' },
        });
        const r = await _checkBurnerUsdcBalance(TEST_BURNER_PUBKEY, 20000n);
        assert.strictEqual(r.ok, true);
        assert.strictEqual(r.haveAtomic, '20000');
    });

    // ── BRANCH 3: balance present but insufficient ──────────────────────────
    await check('have < demand → insufficient_burner_balance with exact shortfall', async () => {
        // The exact scenario from device-test 2026-05-12: burner had
        // 3378 atomic ($0.003378), textbelt demand was 20000 ($0.02).
        rpcResponder = async () => ({
            value: { amount: '3378', decimals: 6, uiAmountString: '0.003378' },
        });
        const r = await _checkBurnerUsdcBalance(TEST_BURNER_PUBKEY, 20000n);
        assert.strictEqual(r.error, 'insufficient_burner_balance');
        assert.strictEqual(r.haveAtomic, '3378');
        assert.strictEqual(r.haveDecimal, '0.003378');
        assert.strictEqual(r.needAtomic, '20000');
        assert.strictEqual(r.needDecimal, '0.02');
        assert.strictEqual(r.shortAtomic, '16622');
        assert.strictEqual(r.shortDecimal, '0.016622');
    });

    // ── BRANCH 4: transient RPC errors → fail-OPEN ──────────────────────────
    // These return distinct non-insufficient_burner_balance errors so the
    // CALLER can decide to fail-open. The caller (in _handle) logs WARN and
    // falls through to the existing cap-reserve + facilitator-side checks.
    await check('RPC timeout → preflight_balance_rpc_failed (fail-open)', async () => {
        rpcResponder = async () => ({ error: 'rpc timeout' });
        const r = await _checkBurnerUsdcBalance(TEST_BURNER_PUBKEY, 20000n);
        assert.strictEqual(r.error, 'preflight_balance_rpc_failed');
        assert.notStrictEqual(r.error, 'insufficient_burner_balance');
    });
    await check('RPC 5xx → preflight_balance_rpc_failed (fail-open)', async () => {
        rpcResponder = async () => ({ error: 'HTTP 503 Service Unavailable from RPC' });
        const r = await _checkBurnerUsdcBalance(TEST_BURNER_PUBKEY, 20000n);
        assert.strictEqual(r.error, 'preflight_balance_rpc_failed');
    });
    await check('RPC rate-limit (-32005 / 429) → preflight_balance_rpc_failed (fail-open)', async () => {
        rpcResponder = async () => ({ error: '-32005: Too many requests' });
        const r = await _checkBurnerUsdcBalance(TEST_BURNER_PUBKEY, 20000n);
        assert.strictEqual(r.error, 'preflight_balance_rpc_failed');
    });
    // R-pr373-r2-2: "invalid param: pubkey" is NOT a not-found marker —
    // can also surface for other RPC/input issues. Must fail-open.
    await check('"invalid param: pubkey" → preflight_balance_rpc_failed (NOT not-found, R2-2 regression)', async () => {
        rpcResponder = async () => ({ error: 'invalid param: pubkey' });
        const r = await _checkBurnerUsdcBalance(TEST_BURNER_PUBKEY, 20000n);
        assert.strictEqual(r.error, 'preflight_balance_rpc_failed');
        assert.notStrictEqual(r.error, 'insufficient_burner_balance',
            'Must NOT be classified as ATA-not-found (would incorrectly fail-closed)');
    });

    // ── BRANCH 5: malformed RPC response → fail-OPEN ────────────────────────
    await check('RPC returned value without .amount → preflight_balance_rpc_malformed_response', async () => {
        rpcResponder = async () => ({ value: { decimals: 6 } }); // missing amount
        const r = await _checkBurnerUsdcBalance(TEST_BURNER_PUBKEY, 20000n);
        assert.strictEqual(r.error, 'preflight_balance_rpc_malformed_response');
    });
    await check('RPC returned .amount as non-numeric string → preflight_balance_rpc_malformed_response', async () => {
        rpcResponder = async () => ({ value: { amount: 'not-a-number', decimals: 6 } });
        const r = await _checkBurnerUsdcBalance(TEST_BURNER_PUBKEY, 20000n);
        assert.strictEqual(r.error, 'preflight_balance_rpc_malformed_response');
    });

    // ── BRANCH 6: empty RPC result (no value, no error) → fail-OPEN ─────────
    await check('null RPC result → preflight_balance_rpc_empty_response (fail-open)', async () => {
        rpcResponder = async () => null;
        const r = await _checkBurnerUsdcBalance(TEST_BURNER_PUBKEY, 20000n);
        assert.strictEqual(r.error, 'preflight_balance_rpc_empty_response');
        assert.notStrictEqual(r.error, 'insufficient_burner_balance');
    });

    // ── Summary ─────────────────────────────────────────────────────────────
    if (failures > 0) {
        console.error(`\n✗ ${failures} test(s) failed in agent-pay-preflight-balance.test.js`);
        process.exit(1);
    }
    console.log('\n✓ All agent-pay-preflight-balance.test.js cases passed (R-pr373-r3-1 branch coverage)');
})();
