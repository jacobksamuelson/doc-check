#!/usr/bin/env node
// Re-grade saved runs with the current checks, without running Claude again.
// Use it after fixing a check, so old and new runs are scored the same way.
//
//   node evals/regrade.mjs evals/runs/<time>

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { FIXTURES } from './lib/common.mjs';
import { scenarios } from './scenarios.mjs';

const runDir = process.argv[2];
if (!runDir) {
  console.error('Usage: node evals/regrade.mjs evals/runs/<time>');
  process.exit(1);
}

let passed = 0;
let total = 0;
for (const name of readdirSync(runDir).sort()) {
  const resultPath = join(runDir, name, 'result.json');
  if (!existsSync(resultPath)) continue;
  const saved = JSON.parse(readFileSync(resultPath, 'utf8'));
  const s = scenarios.find((x) => x.id === saved.scenario);
  if (!s) continue;
  const docPath = join(runDir, name, 'work', s.file);
  const r = {
    doc: existsSync(docPath) ? readFileSync(docPath, 'utf8') : '',
    original: readFileSync(join(FIXTURES, s.id, 'work', s.file), 'utf8'),
    subagents: saved.reviewerPrompts || [],
    reply: saved.reply || '',
  };
  const checks = Object.entries({ ...s.docChecks, ...s.runChecks }).map(([check, fn]) => {
    const v = fn(r);
    return { check, pass: v === true, detail: v === true ? '' : v };
  });
  const ok = checks.filter((c) => c.pass).length;
  passed += ok;
  total += checks.length;
  console.log(`${name}: ${ok}/${checks.length}${checks.filter((c) => !c.pass).map((c) => `\n  ✗ ${c.check}: ${c.detail}`).join('')}`);
}
console.log(`\nTotal: ${passed}/${total}`);
