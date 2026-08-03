# Renvura — Locked Decisions

**Version:** 1.0 · **Date:** 2026-08-03 · **Status:** Highest authority in the project

<!-- markdownlint-disable MD013 MD036 -->
<!--
  MD013 (line-length) and MD036 (no-emphasis-as-heading) are intentionally disabled here, for
  the same reasons documented at the top of docs/PROJECT_SPECIFICATION.md: tables cannot be
  wrapped to 80 columns without breaking, and the **Decision.** / **Consequences.** /
  **Locked rules.** / **Overrides.** labels are a deliberate repeated structure inside each
  D-xx decision, not headings. All other rules are enforced and currently pass.
-->

Every decision below is **locked**. It may only be changed by the founder, explicitly, in
writing, by editing this file. Until then, no plan, phase, pull request, agent, review or
older document may contradict it. If a task appears to require breaking one of these, stop
and raise it rather than working around it.

---

## Source-of-truth hierarchy

| Rank | Document | Authority |
| --- | --- | --- |
| 1 | `docs/LOCKED_DECISIONS.md` | Absolute. Overrides everything below. |
| 2 | `docs/PROJECT_SPECIFICATION.md` | Business, product, language, architecture, scope, phases. |
| 3 | `docs/STOREFRONT_DESIGN_DIRECTION.md` | Visual and storefront design. |
| 4 | `assets/design-references/*.png` | Inspiration only, within the limits of D-06 and D-11. |
| 5 | `assets/Renvura-Project-Specification.pdf` (v1.8) | **Historical.** Background only. Superseded wherever it conflicts. |
| 6 | `assets/Renvura—Educational Toy Shop Design.pdf` | **Historical secondary inspiration.** Superseded as the design authority, but still usable for ideas — see below. |
| 7 | `README.md`, code comments | Descriptive of the current build; not authoritative for direction. |

The PDFs stay in the repository as historical reference. They are **not** to be quoted as
current direction, and any code comment or README line citing them as the source of truth is
now stale and must be corrected during the Phase 1 revision.

**The design PDF keeps a narrow, useful role.** It may be consulted as secondary inspiration —
particularly reference **1c (Product Detail — Expert Insight)** for product-detail ideas such
as expert-note placement, age guidance and specification layout. It may never override the
three Markdown documents or the three selected PNG references, and its placeholder content
(prices, the "Farah Karim" curator, safety claims) stays excluded under D-12.

---

## D-01 · Business scope — broad children's store

**Decision.** Renvura is a broad children's e-commerce store for Bangladeshi families. It may
sell learning products, toys, baby essentials, feeding products, child-care products, safety
products, clothing, accessories, school supplies, travel products, gifts, development kits and
other child-related products. Learning and play-based products are an **initial specialty, not
the complete business**.

**Consequences.**

- The platform must **not** be architected only for educational or developmental toys.
- Developmental domains, milestones, expert notes and age guidance are **optional product
  attributes** — nullable in the schema, absent by default, never required by any form, API
  route or component, and never rendered as an empty section.
- No category is privileged in code. Categories are data.
- Age navigation starts at newborn, not at age 2.

**Overrides.** v1.8 §1.1 ("Niche: Child development & learning materials for ages 2–12"),
v1.8 §1.2, and v1.8 §8's mandatory child-development fields.

---

## D-02 · English-first hybrid language, no toggle

**Decision.** One English-first hybrid-language website. No Bangla/English language toggle.
No separate `/bn` and `/en` route trees. No duplicate translated pages. No hreflang
architecture. No machine translation.

**English is used for:** navigation, category names, buttons, search, product names,
specifications, cart, checkout, account, all system UI, and the entire admin dashboard.

**Bangla is used selectively for:** detailed product explanations, usage instructions, expert
notes, age guidance, safety warnings, and important delivery or return information.

**Consequences.**

- Bangla is stored as an optional sibling field (`descriptionBn`), not a locale map.
- Bangla renders when present, is silently omitted when absent, and never shows a
  "translation pending" fallback.
- Bangla runs carry `lang="bn"` and the Bengali type class; `<html lang>` stays `en`.
- Product and category search must match **both** English and Bangla terms via a
  `searchAliases` array.
- `next-intl`, `messages/*.json`, `src/i18n/*`, the locale proxy and `LanguageToggle` are
  removed in the Phase 1 revision.

**Supporting assumption.** Expected primary customers are educated Bangladeshi parents who
are generally comfortable with English commerce interfaces (PROJECT_SPECIFICATION §2.2).
This assumption is what makes English-first the right default. If real usage contradicts it —
Bangla-heavy search queries, support requests about understanding the interface, drop-off at
English-only steps — bring that evidence and reopen this decision rather than defending the
architecture.

**Overrides.** v1.8 §3.3 (toggle + bilingual fields), v1.8 §7.1 (bilingual SEO / hreflang),
and the current Phase 1 implementation.

---

## D-03 · Clean URLs

**Decision.** Clean, English, unprefixed routes: `/products`, `/products/[slug]`,
`/category/toys`, `/category/toys/wooden-toys`, `/age/3-5-years`, `/collections/[slug]`,
`/search`, `/offers`, `/cart`, `/checkout`, `/about`, `/blog/[slug]`.

**Consequences.**

- No locale segment anywhere in the route tree.
- Slugs are always English, even for a Bangla-named product.
- Canonical URL is `${siteUrl}${path}` — one canonical per page, no alternates.
- `alternateLanguages`, `localeTags` and `openGraphLocales` are deleted.
- The sitemap emits one entry per page, not one per locale.

**Overrides.** The `[locale]` routing in the current Phase 1 implementation.

---

## D-04 · Single-repository full-stack Next.js architecture

**Decision.** One repository. Next.js App Router, full stack. No monorepo, no separate
client/server projects, no Express backend, no separate API service.

**Locked stack:** Next.js 16 (App Router) · TypeScript strict · Tailwind CSS 4 · HeroUI 3 ·
MongoDB Atlas + Mongoose · Zod · react-icons · react-hot-toast · Better Auth (Phase 5) ·
SSLCOMMERZ + COD (Phase 7) · Pathao/Steadfast (Phase 8) · Vercel + Atlas · Vitest + Playwright.

**Consequences.**

- No page-builder framework, theme engine, or theme-derived code.
- No new UI, animation, carousel, modal or icon library without explicit justification and
  founder approval. HeroUI Modal covers dialogs; CSS scroll-snap covers rails.
- Design references must not pull dependencies in behind them.

**Overrides.** v1.8 §10 "Remaining Decisions — Backend shape" is now settled, not open.

---

## D-05 · Design references and their roles

**Decision.** Three reference images, three distinct roles:

| File | Role |
| --- | --- |
| `primary-storefront-reference.png` | Main reference for homepage structure, category discovery, age navigation, promotional sections and product merchandising |
| `premium-layout-reference.png` | Reference for spacing, restraint, clean product grids and premium presentation |
| `playful-details-reference.png` | Reference for controlled child-friendly shapes, category treatments, illustrations and supporting colours |

**Consequences.**

- These three PNGs replace design references 1a, 1b and 1c in
  `assets/Renvura—Educational Toy Shop Design.pdf` as the design authority.
- `playful-details-reference.png` is a **ceiling** of playfulness. Renvura sits well below it.
- References inform commerce structure, spacing, product presentation and controlled
  child-friendly styling — nothing else.

**Overrides.** The design PDF as a source of layout direction. Note that its "Farah Karim"
curator was already identified as a mockup placeholder and remains excluded.

---

## D-06 · Colour system

**Decision.** The official Renvura core palette is preserved and extended with a supporting
palette.

**Core (unchanged):** Authority Navy `#11253C` · Premium Gold `#CDAF80` ·
Linen Cream `#F7F1E5` · Slate Gray `#A5AAB5`

**Supporting (new):** Soft Sky `#D9EEF5` · Soft Mint `#E2EED8` · Soft Blush `#F6DAD8` ·
Soft Lavender `#E7DFF4` · Soft Sunshine `#F8E6A8` · Dark secondary text `#4A5A6E`

**Locked rules.**

1. Linen Cream or warm white is the primary storefront background.
2. Navy is for headings, navigation, footer, important text and selected trust sections.
3. Gold is used **sparingly** — primary CTA backgrounds and premium highlights only.
4. **Always navy text on gold buttons.**
5. **Never gold text on cream.** Any size, any weight, any element.
6. Slate is for borders, dividers and disabled states — **not** important body text.
7. `#4A5A6E` is the official readable secondary text colour.
8. Supporting pastels are for category cards, age groups, promotional surfaces, badges and
   subtle illustration. They support the brand; they do not replace navy, gold and cream.
9. Product photography provides most of the brighter colour.
10. Avoid excessive rainbow colour, strongly gendered pink/blue styling, and visually chaotic
    sections.

**Consequences.**

- `tests/unit/brand-contrast.test.ts` stays and continues to fail the build on gold text.
- What v1.8 recorded as a "deviation" — `--muted: #4A5A6E` — is now the official token.
- Pastels are assigned per category and per age band as **data** (`accentToken`), so a
  category's colour is stable everywhere it appears.
- All text/background pairs must clear WCAG AA (4.5:1 body, 3:1 large).

**Overrides / extends.** v1.8 §2.1 — the four-colour palette is no longer the complete system.

---

## D-07 · Light storefront at launch — settled

**Decision.**

1. **The visible theme toggle is removed.**
2. **The launch storefront ships light/cream only.**
3. **The existing dark tokens in `globals.css` may remain in place, unused**, as a starting
   point for possible post-launch work.

**Consequences.**

- No design work, QA time or component variant is spent on dark mode before launch.
- No feature, component or test may depend on a theme switch existing.
- This is no longer an open question. It has been removed from the unresolved-decisions list
  in PROJECT_SPECIFICATION §12.2.

**Overrides.** v1.8 §3.4 (theme toggle in the navbar as launch scope).

---

## D-08 · Product selection and demo data

**Decision.** Final products have not been selected. Phase 2 may build against **synthetic
demo data** — invented names, prices, stock, images and specifications used to exercise the
real product components.

**Where it may exist.** Local development, and protected preview environments that are not
publicly reachable. **Nowhere else.**

**Locked rules.**

- Demo data lives in a **separate development database**, never the production cluster.
- **Production refuses active demo data through an environment/runtime guard** — a startup or
  request-time check that fails loudly in production. The `isDemo` flag is a label, not a
  safety mechanism, and is not sufficient protection on its own.
- **Demo mode is visibly labelled** (persistent banner plus per-product marker) and the site
  emits `noindex, nofollow` and is excluded from the sitemap while it is on.
- **No `Product`/`Offer` structured data is emitted for demo products**, in any environment.
  The markup is built and tested in Phase 2; it ships only for real, published, qualifying
  products.
- **All external side effects are disabled for demo orders:** no payment authorisation or
  capture, no courier consignment, no transactional email, no SMS/OTP, no Pixel/CAPI
  conversion events.
- Demo records live in MongoDB and are created by a seed script — never hard-coded in
  components — so the real components are what get exercised.
- Every demo record carries `isDemo: true`.
- One admin action or script removes all demo records; real products replace them with no
  code change.
- **Demo data is purged before public launch**, verified at the launch gate.

---

## D-09 · Founder positioning

**Decision.** Founder expertise is a **supporting trust advantage**, not the main subject of
the homepage. Products, categories, discovery, offers and shopping actions dominate the
storefront.

**Locked rules.**

- The homepage founder/expert section is **small, one row, always below the primary product
  sections, never full-bleed, never the hero**. This holds under every homepage configuration
  (D-10) and is not tied to any particular position number.
- It contains at most: photo, name, one credential line, one sentence, one link to `/about`.
- The full founder story, credentials and philosophy live on `/about`.
- Expert notes appear on the minority of products that carry one, attributed, in a distinct
  panel — and their absence must never create an empty block.
- The only person named anywhere is **Abdullah Al Masum**, with his real credentials
  (M.Ed., Institute of Education and Research, University of Dhaka; background in early
  childhood care and development and inclusive education).

**Overrides.** v1.8 §1.1 ("expertise-first store", "content-led authority brand with a shop
attached") and v1.8 §4.1 ("Home: expertise-led hero"), plus the current Phase 1 homepage,
which leads with the curator block.

---

## D-10 · Homepage order is a configurable default, within fixed constraints

**Decision.** The homepage section order below is the **recommended default merchandising
order**, not a locked layout. Section presence and order are **data/configuration-driven**, so
the founder can reorder or omit sections in response to inventory, campaigns and observed
customer behaviour without a deployment.

**Recommended default order**

1. Announcement and delivery bar
2. Commerce header (logo, search, categories, account, wishlist, cart)
3. Product-focused hero
4. Shop by category
5. Shop by age
6. **Featured Products**
7. Promotional category banners
8. Best Sellers *(only when derived from real order data — see below)*
9. Curated collections
10. New arrivals
11. Offers or seasonal campaigns
12. Why parents choose Renvura
13. Small founder/expert trust section
14. Helpful articles
15. Customer reviews
16. Newsletter or WhatsApp support
17. Complete e-commerce footer

**Four constraints that always hold, whatever the configuration:**

1. **Header and hero stay at the top.**
2. **Product discovery and merchandising come before founder content.**
3. **Founder content is never the hero, and always appears below the primary product
   sections.**
4. **The footer is last.**

**Locked rules.**

- The order must not be hardcoded in the page component.
- Any section may be omitted when its data does not exist.
- **"Featured Products" is the default early product grid** and the honest label at any stage.
- **"Best Sellers" may only appear when derived from real completed-order data.** A hand-picked
  grid labelled "Best Sellers" is a fabricated claim under D-12. Until sales data exists, the
  section is omitted — not renamed, not seeded.
- **Customers must reach real product cards early.** On a 360 px viewport the first product
  grid should be roughly one scroll below the hero, not five. If an arrangement pushes the
  first grid below image-heavy banners, move the products up.
- Section numbers describe this default arrangement only and are not part of any section's
  identity.
- The homepage must feel child-friendly but not childish, premium but not formal, colourful
  but not chaotic, and clearly designed to sell products.

---

## D-11 · No copying

**Decision.** No reference theme, text, logo, product image, illustration or layout may be
copied pixel-for-pixel or near-verbatim.

**Locked rules.**

- No theme code, CSS or markup enters the repository.
- No reference illustration, mascot, doodle or product photograph is used — not even as a
  development placeholder. Use plain neutral placeholder tiles.
- No reference copy is reused, including headings, taglines and section titles.
- References are used only to understand **commerce structure, spacing, product presentation
  and controlled child-friendly styling**.
- The final storefront must be **recognisably Renvura** — navy, gold and cream carry the
  identity, and nothing on the page should be mistakable for a reference theme.

---

## D-12 · No unverified claims

**Decision. Never present invented information as real.**

Never invent, infer, placeholder or "reasonably assume" any of the following in a
customer-reachable context:

prices · currency amounts · certifications · materials · safety claims (including
"non-toxic", "BPA-free", "lead-free") · stock levels · discounts · delivery promises ·
delivery charges · delivery times · return promises · refund or warranty terms · legal
wording · review or testimonial text · customer names · partner or brand logos · payment
badges for methods not integrated.

**Locked rules.**

- Where such content is structurally required but not yet supplied, render an explicit,
  honest pending state; emit `noindex, nofollow`; exclude the page from the sitemap. This is
  the rule the current Phase 1 already follows for FAQ and the five policy pages, and it
  continues unchanged.
- The homepage reviews section is **absent** until real reviews exist. No seeded testimonials.
- Badges and sections such as "Bestseller" / "Best Sellers" are derived from real data or not
  shown.
- Legal and policy wording must be founder-supplied and reviewed before those pages go live.
- **Structured data is emitted only where the real content and eligibility exist.**
  `Organization` is the site-wide default: **emitted from Phase 1** with verified details
  only, then **verified and enriched in Phase 9** with the final, genuine business details.
  `Product`, `Offer`, `AggregateRating`, `Article` and `FAQPage` appear only with real,
  published, qualifying content behind them — `Product`/`Offer` support is built and tested
  in Phase 2 but is **never emitted for demo products**.
  **`LocalBusiness` is used only if Renvura has a genuine public business location** with
  complete, accurate details — not for an online-only operation.
- **Licensed stock photography is permitted** with proper commercial licensing and model
  releases, but must never be presented, captioned or framed as a real Renvura customer,
  testimonial or user-submitted content. Photographs Renvura commissions, captures or owns
  require founder permission and documented consent where a person is identifiable.

**The one bounded exception** is synthetic demo content under D-08 — permitted precisely
because it is never presented as real: confined to development and protected previews,
labelled, noindexed, side-effect-free, database-separated, guarded out of production and
purged before launch. Outside those conditions this decision applies without exception.

---

## D-13 · Launch versus later features

**Decision.**

**Launch scope.** Storefront shell (announcement bar, commerce header, full footer) ·
product catalogue, listing, detail, variants, images · categories (nested) and age navigation ·
collections and bundles · search with English + Bangla aliases · cart and wishlist · checkout
with COD and the one-click COD express modal · guest checkout by phone · online payment
(SSLCOMMERZ) and the prepay discount · courier integration with tracking and COD
reconciliation · phone-OTP accounts, order history, order tracking · admin (products,
categories, media, orders, customers, settings) · basic coupon codes · About, Contact, FAQ and
five real policy pages · small founder trust section · **a simple single-author article
system** with a small number of real articles · SEO foundations, structured data, sitemap,
robots, canonicals · **WhatsApp click-to-chat** · **GA4, Google Search Console, and
Meta Pixel and Conversions API (CAPI)** with core commerce events · the mobile performance
budget.

**Later scope.** Loyalty points and ledger · review incentives · scheduled occasion coupon
campaigns with stacking rules · affiliate/referral program · **multi-author** content platform
(Author role, `/studio`, editorial workflow) · age-graduation retention automation ·
abandoned-cart **automation sequences** · advanced funnel and marketing automation · chatbot ·
dark mode · lead-magnet gating · Trustpilot.

**Locked rules.**

- **Basic GA4, Search Console, Meta Pixel, WhatsApp support and the simple single-author
  article system must be complete before public launch.** They are launch requirements, and
  the phase roadmap places them before the launch gate. Advanced automation, multi-author
  workflow, abandoned-cart sequences and the chatbot stay later.
- **The launch gate sits after every launch requirement is complete** — not mid-way through
  them. Nothing in the launch scope is finished after going live.
- **Online payment (SSLCOMMERZ) and automated courier integration remain the desired launch
  scope.** If third-party onboarding is the only thing blocking launch, the controlled
  COD-only / manual-courier fallback in PROJECT_SPECIFICATION §8.1 may be used: payment
  options **hidden, not disabled**; no prepay discount advertised; no uninstalled payment
  logos; tracking recorded manually with no fabricated delivery estimates; volume kept within
  manual capacity. Using the fallback is a founder decision, is recorded when taken, does not
  waive any other launch requirement, and Phases 7–8 complete immediately after launch.
- If a feature does not clearly earn its place at launch — by driving trust, conversion, or
  first revenue — it waits. Nothing is cut; it is sequenced.

---

## D-14 · Mobile-first performance is mandatory

**Decision.** Mobile-first performance is a **requirement**, not a polish task. The target
device is a low-to-mid-range Android phone on mobile data in Bangladesh.

**Locked budget.** LCP < 2.5 s · CLS < 0.1 · INP < 200 ms, measured on a throttled mid-range
Android profile, on the homepage and product pages.

**Consequences.**

- Server components by default; client components only where interaction demands it.
- Every added client component, third-party script and dependency must be justified against
  this budget.
- No auto-rotating hero carousel, no carousel or animation library, no infinite scroll on
  listing pages, no popup modal on page load.
- Images through `next/image` with reserved dimensions; exactly one `priority` image per page.
- Fonts self-hosted via `next/font`, Bengali subset loaded only where used.
- Performance is an explicit launch gate. A build that misses the budget does not launch.

---

## D-15 · Phase 1 must be revised, not preserved

**Decision.** The existing Phase 1 implementation is revised in place to comply with D-01
through D-14 before Phase 2 begins.

**Must be removed.** The `[locale]` route segment · `src/i18n/*` · the next-intl proxy ·
`messages/bn.json` and `messages/en.json` · `LanguageToggle` · the locale-aware `AppLink` ·
`hreflang`/`alternateLanguages` · `localeTags` and `openGraphLocales` · the locale loop in
`src/app/sitemap.ts` · `locale` on `ContactSubmission` and the contact validation schema ·
the founder-led homepage hero · the `html[lang='bn']` global font switch.

**Must be kept.** Brand tokens and the contrast test · the three type faces · the MongoDB
layer and connection strategy · the contact form with its persistent MongoDB rate limiting ·
the loading-state system · branded 404 and error pages · policy pending states and their
`noindex` handling · the route-registry pattern in `src/lib/site.ts` · the build's
independence from the database.

**Must be added.** Supporting colour tokens · the per-run Bangla type mechanism · a commerce
header and full e-commerce footer · a product-first homepage · the expanded commerce route
registry.

**No dead controls.** Phase 1 must not expose any clickable control or link that does nothing.
Search, account, wishlist and cart are either **hidden until their routes work**, or **visually
represented while genuinely disabled** (`disabled`/`aria-disabled`, non-interactive, visibly
de-emphasised) **in a non-public development preview only**. No live-looking control that
no-ops, and no link to a route that does not exist.

**Categories and age bands are Phase 2 decisions.** Phase 1 builds data-driven navigation,
category and age components that render correctly against an **empty** dataset. It must not
hardcode invented production categories or bands. When bands are finalised in Phase 2, their
ranges must be contiguous and non-overlapping.

**Visual approval happens in Phase 2**, once protected demo products populate the real product
components — a storefront with no products in it cannot be meaningfully approved.

**Phase 1 revision exit criteria** — all must pass before Phase 2 begins:

- Node **22.22+** environment verified in development and CI.
- `npm audit` run and every finding **manually triaged** and recorded.
  **`npm audit fix --force` must not be used.**
- `npm run lint`, `npm run typecheck`, `npm run test` (Vitest), `npm run test:e2e`
  (Playwright smoke) and `npm run build` all pass.
- No dead links and no nonfunctional interactive controls anywhere in the build.
- Mobile visual review completed at **360 px** width, with no horizontal body scroll and no
  clipped or overlapping content.
- `README.md` and any code comment citing the v1.8 PDF as the source of truth updated to
  point at `docs/`.

**Locked rule.** No application code, dependency, test, configuration or asset changes are
made under the authority of this document alone. This revision is a **documentation-only**
deliverable; the code changes above are the scope of the Phase 1 revision task, to be planned
and approved separately.

---

## D-16 · Product compliance, safety and publishing validation

**Decision.** Compliance and safety data is a **separate optional block**, independent of the
optional child-development block, and is governed by stricter rules.

**Locked rules.**

- `safetyWarning` and all related fields live in the **compliance block, not the
  child-development block**. A feeding steriliser needs safety information and has no
  development domain.
- The compliance block supports: manufacturer or supplier, country of origin, material
  information, safety warnings, certification and test-report references, batch and expiry
  where applicable, warranty where applicable, and — for every claim — an **evidence/source
  reference and a verification status**.
- A compliance claim that is not `verified` is **never rendered** on the storefront. Nothing
  in this block may be inferred from a product name, supplier marketing copy, a marketplace
  listing or a photograph.
- **Category-specific publishing requirements are supported.** Each category carries a
  compliance profile naming which fields are mandatory to publish. **Higher-risk categories —
  feeding, skincare and care, electrical, safety products, and anything for under-3s — cannot
  be published until the applicable information and documents are verified.**
- **No specific law, standard number or certification scheme is claimed as applicable to
  Renvura in these documents.** What applies must be confirmed by a qualified adviser before
  any such claim is published. The system holds and gates on verified data; it does not assert
  what that data must be. Categories whose requirements are unconfirmed stay unpublished.

**Draft and publishing validation.**

- **Incomplete products can always be saved as drafts.** Validation gates the transition to
  `active`, never the write.
- **Publishing** requires name, description, a real price, SKU, at least one image with alt
  text, a primary category, a valid stock policy, and every compliance field that category
  requires — reported as a per-field checklist, not a single rejection.
- **`stockPolicy` is always required. Stock quantity is required only when `stockPolicy` is
  `track`.**
- **Draft products are never publicly accessible, never indexed and never in the sitemap.**
  Archived products keep their URL alive, marked unavailable and `noindex`, but leave all
  discovery. Active products are fully visible.
