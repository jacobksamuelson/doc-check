# Tests and evals

| | What it checks | Run it after | Cost |
|---|---|---|---|
| `node evals/tests.mjs` | The eval's own checks: planted-problem checks fail on the untouched doc, and every doc check passes on a hand-fixed answer key | changing checks or test docs | free, instant |
| `node evals/run.mjs --runs 2` | The skill: a fresh Claude checks four docs and is graded pass/fail | changing `SKILL.md` | $2.08–2.44 per full run |

Results vary between runs, so run each scenario twice and watch the pass rate.

## How a run works

For each scenario, `run.mjs` makes a clean folder with the skill, a pretend person's rules (`fixtures/CLAUDE.md`), the doc and its sources. It runs `claude -p` with `--safe-mode`, so your own CLAUDE.md, skills and plugins stay out of it. It then grades the final doc and the run: whether a reviewer agent ran, and how long the report was.

| Scenario | Planted problems | Also checks |
|---|---|---|
| `drifted-proposal`: a proposal edited comment by comment | stale "pictured above", an item in two lists, a count that doesn't match its list, two decided items still listed as open | the person's own paragraph and firm decision come back word for word; a real open question stays |
| `metrics-update`: a metrics update and its sources | two numbers that don't match the source, a causal claim the source rules out, an unsourced claim, a banned word, a TODO, a doubled word | |
| `quick-reply`: a two-sentence Slack reply | wrong date, an exclamation mark, "just" | no reviewer agent for something this short |
| `clean-plan`: a doc with nothing wrong | none | at least 80% of lines come back unchanged |

Each run is saved locally in `evals/runs/<time>[-<label>]/<scenario>[-<n>]/` with the transcript, the final doc and `result.json` (including the prompt the reviewer got). That folder isn't committed.

```bash
node evals/run.mjs                              # all scenarios, once
node evals/run.mjs quick-reply                  # one scenario
node evals/run.mjs --runs 2 --label try         # twice each, folder tagged "try"
node evals/run.mjs --skill path/to/old/doc-check  # test another copy of the skill
node evals/run.mjs --model sonnet --budget 2    # another model; cap each run at $2 (default $4)
node evals/regrade.mjs evals/runs/<folder>      # re-score saved runs after changing a check
```

## Adding a scenario

1. Add `fixtures/<id>/work/<file>` (the doc with planted problems), `fixtures/<id>/expected/<file>` (the same doc fixed by hand) and, if needed, `fixtures/<id>/sources/`.
2. Add the scenario to `scenarios.mjs`: the situation as the assistant knows it, `docChecks` (graded on the final doc) and `runChecks` (graded on the run). Start the names of checks that guard what must be kept with "Kept", "Left" or "No "Update:"" so `tests.mjs` expects them to pass on the untouched doc.
3. Run `node evals/tests.mjs` until every check behaves, then run the eval.

Grade outcomes, not wording, and accept any fair fix. The first sharing check failed runs that reworded the question to "after v1", which was a good fix. A clean doc has to be actually clean: the first `clean-plan` had real gaps, and the reviewer rightly found them.

## Results

Nov 11, 2026. Four scenarios, two runs each, 60 checks, graded with the current checks and test docs:

| Skill | Passed | Misses |
|---|---|---|
| v0.1.0 | 50/60 | every report over its word limit (345–423 words on the proposal, against 220); a reviewer agent started for a two-sentence reply |
| v0.2.0 | 59/60 | one run left the decided sharing question open |

The v0.1.0 score combines the baseline run (re-scored) with a re-run of `clean-plan` on the current doc. The v0.2.0 score is the `v0.2.0-release` run.

The sharing question is the one to watch. In the last eight runs the reviewer flagged it every time. The misses came from the author, who sometimes asked the person about it, or dropped it, instead of fixing it.
