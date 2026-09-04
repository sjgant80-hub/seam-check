# seam-check

**LIVE DEMO: https://sjgant80-hub.github.io/seam-check/** ·
**see it on a real PR: [#1](https://github.com/sjgant80-hub/seam-check/pull/1)** — the bot's
first words were "you already own this."

A GitHub Action that collapses a pull request's intent against your org's **own repos** —
and says **"you already own this"** in the thread, before the merge.

Teams — and now their AI tools — constantly rebuild what the org already holds, because
nobody checks the estate first. seam-check is that check as CI: deterministic, advisory by
default, nothing leaves your org.

## Add it in two minutes

```yaml
# .github/workflows/seam-check.yml
name: seam-check
on: [pull_request]
permissions: { contents: read, pull-requests: write }
jobs:
  own:
    runs-on: ubuntu-latest
    steps:
      - uses: sjgant80-hub/seam-check@v0.1
        # with:
        #   org: your-org            # default: the repo's owner
        #   fail-on: already-owned   # default: none (advisory)
        #   always-comment: "true"   # default: novel stays silent
        #   shadow: path/shadow.json # skip the API — for private setups
```

On every PR it builds a **shadow** of your org's described repos (via the built-in token,
or a committed `shadow.json`), collapses the PR's title + first body line against it, and:

- **already-owned** — one repo covers the intent at κ = 0.618 → a comment names it, with
  the support score. `fail-on: already-owned` turns this into a failing check.
- **partly-owned** — two repos together cover it → "compose, don't build."
- **novel** — silence by default (politeness is part of adoption).

Reruns **edit one marker-first comment** — never spam. A thin PR title is never a red
build; a broken shadow is never a silent green.

## The kernel is gated — 50/50, zero baselines

The verdict logic (`check.mjs`) is mutation-tested before every push: 50 mutants, 50
killed. The κ boundary is exact to the bit (support 0.618 owns, 0.617 does not). One
tokenizer — the [end-of-software](https://sjgant80-hub.github.io/end-of-software/) seam's
own — one law.

```bash
node --test check.test.mjs
node /path/to/witness.mjs mutate check.mjs --timeout 20000 --cap 400 --test node --test check.test.mjs
```

## Limits, stated plainly

It reads titles and descriptions, not diffs — a mislabelled PR gets a mislabelled answer.
It cannot see repos your org never described; an undescribed repo is invisible, and the
Action refuses a thin shadow out loud rather than guessing. No learning, no telemetry, no
uploads.

## The pair

Before you merge AI-written code, two questions deserve a deterministic answer:
**did it survive its own tests?** — [witness](https://github.com/sjgant80-hub/witness).
**And did you already own it?** — seam-check. Both run in plain CI; both refuse to guess.

MIT. Built on the Konomi architecture, created by Thomas Frumkin.
