// Shared by the tests and the eval: paths and small helpers for reading markdown.

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO = fileURLToPath(new URL('../../', import.meta.url));
export const SKILL = join(REPO, 'skills/doc-check');
export const FIXTURES = join(REPO, 'evals/fixtures');

export const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
export const words = (s) => String(s).split(/\s+/).filter(Boolean).length;

// Text under the first heading containing `title`, up to the next heading of the same or higher level.
// Returns '' when the heading is gone (a removed section holds nothing).
export function section(md, title) {
  const lines = md.split('\n');
  let start = -1;
  let level = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(#+)\s+(.*)$/);
    if (m && m[2].toLowerCase().includes(title.toLowerCase())) {
      start = i + 1;
      level = m[1].length;
      break;
    }
  }
  if (start < 0) return '';
  let end = lines.length;
  for (let i = start; i < lines.length; i++) {
    const m = lines[i].match(/^(#+)\s/);
    if (m && m[1].length <= level) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join('\n');
}

export const bullets = (text) => text.split('\n').filter((l) => /^\s*([-*]|\d+\.)\s+/.test(l));

const NUMBER_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8 };
// "v1 has three parts:" followed by a list: the number must match the list, or be gone.
export function countMatchesList(text) {
  const m = text.match(/\b(one|two|three|four|five|six|seven|eight|\d)\s+(parts|things|pieces|items|features)\b/i);
  if (!m) return true;
  const said = NUMBER_WORDS[m[1].toLowerCase()] ?? Number(m[1]);
  const listed = bullets(text.slice(m.index)).length;
  return said === listed ? true : `says ${m[1]} ${m[2]} but lists ${listed}`;
}

// Share of the original's non-empty lines that are still in the doc word for word.
export function linesKept(original, now) {
  const have = new Set(now.split('\n').map(norm));
  const lines = original.split('\n').map(norm).filter(Boolean);
  return lines.filter((l) => have.has(l)).length / lines.length;
}

// ── Checks shared by scenarios ──────────────────────────────────────────────────

export const noUpdateLabels = (r) => {
  const m = r.doc.match(/^\W*(update|updated|correction|corrected|edit|edited|note)\W*\s*[:(—-]/im);
  return m ? `found a "${m[0].trim()}" label` : true;
};

export const keptVerbatim = (snippet) => (r) => (norm(r.doc).includes(norm(snippet)) ? true : `changed or removed: "${snippet.slice(0, 60)}…"`);

export const reviewerRan = (r) => (r.subagents.length ? true : 'no reviewer agent was started');
export const noReviewer = (r) => (r.subagents.length ? `started ${r.subagents.length} agent(s) for a short reply` : true);

export const shortReport = (max) => (r) => {
  const n = words(r.reply);
  if (!n) return 'no reply';
  return n <= max ? true : `report is ${n} words (max ${max})`;
};
