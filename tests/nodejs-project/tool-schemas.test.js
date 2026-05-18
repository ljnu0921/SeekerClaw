#!/usr/bin/env node
// tool-schemas.test.js — regression for the agent-killing bug discovered
// during BAT-582 device test 2026-05-12.
//
// Symptom: every agent turn errored with
//   `API error (400): Invalid schema for function 'agentpay': In context
//    'properties', 'body', 'type', '1', array schema missing items`
// taking down the entire agent (not just agent_pay) because the Anthropic
// API rejects the whole toolset if ANY tool has an invalid input_schema.
//
// Root cause: tools/agent_pay.js declared
//   body: { type: ['object', 'array', 'string'], description: '...' }
// JSON Schema rule: when `type` includes `array`, an `items` schema MUST
// be defined. Validators that accept polymorphic `type` unions still
// enforce per-type constraints (Anthropic strict-mode).
//
// What this test asserts:
//   1. Every tool registered in tools/index.js has an input_schema
//   2. Every input_schema is a JSON object with type === 'object'
//   3. Recursively, anywhere a schema declares `array` (as `type:'array'`
//      OR via `type` array union containing 'array'), `items` MUST be
//      defined.
//   4. Every required property name appears in `properties`.
//
// Run: node tests/nodejs-project/tool-schemas.test.js
//
// Why this exists, not just a Copilot-review rule: schema bugs surface
// only when the agent actually makes an API call with the tools attached.
// Device-side bug, $-affecting, blocked by zero existing automated test.
// This script runs in pre-push (no network, no device) and catches
// regressions before they reach the wire.

'use strict';

const assert = require('assert');
const path = require('path');

const BUNDLE = path.resolve(__dirname, '..', '..', 'app', 'src', 'main', 'assets', 'nodejs-project');

// ── Minimal mocks so requiring tools/index.js doesn't pull the world ────────
// We only need the TOOLS array — handlers and bridge are not exercised.
// Some transitive deps (security.js) read `config` as a destructured object
// and iterate Object.keys(config), so we have to expose a real (if empty)
// object — not undefined.
const configPath = require.resolve(path.join(BUNDLE, 'config.js'));
require.cache[configPath] = {
    id: configPath,
    filename: configPath,
    loaded: true,
    exports: {
        BRIDGE_TOKEN: 'test-token',
        CHANNEL: 'telegram',
        log: () => {},
        workDir: '/tmp/seekerclaw-test',
        config: {},
        REASONING_ENABLED: false,
        MAX_TOOL_USES: 25,
        HARD_MAX_TOOL_RESULT_CHARS: 50_000,
    },
};

// ── Load TOOLS ──────────────────────────────────────────────────────────────
const { TOOLS } = require(path.join(BUNDLE, 'tools', 'index.js'));

assert.ok(Array.isArray(TOOLS), 'TOOLS export must be an array');
assert.ok(TOOLS.length > 0, 'TOOLS array must be non-empty');

// ── Recursive schema walker ─────────────────────────────────────────────────
// Returns a list of issues. Empty list = schema is OK.
function findSchemaIssues(schema, schemaPath /* string */) {
    const issues = [];
    if (schema == null || typeof schema !== 'object') {
        issues.push(`${schemaPath}: schema is not an object (got ${typeof schema})`);
        return issues;
    }

    // Resolve declared type(s) — string OR array of strings.
    const t = schema.type;
    const types = Array.isArray(t) ? t : (typeof t === 'string' ? [t] : []);

    // Rule: any schema that allows `array` must define `items`. The
    // Anthropic API enforces this even when type is a polymorphic union.
    // This is the rule that bit BAT-664 — without `items`, the entire
    // toolset is rejected with HTTP 400 and every agent turn fails.
    if (types.includes('array') && !Object.prototype.hasOwnProperty.call(schema, 'items')) {
        issues.push(`${schemaPath}: declares type 'array' (or union including it) but is missing required 'items' schema`);
    }

    // Rule: any schema that allows `object` and declares `properties`
    // must list `required` entries that all appear in `properties`.
    if (types.includes('object') && schema.properties && schema.required) {
        if (!Array.isArray(schema.required)) {
            issues.push(`${schemaPath}: 'required' must be an array, got ${typeof schema.required}`);
        } else {
            for (const name of schema.required) {
                if (!Object.prototype.hasOwnProperty.call(schema.properties, name)) {
                    issues.push(`${schemaPath}: 'required' lists "${name}" but it's not in properties`);
                }
            }
        }
    }

    // Recurse into nested schemas.
    if (schema.properties && typeof schema.properties === 'object') {
        for (const [k, v] of Object.entries(schema.properties)) {
            issues.push(...findSchemaIssues(v, `${schemaPath}.properties.${k}`));
        }
    }
    if (schema.items && typeof schema.items === 'object' && !Array.isArray(schema.items)) {
        // items can also be `{}` (= "any value") — that's valid and has
        // no nested constraints to walk. Only recurse when there's real
        // structure inside (any non-empty object schema).
        if (Object.keys(schema.items).length > 0) {
            issues.push(...findSchemaIssues(schema.items, `${schemaPath}.items`));
        }
    }
    for (const combinator of ['oneOf', 'anyOf', 'allOf']) {
        if (Array.isArray(schema[combinator])) {
            schema[combinator].forEach((s, i) => {
                issues.push(...findSchemaIssues(s, `${schemaPath}.${combinator}[${i}]`));
            });
        }
    }
    return issues;
}

// ── Run checks ──────────────────────────────────────────────────────────────
console.log(`Validating input_schema for ${TOOLS.length} tools…`);
let failed = 0;
const allIssues = [];

for (const tool of TOOLS) {
    assert.ok(typeof tool.name === 'string' && tool.name.length > 0,
        `tool missing name: ${JSON.stringify(tool).slice(0, 80)}`);
    assert.ok(typeof tool.description === 'string' && tool.description.length > 0,
        `tool ${tool.name}: missing or empty description`);
    assert.ok(tool.input_schema && typeof tool.input_schema === 'object',
        `tool ${tool.name}: missing input_schema`);
    assert.strictEqual(tool.input_schema.type, 'object',
        `tool ${tool.name}: input_schema.type must be 'object' (got ${JSON.stringify(tool.input_schema.type)})`);

    const issues = findSchemaIssues(tool.input_schema, `[${tool.name}].input_schema`);
    if (issues.length > 0) {
        failed++;
        allIssues.push({ tool: tool.name, issues });
    }
}

if (failed > 0) {
    console.error(`\n✗ ${failed} tool(s) have schema issues:\n`);
    for (const { tool, issues } of allIssues) {
        console.error(`  ${tool}:`);
        for (const issue of issues) console.error(`    - ${issue}`);
    }
    console.error('\nThese schemas would be rejected by the Anthropic API,');
    console.error('taking down ALL agent turns (not just calls to the bad tool).');
    process.exit(1);
}

console.log(`✓ All ${TOOLS.length} tool input_schemas pass JSON Schema validity checks`);

// ── Internal self-check: confirm the validator actually catches the bug ─────
// This is meta-test: if someone breaks `findSchemaIssues` (e.g. by removing
// the array-needs-items rule), the rest of the test stays green but we've
// lost the actual regression coverage. So we synthesize the exact buggy
// schema BAT-664 shipped and assert the validator flags it.
const synthBug = {
    type: 'object',
    properties: {
        body: { type: ['object', 'array', 'string'], description: 'oops no items' },
    },
};
const synthIssues = findSchemaIssues(synthBug, '[meta]');
if (synthIssues.length === 0) {
    console.error('✗ META-CHECK FAILED — validator no longer detects the BAT-664 bug shape');
    console.error('  (type union containing "array" without items). The regression');
    console.error('  rule has been weakened — restore the check in findSchemaIssues.');
    process.exit(1);
}
console.log(`✓ Meta-check: validator correctly flags the BAT-664 bug shape (${synthIssues.length} issue${synthIssues.length === 1 ? '' : 's'})`);
