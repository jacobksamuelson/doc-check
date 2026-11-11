#!/usr/bin/env node
// Free, fast test of the eval's own checks. For each scenario:
//   - the untouched fixture must FAIL every check that guards a planted problem
//     (checks that guard what must be kept should pass on it), and
//   - the hand-fixed answer key in expected/ must PASS every doc check.
// If either is wrong, the check is broken, not the skill.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FIXTURES } from './lib/common.mjs';
import { scenarios } from './scenarios.mjs';

// Checks that pass on the untouched fixture by design (they guard against over-editing).
const KEEP = /^(Kept|Left|No "Update:")/;

let failures = 0;
for (const s of scenarios) {
  const original = readFileSync(join(FIXTURES, s.id, 'work', s.file), 'utf8');
  const fixed = readFileSync(join(FIXTURES, s.id, 'expected', s.file), 'utf8');
  console.log(`\n▸ ${s.id}`);
  for (const [name, fn] of Object.entries(s.docChecks)) {
    const onOriginal = fn({ doc: original, original });
    const onFixed = fn({ doc: fixed, original });
    const originalOk = KEEP.test(name) ? onOriginal === true : onOriginal !== true;
    const fixedOk = onFixed === true;
    const ok = originalOk && fixedOk;
    if (!ok) failures++;
    console.log(`  ${ok ? '✓' : '✗'} ${name}${originalOk ? '' : `  [fixture: ${onOriginal === true ? 'passed, should fail' : onOriginal}]`}${fixedOk ? '' : `  [answer key: ${onFixed}]`}`);
  }
}
console.log(failures ? `\n${failures} check(s) broken` : '\nAll checks behave');
process.exit(failures ? 1 : 0);
