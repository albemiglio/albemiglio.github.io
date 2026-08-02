// node check.mjs — palette contrast + outbound links. Exits 1 if anything is broken.
//
// Contrast thresholds: 4.5:1 for text (WCAG 1.4.3 AA), 3:1 for the borders that act
// as the visible boundary of a control (1.4.11) — cards, chips and buttons sit on
// --surface, which is only 1.15:1 against --bg, so their border carries the shape.
// The --border hairlines are pure decoration (row rules, section edges) and are not
// listed: nothing depends on seeing them.
import { readFileSync } from 'node:fs';

const BG = '#0B0D10', SURFACE = '#12151B', TERM = '#0E1117';
const TEXT = '#E7E9EE', MUTED = '#9AA0AB', ACCENT = '#E8E0D0', LINE = '#6A6862';

const pairs = [
  // Body text
  ['text on page background',            TEXT,   BG,      4.5],
  ['text on banded section',             TEXT,   SURFACE, 4.5],
  ['text on card / chip surface',        TEXT,   SURFACE, 4.5],
  ['text in terminal card',              TEXT,   TERM,    4.5],
  // Secondary text — nav, dates, roles, card copy, footer
  ['muted on page background',           MUTED,  BG,      4.5],
  ['muted on banded section',            MUTED,  SURFACE, 4.5],
  ['muted on card / chip surface',       MUTED,  SURFACE, 4.5],
  ['muted in terminal card',             MUTED,  TERM,    4.5],
  // Accent text — kickers, // marks, tags, contact address
  ['accent on page background',          ACCENT, BG,      4.5],
  ['accent on banded section',           ACCENT, SURFACE, 4.5],
  ['accent on card / chip surface',      ACCENT, SURFACE, 4.5],
  ['accent in terminal card',            ACCENT, TERM,    4.5],
  // Filled button: dark label on accent
  ['button label on accent fill',        BG,     ACCENT,  4.5],
  // Control boundaries and focus ring (non-text)
  ['button/card border on background',   LINE,   BG,      3.0],
  ['button/card border on band',         LINE,   SURFACE, 3.0],
  ['contact underline on band',          LINE,   SURFACE, 3.0],
  ['focus ring on page background',      ACCENT, BG,      3.0],
  ['focus ring on banded section',       ACCENT, SURFACE, 3.0],
];

const lum = h => {
  const c = h.replace('#', '').match(/../g).map(x => parseInt(x, 16) / 255)
    .map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

let fail = false, warn = false;

for (const [what, fg, bg, min] of pairs) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) fail = true;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2).padStart(5)}:1  (min ${min.toFixed(1)})  ${what}  [${fg} on ${bg}]`);
}

// Read the links straight out of the page so this can't drift from what ships.
const html = readFileSync(new URL('index.html', import.meta.url), 'utf8');
const links = [...new Set(html.match(/https:\/\/[^"']+/g) ?? [])]
  .filter(u => !u.includes('fonts.google') && !u.includes('gstatic'));

// These two answer bots with 999 / 403 no matter what. Report, don't fail the run.
const botBlocked = ['linkedin.com', 'builtbybit.com'];

console.log('');
for (const url of links) {
  const soft = botBlocked.some(h => url.includes(h));
  let label, status;
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    status = res.status;
    label = res.status < 400 ? 'PASS' : (soft ? 'WARN' : 'FAIL');
  } catch (e) {
    status = e.message;
    label = soft ? 'WARN' : 'FAIL';
  }
  if (label === 'FAIL') fail = true;
  if (label === 'WARN') warn = true;
  console.log(`${label}  ${url} -> ${status}${label === 'WARN' ? '  (blocks bots — open it by hand)' : ''}`);
}

if (warn) console.log('\nWARN links are bot-blocked, not dead. Check them in a browser after any URL change.');
process.exit(fail ? 1 : 0);
