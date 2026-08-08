# Dependency audit triage — Phase 1 revision

Record required by `docs/PROJECT_SPECIFICATION.md` §11.1.4 and D-15: every `npm audit`
finding is manually triaged and recorded. **`npm audit fix --force` must not be used** — it
would install `next@9.3.3`, a seven-major downgrade of the framework.

**Date:** 2026-08-03 · **Node:** v22.23.1 · **npm:** 10.9.8 · **Result:** 3 high, 0 moderate,
0 low.

**Re-checked 2026-08-07** (Node v22.23.1 · npm 10.9.8) at the close of the Phase 1 revision.
Still 3 high, 0 moderate, 0 low, and the same three packages. Two things changed and are
triaged below: a **fourth** postcss advisory has been published, and the upgrade that clears
all three findings is **now available as a stable release**.

Removing `next-intl` in this revision cleared one moderate finding (it depended transitively
on the vulnerable `next` range). The remaining three all originate inside Next.js's own nested
dependencies.

**Re-checked 2026-08-08** (Node v22.23.1 · npm 10.9.8), before starting Phase 4. **4 high, 0
moderate, 0 low.** The three tracked findings are unchanged. One new finding — `nanoid` —
triaged below as finding 4. Unlike the first three, a fix for it is available through ordinary
`npm audit fix` (no `--force`, no Next upgrade), but it is not applied here: the vulnerable
code path is never reached by this codebase at all (see below), so upgrading buys no real
security improvement and is left as a founder-optional cleanup rather than treated as required.

## Findings

### 1 · `postcss@8.4.31` — high — **accepted, tracked**

- GHSA-qx2v-qp2m-jg93 (XSS via unescaped `</style>` in stringify output)
- GHSA-6g55-p6wh-862q (arbitrary file read via attacker-controlled `sourceMappingURL`)
- GHSA-r28c-9q8g-f849 (path traversal in previous-source-map auto-loading)
- GHSA-fxqj-rqcc-2cmp (**new on 2026-08-07** — incomplete fix of GHSA-6g55-p6wh-862q;
  attacker-controlled `sourceMappingURL` still reads arbitrary `.map` files when `from` is
  unset)

**Where:** `node_modules/next/node_modules/postcss` — Next.js's bundled copy only.
**Not** the project's own PostCSS: `@tailwindcss/postcss` and Vite both resolve `postcss@8.5.25`,
which is patched.

**Why accepted for now:** all three require attacker-controlled CSS or source-map input.
Renvura's CSS is authored in-repo and compiled at build time; no user-supplied CSS reaches
PostCSS. Exposure is build-time only, on a trusted input set.

**Tracked:** resolved by a Next.js minor upgrade. As of 2026-08-07 the advisory range ends at
`16.3.0-preview.10` and **`next@16.3.0` stable is released**, so the upgrade this entry was
waiting for is now available. It remains a standalone dependency change, not folded into a
feature phase, and is **not** taken as part of the Phase 1 revision.

The fourth advisory does not change the triage. The added file-read path has the same
precondition as the other three — attacker-controlled CSS or source-map input — and Renvura's
CSS is authored in-repo and compiled at build time.

### 2 · `sharp@0.34.5` — high — **accepted, tracked, with a hard deadline**

- GHSA-f88m-g3jw-g9cj (inherited libvips CVE-2026-33327, -33328, -35590, -35591)

**Where:** `node_modules/sharp`, pulled in by Next.js for image optimisation.

**Why accepted for now:** in Phase 1 `sharp` only processes first-party brand images at build
time. There is no upload path and no user-supplied image.

**Hard deadline — this must be resolved before Phase 6.** Phase 6 adds admin media upload,
which feeds user-supplied images into `sharp` at runtime and turns a low-exposure build-time
issue into a genuine remote attack surface. Upgrading Next (and therefore `sharp` ≥ 0.35.0)
is a prerequisite for that phase, not a follow-up to it.

### 3 · `next@16.2.12` — high — **transitive only**

Flagged solely because it depends on the two packages above. No defect in Next.js itself is
reported. Resolved by the same minor upgrade.

### 4 · `nanoid@3.3.16` — high — **accepted, transitive, dependency path confirmed unreachable**

- GHSA-2v37-7h3g-55p8 (custom generators can loop indefinitely when `size` is `0`)
- Affects `nanoid < 3.3.17`. CVSS 5.9, `AC:H` — even in an exploitable call site this needs a
  specific, unusual argument, not just attacker-reachable input.

**Where:** `node_modules/nanoid` (hoisted, one copy, `npm ls nanoid --all` confirms a single
`3.3.16` resolution). **Transitive**, two levels down, entirely inside build tooling:

```text
@tailwindcss/postcss@4.3.3 → postcss@8.5.25 → nanoid@3.3.16   (the project's own PostCSS)
next@16.2.12                → postcss@8.4.31 → nanoid@3.3.16   (Next's bundled copy, deduped)
```

Renvura's `package.json` does not depend on `nanoid` directly and no application code
imports it.

**Why accepted — the vulnerable code path is not exercised, not merely "no untrusted input
reaches it":** the advisory is specific to nanoid's *custom* generator functions
(`customAlphabet` / `customRandom`) being called with `size: 0`. The only call site that pulls
`nanoid` into this dependency tree at all is PostCSS itself
(`node_modules/postcss/lib/input.js`):

```js
let { nanoid } = require('nanoid/non-secure')
// …
this.id = '<input css ' + nanoid(6) + '>'
```

This calls the plain, non-custom generator with a hardcoded literal `6` — never `0`, never a
custom generator, never a value derived from user input. The vulnerable branch (custom
generator, zero size) is not reachable through this call regardless of what CSS is compiled.
On top of that, it fires only while PostCSS is parsing CSS during `next build`/`next dev` —
build-time only, same exposure boundary as findings 1–3.

**Fix available without `--force`, deliberately not applied:** both PostCSS copies declare
`"nanoid": "^3.3.16"` / `"^3.3.6"`, so `nanoid@3.3.17+` satisfies both ranges and
`npm audit fix` (no `--force`) resolves this finding alone, without touching `next`, `postcss`
or `sharp`. `npm audit fix --dry-run` confirms the remaining-after-fix report no longer lists
`nanoid`. It was not run for this triage pass because the code path above is not reachable —
there is nothing for the upgrade to protect against in this application — and D-15's discipline
is to record a manual decision rather than run a fixer reflexively. A founder or maintainer may
still choose to run plain `npm audit fix` at any time purely to keep the audit output clean; it
carries no functional risk (`nanoid` is a leaf dependency, not part of the Next/PostCSS/Sharp
version coupling that findings 1–3 are pinned by).

## What was not done, and why

- **`npm audit fix --force` was not run.** It resolves the tree by installing `next@9.3.3`,
  which would destroy the App Router architecture the whole specification is built on.
- **No package was pinned or patched by hand.** Overriding Next's nested `postcss`/`sharp` via
  npm `overrides` would decouple them from the versions Next is tested against and risks
  subtle image-pipeline breakage for a build-time-only issue.

## Re-check

Re-run `npm audit` and update this file at the start of each phase, and immediately before the
launch gate.
