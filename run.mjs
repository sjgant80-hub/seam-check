#!/usr/bin/env node
// run.mjs — the Action's I/O shell around the GATED kernel (check.mjs, witness-clean).
// Thin by design: read the PR event, build/load the shadow, ask the kernel, speak once.
//
// Env (set by action.yml or the CI smoke):
//   GITHUB_EVENT_PATH   the event JSON (GitHub sets this)
//   SEAM_ORG            org/user whose repos form the shadow (default: the repo's owner)
//   SEAM_SHADOW         path to a prebuilt shadow.json (skips the API — used by CI + private setups)
//   SEAM_FAIL_ON        'none' (default) | 'already-owned'
//   SEAM_ALWAYS_COMMENT 'true' to speak on novel too
//   SEAM_DRY            '1' → print the comment instead of posting (no API writes)
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { checkOf, commentOf, exitOf, MARKER } from './check.mjs';
import { shadowOfOrg } from './build-shadow.mjs';

const evPath = process.env.GITHUB_EVENT_PATH;
if (!evPath) { console.error('seam-check: no GITHUB_EVENT_PATH — run me from a workflow (or set it to a fixture)'); process.exit(2); }
const event = JSON.parse(readFileSync(evPath, 'utf8'));
const pr = event.pull_request;
if (!pr) { console.log('seam-check: not a pull_request event — nothing to check'); process.exit(0); }

let shadow;
if (process.env.SEAM_SHADOW) {
  shadow = JSON.parse(readFileSync(process.env.SEAM_SHADOW, 'utf8'));
  console.log('shadow: ' + shadow.folds.length + ' folds from ' + (shadow.source || process.env.SEAM_SHADOW));
} else {
  const org = process.env.SEAM_ORG || (event.repository && event.repository.owner && event.repository.owner.login);
  if (!org) { console.error('seam-check: no org to read — set the org input'); process.exit(2); }
  shadow = shadowOfOrg(org);
  console.log('shadow: ' + shadow.folds.length + ' described folds from ' + shadow.source);
  if (shadow.folds.length < 3) { console.error('seam-check: the shadow is thin (' + shadow.folds.length + ') — an undescribed repo is invisible to every seam'); process.exit(2); }
}

const result = checkOf(pr.title, pr.body || '', shadow.folds);
console.log(result.ok ? 'verdict: ' + result.verdict + ' — ' + result.say : 'no verdict: ' + result.why);

const cm = commentOf(result, process.env.SEAM_ALWAYS_COMMENT === 'true');
if (cm.comment) {
  if (process.env.SEAM_DRY === '1') {
    console.log('--- comment (dry run) ---\n' + cm.comment);
  } else {
    const repo = event.repository.full_name, num = pr.number;
    // marker-first law: reruns EDIT the one comment, never spam the thread
    let existingId = null;
    try {
      const raw = execFileSync('gh', ['api', '--paginate', 'repos/' + repo + '/issues/' + num + '/comments', '-q', '.[] | {id: .id, body: .body}'], { stdio: 'pipe', timeout: 120000 }).toString();
      for (const line of raw.trim().split('\n').filter(Boolean)) {
        const c = JSON.parse(line);
        if (typeof c.body === 'string' && c.body.startsWith(MARKER)) { existingId = c.id; break; }
      }
    } catch { /* first comment on a fresh thread */ }
    if (existingId) {
      execFileSync('gh', ['api', '-X', 'PATCH', 'repos/' + repo + '/issues/comments/' + existingId, '-f', 'body=' + cm.comment], { stdio: 'pipe', timeout: 120000 });
      console.log('comment updated in place');
    } else {
      execFileSync('gh', ['api', '-X', 'POST', 'repos/' + repo + '/issues/' + num + '/comments', '-f', 'body=' + cm.comment], { stdio: 'pipe', timeout: 120000 });
      console.log('comment posted');
    }
  }
} else {
  console.log('no comment: ' + (cm.why || 'silence'));
}

const ex = exitOf(result, process.env.SEAM_FAIL_ON);
if (!ex.ok) { console.error('seam-check: ' + ex.why); process.exit(2); }
console.log('exit ' + ex.code + ' — ' + ex.why);
process.exit(ex.code);
