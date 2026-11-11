// Eval scenarios: a doc with planted problems, what the assistant knows from the
// conversation so far, and what a good check does.
//
// docChecks grade the final document only. tests.mjs runs them against the
// untouched fixture (planted problems must fail) and the hand-fixed answer key in
// expected/ (everything must pass), so a broken check shows up for free.
// runChecks grade how the run went: the reviewer agent and the report.

import { section, bullets, countMatchesList, linesKept, noUpdateLabels, keptVerbatim, reviewerRan, noReviewer, shortReport } from './lib/common.mjs';

const WHY_NOW =
  'Students run the same job search over and over. In our October interviews, nine of the twelve students we talked to said they retype the same filters every time they open the app, and several said they had given up on filters altogether because it felt like too much work to set them up again on every visit. I think this is the single most annoying small thing in search right now, and it is cheap to fix, which is why I want it in this cycle rather than the next one.';

export const scenarios = [
  {
    id: 'drifted-proposal',
    about: 'A proposal edited comment by comment until it drifted (the Nov 11 case), with the person’s own paragraph and a firm decision in it.',
    file: 'doc.md',
    situation: [
      'You have been editing ./work/doc.md with Sam, comment by comment, and just finished the last round of edits.',
      'What you know from the conversation:',
      '- The doc goes to Sam’s eng lead and design lead to approve the v1 scope.',
      '- Sam wrote the "Why now" section himself and pasted it in; those are his words.',
      '- In chat Sam decided email alerts are out of v1 and come next cycle.',
      '- On migrating old bookmarked jobs Sam said: "Final answer, we\'re not doing it."',
      '- Sam confirmed the limit of 20 saved searches on Nov 6.',
    ],
    docChecks: {
      'Image reference points at the image': (r) => {
        const lines = r.doc.split('\n');
        const img = lines.findIndex((l) => /!\[.*\]\(filter-bar\.png\)/.test(l));
        const above = lines.findIndex((l) => /(pictured|shown) above/i.test(l));
        const below = lines.findIndex((l) => /(pictured|shown) below/i.test(l));
        if (above >= 0 && (img < 0 || img > above)) return '"pictured above" but the image is below it';
        if (below >= 0 && (img < 0 || img < below)) return '"pictured below" but the image is above it';
        return true;
      },
      'Email alerts only in "Not in v1"': (r) => {
        const inV1 = /email alert/i.test(section(r.doc, 'proposing'));
        const out = /email alert/i.test(section(r.doc, 'not in v1'));
        if (inV1) return 'email alerts still listed in v1';
        return out ? true : 'email alerts dropped from "Not in v1"';
      },
      'Count matches the v1 list': (r) => countMatchesList(section(r.doc, 'proposing')),
      'Decided sharing is not an open v1 question': (r) => {
        const q = section(r.doc, 'open question').split('\n').find((l) => /shar/i.test(l));
        // Moving it to "after v1" is a fair fix; asking it as if v1 were still open is not.
        return !q || /after v1|v2|next cycle|later|future|beyond v1/i.test(q) ? true : 'sharing still an open v1 question (decided private on Nov 4)';
      },
      'Decided limit is not an open question': (r) => (/10 or 20|limit/i.test(section(r.doc, 'open question')) ? 'the 20-search limit is still an open question' : true),
      'Kept the real open question': (r) => (/retired/i.test(section(r.doc, 'open question')) ? true : 'removed the retired-filter question, which is still open'),
      "Kept Sam's own paragraph word for word": keptVerbatim(WHY_NOW),
      "Kept Sam's firm decision word for word": keptVerbatim('We will not migrate old bookmarked jobs into saved searches.'),
      'No "Update:" labels': noUpdateLabels,
    },
    runChecks: {
      'Started a separate reviewer agent': reviewerRan,
      'Report is short (≤ 220 words)': shortReport(220),
    },
  },
  {
    id: 'metrics-update',
    about: 'A weekly metrics update with numbers that disagree with the sources, an overclaim, an unsupported claim, a banned word and leftovers.',
    file: 'doc.md',
    sources: true,
    situation: [
      'You wrote ./work/doc.md for Sam: a weekly metrics update for his exec team. It is ready except for the check.',
      'The sources it came from are in ./sources (a query result and a note from the data team).',
    ],
    docChecks: {
      'Activation matches the source (38.4%)': (r) => (/42\s?%/.test(r.doc) ? 'still says 42%' : /38\.4\s?%/.test(r.doc) ? true : 'no 38.4% in the doc'),
      'New teams matches the source (1,204)': (r) => (/1,?240/.test(r.doc) ? 'still says 1,240' : /1,?204/.test(r.doc) ? true : 'no 1,204 in the doc'),
      'No causal claim the source rules out': (r) => {
        // "We can't say the checklist caused it" is the right fix; "the checklist caused the lift" is not.
        const claims = r.doc.split(/(?<=[.!?])\s+|\n/).filter((x) => /\bcaused\b|\bdrove\b|\bthanks to\b|\bbecause of the\b/i.test(x));
        const bare = claims.find((x) => !/\b(can'?t|cannot|not|no|unclear|may|might|whether)\b/i.test(x));
        return bare ? `still claims cause: "${bare.trim()}"` : true;
      },
      'Unsupported churn claim removed': (r) => (/third straight week/i.test(r.doc) ? 'still claims churn fell three weeks running (no source)' : true),
      'Says "teams", not "orgs"': (r) => (/\borg(s|anizations?)\b/i.test(r.doc) ? 'still says orgs' : true),
      'No placeholders or doubled words': (r) => (/TODO|\bthe the\b/i.test(r.doc) ? 'TODO or "the the" left in' : true),
      'No "Update:" labels': noUpdateLabels,
    },
    runChecks: {
      'Started a separate reviewer agent': reviewerRan,
      'Report is short (≤ 220 words)': shortReport(220),
    },
  },
  {
    id: 'quick-reply',
    about: 'A two-sentence Slack reply with a wrong date and two rule breaks. A short reply gets the quick check, not a reviewer agent.',
    file: 'reply.md',
    sources: true,
    situation: [
      'Sam asked you to draft his reply to Dana in Slack. Your draft is in ./work/reply.md.',
      'The thread it answers is in ./sources/thread.md.',
    ],
    docChecks: {
      'Date matches the thread (Fri Nov 20)': (r) => (/Nov(ember)?\.? 19\b/i.test(r.doc) ? 'still says Nov 19' : /Nov(ember)?\.? 20\b/i.test(r.doc) ? true : 'no Nov 20 in the reply'),
      'No exclamation marks': (r) => (r.doc.includes('!') ? 'has an exclamation mark' : true),
      'No "just"': (r) => (/\bjust\b/i.test(r.doc) ? 'still says "just"' : true),
    },
    runChecks: {
      'No reviewer agent for a short reply': noReviewer,
      'Report is short (≤ 120 words)': shortReport(120),
    },
  },
  {
    id: 'clean-plan',
    about: 'A short rollout plan with nothing wrong. A good check leaves it nearly as it was.',
    file: 'doc.md',
    situation: [
      'You wrote ./work/doc.md for Sam: the rollout plan for saved searches, for his eng lead and the support team. It is ready except for the check.',
      'Every fact in it (dates, names, thresholds, the flag, the channel, what Marco confirmed) came from Sam in this conversation. There are no other sources.',
    ],
    docChecks: {
      'Left the doc nearly as it was (≥ 80% of lines kept)': (r) => {
        const kept = linesKept(r.original, r.doc);
        return kept >= 0.8 ? true : `only ${Math.round(kept * 100)}% of lines kept`;
      },
      'Kept every metric row': (r) => (bullets(r.doc).length >= 3 && (r.doc.match(/^\|/gm) || []).length >= 5 ? true : 'lost rows from the table or the Who list'),
      'No "Update:" labels': noUpdateLabels,
    },
    runChecks: {
      'Started a separate reviewer agent': reviewerRan,
      'Report is short (≤ 150 words)': shortReport(150),
    },
  },
];
