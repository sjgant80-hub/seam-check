#!/usr/bin/env node
// build-shadow.mjs — the shadow is GENERATED, never typed. The ownership filter is OWNED,
// not "live": a repo without a webpage is still a fold you hold (the honest-filter lesson).
// Refuses thin shadows out loud — an undescribed repo is invisible to every seam.
//
//   node build-shadow.mjs --org <github-org-or-user>   → any org's shadow via the GitHub API
//   node build-shadow.mjs <path-to-estate-index.json>  → the estate's shadow, from its index
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

/** owned + described → a fold; everything else is honestly invisible. */
export function foldsFrom(repos) {
  return repos
    .filter((r) => r && !r.fork && !r.archived && !r.private && typeof r.desc === 'string' && r.desc.trim().length >= 20)
    .map((r) => ({ name: r.name, desc: r.desc.trim().slice(0, 160), url: r.url || null }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** any org's (or user's) repos via gh api — GH_TOKEN/GITHUB_TOKEN is honored by gh itself. */
export function shadowOfOrg(org) {
  const Q = '.[] | {name: .name, desc: (.description // ""), url: .html_url, fork: .fork, archived: .archived, private: .private}';
  let raw;
  try {
    raw = execFileSync('gh', ['api', '--paginate', 'orgs/' + org + '/repos?per_page=100', '-q', Q], { stdio: 'pipe', timeout: 300000 }).toString();
  } catch {
    raw = execFileSync('gh', ['api', '--paginate', 'users/' + org + '/repos?per_page=100', '-q', Q], { stdio: 'pipe', timeout: 300000 }).toString();
  }
  const folds = foldsFrom(raw.trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)));
  return { source: 'github ' + org, folds };
}

const arg = process.argv[2];
if (arg !== undefined || process.argv.length > 2) {
  let out;
  if (arg === '--org') {
    const org = process.argv[3];
    if (!org) { console.error('usage: node build-shadow.mjs --org <github-org>'); process.exit(2); }
    out = shadowOfOrg(org);
    if (out.folds.length < 3) { console.error('REFUSED: the shadow came back thin (' + out.folds.length + ') — does the org describe its repos? An undescribed repo is invisible to every seam.'); process.exit(1); }
  } else if (arg) {
    const idx = JSON.parse(readFileSync(arg, 'utf8'));
    out = { source: 'estate index (generated ' + idx.generated + ')', folds: foldsFrom(idx.nodes) };
    if (out.folds.length < 50) { console.error('REFUSED: the estate shadow came back thin (' + out.folds.length + ') — is the index stale?'); process.exit(1); }
  }
  if (out) {
    writeFileSync('shadow.json', JSON.stringify(out, null, 0));
    console.log('shadow.json: ' + out.folds.length + ' described folds · from ' + out.source);
  }
}
