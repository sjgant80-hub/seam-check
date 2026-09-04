// seam-check · check.mjs — THE OWNERSHIP QUESTION, asked of every pull request.
//
// Teams — and now their AI tools — rebuild what the org already owns, because nobody checks
// the estate first. This kernel is that check as law: a PR's stated intent is collapsed
// against the org's own shadow (its described repos), and the verdict speaks BEFORE the
// merge: already-owned / partly-owned / novel. Advisory by default — a hint, not a wall.
//
//   · INTENT      — the TITLE is the intent; the body contributes only its first non-empty
//                   line; the combined input is capped so boilerplate bodies cannot drown
//                   the signal. Fewer than two checkable words is refused: a label is not
//                   an intent. One tokenizer (the seam's own intentOf) — one law.
//   · NO DOOR LAW HERE — the seam's doors exist so capability is never auto-RENDERED behind
//                   money/legal/private words. seam-check renders nothing; it only answers
//                   "do you own this?" — a question that is legitimate in every domain. So
//                   "add payment processing" gets an ownership answer, not a refusal.
//   · DECISION    — already-owned when one fold covers the intent at κ; partly-owned when
//                   the best two folds each hold ≥ κ/2 and together cover ≥ κ (compose,
//                   don't build); novel otherwise, naming the nearest shapes.
//   · THE COMMENT — deterministic markdown, marker-first so reruns EDIT one comment instead
//                   of spamming the thread. Novel stays silent by default: politeness is
//                   part of adoption.
//   · THE EXIT    — advisory means exit 0. fail-on='already-owned' turns the verdict into a
//                   wall for teams that want one. A config error (bad shadow) exits loud;
//                   a thin PR title is the author's to fix, never a red build.
//
// Pure and total: garbage in → { ok:false, why }, never a throw mid-check.

import { intentOf } from './render.mjs';

export const KAPPA = 0.618;           // the chord — pinned; must equal the seam's
export const INTENT_CAP = 400;        // chars of PR text considered — signal, not boilerplate
export const MARKER = '<!-- seam-check -->';

const S = (v) => typeof v === 'string';
const round3 = (x) => Math.round(x * 1000) / 1000;

/** INTENT — title + first non-empty body line, capped, tokenized by the seam's one law. */
export function prIntent(title, body) {
  if (!S(title) || title.trim().length === 0) return { ok: false, why: 'a PR with no title has no intent — nothing to check', neutral: true };
  const firstLine = S(body) ? (body.split('\n').map((l) => l.trim()).find((l) => l.length > 0) || '') : '';
  const text = (title.trim() + ' ' + firstLine).slice(0, INTENT_CAP);
  const it = intentOf(text);
  if (!it.ok) return { ok: false, why: 'the PR says too little to check — say what it DOES', neutral: true };
  if (it.tokens.length < 2) return { ok: false, why: 'one checkable word is a label, not an intent — say what the PR DOES', neutral: true };
  return { ok: true, tokens: it.tokens, key: it.key, considered: text };
}

/** SPECTRUM — every fold's interference with the intent; the check is inspectable, not oracular. */
export function spectrumOf(tokens, shadow) {
  if (!Array.isArray(tokens) || tokens.length === 0 || !tokens.every((t) => S(t) && t.length > 0))
    return { ok: false, why: 'spectrum needs the intent tokens' };
  if (!Array.isArray(shadow) || shadow.length === 0)
    return { ok: false, why: 'an empty shadow answers nothing — bring the org\'s repos', config: true };
  for (const f of shadow) {
    if (!f || !S(f.name) || f.name.length === 0 || !S(f.desc))
      return { ok: false, why: 'a shadow fold is { name, desc, url? } — an undescribed repo is invisible to every seam', config: true };
  }
  const scored = shadow.map((f) => {
    const ft = intentOf(f.name.replace(/[-_]/g, ' ') + ' ' + f.desc);
    const set = ft.ok ? new Set(ft.tokens) : new Set();
    const hit = tokens.filter((w) => set.has(w));
    return { name: f.name, url: S(f.url) ? f.url : null, support: round3(hit.length / tokens.length), hit };
  }).sort((a, b) => b.support - a.support || a.name.localeCompare(b.name));
  return { ok: true, scored };
}

/** DECISION — the ownership law over a scored spectrum. Pure, boundary-exact at κ. */
export function decideOwnership(scored, nTokens) {
  if (!Array.isArray(scored) || scored.length === 0 || !Number.isInteger(nTokens) || nTokens < 1)
    return { ok: false, why: 'the decision needs a scored spectrum and the intent size' };
  const [best, second] = scored;
  if (best.support >= KAPPA) {
    return { ok: true, verdict: 'already-owned', fold: { name: best.name, url: best.url }, support: best.support,
      say: 'you already own this — "' + best.name + '" covers the PR\'s intent at ' + best.support };
  }
  if (second && best.support >= KAPPA / 2 && second.support >= KAPPA / 2) {
    const union = new Set([...best.hit, ...second.hit]);
    const coverage = round3(union.size / nTokens);
    if (coverage >= KAPPA) {
      return { ok: true, verdict: 'partly-owned', folds: [{ name: best.name, url: best.url }, { name: second.name, url: second.url }], coverage,
        say: '"' + best.name + '" + "' + second.name + '" together cover ' + coverage + ' of this PR — compose, don\'t build' };
    }
  }
  const nearest = scored.slice(0, 2).filter((s) => s.support > 0).map((s) => s.name);
  return { ok: true, verdict: 'novel', nearest,
    say: 'novel — the shadow holds no fold for this' + (nearest.length ? '; nearest shapes: ' + nearest.join(', ') : '') };
}

/** THE CHECK — intent → spectrum → decision, wired as one call for the Action and the page. */
export function checkOf(title, body, shadow) {
  const it = prIntent(title, body);
  if (!it.ok) return it;
  const sp = spectrumOf(it.tokens, shadow);
  if (!sp.ok) return sp;
  const d = decideOwnership(sp.scored, it.tokens.length);
  if (!d.ok) return d;
  return { ...d, spectrum: sp.scored.map(({ name, url, support }) => ({ name, url, support })), considered: it.considered };
}

/**
 * THE COMMENT — deterministic markdown, marker-first (reruns edit, never spam). Novel is
 * silent by default; alwaysComment=true speaks on novel too. Refusals never comment — a
 * thin title is for the Action log, a config error is for a red build, neither for the thread.
 */
export function commentOf(result, alwaysComment) {
  if (!result || result.ok !== true) return { ok: true, comment: null, why: 'refusals are for logs, not PR threads' };
  const link = (f) => f.url ? '[' + f.name + '](' + f.url + ')' : '`' + f.name + '`';
  const foot = '\n\n_seam-check · advisory · κ = 0.618 · the verdict reads your own repos; nothing leaves your org_';
  if (result.verdict === 'already-owned') {
    return { ok: true, comment: MARKER + '\n**you already own this** — ' + link(result.fold) + ' covers this PR\'s intent at **' + result.support + '**.\n\nBefore merging new code, look at the fold you have.' + foot };
  }
  if (result.verdict === 'partly-owned') {
    return { ok: true, comment: MARKER + '\n**partly owned** — ' + link(result.folds[0]) + ' + ' + link(result.folds[1]) + ' together cover **' + result.coverage + '** of this PR.\n\nCompose what you own before building anew.' + foot };
  }
  if (result.verdict === 'novel') {
    if (!alwaysComment) return { ok: true, comment: null, why: 'novel is silent by default — politeness is part of adoption' };
    return { ok: true, comment: MARKER + '\n**novel** — no existing fold covers this PR.' + (result.nearest && result.nearest.length ? ' Nearest shapes: ' + result.nearest.map((n) => '`' + n + '`').join(', ') + '.' : '') + foot };
  }
  return { ok: false, why: 'unknown verdict "' + result.verdict + '" — the comment law refuses guesses' };
}

/** THE EXIT — advisory by default; a wall only when asked; config errors loud, thin PRs neutral. */
export function exitOf(result, failOn) {
  const mode = failOn === undefined || failOn === null || failOn === '' ? 'none' : failOn;
  if (mode !== 'none' && mode !== 'already-owned') return { ok: false, why: 'fail-on must be "none" or "already-owned"' };
  if (!result || typeof result.ok !== 'boolean') return { ok: false, why: 'the exit law needs a check result' };
  if (result.ok !== true) return { ok: true, code: result.config ? 2 : 0, why: result.config ? 'a broken shadow must not look green' : 'a thin PR is the author\'s to fix, never a red build' };
  if (mode === 'already-owned' && result.verdict === 'already-owned') return { ok: true, code: 1, why: 'fail-on=already-owned: the org asked for a wall' };
  return { ok: true, code: 0, why: 'advisory' };
}
