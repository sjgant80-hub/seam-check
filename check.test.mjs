// check.test.mjs — the ownership question, falsifiable. Load-bearing: the title-first
// intent law (cap, first body line, two-token floor), the κ boundary EXACT at the decision
// seam, door words getting an ownership answer (never a refusal), the comment pinned as a
// literal (marker-first, reruns edit not spam), and the exit law's three temperatures
// (advisory 0 / wall 1 / broken-config 2). Pinned numerically — a test that derives its
// expectation from the export follows the mutant.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as C from './check.mjs';
import { KAPPA as SEAM_KAPPA } from './render.mjs';

const SHADOW = [
  { name: 'witnessy', desc: 'gate build mutation fuzz test theatre tool', url: 'https://x/witnessy' },
  { name: 'payflow', desc: 'payment processing checkout flow engine', url: 'https://x/payflow' },
  { name: 'meshy', desc: 'sovereign mesh transport' },
];

test('THE CONSTANTS — pinned, and one κ with the seam', () => {
  assert.equal(C.KAPPA, 0.618);
  assert.equal(SEAM_KAPPA, 0.618);
  assert.equal(C.INTENT_CAP, 400);
  assert.equal(C.MARKER, '<!-- seam-check -->');
});

test('INTENT — title first, one body line, capped, two-token floor', () => {
  const t = C.prIntent('Add mutation gate', 'ignored?\n\nfirst real line here\nsecond line zebra');
  assert.ok(t.ok);
  assert.ok(t.tokens.includes('mutation') && t.tokens.includes('ignored'), 'title + the FIRST non-empty body line');
  assert.ok(!t.tokens.includes('zebra'), 'later body lines never drown the signal');
  const longTitle = Array.from({ length: 80 }, (_, i) => 'w' + String(i).padStart(3, '0')).join(' '); // 399 chars
  const capped = C.prIntent(longTitle, 'qqqq');
  assert.equal(capped.tokens.length, 80, 'the cap holds at ' + C.INTENT_CAP);
  assert.ok(!capped.tokens.includes('qqqq'), 'text beyond the cap is not considered');
  const short = C.prIntent('fix the parser', 'qqqq extra');
  assert.ok(short.tokens.includes('qqqq'), 'under the cap, the first body line IS considered');
  assert.ok(C.prIntent('some intent title', '\nzebra').tokens.includes('zebra'),
    'a LEADING EMPTY line never eats the first real one — non-empty means non-empty');
  assert.deepEqual(C.prIntent('mutation gate', '').tokens, ['mutation', 'gate'],
    'exactly two tokens IS an intent — the floor is below 2, not at it');
  assert.match(C.prIntent('', 'body').why, /no title has no intent/);
  assert.equal(C.prIntent('', 'body').neutral, true, 'thin PRs are neutral, never red');
  assert.match(C.prIntent('   ', null).why, /no title/);
  assert.match(C.prIntent('Fix', '').why, /label, not an intent/);
  assert.match(C.prIntent('the and was', '').why, /too little to check/);
});

test('SPECTRUM — exact supports, sorted, refusals name the law and flag config', () => {
  const it = C.prIntent('sign every envelope with sovereign keys', '');
  const sp = C.spectrumOf(it.tokens, [
    { name: 'signer', desc: 'sign envelope sovereign keys tool', url: 'https://x/s' },
    { name: 'meshy', desc: 'sovereign mesh' },
  ]);
  assert.ok(sp.ok);
  assert.deepEqual(sp.scored.map(({ name, url, support }) => ({ name, url, support })), [
    { name: 'signer', url: 'https://x/s', support: 0.8 },
    { name: 'meshy', url: null, support: 0.2 },
  ], 'exact interference, provenance kept, missing url honest as null');
  const empty = C.spectrumOf(it.tokens, []);
  assert.match(empty.why, /empty shadow answers nothing/);
  assert.equal(empty.config, true, 'a broken shadow is a CONFIG error');
  assert.equal(C.spectrumOf(it.tokens, [{ name: 'x' }]).config, true);
  assert.match(C.spectrumOf(it.tokens, [{ name: 'x' }]).why, /undescribed repo is invisible/);
  assert.match(C.spectrumOf([], SHADOW).why, /needs the intent tokens/);
  assert.match(C.spectrumOf(['', 'abc'], SHADOW).why, /needs the intent tokens/, 'an empty-string token is not a token');
  assert.equal(C.spectrumOf(it.tokens, [null]).ok, false, 'a null fold is refused, never thrown on');
  assert.equal(C.spectrumOf(it.tokens, [{ name: '', desc: 'described' }]).config, true, 'an EMPTY name is no name');
  assert.equal(C.spectrumOf(it.tokens, [{ name: 'ok', desc: 7 }]).config, true, 'a non-string desc is no description');
});

test('DECISION — the κ boundary EXACT: 0.618 owns, 0.617 does not; κ/2 likewise', () => {
  const row = (name, support, hit = []) => ({ name, url: null, support, hit });
  const owned = C.decideOwnership([row('a', 0.618)], 10);
  assert.equal(owned.verdict, 'already-owned');
  assert.equal(owned.support, 0.618, 'at κ exactly, the org owns it — >= not >');
  assert.equal(C.decideOwnership([row('a', 0.617)], 10).verdict, 'novel');
  // partly: both at exactly κ/2, union at exactly κ (309 of 500)
  const h1 = Array.from({ length: 155 }, (_, i) => 't' + i);
  const h2 = Array.from({ length: 154 }, (_, i) => 't' + (155 + i));
  const partly = C.decideOwnership([row('a', 0.309, h1), row('b', 0.309, h2)], 500);
  assert.equal(partly.verdict, 'partly-owned');
  assert.equal(partly.coverage, 0.618, '309/500 IS κ — the same double');
  assert.equal(C.decideOwnership([row('a', 0.309, h1), row('b', 0.308, h2.slice(1))], 500).verdict, 'novel',
    'second below κ/2 never recombines');
  const novel = C.decideOwnership([row('near', 0.3), row('far', 0.1), row('dark', 0)], 10);
  assert.equal(novel.verdict, 'novel');
  assert.deepEqual(novel.nearest, ['near', 'far'], 'dark folds are never "nearest"');
  assert.deepEqual(C.decideOwnership([row('near', 0.3), row('dark', 0)], 10).nearest, ['near'],
    'a dark fold in the top two STILL never reads as "nearest" — zero interference is zero');
  const single = C.decideOwnership([row('a', 1, ['x'])], 1);
  assert.equal(single.verdict, 'already-owned', 'a one-token intent is decidable — the floor is below 1, not at it');
  assert.match(C.decideOwnership([], 5).why, /needs a scored spectrum/);
  assert.match(C.decideOwnership([row('a', 1)], 0).why, /needs a scored spectrum/);
});

test('THE CHECK wired — and door words get an OWNERSHIP answer, never a refusal', () => {
  const r = C.checkOf('gate my build with mutation and fuzz to kill test theatre', '', SHADOW);
  assert.equal(r.verdict, 'already-owned');
  assert.equal(r.fold.name, 'witnessy');
  assert.equal(r.support, 0.833, '5 of 6 meat tokens — "build"/"tool" are STOP words in the seam\'s one tokenizer');
  assert.equal(r.spectrum[0].name, 'witnessy');
  assert.ok(!('hit' in r.spectrum[0]), 'the public spectrum is name/url/support only');
  const door = C.checkOf('add payment processing to the checkout flow', '', SHADOW);
  assert.equal(door.verdict, 'already-owned', 'seam-check renders nothing, so the door law does not apply — ownership is answerable in every domain');
  assert.equal(door.fold.name, 'payflow');
  assert.equal(door.support, 0.8);
  const partly = C.checkOf('alpha bravo charlie delta echo foxtrot', '', [
    { name: 'north', desc: 'alpha bravo charlie' }, { name: 'south', desc: 'delta echo' },
  ]);
  assert.equal(partly.verdict, 'partly-owned');
  assert.equal(partly.coverage, 0.833);
  assert.equal(C.checkOf('Fix', '', SHADOW).neutral, true, 'intent refusals pass through');
  assert.equal(C.checkOf('a real intent here', '', []).config, true, 'config refusals pass through');
});

test('THE COMMENT — pinned literals, marker-first; novel silent by default; refusals never comment', () => {
  const owned = C.commentOf({ ok: true, verdict: 'already-owned', fold: { name: 'witnessy', url: 'https://x/witnessy' }, support: 0.857 });
  assert.equal(owned.comment,
    '<!-- seam-check -->\n**you already own this** — [witnessy](https://x/witnessy) covers this PR\'s intent at **0.857**.\n\nBefore merging new code, look at the fold you have.\n\n_seam-check · advisory · κ = 0.618 · the verdict reads your own repos; nothing leaves your org_');
  assert.ok(owned.comment.startsWith(C.MARKER), 'marker-first: reruns edit one comment, never spam');
  const partly = C.commentOf({ ok: true, verdict: 'partly-owned', folds: [{ name: 'a', url: null }, { name: 'b', url: 'https://x/b' }], coverage: 0.833 });
  assert.equal(partly.comment,
    '<!-- seam-check -->\n**partly owned** — `a` + [b](https://x/b) together cover **0.833** of this PR.\n\nCompose what you own before building anew.\n\n_seam-check · advisory · κ = 0.618 · the verdict reads your own repos; nothing leaves your org_');
  assert.equal(C.commentOf({ ok: true, verdict: 'novel', nearest: ['x'] }).comment, null, 'novel is silent by default');
  const loud = C.commentOf({ ok: true, verdict: 'novel', nearest: ['x', 'y'] }, true);
  assert.equal(loud.comment,
    '<!-- seam-check -->\n**novel** — no existing fold covers this PR. Nearest shapes: `x`, `y`.\n\n_seam-check · advisory · κ = 0.618 · the verdict reads your own repos; nothing leaves your org_');
  const bare = C.commentOf({ ok: true, verdict: 'novel' }, true);
  assert.equal(bare.comment,
    '<!-- seam-check -->\n**novel** — no existing fold covers this PR.\n\n_seam-check · advisory · κ = 0.618 · the verdict reads your own repos; nothing leaves your org_',
    'loud novel with NO nearest still speaks — refused garbage never throws');
  assert.equal(C.commentOf({ ok: false, why: 'thin' }).comment, null, 'refusals are for logs, not threads');
  assert.match(C.commentOf({ ok: true, verdict: 'wat' }).why, /refuses guesses/);
});

test('THE EXIT — advisory 0, wall 1, broken config 2, thin PR 0, bad mode refused', () => {
  const owned = { ok: true, verdict: 'already-owned' };
  assert.equal(C.exitOf(owned, 'none').code, 0);
  assert.equal(C.exitOf(owned, '').code, 0, 'empty mode means advisory');
  assert.equal(C.exitOf(owned, undefined).code, 0);
  assert.equal(C.exitOf(owned, 'already-owned').code, 1, 'the wall, only when asked for');
  assert.equal(C.exitOf({ ok: true, verdict: 'novel' }, 'already-owned').code, 0);
  assert.equal(C.exitOf({ ok: false, config: true, why: 'bad shadow' }, 'none').code, 2, 'a broken shadow must not look green');
  assert.equal(C.exitOf({ ok: false, neutral: true, why: 'thin' }, 'none').code, 0, 'a thin PR is never a red build');
  assert.match(C.exitOf(owned, 'sometimes').why, /must be "none" or "already-owned"/);
  assert.match(C.exitOf(null, 'none').why, /needs a check result/);
});

test('THE FUZZ — 250 random PRs: total, deterministic, comments marker-first or silent', () => {
  let seed = 6180;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const WORDS = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'payment', 'delete', 'publish', 'gate', 'mesh', 'the', 'and'];
  const pick = () => WORDS[Math.floor(rnd() * WORDS.length)];
  for (let t = 0; t < 250; t++) {
    const title = Array.from({ length: 1 + Math.floor(rnd() * 6) }, pick).join(' ');
    const body = rnd() > 0.5 ? pick() + '\n' + pick() : '';
    const shadow = Array.from({ length: 1 + Math.floor(rnd() * 4) }, (_, i) => ({
      name: 'f' + i, desc: pick() + ' ' + pick() + ' ' + pick(), url: rnd() > 0.5 ? 'https://x/f' + i : undefined,
    }));
    const a = C.checkOf(title, body, shadow);
    assert.deepEqual(C.checkOf(title, body, shadow), a, 'no moods');
    assert.equal(typeof a.ok, 'boolean');
    if (a.ok) {
      assert.ok(['already-owned', 'partly-owned', 'novel'].includes(a.verdict));
      for (let i = 1; i < a.spectrum.length; i++) assert.ok(a.spectrum[i - 1].support >= a.spectrum[i].support, 'spectrum sorted');
    }
    const cm = C.commentOf(a, rnd() > 0.5);
    assert.ok(cm.comment === null || cm.comment.startsWith(C.MARKER), 'every spoken comment is marker-first');
    const ex = C.exitOf(a, rnd() > 0.5 ? 'none' : 'already-owned');
    assert.ok(ex.ok && [0, 1, 2].includes(ex.code));
  }
});
