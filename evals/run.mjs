#!/usr/bin/env node
// Eval: does a fresh Claude check a doc well with the skill? For each scenario it
// makes a clean folder with the skill, the person's rules (CLAUDE.md), the doc and
// its sources, runs `claude -p` in safe mode (so your own CLAUDE.md, skills and
// plugins stay out of it), then grades the final doc and the run.
//
//   node evals/run.mjs                    all scenarios, once each
//   node evals/run.mjs quick-reply        one scenario
//   node evals/run.mjs --runs 2           each scenario twice (results vary; watch the pass rate)
//   node evals/run.mjs --model sonnet     pick the model (default: your Claude Code default)
//   node evals/run.mjs --skill <folder>   test another copy of the skill (e.g. an old version)
//
// Runs go in parallel. Costs Claude usage only, capped per run by --budget (default $4).

import { mkdirSync, cpSync, symlinkSync, readFileSync, writeFileSync, existsSync, createWriteStream } from 'node:fs';
import { spawn } from 'node:child_process';
import { join, resolve } from 'node:path';
import { REPO, SKILL, FIXTURES } from './lib/common.mjs';
import { scenarios } from './scenarios.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args.splice(i, 2)[1] : fallback;
};
const model = flag('model', null);
const budget = flag('budget', '4');
const runs = Number(flag('runs', '1'));
const label = flag('label', '');
const skillDir = resolve(flag('skill', SKILL));
const wanted = args.length ? scenarios.filter((s) => args.includes(s.id)) : scenarios;
if (!wanted.length) {
  console.error(`Unknown scenario. Choose from: ${scenarios.map((s) => s.id).join(', ')}`);
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + (label ? `-${label}` : '');
const runDir = join(REPO, 'evals/runs', stamp);

function promptFor(s) {
  return [
    'You are being evaluated on how well you use the doc-check skill for a person.',
    'The skill is in ./.claude/skills/doc-check. Read its SKILL.md first and follow it exactly.',
    "The person's own instructions (their CLAUDE.md) are in ./CLAUDE.md. Read them; they apply to everything you write for them.",
    'There is no live person in this session. If the skill says to ask something, put the question in your final reply instead of waiting.',
    'Stay inside this folder. Edit the document in place.',
    '',
    ...s.situation,
    '',
    'When you are done, write your final reply to the person, the way the skill says to report.',
  ].join('\n');
}

const ALLOWED = ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Agent', 'Task', 'Bash(ls:*)', 'Bash(cat:*)'];

async function runScenario(s, n) {
  const dir = join(runDir, runs > 1 ? `${s.id}-${n}` : s.id);
  const src = join(FIXTURES, s.id);
  mkdirSync(join(dir, '.claude/skills'), { recursive: true });
  symlinkSync(skillDir, join(dir, '.claude/skills/doc-check'));
  cpSync(join(FIXTURES, 'CLAUDE.md'), join(dir, 'CLAUDE.md'));
  cpSync(join(src, 'work'), join(dir, 'work'), { recursive: true });
  if (existsSync(join(src, 'sources'))) cpSync(join(src, 'sources'), join(dir, 'sources'), { recursive: true });

  const cli = ['-p', promptFor(s), '--safe-mode', '--output-format', 'stream-json', '--verbose', '--no-session-persistence', '--max-budget-usd', budget, '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}', '--allowedTools', ...ALLOWED];
  if (model) cli.push('--model', model);

  const transcript = createWriteStream(join(dir, 'transcript.jsonl'));
  const tools = [];
  let result = {};
  const started = Date.now();
  await new Promise((resolve) => {
    const child = spawn('claude', cli, { cwd: dir, env: process.env });
    let buf = '';
    child.stdout.on('data', (d) => {
      transcript.write(d);
      buf += d;
      let nl;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl);
        buf = buf.slice(nl + 1);
        try {
          const ev = JSON.parse(line);
          for (const part of ev.message?.content || []) {
            if (part.type === 'tool_use') tools.push({ name: part.name, input: part.input, sub: !!ev.parent_tool_use_id });
          }
          if (ev.type === 'result') result = ev;
        } catch {
          /* partial line */
        }
      }
    });
    child.stderr.on('data', (d) => transcript.write(d));
    child.on('close', resolve);
  });
  transcript.end();

  const docPath = join(dir, 'work', s.file);
  const r = {
    doc: existsSync(docPath) ? readFileSync(docPath, 'utf8') : '',
    original: readFileSync(join(src, 'work', s.file), 'utf8'),
    tools,
    subagents: tools.filter((t) => !t.sub && (t.name === 'Agent' || t.name === 'Task')),
    reply: result.result || '',
  };
  const grade = (set) =>
    Object.entries(set).map(([name, fn]) => {
      let verdict;
      try {
        verdict = fn(r);
      } catch (e) {
        verdict = `check crashed: ${e.message}`;
      }
      return { name, pass: verdict === true, detail: verdict === true ? '' : String(verdict) };
    });
  const checks = [...grade(s.docChecks), ...grade(s.runChecks)];
  const summary = {
    scenario: s.id,
    run: n,
    passed: checks.filter((c) => c.pass).length,
    total: checks.length,
    costUsd: result.total_cost_usd ?? null,
    minutes: +((Date.now() - started) / 60000).toFixed(1),
    turns: result.num_turns ?? null,
    error: result.is_error ? result.result : null,
    checks,
    reply: r.reply,
    reviewerPrompts: r.subagents.map((t) => t.input?.prompt || ''),
  };
  writeFileSync(join(dir, 'result.json'), JSON.stringify(summary, null, 2));
  return summary;
}

mkdirSync(runDir, { recursive: true });
console.log(`Eval run ${stamp}${model ? ` (model ${model})` : ''}, ${runs} run(s) per scenario. Results in evals/runs/${stamp}/`);
const jobs = wanted.flatMap((s) => Array.from({ length: runs }, (_, i) => runScenario(s, i + 1)));
const all = await Promise.all(jobs);

for (const s of wanted) {
  const mine = all.filter((o) => o.scenario === s.id);
  const p = mine.reduce((t, o) => t + o.passed, 0);
  const t = mine.reduce((t, o) => t + o.total, 0);
  const cost = mine.reduce((t, o) => t + (o.costUsd || 0), 0);
  console.log(`\n▸ ${s.id}: ${p}/${t} checks passed · $${cost.toFixed(2)}`);
  for (const name of mine[0].checks.map((c) => c.name)) {
    const res = mine.map((o) => o.checks.find((c) => c.name === name));
    const ok = res.filter((c) => c.pass).length;
    const why = res.filter((c) => !c.pass).map((c) => c.detail);
    console.log(`  ${ok === res.length ? '✓' : ok ? '~' : '✗'} ${name} (${ok}/${res.length})${why.length ? `: ${[...new Set(why)].join(' | ')}` : ''}`);
  }
  for (const o of mine) if (o.error) console.log(`  run ${o.run} error: ${o.error}`);
}
const passed = all.reduce((t, s) => t + s.passed, 0);
const total = all.reduce((t, s) => t + s.total, 0);
const cost = all.reduce((t, s) => t + (s.costUsd || 0), 0);
writeFileSync(join(runDir, 'summary.json'), JSON.stringify({ stamp, model, runs, passed, total, costUsd: +cost.toFixed(2), scenarios: all.map(({ scenario, run, passed, total, costUsd, minutes }) => ({ scenario, run, passed, total, costUsd, minutes })) }, null, 2));
console.log(`\nTotal: ${passed}/${total} checks passed · $${cost.toFixed(2)} Claude usage`);
process.exit(passed === total ? 0 : 1);
