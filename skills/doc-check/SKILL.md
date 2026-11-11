---
name: doc-check
description: Check a written deliverable as a whole before it reaches the person. Use after creating or editing any document, write-up, proposal, scope, memo, report, page, deck or long reply draft, and before saying it's done; also when asked to "check my doc", "review this doc", "does this make sense", "sanity check this", or "clean up the doc". A fresh reviewer reads the whole thing cold, then you fix what it finds. Run it after every round of edits, not only the first draft, because piecemeal edits are where docs drift. Short replies (a Slack message, a few sentences) get a quick check without the reviewer.
---

# Doc check

Docs go wrong between edits, not inside them. Each fix is right where it's made, but the whole drifts: a section that moved still says "above", an item lands in two lists, a table disagrees with the prose, a decision made in chat is still listed as an open question, and the opening no longer matches what the doc turned into. The author can't see this, because they read what they meant. So the check is done by a reader who doesn't know what you meant.

**Run it after every round of edits, before you report back.** Fix what it finds, then report. The person should get a doc that already makes sense, not a list of problems.

**Short replies get the quick check** (end of this page) instead of steps 1–5: a Slack or email reply, a comment, anything a few sentences long.

## 1. Read the whole doc as it stands now

Read the full current text, not your memory of it and not only the parts you touched. Other people may have edited it since your last read; their words stand. For a doc in a docs tool, read the whole tab. For an HTML page, read the file. For a deck, read every slide.

## 2. Gather what the reviewer needs, and nothing else

- **The doc's full text**, with images listed by their alt text and the sentence that introduces each.
- **The ask, in one or two lines**: who reads it and what it's for (decide, approve, scope, inform).
- **The writing rules** the person has given: their CLAUDE.md, memory files and anything said in this conversation about length, tone, structure or words to avoid.
- **The sources**: the queries, files, tickets and threads the doc's facts came from, with the numbers as they came back.
- **What's settled**, quoted: text the person wrote or pasted in themselves, and decisions they stated ("we're not doing X", "the limit is 20"). These stay. The reviewer may question them but not cut or reword them.
- **Where each claim came from**: which claims you checked against a source (name it) and which you inferred, remembered or wrote without checking. Be honest; the unchecked ones are where a fresh reader helps most.

Do **not** pass your reasoning, your plan or your summary of what changed. Where a claim came from is not reasoning; why you structured the doc this way is. The reviewer has to read the doc the way its reader will.

## 3. Get a fresh review

Start a separate reviewer agent (a general-purpose subagent) with the prompt below. If you can't start one, do the review yourself as a stranger would: read top to bottom once without stopping to fix, write down every finding, then fix.

```
You are reviewing a document before it goes to its reader. You did not write it
and you don't know what the author meant: judge only what is on the page.

The ask: <who reads it, and what it's for>
The writing rules: <the person's rules, quoted>
The sources: <queries, files, tickets, threads, with the numbers they returned>

Settled, not up for cutting or rewording: <the person's own text and stated
decisions, quoted>. If one of these looks wrong or clashes with the rest of
the doc, raise it as a question for the person, never as a cut or a rewrite.

Checked against a source: <claims, each with its source>
Not checked (inferred, remembered or unsourced): <claims>
Test the unchecked claims hardest. A claim no source supports is a finding.

The document:
<full text>

Report findings under these headings. Quote the exact words for each, say why
it's a problem, and give the fix. Say "none" under a heading with nothing.

1. Story. After the first screen, what does this doc propose or answer? Is that
   the right thing to lead with? Does each section earn its place, in the order a
   reader needs it? Are there leftovers from an earlier version of the doc?
2. Consistency. Does any item appear in two places, or in places that disagree
   (an MVP list vs a skip list, a table vs the prose, a count vs the list it
   counts)? Is anything decided still listed as open? Are names, owners,
   numbers and terms the same everywhere?
3. References. Does every "above", "below", "see X", caption and image intro
   point at what is actually there? Do links and ticket ids look right?
4. Facts. Does every number, name, date and technical claim match the sources?
   Do dates match their weekdays? Flag anything the sources don't support, and
   anything stated more surely than the sources allow.
5. Rules. Every place the writing rules are broken.
6. Fragments. Typos, half-finished sentences, placeholders, doubled words.
7. Cut. What could go without the reader losing anything: repeats, restated
   points, filler. Never the settled text above.

If the doc is in good shape, say so and keep the list short. Don't invent
findings to fill the headings.

End with the three changes that would most improve the doc.
```

## 4. Fix, then check again if needed

Go through the findings one at a time and settle each one: fix it, turn it into a question for the report, or drop it because it's wrong. None should slip by unhandled.

- Fix everything certain: consistency, references, facts, rule breaks, fragments, cuts. Fold each fix into the existing text: no "Update:" notes, no "Correction:", no narrating what changed. The doc reads as if it was always right. When the doc records a decision and an open question or list elsewhere contradicts it, the recorded decision wins: fix the other place, no source needed.
- **The person's own words and decisions stay.** Don't cut, reword or "tighten" text they wrote, or reopen a decision they stated, even when the reviewer suggests it. If one looks wrong, ask in the report. The same goes for anyone else's words: fix only obvious typos, and lay anything bigger as a suggestion if the tool has them, or list it in the report.
- **Change only what a finding calls for.** A doc that checks out clean should come back nearly as it was. Don't rewrite good sentences to show work.
- **Story problems** (wrong lead, wrong order, a section that doesn't belong): fix them when the ask allows restructuring. If the fix changes what the doc proposes, ask the person instead of deciding.
- If the fixes moved or rewrote whole sections, run the review once more. Stop after two passes.

## 5. Report

Keep it short, under 150 words: the person wants the doc, not a review of it. Lead with one line on where the doc stands, then at most:
- **up to five changes** they'd want to know about (a moved section, a cut table, a fact corrected against its source), one short line each, saying what changed, not why, unless they need the why to act, and
- **up to three questions** you couldn't resolve, most important first, each one or two sentences ending with the option you recommend.

Leave out typo fixes, what you left alone and why, reviewer suggestions you didn't take, and any summary of the doc. If the doc was clean, the whole report can be one line: "Checked, no changes." plus any real question. Don't reopen a decision the doc records as made or approved unless it's contradicted somewhere.

## Quick check for short replies

For a reply, comment or message of a few sentences, skip the reviewer agent. Read it once as the person receiving it would, then check:

- **Facts:** every date, weekday, number, name and promise matches the thread or source it answers.
- **The question:** it answers what was actually asked.
- **Rules:** the person's writing rules (banned words, punctuation, tone).
- **Fragments:** typos, doubled words, placeholders.

Fix in place and change nothing else. Report in two or three lines: the reply as it stands, and anything you corrected that the person should know (a wrong date, say). Ask only if a fact can't be settled from the source.

## What a clean doc looks like

- The first screen says what it proposes or answers, in plain words.
- Every item lives in exactly one place, and lists, tables and prose agree.
- Decisions are stated as decisions; only real unknowns are open questions, each with an owner.
- Every reference resolves, every image is introduced by the sentence before it, and every number traces to a source.
- The person's own words and decisions are as they left them.
- It reads as the current state, never as a log of how it got there.
- It is as short as it can be and still carry what the reader needs.
