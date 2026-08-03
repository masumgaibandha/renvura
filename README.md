# Renvura — Phase 1 (Foundation + SEO base)

Child-development and play-based learning materials for Bangladesh.

The source of truth for scope is **Renvura Project Specification v1.8** (`assets/Renvura-Project-Specification.pdf`). Visual references are `assets/Renvura—Educational Toy Shop Design.pdf` and the brand images in `assets/`. This repository implements **Phase 1 only** — §9 phase table, row 1.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5.9, `strict` |
| UI | Tailwind CSS 4 + HeroUI 3 (react-aria) |
| i18n | next-intl 4 — `/bn/*` and `/en/*`, Bangla default |
| Database | MongoDB Atlas via Mongoose 9 |
| Icons / toasts | react-icons, react-hot-toast |
| Tests | Vitest (unit), Playwright (smoke) |

Node **22.22+**, npm.

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

`npm run build` is deliberately independent of MongoDB: nothing connects at module load or during static generation. Database access is verified separately with `npm run db:check`.

## Environment

Copy `.env.example` to `.env.local`. `NEXT_PUBLIC_SITE_URL` must be the real origin for each environment — a wrong value silently poisons canonical URLs, hreflang and the sitemap.

## Brand tokens

The four official values (§2.1) live in `src/styles/globals.css` and are mapped onto HeroUI's semantic CSS variables, so stock HeroUI components are on-brand without per-component overrides.

| Token | Hex | Light | Dark |
| --- | --- | --- | --- |
| Authority Navy | `#11253C` | text / surfaces | background |
| Premium Gold | `#CDAF80` | accent | accent |
| Linen Cream | `#F7F1E5` | background | text |
| Slate Gray | `#A5AAB5` | borders, rules | secondary text |

**Contrast rule (enforced).** Gold is never a text colour on cream. Use `bg-accent` with `text-on-accent` for filled blocks, and `text-accent-ink` where accent-coloured text is wanted — it resolves to navy in light and gold in dark. `tests/unit/brand-contrast.test.ts` fails the build if `text-accent` or a raw gold hex appears as a text colour in `src/`.

Two deviations from a literal reading of §2.1, both for readability on mid-range Android:

- Light-theme secondary text is slate mixed toward navy (`#4A5A6E`); pure `#A5AAB5` on cream is about 1.9:1. Slate is still used directly for borders and rules, and for secondary text in dark where it clears 6:1.
- `--accent-soft-foreground` is pinned rather than left to HeroUI's derived gold/navy mix, which would have produced gold-ish text on cream in soft variants.

## Typography

Lora (English display headings), Manrope (Latin UI and body), Noto Sans Bengali (all Bangla, headings included — Lora has no Bengali glyphs). Self-hosted via `next/font`. Add `class="latin"` to Latin runs inside Bangla pages (brand name, phone numbers, email).

## Assets

`assets/` holds the untouched originals and is never modified. Optimised web copies are generated into `public/brand/`, plus `src/app/icon.png` and `src/app/apple-icon.png`. Light/dark pairs swap by CSS, never by filter.

## Routes

| Route | Rendering | Indexed |
| --- | --- | --- |
| `/` | redirect → `/bn` | — |
| `/{locale}` | SSG | yes |
| `/{locale}/about` | SSG | yes |
| `/{locale}/contact` | SSG | yes |
| `/{locale}/faq` | SSG | **no** |
| `/{locale}/privacy`, `/returns`, `/shipping`, `/terms`, `/child-safety` | SSG | **no** |
| `/api/contact` | dynamic | — |

`src/lib/site.ts` is the single route registry. Navigation, the footer and the sitemap all read from it, so a link can never point at a route that does not exist, and the sitemap can never advertise a page whose content is pending.

FAQ and the five policy pages render an explicit "not published yet" state. They carry no draft or placeholder legal text, emit `noindex, nofollow`, and are excluded from `sitemap.xml`. §5.9 requires real, reviewed legal wording before these go live.

## Content rules observed

- The only person named is **Abdullah Al Masum**. The "Farah Karim" curator in design reference 1b is a mockup placeholder and is not used.
- No prices, no product listings, no delivery or returns terms, no safety certifications and no "non-toxic" claims appear anywhere. Design references 1b and 1c show these; they belong to Phases 2 and 3 with real data.
- The homepage states plainly that the catalogue is still in build and that nothing on the page is a live product offer.
- Bangla copy in `messages/bn.json` is a **first-pass translation** and is marked as such in its `_meta` block. It needs founder review before launch.

## Contact form

Stored in MongoDB first (`contact_submissions`) — that document is authoritative and is the founder's follow-up queue until the admin UI arrives in Phase 7. Email notification is best-effort on top and sits behind an adapter; Phase 1 ships the `log` adapter only, so a missing provider cannot lose an enquiry.

Spam protection is honeypot + timing validation + a **persistent** fixed-window rate limit stored in MongoDB with a TTL index (`rate_limit_hits`). It is deliberately not in process memory: every serverless instance must see the same counter, and an in-memory limiter resets on cold start.

## Notes for the next phase

- `ConfirmModal` (`src/components/ui/ConfirmModal.tsx`) is the HeroUI-based dialog primitive from §5.10. It has no consumer in Phase 1 — the first is Phase 3 (remove from cart).
- Skeleton primitives are intentionally shape-agnostic. Product-grid and blog-list skeletons belong with the components they stand in for (Phases 2 and 9).
- `[locale]/loading.tsx` must **not** be reintroduced. A Suspense boundary directly above the `[...rest]` catch-all makes Next stream a 200 before `notFound()` throws, turning every unknown URL into a soft 404. Loading states live in the route group `(home)` and in each leaf route instead.
