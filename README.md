# Renvura — Phase 1 (Foundation, de-localised, commerce-ready)

A broad children's e-commerce store for Bangladeshi families — learning and play, baby
essentials, feeding, child care, safety, clothing, accessories, school supplies, travel and
gifts. Learning and play-based products are an initial specialty, not the whole business.

## Source of truth

**These three Markdown documents are the authority for this project, in this order:**

| Rank | Document | Covers |
| --- | --- | --- |
| 1 | [`docs/LOCKED_DECISIONS.md`](docs/LOCKED_DECISIONS.md) | Absolute. D-01…D-16 override everything below |
| 2 | [`docs/PROJECT_SPECIFICATION.md`](docs/PROJECT_SPECIFICATION.md) | Business, product, language, architecture, scope, phases |
| 3 | [`docs/STOREFRONT_DESIGN_DIRECTION.md`](docs/STOREFRONT_DESIGN_DIRECTION.md) | Visual and storefront design |

The PDFs in `assets/` (`Renvura-Project-Specification.pdf` v1.8 and
`Renvura—Educational Toy Shop Design.pdf`) are **historical reference only**. They are
superseded wherever they conflict, and must not be cited as current direction. The design PDF
remains useful as secondary inspiration for product-detail ideas.

### Design reference images are local-only and not distributed through Git

`assets/design-references/*.png` holds three third-party storefront screenshots used purely to
study commerce structure, spacing and controlled child-friendly styling (D-05).

**They are deliberately git-ignored and are not committed.** A fresh clone will not contain
them — they are third-party commercial theme screenshots, they are large (~20 MB), and they
must never be redistributed. Ask the founder for a copy if you need them locally; put them in
`assets/design-references/` and git will ignore them.

Nothing from those references may be copied — no layout, text, logo, illustration or imagery
(D-11). They inform structure only; the storefront must be recognisably Renvura.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5.9, `strict` |
| UI | Tailwind CSS 4 + HeroUI 3 (react-aria) |
| Database | MongoDB Atlas via Mongoose 9 |
| Validation | Zod |
| Icons / toasts | react-icons, react-hot-toast |
| Tests | Vitest (unit), Playwright (smoke) |

Node **22.22+**, npm. There is **no i18n library and no theme library** — see below.

## Commands

```bash
npm run dev        # development server
npm run build      # production build — does NOT require a database
npm run start      # serve the production build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run test       # Vitest unit tests
npm run test:e2e   # Playwright smoke tests (needs a build first)
npm run db:check   # verify Atlas connectivity and sync indexes
npm run verify     # lint + typecheck + test + build
```

`npm run build` is deliberately independent of MongoDB: nothing connects at module load or
during static generation. Database access is verified separately with `npm run db:check`.

## Language — English-first hybrid, one page set

Renvura is **one English-first website** (D-02). There is no language toggle, no `/bn` and
`/en` route trees, no duplicate translated pages and no `hreflang`.

- **English** carries navigation, category names, buttons, search, product names,
  specifications, cart, checkout, account and every system surface.
- **Bangla** is used selectively where it genuinely helps: detailed product explanations,
  usage instructions, expert notes, age guidance, safety warnings, and important delivery or
  return information.

Bangla is applied **per run**, not per page. Wrap a Bangla passage in `<Bn>`
(`src/components/ui/Bn.tsx`); it marks the run `lang="bn"` and switches it to Noto Sans
Bengali, so the Bengali subset loads only where it is used. `<html lang>` stays `en`.

URL slugs are always English.

## Routes

All routes are clean and unprefixed (D-03). `src/lib/site.ts` is the single registry:
navigation, the footer, the sitemap and the tests all read from it.

| Route | Rendering | Indexed |
| --- | --- | --- |
| `/` | SSG | yes |
| `/about` | SSG | yes |
| `/contact` | SSG | yes |
| `/faq` | SSG | **no** |
| `/privacy`, `/returns`, `/shipping`, `/terms`, `/child-safety` | SSG | **no** |
| `/api/contact` | dynamic | — |

Every route carries a `phase` in the registry. Only `phase: 'built'` routes are rendered in
navigation, the footer or the sitemap — which is what mechanically prevents dead links.
Later-phase commerce routes (`/products`, `/cart`, `/search`, …) are declared there so the
structure is reviewable, but stay invisible until the phase that builds them flips the flag.

FAQ and the five policy pages render an explicit "not published yet" state. They carry no
draft or placeholder legal text, emit `noindex, nofollow`, and are excluded from
`sitemap.xml`. Real, reviewed wording is required before they go live (D-12).

## No dead controls

Phase 1 exposes **no clickable control or link that does nothing** (D-15, §11.1.1). Search,
account, wishlist and cart are absent from the header rather than shown-but-broken; they
appear automatically as their routes become `built`. A Playwright test asserts that no page
links to an unbuilt route and that every internal link resolves.

## Brand tokens

Light/cream only — **the theme toggle is removed and dark mode is not launch-critical**
(D-07). The `.dark` block in `src/styles/globals.css` is retained, unused, as a starting point
for possible post-launch work; nothing depends on a theme switch existing.

**Core palette**

| Token | Hex | Role |
| --- | --- | --- |
| Authority Navy | `#11253C` | Headings, navigation, footer, important text |
| Premium Gold | `#CDAF80` | Primary CTA fills, premium highlights — sparingly |
| Linen Cream | `#F7F1E5` | Primary storefront background |
| Slate Gray | `#A5AAB5` | Borders, dividers, disabled states — **never body text** |

**Supporting palette** (D-06): Soft Sky `#D9EEF5` · Soft Mint `#E2EED8` · Soft Blush
`#F6DAD8` · Soft Lavender `#E7DFF4` · Soft Sunshine `#F8E6A8`, plus `#4A5A6E` as the official
secondary text colour. Pastels are for category cards, age pills, promotional surfaces and
badges — they support navy, gold and cream and never replace them.

**Contrast rule (enforced).** Gold is never a text colour on cream. Use `bg-accent` with
`text-on-accent` for filled blocks. `tests/unit/brand-contrast.test.ts` fails the build if
`text-accent` or a raw gold hex appears as a text colour in `src/`.

## Typography

Lora (English display headings), Manrope (UI and body), Noto Sans Bengali (Bangla runs only).
Self-hosted via `next/font`. Product names, prices, buttons and filters are always Manrope —
serif product names read as editorial, not shoppable.

## Homepage

The section order is **configuration, not layout code** (D-10) — see
`src/lib/homepage-sections.ts`. The page component resolves each configured section id to a
component and renders the enabled ones in the configured order, so the order can change
without touching the page. Four constraints are enforced by `assertHomepageOrder` and covered
by unit tests: the hero is first, discovery and merchandising precede founder content, the
founder is never the hero, and the footer is last.

Category, age and product sections are fed from `src/lib/content/storefront.ts`, which
returns **empty** collections in Phase 1 by design. Categories, age bands and products are
Phase 2 decisions and are not invented here (§11.1.2). Every section renders `null` on an
empty dataset, so the homepage currently shows the hero, an honest catalogue-status panel, the
trust row, the small founder block and support — with nothing fabricated to fill the gap.

## Content rules observed

- The only person named is **Abdullah Al Masum**, with his real credentials.
- No prices, product listings, delivery or returns terms, safety certifications or
  "non-toxic" claims appear anywhere.
- No seeded reviews or testimonials, and no "Best Sellers" section — that label requires real
  completed-order data (D-10, D-12).
- The homepage states plainly that the catalogue is still in build and that nothing on the
  page is a live product offer.
- Structured data is **`Organization` only**. `LocalBusiness` is not emitted (no confirmed
  public business location); `Product`/`Offer` support arrives in Phase 2 and never ships for
  demo products.

## Contact form

Stored in MongoDB first (`contact_submissions`) — that document is authoritative and is the
founder's follow-up queue until the admin UI arrives. Email notification is best-effort on top
and sits behind an adapter; Phase 1 ships the `log` adapter only, so a missing provider cannot
lose an enquiry.

Spam protection is honeypot + timing validation + a **persistent** fixed-window rate limit
stored in MongoDB with a TTL index (`rate_limit_hits`). It is deliberately not in process
memory: every serverless instance must see the same counter, and an in-memory limiter resets
on cold start.

## Notes for the next phase

- `ConfirmModal` is the HeroUI-based dialog primitive. It has no consumer yet — the first is
  Phase 4 (remove from cart).
- `ProductCard` and `ProductRail` exist and are wired to the (empty) storefront sources.
  Phase 2 exercises them with protected demo data; **storefront visual approval happens then**
  (§11.1.3), not now.
- Skeleton primitives are intentionally shape-agnostic. Product-grid and blog-list skeletons
  belong with the components they stand in for.
- Do not add a root `loading.tsx`. A Suspense boundary above the whole app makes Next stream a
  200 before an unmatched route can throw `notFound()`, turning every unknown URL into a soft
  404. Loading states live in `(home)` and in each leaf route instead.
