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

## What was not done, and why

- **`npm audit fix --force` was not run.** It resolves the tree by installing `next@9.3.3`,
  which would destroy the App Router architecture the whole specification is built on.
- **No package was pinned or patched by hand.** Overriding Next's nested `postcss`/`sharp` via
  npm `overrides` would decouple them from the versions Next is tested against and risks
  subtle image-pipeline breakage for a build-time-only issue.

## Re-check

Re-run `npm audit` and update this file at the start of each phase, and immediately before the
launch gate.
