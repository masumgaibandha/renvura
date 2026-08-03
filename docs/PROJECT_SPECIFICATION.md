# Renvura — Project Specification

**Version:** 2.0 · **Date:** 2026-08-03 · **Status:** Current source of truth

<!-- markdownlint-disable MD013 MD036 -->
<!--
  Two markdownlint rules are intentionally disabled for this document.

  MD013 (line-length): prose is wrapped at ~95 characters and tables are not wrapped at all.
  Forcing an 80-character limit would either break table rows — which cannot be wrapped in
  Markdown without breaking the table — or fragment sentences and hurt readability. The
  80-column rule is not worth damaging the document to satisfy.

  MD036 (no-emphasis-as-heading): bold labels such as **Rules**, **Storefront** and
  **Stock modelling** are deliberate intra-section labels, not navigable sections. Every
  real heading here carries a section number (§7.2, §11.1.4) and is cross-referenced by that
  number. Promoting these labels to headings would inject dozens of unnumbered entries into
  the structure and break the numbering convention the three documents rely on.

  All other rules are enforced and currently pass.
-->

---

## 0. Status of this document

This document supersedes `assets/Renvura-Project-Specification.pdf` (v1.8) and
`assets/Renvura—Educational Toy Shop Design.pdf` wherever they conflict. Those PDFs are
retained as **historical reference only** and must not be cited as authority for business,
language, product or design direction.

Source-of-truth order (highest first):

1. `docs/LOCKED_DECISIONS.md`
2. `docs/PROJECT_SPECIFICATION.md` (this file)
3. `docs/STOREFRONT_DESIGN_DIRECTION.md`
4. `assets/design-references/*.png` — selected visual references
5. Historical PDFs in `assets/` — background context and **secondary inspiration only**

`assets/Renvura—Educational Toy Shop Design.pdf` is retained as historical secondary
inspiration and is still worth consulting for **product-detail page ideas** (reference 1c in
particular). It may never override these three Markdown documents or the three selected PNG
references.

Where v1.8 is unchanged (technology stack rationale, payment/courier/SMS landscape, SEO
technical fundamentals, admin module inventory), it remains useful and is carried forward
here in condensed form.

---

## 1. Business positioning

Renvura is a **broad children's e-commerce store for Bangladeshi families**. It sells
products for children — across ages, categories and price points — through a fast,
trustworthy, mobile-first online shop.

Learning and play-based products are the **initial specialty**: the first curated depth,
the founder's area of expertise, and the strongest early differentiator. They are not the
boundary of the business. The platform must be architected so that adding baby feeding
products, school supplies or travel gear is ordinary catalogue work, not a re-architecture.

**What Renvura is:**

- A children's product store, organised by category and by age, that sells.
- A store whose curation is informed by child-development expertise.
- A store built for Bangladeshi buying behaviour: mobile, cash-on-delivery, trust-driven,
  WhatsApp-assisted.

**What Renvura is not:**

- Not an educational-toy-only shop.
- Not a blog or content brand with a shop attached. Content supports commerce; it does not
  outrank it on the homepage.
- Not a developmental-assessment or milestone-tracking product.

**Positioning shift from v1.8.** v1.8 described "an expertise-first store … content-led
authority brand with a shop attached", scoped to child development and learning materials
for ages 2–12. That is now explicitly revised: **products, categories, discovery, offers and
shopping actions dominate the storefront**, and founder expertise is a supporting trust
advantage placed in a small, well-designed section — not the subject of the homepage.

**Founder.** Abdullah Al Masum — M.Ed., Institute of Education and Research, University of
Dhaka; background in early childhood care and development and inclusive education. This is
real, verified, and is a genuine advantage in a low-trust market. It is used as a **trust
signal**, not as the store's identity.

---

## 2. Target customers

### 2.1 Who Renvura sells to

**Parents, caregivers and gift buyers of children aged 0–12.**

That is the whole established definition. It is deliberately not narrowed by gender, age
bracket, city tier or income. Caregivers include grandparents, guardians, relatives and
anyone else buying on a child's behalf.

| Segment | What they need from the site |
| --- | --- |
| **Parents and caregivers of 0–12s** | Fast pages, clear prices, obvious "add to cart", COD, a phone number they can call |
| **Gift buyers** | Age filters, price bands, gift browsing, confidence that the item suits the age |
| **Expectant and new parents** | Newborn and 0–12-month navigation, baby essentials categories, plain guidance |
| **Educators and centres** | Preschools, daycare centres, therapists — bulk-friendly browsing, learning categories, expert notes where they exist |

### 2.2 One established assumption

**Expected primary customers are educated Bangladeshi parents who are generally comfortable
with English commerce interfaces.** This is the assumption that supports the English-first
hybrid-language decision (§4): English carries the interface because these shoppers already
navigate English commerce UI daily, while Bangla carries the explanatory, emotional and
safety-critical text where it genuinely adds understanding.

### 2.3 Hypotheses to validate — not facts

The following are **working assumptions used to make design and performance decisions**. They
are not established facts about Renvura's customers, and none of them should be repeated
elsewhere as if they were. Validate each against real analytics, order data and customer
conversations once traffic exists, and revise this section accordingly.

| # | Hypothesis | How to validate |
| --- | --- | --- |
| H-1 | Buyers skew urban and semi-urban | Order shipping addresses by division/district |
| H-2 | Buyers skew female | Optional, self-declared only; never inferred from names or products |
| H-3 | Buyers cluster in the 25–40 age range | Only if voluntarily supplied; otherwise leave unmeasured |
| H-4 | Most sessions are mobile, on low-to-mid-range Android | GA4 device and browser reports |
| H-5 | Most sessions run on 4G or slower connections | Field Core Web Vitals (CrUX / GA4 real-user data) |
| H-6 | COD is the preferred payment method | Payment-method split once both are live |
| H-7 | Facebook/Instagram is the largest acquisition channel | GA4 acquisition reports + Meta attribution |

**Device and network constraint (applies regardless of validation).** Build for a 4G-or-worse
connection on an Android device with 3–4 GB RAM. Even if H-4 and H-5 turn out to be
overstated, designing for that profile costs nothing for faster devices and protects the
slowest customers. Every homepage section, script and image must justify its weight. This
constraint outranks visual ambition.

**Trust reality.** Bangladeshi online buyers have been burned by fake stores. The site earns
trust through: visible contact details, real policies, honest stock and delivery statements,
real reviews, COD, and — secondarily — the founder's credentials.

---

## 3. Product and category scope

### 3.1 In scope

Renvura may sell any legitimate child-related product, including:

- Learning products and educational materials
- Toys and play equipment
- Baby essentials
- Feeding products
- Child-care products
- Safety products
- Clothing
- Accessories
- School supplies
- Travel products (prams, carriers, car-seat accessories, travel bags)
- Gifts and gift sets
- Development kits and curated bundles
- Other child-related products as the catalogue grows

### 3.2 Category model requirements

- Categories are **data**, not code. Adding, renaming, reordering, nesting or retiring a
  category is an admin operation with no deployment.
- Two levels of nesting must be supported at minimum (`Toys → Wooden Toys`). The
  storefront must render sensibly with one level only.
- Every category has: English name, English slug, optional Bangla name for search aliasing,
  optional description, optional image, optional accent colour token, sort order, active
  flag, SEO fields.
- **No category is privileged in the schema.** "Educational" is a category like any other.

### 3.3 Age navigation

Age is a **first-class navigation axis**, independent of category. Because the store now
includes baby essentials and feeding products, age navigation starts at newborn, not at 2.

Age bands are configurable data with a label, a min/max month range, a slug and a pastel
token. A product declares an age range in months; band membership is derived, so re-banding
never requires re-tagging products.

**The final band set is a Phase 2 decision, not a Phase 1 one.** Phase 1 builds age
navigation as a data-driven component that renders correctly against an **empty** age-band
dataset and must not hardcode an invented production band set. A candidate set for the
founder to confirm in Phase 2:

`0–11 months` · `1–2 years` · `3–5 years` · `6–8 years` · `9–12 years`

**Boundaries must not overlap.** Bands are **inclusive** month ranges:

- `minMonths` is inclusive.
- `maxMonths` is inclusive.
- The next band must start at the previous band's `maxMonths + 1`.
- Bands must be contiguous (no gaps) and non-overlapping.

So every month value belongs to exactly one band. `0–11 months` then `1–2 years`
(12–35 months) is correct; `0–12 months` then `1–2 years` is not, because month 12 would fall
in both. A validation rule enforces contiguity and non-overlap when bands are saved.

### 3.4 Optional developmental attributes

Development domains, milestones, expert notes and age guidance are **optional product
attributes**. A pack of feeding bibs carries none of them. A fine-motor lacing set may carry
all of them.

Rules:

- Optional at the schema level — nullable, absent by default, never required to save a product.
- Optional at the UI level — a product page renders correctly and completely with none of
  them present. No empty "Development domains" heading, no "N/A".
- Filters and facets for these attributes appear only where products actually carry them.
- `/development/[domain]` may exist as a discovery route, but only as a **filtered view over
  a catalogue that mostly lacks the attribute** — never as a primary navigation item competing
  with categories and ages.

### 3.5 Product selection status

**Final products have not been selected.** Nothing in the repository, in these documents, or
on any deployed page may present a specific product, price, brand, material, certification,
stock level, discount, delivery time or return term as real until the founder supplies it.

Phase 2 may build against **synthetic DEMO data** — names, prices, stock, images and
specifications invented purely to exercise the real product components.

**Where demo data may exist**

- Local development.
- Protected preview environments (authentication-gated or otherwise not publicly reachable).

**Nowhere else.** Demo data must never populate a public production storefront.

**Rules**

- Demo data lives in a **separate development database**, not in the production Atlas
  cluster. Environment separation is the primary containment mechanism.
- Stored in MongoDB like any product, created by a seed script, never hard-coded in
  components — so the real components are what get exercised.
- Every demo record carries `isDemo: true`. This is a **label, not a safety mechanism**.
- **Production refuses active demo data through an environment/runtime guard.** A startup or
  request-time check fails loudly if `NODE_ENV`/deployment environment is production and
  demo mode is enabled or any `isDemo: true` document is active. `isDemo` alone is not
  sufficient protection — a flag can be flipped or forgotten; a guard cannot be ignored.
- **Demo mode is visibly labelled** — a persistent banner plus a per-product marker — and the
  entire site emits `noindex, nofollow` and is excluded from the sitemap while it is on.
- **All external side effects are disabled for demo orders:** no payment authorisation or
  capture, no courier consignment creation, no transactional email, no SMS/OTP dispatch, no
  Pixel/CAPI conversion events. Demo checkout exercises the internal flow and stops at the
  boundary.
- A single admin action or script removes all demo records; real products replace them with
  no code change.
- **Demo data must be purged before public launch**, verified at the launch gate (§11.2).

### 3.6 Claims discipline (absolute)

**The rule is: never present invented information as real.**

Never invent, infer, placeholder or "reasonably assume", in any customer-reachable context:

prices · currency amounts · certifications · materials · safety claims (including
"non-toxic", "BPA-free", "lead-free") · stock levels · discounts · delivery promises ·
delivery charges · return or refund terms · warranty terms · legal wording · review or
testimonial text · customer names · partner or brand logos.

Where such content is structurally required but not yet supplied, the page renders an
explicit, honest pending state and is excluded from the index and sitemap. This is the rule
Phase 1 already follows for the FAQ and the five policy pages; it continues unchanged.

**Synthetic demo content is the one bounded exception**, and only because it is never
presented as real: it is confined to local development and protected preview environments,
visibly labelled, noindexed, side-effect-free, kept in a separate database, blocked from
production by a runtime guard, and purged before launch (§3.5). Outside those conditions the
absolute rule applies without exception.

---

## 4. Language strategy

### 4.1 The decision

**One English-first hybrid-language website.** One set of pages. One URL per page.

Explicitly ruled out:

- A Bangla/English language toggle
- Separate `/bn` and `/en` route trees
- Duplicate translated pages
- `hreflang` alternate architecture
- Machine translation of UI or content

### 4.2 English (default for everything structural)

Navigation · category names · buttons and CTAs · search UI · product names · specification
tables and labels · filters and sort · badges · cart · checkout · payment · order status ·
account · forms and validation messages · toasts · errors · footer link labels · admin
dashboard (entirely English) · URL slugs · metadata and structured data.

### 4.3 Bangla (selective, where it genuinely helps)

Bangla appears inside content, not inside chrome:

- Detailed product explanations — the paragraph a parent actually reads before deciding
- Usage instructions
- Expert notes ("why this helps your child")
- Age guidance written as advice
- Safety warnings
- Important delivery and return information at the point it matters (checkout, product page)
- Selected trust copy and support prompts

### 4.4 Rules

- Bangla is stored as its own optional field beside the English one, e.g.
  `description` (English, required) and `descriptionBn` (Bangla, optional). It is **not** a
  locale map, and there is no locale resolution layer.
- A Bangla field renders when present and is silently omitted when absent. No fallback text,
  no "translation pending".
- Bangla and English may appear on the same page, in the same section, at the same time.
  That is the intent of "hybrid", not a defect.
- Bangla runs are wrapped in an element carrying `lang="bn"` and a Bangla type class so
  Noto Sans Bengali applies to that run only. The page's `<html lang>` is `en`.
- **URL slugs are always English.** `/category/feeding`, never a transliteration.
- **Search accepts both.** Products and categories carry a `searchAliases` array holding
  Bangla terms, transliterations and common misspellings, so a shopper typing Bangla finds
  the English-named product. Aliases are indexed for search only and never rendered as labels.
- No `hreflang`, no `x-default`, no locale-prefixed canonical URLs.

### 4.5 Why

A toggle forces every string to exist twice, doubles QA, doubles the page inventory Google
must crawl, and adds a routing layer — for a benefit that, for Renvura's expected customers,
is largely already met. Per §2.2, the expected primary customers are educated Bangladeshi
parents who are generally comfortable with English commerce interfaces; English chrome is not
the barrier a toggle would be built to remove. Where Bangla genuinely wins is in the
emotional, explanatory and safety-critical text. Putting Bangla exactly there, and nowhere
else, gets the benefit at a fraction of the cost.

If real usage contradicts the §2.2 assumption — Bangla-heavy search queries, support requests
about understanding the interface, drop-off concentrated at English-only steps — revisit this
decision with that evidence rather than defending the architecture.

---

## 5. Technology architecture

### 5.1 Locked

| Layer | Choice | Note |
| --- | --- | --- |
| Repository | **Single repository, full-stack Next.js App Router** | No monorepo, no separate client/server projects, no Express backend |
| Framework | Next.js 16 (App Router, Turbopack) | Server rendering for SEO; built-in image optimisation |
| Language | TypeScript 5.9, `strict` | |
| UI | Tailwind CSS 4 + HeroUI 3 | HeroUI Modal covers dialogs; no extra modal library |
| Database | MongoDB Atlas via Mongoose | Flexible schema fits optional attributes and variants |
| Icons / toasts | react-icons, react-hot-toast | |
| Validation | Zod | |
| Auth | Better Auth — phone-OTP primary, email secondary, guest checkout allowed | Phase 5 |
| Payments | SSLCOMMERZ (bKash, Nagad, Rocket, cards, bank) + COD | Phase 7 |
| Courier | Pathao / Steadfast | Phase 8 |
| Hosting | Vercel + Atlas | |
| Analytics | Meta Pixel + CAPI, GA4, Search Console | Phase 10 |
| Tests | Vitest (unit), Playwright (smoke/e2e) | |

Node 22.22+, npm.

### 5.2 Removed from the architecture

- **`next-intl` and the locale routing layer.** The `[locale]` route segment, `src/i18n/*`,
  the locale proxy/middleware, `messages/bn.json`, `messages/en.json`, `LanguageToggle`, the
  locale-aware `AppLink`, `localeTags`, `openGraphLocales` and `alternateLanguages` are all
  removed during the Phase 1 revision. See §11.1.
- **hreflang generation** in `src/lib/seo/metadata.ts` and the locale loop in
  `src/app/sitemap.ts`.

### 5.3 Not permitted

- Page-builder frameworks, theme engines, or any code lifted from a purchased theme.
- Component libraries beyond HeroUI, animation libraries, carousel libraries, or icon packs
  beyond react-icons — unless a specific, justified need survives review. The design
  references are **inspiration only**; they must not pull dependencies in behind them.
- Client-only rendering for product, category or article pages.

### 5.4 Route map (clean URLs, no locale prefix)

**Storefront**

```text
/                          Home
/products                  All products, filters + sort
/products/[slug]           Product detail
/category/[slug]           Category listing (nested: /category/toys/wooden-toys)
/age/[band]                Age listing, e.g. /age/3-5-years
/collections/[slug]        Curated collections and bundles
/search                    Search results (English + Bangla alias matching)
/offers                    Active offers and campaigns
/cart                      Cart
/checkout                  Checkout — COD + online
/order/confirm/[id]        Order confirmation
/track                     Order tracking by phone + order ID
/wishlist                  Wishlist
/about                     About Renvura (founder story lives here, in full)
/contact                   Contact
/faq                       FAQ
/blog, /blog/[slug]        Articles
/privacy /returns /shipping /terms /child-safety     Policies
```

**Auth / account**

```text
/login /register
/account /account/orders /account/addresses /account/reviews
/account/rewards           later phase
```

**Admin (English only)**

```text
/admin                     Dashboard
/admin/products            CRUD, variants, images, optional child-dev fields
/admin/categories          Category tree, images, accent tokens
/admin/orders              Status, push-to-courier, COD tracking
/admin/customers
/admin/content             Articles
/admin/coupons             Occasion campaigns
/admin/reviews             Moderation
/admin/settings            Payment, courier, shipping zones
```

### 5.5 SEO architecture

Carried forward from v1.8 §7, minus the bilingual parts:

- SSR/SSG for every product, category and article page — never a client-only shell.
- Unique title, description and Open Graph tags per page.
- **Structured data — only where the real content exists and the eligibility requirements are met:**
  - `Organization` — **the default site-wide entity. Emitted from Phase 1**, using only the
    details that are already true and verified (name, site URL, logo, the published contact
    details). **Phase 9 verifies and enriches it** with the final, genuine business details
    once they are confirmed — legal name, full contact information, social profiles. Phase 1
    ships a correct-but-minimal entity; Phase 9 completes it. Nothing is guessed at either point.
  - `BreadcrumbList` — on every listing and detail page once the category tree exists.
  - `Product` + `Offer` — **support is built and tested in Phase 2**, but it is **never
    emitted for demo products**. Markup is emitted only for real, published, qualifying
    products: `status: active`, a real founder-supplied price, and a real availability state.
    Never on demo data, never on a draft, never on a pending page. In Phase 2 the markup is
    verified against real sample data locally rather than by shipping it over demo records.
  - `AggregateRating` — only once genuine customer reviews exist for that product. Never
    seeded, never estimated.
  - `Article` — only on published articles with a real author, headline and date.
  - `FAQPage` — only once the FAQ carries real, published question-and-answer content.
  - `LocalBusiness` — **only if and when Renvura has a genuine public business location**
    with complete, accurate name, address, phone and opening hours. It is not emitted for an
    online-only operation, and a home or unlisted address is not a substitute.
- Markup is validated (Rich Results Test / Search Console) before each type goes live.
- Auto-generated `sitemap.xml` and `robots.txt`, driven by the route registry; pending pages
  excluded.
- Canonical tags on every page; filter and sort permutations canonicalise to the clean listing.
- Clean readable URLs (`/blog/child-motor-skills-3-years`).
- Core Web Vitals treated as a launch gate, not a polish task.
- **No hreflang.** One page, one canonical, one language declaration (`en`) with `lang="bn"`
  on Bangla runs.

---

## 6. Customer journeys

**J1 — Facebook ad → product → COD order (the primary revenue path)**
Ad → product page → sees price, images, delivery note → "Order via Cash on Delivery"
one-click modal (name, phone, address) → confirmation → SMS/WhatsApp follow-up.
Must work end-to-end on a mid-range Android in under a minute.

**J2 — Homepage browse → category → cart → checkout**
Home → Shop by Category → category listing with filters → product → add to cart → cart →
checkout (COD or online) → confirmation.

**J3 — Gift by age**
Home → Shop by Age → age band → sort by price or popularity → product → add to cart → checkout.

**J4 — Search**
Header search (English or Bangla term) → suggestions → results → product. Must return useful
results for a Bangla query against an English-named catalogue.

**J5 — Google organic → article → product**
Search → article → in-article product links → product → cart.

**J6 — Hesitant buyer → WhatsApp → assisted order**
Product page → WhatsApp button with product context → human reply → order placed by the
customer or captured by the founder.

**J7 — Repeat purchase as the child grows**
Order history → "shop the next age band" → new order. The retention engine of this niche.

**J8 — Founder operations**
Admin → add/edit product with images and optional developmental fields → publish → confirm
order → push to courier → mark delivered.

---

## 7. Product data requirements

The model must serve a bib and a STEM kit equally well. Everything child-development-specific
is optional.

### 7.1 Product

**Always required — even on a draft**

```text
status            draft | active | archived        default: draft
stockPolicy       track | always-in-stock | made-to-order
createdAt / updatedAt
```

**Required to publish (`status: active`) — optional while `status: draft`**

```text
name              string, English
slug              string, English, unique
description       string/rich text, English
price             number, BDT — a real founder-supplied price
sku               string
category          ref Category (primary)
images[]          at least one { url, alt, width, height, sortOrder }
stock             number — required only when stockPolicy is `track`
compliance        category-specific fields per §7.2
```

**Stock modelling**

- `stockPolicy` is always required, including on drafts. It is the field that determines
  whether a quantity is meaningful at all.
- `stock` (quantity) is required **only when `stockPolicy` is `track`**. It is meaningless
  for `always-in-stock` and `made-to-order`, and must not be validated, displayed as a count,
  or decremented for those policies.
- Storefront availability derives from the policy: `track` → in stock / low stock / out of
  stock by quantity; `always-in-stock` → always purchasable; `made-to-order` → purchasable
  with a lead-time note (real, founder-supplied).

**Status visibility rules**

| Status | Publicly reachable | Indexed | In sitemap | In listings / search | Orderable | Existing orders |
| --- | --- | --- | --- | --- | --- | --- |
| `draft` | **No** — 404 to the public | No | No | No | No | n/a |
| `active` | Yes | Yes | Yes | Yes | Yes | Yes |
| `archived` | Direct URL only, marked unavailable | `noindex` | No | No | No | Remain valid and viewable |

Draft products are never publicly accessible, never indexed and never included in the
sitemap. They are visible only in the admin. Archived products keep their URL alive so
historical order links and inbound links do not 404, but they leave discovery entirely.

**Core (optional)**

```text
descriptionBn     string/rich text, Bangla   — the detailed explanation
shortDescription  string, English
comparePrice      number — only when a real prior price exists
brand             ref Brand | string
categories[]      additional category refs
collections[]     refs
tags[]            strings
searchAliases[]   strings — Bangla terms, transliterations, misspellings (search only)
variants[]        { name, options[], sku, price, stock, image }
attributes[]      { key, labelEn, value, unit }  — generic spec rows; the extension point
                   for material, dimensions, capacity, battery, wash care, etc.
badges[]          new | bestseller | offer — derived where possible, not hand-typed
weightGrams       number — needed for courier
isDemo            boolean, default false
isFeatured        boolean
ratingSummary     { average, count } — populated by the review system only
seo               { metaTitle, metaDescription, ogImage }
```

**Optional child-development block — entirely nullable, marketing/guidance content**

```text
ageRange          { minMonths, maxMonths }        → powers /age/[band]
developmentDomains[]  strings from a configurable list
expertNote        { en?, bn? }                    → "why this helps"
milestones[]      { en?, bn? }
ageGuidance       { en?, bn? }
```

`safetyWarning` deliberately does **not** live here. It is compliance content, not
developmental content, and belongs in the block below — a bottle steriliser needs a safety
warning and has no development domain.

**Bundles**

```text
productType       single | bundle
bundleItems[]     { product, qty }
```

Rules: no field in the optional child-development block may be required by a form, an API
route, a card component or a detail-page section. A product carrying none of it must render a
complete, professional-looking page.

### 7.2 Optional compliance and safety block

A **separate optional block**, independent of the child-development block and governed by
different rules: developmental content is discretionary marketing; compliance content, once
a category requires it, is a **publishing precondition**.

```text
manufacturer        { name, contact? }            — manufacturer or supplier
supplier            { name, contact? }
countryOfOrigin     string
materials[]         { component, material, note? }
safetyWarnings[]    { en?, bn?, severity }        — moved here from the dev block
ageSafetyNote       { en?, bn? }                  — e.g. small-parts / choking guidance
certifications[]    { scheme, reference, issuedBy, issuedAt?, expiresAt?, documentUrl? }
testReports[]       { labName, reportRef, testedAt, documentUrl? }
batch               { batchCode?, manufacturedAt?, expiresAt? }
warranty            { periodMonths?, terms{ en?, bn? }, provider? }
evidence[]          { field, sourceType, sourceRef, documentUrl?, capturedAt }
verification        { status: unverified | pending | verified | rejected,
                      verifiedBy, verifiedAt, notes }
```

**Rules**

- Every claim in this block carries an **evidence/source reference and a verification
  status**. A material, certification or safety statement with `verification.status` other
  than `verified` is never rendered on the storefront.
- Nothing here may be inferred from a product name, a supplier's marketing copy, a
  marketplace listing or a photograph. It comes from a document or a named responsible
  person, and the reference is recorded.
- Expired certifications and out-of-date test reports do not render; the admin surfaces them
  for renewal.

**Category-specific publishing requirements**

Categories carry a `complianceProfile` naming which of the fields above are mandatory before
a product in that category can move from `draft` to `active`. **Higher-risk categories cannot
be published until the applicable information and documents are verified.** Categories
expected to need a stricter profile include, at minimum:

| Category group | Typically requires |
| --- | --- |
| **Feeding** (bottles, teats, sterilisers, utensils, food contact) | Manufacturer, country of origin, materials, food-contact suitability evidence, safety warnings, batch/expiry where applicable |
| **Skincare and care products** | Manufacturer, ingredients, batch and expiry, usage and warning text, verified supplier |
| **Electrical and battery-powered** | Manufacturer, voltage/battery specification, safety warnings, applicable certification references, warranty |
| **Safety products** (gates, harnesses, guards, car-seat accessories) | Manufacturer, materials, installation and usage warnings, certification or test-report references |
| **Toys with small parts, and anything for under-3s** | Materials, choking/small-parts warning, age safety note, manufacturer |

The profile set is configurable data and is expanded as the catalogue grows.

**Legal qualification.** This document deliberately **names no specific statute, standard
number or certification scheme as applicable to Renvura.** Which Bangladeshi regulations,
import requirements and product standards apply — and which certifications are legitimate for
a given category — must be confirmed by a qualified adviser before any such claim is
published. The system is built to *hold and gate on* verified compliance data; it does not
assert what that data must be. Categories whose requirements are not yet confirmed stay
unpublished rather than publishing an unverified claim.

### 7.3 Publishing validation

**Creating and saving a document must never be blocked by incomplete data.** Validation
gates the transition to `active`, not the write.

- A product can always be **saved as a draft** with nothing but `status` and `stockPolicy`.
  Partial work is preserved; the founder can add a name today and images next week.
- The **publish action** runs the full validation: name, description, real price, SKU, at
  least one image with alt text, a primary category, a valid stock policy (plus a quantity
  when `track`), and every compliance field required by that category's `complianceProfile`
  in `verified` state.
- Publish failures are reported as a per-field checklist in the admin — "what is missing
  before this can go live" — not as a single rejection.
- The same rule applies to categories, collections and articles: draft freely, validate at
  publish.
- Un-publishing (`active` → `draft` or `archived`) is always allowed and never blocked by
  validation.

### 7.4 Category

```text
name (En) · slug (En) · parent? · description? (En) · descriptionBn?
image? · accentToken?  (soft-sky | soft-mint | soft-blush | soft-lavender | soft-sunshine)
complianceProfile?  — which §7.2 fields are mandatory to publish in this category
searchAliases[] · sortOrder · isActive · seo{}
```

### 7.5 AgeBand

```text
label (En) · slug (En) · minMonths · maxMonths · accentToken · sortOrder · isActive
```

Ranges must be contiguous and non-overlapping (§3.3).

### 7.6 Collection

```text
name (En) · slug · description? · descriptionBn? · heroImage? · products[] | rules{}
· isActive · sortOrder · seo{}
```

### 7.7 Order, User, Review, Coupon, Post

Carried forward from v1.8 §8 with bilingual field maps flattened to single English fields
plus optional `*Bn` companions, and with `locale` removed from every document. Full shapes
are settled in their own phases (4, 5, 13, 14, 11 respectively).

Order essentials unchanged: `orderNumber`, `customer{name, phone, email?}`,
`items[{product, variant?, qty, price}]`, `shippingAddress{division, district, area, street}`,
`paymentMethod: cod | bkash | nagad | rocket | card | bank`, `paymentStatus`, `subtotal`,
`deliveryCharge`, `discount`, `total`,
`status: pending → confirmed → processing → shipped → delivered | cancelled | returned`,
`courier{provider, consignmentId, trackingCode}`, `codAmount`, `notes`.

---

## 8. Launch scope

Launch means: a Bangladeshi parent can find a product, understand it, trust it, and receive it.

**In:**

- Storefront shell — announcement bar, commerce header, footer (§ Storefront Design Direction)
- Product catalogue: listing, filters, sort, product detail, variants, images
- Categories (nested) and age navigation
- Collections and bundles
- Search — English + Bangla aliases, header suggestions, results page
- Cart, wishlist
- Checkout: COD + one-click COD express modal, guest checkout by phone
- Online payment via SSLCOMMERZ + prepay discount
- Courier integration (one provider) with tracking and COD reconciliation
- Accounts: phone-OTP login, order history, addresses, order tracking
- Admin: products, categories, media, orders, customers, basic settings
- Offers and coupon codes (basic — fixed/percentage, date-bounded)
- Trust content: About, Contact, FAQ, five real policy pages, small founder section
- **Simple single-author article system** — create, edit, publish, list and read articles.
  One author (the founder), no roles, no editorial workflow, no `/studio`
- SEO foundations, structured data (§5.5 rules), sitemap, robots, canonicals
- **WhatsApp click-to-chat support** — floating button plus the homepage support section
- **Basic analytics, live and verified before launch: GA4, Google Search Console, and Meta
  Pixel + Conversions API** with the core commerce events (ViewContent, AddToCart,
  InitiateCheckout, Purchase)
- Mobile performance meeting the Core Web Vitals budget (§10)

**Out — and deliberately so:**

Loyalty points and the points ledger · review incentives · affiliate/referral program ·
multi-author content platform (Author role, `/studio`, editorial workflow) ·
age-graduation automation · abandoned-cart follow-up **sequences** · chatbot · dark mode ·
lead-magnet gating · advanced merchandising and marketing automation · Trustpilot.

The rule from v1.8 stands and is reaffirmed: **if a feature does not clearly earn its place
at launch — by driving trust, conversion, or first revenue — it waits.** Nothing is cut; it
is sequenced.

### 8.1 Controlled fallback if third-party onboarding delays launch

Online payment (SSLCOMMERZ) and automated courier integration (Pathao/Steadfast) **remain the
desired launch scope**. But their timing depends on third-party onboarding — trade licence
checks, merchant approval, API credentials — which Renvura does not control.

If onboarding is the only thing blocking launch, launching is preferable to waiting, under
these controlled conditions:

**COD-only fallback (payments not yet live)**

- Cash on delivery is the only payment method presented. The online-payment option is
  **hidden, not disabled** — no visible control that cannot complete.
- The prepay discount is not advertised anywhere, because it cannot be honoured.
- No payment-method logos appear in the footer for methods that are not integrated.
- Checkout, order confirmation and tracking work end-to-end on COD alone. This path is
  complete from Phase 4, so it is a real fallback and not a rush job.

**Manual-courier fallback (courier API not yet live)**

- Orders are dispatched through the courier's own dashboard or a manual booking process; the
  admin records the consignment ID and tracking code by hand on the order.
- `/track` reads whatever the admin has recorded. If no tracking code exists yet, it shows
  the honest internal status ("confirmed", "packed") and the support phone number — never a
  fabricated delivery estimate.
- Order volume must stay within what the founder can process by hand; this is explicitly a
  bridge, not a steady state.

**Conditions on using the fallback**

- It is a founder decision, recorded here when taken — not a default.
- Every other launch requirement in §8 must still be complete. The fallback substitutes for
  payment and courier automation only; it never justifies launching without analytics,
  policies, real products or the performance budget.
- Phases 7 and 8 remain scheduled and are completed immediately after launch.

---

## 9. Later-phase scope

Every item below is **excluded from launch**. Phase numbers refer to §11.2, where all
post-launch phases sit after the launch gate.

| Feature | Phase | Why it waits |
| --- | --- | --- |
| Abandoned-cart follow-up **sequences** | 11 | Capture is built at launch; the automated messaging sequence is not |
| Age-graduation retention automation | 11 | Depends on messaging integration and a real order history |
| Advanced funnel automation, lookalike/retargeting audiences beyond basic Pixel | 11 | Basic Pixel + CAPI ship at launch; audience automation is tuning work |
| Review incentives | 12 | Reviews themselves are Phase 12; the reward mechanism waits behind loyalty |
| Multi-author content platform, Author role, `/studio`, editorial workflow | 13 | The launch article system is single-author; roles and workflow wait for contributor volume |
| Loyalty points, ledger, redemption | 15 | Retention engine; needs real repeat buyers to tune |
| Occasion coupon campaigns with auto-activation and stacking rules | 15 | Basic coupon codes ship at launch; scheduling and stacking come later |
| Affiliate / referral program | 16 | Attribution, commission accounting, payouts and COD fraud checks are a project of their own |
| Chatbot with human handoff | 17 | Human replies build more trust early; add once volume justifies it |
| Dark mode | 18 | Not launch-critical; see LOCKED_DECISIONS D-07 |
| Printed unboxing play guide, lead magnet | Operational | Low-tech, high-impact; not a software dependency |

**Not in this table** — and therefore **in** the launch scope: GA4, Search Console,
Meta Pixel and Conversions API (CAPI), WhatsApp click-to-chat, and the simple single-author
article system. §8 lists them as launch requirements and §11.2 completes them before the
launch gate.

---

## 10. Performance and quality budget

Mandatory, measured on a throttled mid-range Android profile:

- LCP < 2.5 s on the homepage and product pages
- CLS < 0.1 — reserved dimensions on every image and every card
- INP < 200 ms
- Homepage JavaScript kept as small as the feature set allows; every added client component
  and every third-party script must be justified
- Images: `next/image`, AVIF/WebP, correct `sizes`, lazy below the fold, one priority image
  in the hero
- Fonts: self-hosted via `next/font`, `display: swap`, Bengali subset loaded only where used
- No layout-shifting carousels above the fold
- Accessibility: WCAG 2.1 AA contrast (see the design document's colour rules), visible focus,
  44×44 px minimum touch targets, keyboard-operable menus and modals

---

## 11. Revised development phases

Each phase produces a working, reviewable increment and is gated by founder review.

### 11.1 Phase 1 (revision) — Foundation, de-localised, commerce-ready

Rework the existing Phase 1 rather than rebuild it.

- Remove the locale layer: delete the `[locale]` route segment and flatten all routes;
  remove `src/i18n/*`, the next-intl proxy/middleware, `messages/*.json`, `LanguageToggle`;
  replace the locale-aware `AppLink` with `next/link`.
- Strip `hreflang`/`alternateLanguages` from `src/lib/seo/metadata.ts`; canonical becomes
  `${siteUrl}${path}`. Remove the locale loop from `src/app/sitemap.ts`. Remove `localeTags`
  and `openGraphLocales` from `src/lib/site.ts`.
- Move UI copy to plain English in components or a single non-i18n copy module.
- Introduce the Bangla type mechanism: a `lang="bn"` + Bangla-font class applied per run,
  replacing the `html[lang='bn']` global rules in `globals.css`.
- Add the supporting pastel colour tokens and promote `#4A5A6E` to the official secondary
  text token (see the design document).
- Remove the theme toggle and ship light/cream only (D-07). Dark tokens may remain in
  `globals.css`, unused.
- Rebuild `Header` as a commerce header (logo, search, categories, account, wishlist, cart)
  and `Footer` as a full e-commerce footer — subject to the placeholder rule below.
- Rebuild the homepage as a product-first layout per `STOREFRONT_DESIGN_DIRECTION.md`,
  with sections that have no data yet **omitted**, not filled with fabricated content.
- Build category and age navigation as **data-driven components that render correctly against
  an empty dataset**. See §11.1.2.
- Demote the founder block to a small trust section; the full story stays on `/about`.
- Expand `src/lib/site.ts` into the commerce route registry.
- Update the affected tests (`seo-metadata`, `messages`, `smoke`) and `README.md`.
- Remove `locale` from `ContactSubmission` and the contact validation schema.
- Keep: brand tokens, contrast test, fonts, MongoDB layer, contact form, rate limiting,
  loading-state system, 404/error pages, policy pending states.

#### 11.1.1 No dead controls

**Phase 1 must not expose any clickable control or link that does nothing.** A header with a
search box that does not search, a cart icon with no cart, or a wishlist heart that silently
fails is worse than not shipping them: it reads as a broken store, which is precisely the
trust problem Renvura exists to solve.

For search, account, wishlist and cart, exactly two options are permitted:

1. **Hidden** until the route behind them works (Phases 3–5), or
2. **Visually represented but clearly disabled**, and only in a non-public development
   preview — a genuinely disabled control (`disabled` / `aria-disabled`, non-interactive,
   visibly de-emphasised, with a short "coming soon" affordance). Never a live-looking
   control that no-ops.

Option 2 exists so the header's final proportions can be reviewed. It must never reach a
publicly reachable environment.

The same rule covers navigation: no link to a route that does not exist. The route-registry
pattern already in `src/lib/site.ts` is what enforces this, and it is kept for that reason.

#### 11.1.2 Categories and age bands are Phase 2 decisions

Phase 1 does **not** decide, and must not hardcode, the production category set or the age
bands.

- Navigation, category tiles and age pills are built as data-driven components fed from the
  Category and AgeBand collections.
- With an empty dataset they render a correct, deliberate empty state — or the section is
  omitted entirely. They must not fall back to invented sample categories.
- Any placeholder used to check layout during development is obviously non-production,
  lives outside the repository's committed data, and is never deployed.

#### 11.1.3 Visual approval happens in Phase 2

**Final storefront visual approval is a Phase 2 event, not a Phase 1 one.** Phase 1 produces
the structure, tokens, header, footer and homepage skeleton; a storefront with no products in
it cannot be meaningfully approved. Sign-off on the visual design happens once protected
demo products (§3.5) populate the real product cards, grids, category tiles and age pills —
so the founder approves the storefront as it will actually look, not an outline of it.

#### 11.1.4 Phase 1 revision exit criteria

The revision is complete only when all of the following pass:

- **Environment** — Node 22.22+ verified in the development and CI environments, matching
  the `engines` field.
- **Dependency audit** — `npm audit` run and every finding **manually triaged** and recorded
  (fixed, accepted with a reason, or tracked). **`npm audit fix --force` must not be used** —
  it silently applies breaking major upgrades across the dependency tree.
- **Checks pass** — `npm run lint`, `npm run typecheck`, `npm run test` (Vitest),
  `npm run test:e2e` (Playwright smoke) and `npm run build` all green. `npm run verify`
  covers the first four plus the build.
- **No dead links or nonfunctional interactive controls** anywhere in the build (§11.1.1),
  verified by a manual pass over every route in the registry.
- **Mobile visual review at 360 px width** — header, homepage, About, Contact, FAQ, policy
  pending pages, 404 and error pages, with no horizontal body scroll and no overlapping or
  clipped content.
- **Documentation updated** — `README.md` and any code comment citing the v1.8 PDF as the
  source of truth now point at `docs/`, and the removed locale architecture is no longer
  described as current.

### 11.2 Phases

**Phases 1–10 are the launch scope.** The launch gate sits after Phase 10, once every §8
requirement — including analytics, WhatsApp support and the single-author article system — is
complete. Phases 11+ are post-launch.

| # | Phase | Scope |
| --- | --- | --- |
| 1 | Foundation (revision) | As above, including the §11.1.4 exit criteria; **`Organization` structured data begins here** (minimal, verified details only) |
| 2 | Catalogue & product model | Product (with compliance block), Category, AgeBand, Collection models; **founder confirms categories and age bands**; protected demo seed; listing, detail, variants, images, breadcrumbs, draft/publish validation; **`Product`/`Offer` structured-data support built and tested — never emitted for demo products**; **storefront visual approval** |
| 3 | Discovery | Search with Bangla aliases, filters, sort, facets, category tree pages, age pages, collections, offers page |
| 4 | Cart & checkout (COD) | Cart, wishlist, full COD order flow, one-click COD express modal, order confirmation, `/track` |
| 5 | Auth & accounts | Better Auth phone-OTP + local SMS gateway, guest checkout, `/account`, addresses, order history |
| 6 | Admin core | Products (incl. compliance fields and publish validation), categories, media upload, orders, customers, settings; **demo data replaceable with real products from here on** |
| 7 | Payments | SSLCOMMERZ, prepay discount, callbacks, reconciliation — *fallback: §8.1* |
| 8 | Courier | Pathao/Steadfast consignment, tracking, COD remittance — *fallback: §8.1* |
| 9 | Trust, legal & content | Real policy wording, About, FAQ, founder section, contact details; **simple single-author article system** with a small number of real articles; **`Organization` structured data verified and enriched** with the final, genuine business details |
| 10 | Analytics & support (launch requirements) | **GA4, Google Search Console, Meta Pixel + CAPI** with core commerce events; **WhatsApp click-to-chat**; basic abandoned-cart *capture* (no automated sequences) |
| — | **LAUNCH GATE** | Every §8 item complete and verified: real products loaded, **demo data purged and the production guard confirmed**, performance budget met on a throttled mid-range Android profile, security review, SEO and structured-data audit, no dead controls, policies live and reviewed, analytics receiving events, COD order placed end-to-end. Any §8.1 fallback in use is recorded and accepted |
| 11 | Funnel automation | Retargeting audiences, abandoned-cart follow-up sequences, age-graduation sequences, lead-magnet capture |
| 12 | Reviews & social proof | On-site reviews, moderation, AggregateRating, Google Business Profile, Facebook reviews |
| 13 | Content platform at scale | Author role, `/studio`, editorial workflow, video/short types, author profiles |
| 14 | Content SEO & commerce loop | Article schema, cross-linking, internal link strategy |
| 15 | Loyalty & coupons | Points ledger, redemption, scheduled occasion campaigns, review incentives |
| 16 | Affiliate program | Referral codes, attribution, commission ledger, payout approval, fraud checks |
| 17 | Chatbot | FAQ bot with human handoff |
| 18 | Ongoing polish | Performance, Bangla QA, dark mode if wanted, catalogue expansion |

---

## 12. Risks and unresolved operational decisions

### 12.1 Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| **Demo data reaching production** | Fake products shown as real; trust destroyed | Separate development database, **production runtime/environment guard** (not just the `isDemo` label), visible labelling, `noindex`, disabled side effects, purge script, explicit launch-gate check |
| **Unverified compliance data published** | Wrong safety or material information on products a child uses; legal exposure | Verification status required before render; category compliance profiles gate publishing; no statute or certification named without qualified confirmation |
| **Publishing validation blocking day-to-day work** | Founder cannot save partial products; data entered in spreadsheets instead | Validate at publish, never at save (§7.3); per-field "what's missing" checklist |
| **Fabricated copy** | Legal exposure on safety and returns; regulatory risk | Absolute claims ban (§3.6); pending pages `noindex` and excluded from sitemap |
| **Scope creep back toward a niche learning store** | Wrong architecture; hard to add clothing or feeding later | Locked decisions; optional-attribute rule enforced in schema and components |
| **Homepage weight on mid-range Android** | LCP failure, bounced traffic, ranking loss | Performance budget as a launch gate; server components by default; no carousel libraries |
| **Bangla search failing against an English catalogue** | Shoppers find nothing and leave | `searchAliases` populated at product-creation time; admin must make it easy |
| **Design references imitated too closely** | Renvura reads as a generic toy theme; possible IP issue | No-copying decision (LOCKED_DECISIONS D-11); references inform structure only |
| **Policy pages launched with unreviewed wording** | Legal exposure in Bangladesh consumer/data law | Phase 9 gate: no policy page goes live without founder-supplied, reviewed text |
| **Third-party onboarding delays** (SSLCOMMERZ, courier, SMS) | Launch slips | The controlled COD-only / manual-courier fallback in §8.1 — options hidden not disabled, no unhonourable promises, and Phases 7–8 completed immediately after |
| **Better Auth OTP security is Renvura's responsibility** | Account takeover, SMS cost abuse | Rate limiting, expiry, retry throttling designed into Phase 5, not deferred |

### 12.2 Unresolved — needed before the phase named

| # | Decision | Needed by | Options / default |
| --- | --- | --- | --- |
| U-1 | **Age band definition** | **Phase 2** | Candidate: 0–11 months, 1–2, 3–5, 6–8, 9–12 — must be contiguous and non-overlapping (§3.3). Phase 1 builds against an empty dataset |
| U-2 | **Top-level category set** | **Phase 2** | Founder names the first 6–10 top-level categories. Phase 1 builds against an empty dataset |
| U-3 | **Category compliance profiles** | Phase 2 (schema), Phase 6 (enforcement) | Which §7.2 fields each higher-risk category requires; needs qualified confirmation of what actually applies |
| U-4 | **`/development/[domain]` — route or filter only?** | Phase 3 | Default: filter only until enough products carry the attribute |
| U-5 | **Currency formatting** | Phase 2 | Default: `৳` prefix, no decimals, thousands separated |
| U-6 | **Delivery zones and charges** | Phase 4 | Founder-supplied; no placeholder rates |
| U-7 | **Return/refund window and conditions** | Phase 9 | Founder-supplied, reviewed |
| U-8 | **SMS gateway** | Phase 5 | bulksmsbd / Alpha SMS / Reve SMS — compare price per SMS and Bangla sender ID |
| U-9 | **Payment aggregator confirmation** | Phase 7 | SSLCOMMERZ default; §8.1 fallback if onboarding stalls |
| U-10 | **Courier(s)** | Phase 8 | Start with 1–2 by coverage and COD terms; §8.1 fallback if onboarding stalls |
| U-11 | **Who writes and reviews Bangla content** | Phase 2 | Existing `messages/bn.json` is first-pass and is being discarded |
| U-12 | **Brand/manufacturer display** | Phase 2 | Whether brands are a browsable axis or a plain text field |
| U-13 | **Wishlist for guests** | Phase 4 | Default: local storage for guests, synced on login |
| U-14 | **Announcement bar copy** | Phase 1 revision | Needs one founder-supplied fact. Until then the bar carries the phone number, or is omitted |
| U-15 | **`LocalBusiness` eligibility** | Phase 9 | Only if a genuine public business location exists (§5.5) |

**Settled since v1.0 of this document:** the theme toggle is removed and the launch storefront
is light only (D-07) — this is no longer an open question.
