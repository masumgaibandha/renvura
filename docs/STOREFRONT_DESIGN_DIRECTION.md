# Renvura — Storefront Design Direction

<!-- markdownlint-disable MD013 MD036 -->
<!--
  MD013 (line-length) and MD036 (no-emphasis-as-heading) are intentionally disabled here, for
  the same reasons documented at the top of docs/PROJECT_SPECIFICATION.md: tables cannot be
  wrapped to 80 columns without breaking, and bold labels such as **Backgrounds**, **Gold**
  and **Card rules** are intra-section labels beneath numbered headings, not sections in
  their own right. All other rules are enforced and currently pass.
-->

**Version:** 1.0 · **Date:** 2026-08-03 · **Status:** Current source of truth for visual and
storefront design

Supersedes `assets/Renvura—Educational Toy Shop Design.pdf` (references 1a, 1b, 1c) and
§2.1 / §3.4 of `assets/Renvura-Project-Specification.pdf` wherever they conflict. Read
alongside `docs/PROJECT_SPECIFICATION.md` and `docs/LOCKED_DECISIONS.md`.

**The old design PDF is retained as historical secondary inspiration.** It is no longer the
design authority, but it is still worth consulting — particularly reference **1c (Product
Detail — Expert Insight)**, whose treatment of the expert note, age guidance and
specification layout informed §8.4 here. Use it for ideas at the detail level. It may never
override these three Markdown documents or the three selected PNG references, and its
placeholder content (prices, the "Farah Karim" curator, safety claims) remains excluded.

---

## 1. Design objectives

The storefront must be, in this order:

1. **Clearly designed to sell products.** A first-time visitor must see products, prices and
   a way to buy within the first screen and a half. Merchandising outranks storytelling.
2. **Fast on a mid-range Android phone.** Design decisions that cost load time lose.
3. **Trustworthy.** Bangladeshi shoppers scan for signals that a store is real: contact
   details, policies, reviews, COD, a named human. Those signals must be findable without
   dominating.
4. **Child-friendly but not childish.** Warm, soft, welcoming — designed for the *parent*
   who is buying, not for the child. No cartoon-toy-store energy.
5. **Premium but not formal.** Generous spacing, restrained typography, quality photography.
   Not a luxury boutique, not a corporate site.
6. **Colourful but not chaotic.** Colour comes from product photography and a handful of
   controlled pastel surfaces — never from competing saturated blocks.
7. **Recognisably Renvura.** Navy, gold and cream carry the identity. Nothing on the page
   should be mistakable for the reference themes.

### The one-sentence test

> *A parent on a bus, on 4G, on a ৳15,000 Android phone, should understand what Renvura
> sells and be able to start buying — in under five seconds and under two seconds of load.*

---

## 2. Role of each reference image

The three PNGs in `assets/design-references/` each answer a different question. **None is a
template.** Use them for structure, rhythm and restraint — never for their look.

### 2.1 `primary-storefront-reference.png` — commerce structure

**Answers:** what sections a children's storefront homepage needs and in what order.

Take from it:

- The announcement bar → header → hero → category → age → promo → product-grid progression
- **Shop by Category** as circular category tiles on soft pastel discs, horizontally scrollable
- **Shop by Age** as a row of soft, wide pills with distinct pastel fills per band
- The three-across promotional banner row between category and age navigation
- Product grids with a visible discount/new badge convention
- A trust/USP row (icon + short heading + one line) placed after merchandising
- Article cards, newsletter capture and a full multi-column footer at the bottom

Do **not** take: its coral/pink accent colour, its rounded playful wordmark, its brush-stroke
age pills, its cloud-shaped section dividers, the swatch dots on cards, or any of its copy.

### 2.2 `premium-layout-reference.png` — spacing and restraint

**Answers:** how to make a product grid look expensive.

Take from it:

- Generous vertical rhythm between sections; sections separated by space, not by rules
- The small uppercase eyebrow label above a section heading, with the heading centred and
  nothing else competing
- Minimal product-card chrome: image on a neutral tile, tiny category label, product name,
  price. No border, no shadow, no ribbon, no hover explosion
- Full-bleed soft pastel bands used sparingly to break the white/cream rhythm — one or two
  per page, never adjacent
- An editorial image-plus-text block used once, as a change of pace
- A calm, wide footer

Do **not** take: its serif display wordmark treatment, its exact grid proportions, its
oversized footer logotype, or its colour choices.

### 2.3 `playful-details-reference.png` — controlled child-friendliness

**Answers:** which child-friendly devices are worth borrowing — and, by its own excess,
where the line is.

Take from it, **in moderation**:

- Soft organic blob shapes as a background behind a category tile or age pill
- Rounded circular category avatars in a horizontal scroller
- A small number of simple line/flat illustrations as section accents (a star, a cloud, a
  simple arc) — flat, single-colour, from the supporting palette
- The four-item trust strip (secure payment · easy return · delivery · support)
- Soft pill toggles for age selection

Explicitly do **not** take: its saturated purple field, its dense doodle scatter, its
hand-drawn crayon lettering, its wavy cloud dividers between every section, its rainbow
gradients, its sticker-style badges, or its overall density. This reference is a **ceiling
of playfulness, and Renvura should sit well below it** — roughly 20% of its decorative load.

### 2.4 Non-negotiable

No theme, layout, text, logo, product image, illustration or component may be copied
pixel-for-pixel or near-verbatim from any reference. No code, CSS or markup from any theme
enters the repository. The references inform *commerce structure, spacing, product
presentation and controlled child-friendly styling* — nothing more.

---

## 3. Colour system

### 3.1 Core palette (official Renvura brand — unchanged)

| Token | Name | Hex | Role |
| --- | --- | --- | --- |
| `brand-navy` | Authority Navy | `#11253C` | Headings, navigation, footer, important text, trust sections, logo |
| `brand-gold` | Premium Gold | `#CDAF80` | Primary CTA fills, premium highlights, small accents |
| `brand-cream` | Linen Cream | `#F7F1E5` | Primary page background |
| `brand-slate` | Slate Gray | `#A5AAB5` | Borders, dividers, disabled states |

### 3.2 Supporting palette (new — added because the core four are not child-friendly enough alone)

| Token | Name | Hex | Role |
| --- | --- | --- | --- |
| `soft-sky` | Soft Sky | `#D9EEF5` | Category cards, age pills, promo surfaces |
| `soft-mint` | Soft Mint | `#E2EED8` | Category cards, age pills, promo surfaces |
| `soft-blush` | Soft Blush | `#F6DAD8` | Category cards, age pills, promo surfaces |
| `soft-lavender` | Soft Lavender | `#E7DFF4` | Category cards, age pills, promo surfaces |
| `soft-sunshine` | Soft Sunshine | `#F8E6A8` | Category cards, age pills, offer surfaces |
| `ink-muted` | Dark secondary text | `#4A5A6E` | All secondary and supporting body text |

Plus a warm white surface (`#FFFDF7`) for cards and elevated panels, already in the codebase.

### 3.3 Usage rules (binding)

**Backgrounds**

- Linen Cream `#F7F1E5` or warm white is the primary storefront background.
- Warm white `#FFFDF7` for cards, panels and product tiles sitting on cream.
- Navy is a *section* background for the footer and for one or two deliberate trust bands —
  never the page background.
- Pastels are *surface* colours for category cards, age pills, promotional banners, badges
  and subtle illustration — never the page background.

**Text**

- Primary text: Navy `#11253C` on cream/white.
- Secondary text: `#4A5A6E`. **Never Slate Gray `#A5AAB5` for body text** — it lands near
  1.9:1 on cream and is unreadable outdoors on a phone.
- Text on navy surfaces: Linen Cream `#F7F1E5`.
- **Never gold text on cream.** Not for headings, not for prices, not for links, not at any
  size. This is enforced by `tests/unit/brand-contrast.test.ts` and that test must survive
  the Phase 1 revision.
- Gold as text is permitted **only** on navy.
- Text on any pastel surface is Navy. Never white, never gold, never `#4A5A6E` at small sizes.

**Gold**

- Gold is used **sparingly**: primary CTA fills, a thin premium rule, a small badge, an
  active-state indicator.
- **Always navy text on gold buttons.**
- Gold is not a section background, not a large panel, not a category-card fill.
- **Avoid multiple large or competing gold elements in one viewport.** Small gold elements
  may coexist perfectly well — the logo accent, the cart count badge and one primary CTA in
  the same view is correct, not a mistake. What to avoid is two elements both fighting to be
  *the* gold focal point: two filled CTAs of similar size, or a gold CTA next to a gold panel.
  The test is whether the eye knows where to go first.

**Slate**

- Borders, dividers, disabled states, placeholder outlines. That is the whole list.

**Pastels**

- Rotate deterministically across category cards and age pills — assigned per category/band
  as data (`accentToken`), not randomly at render, so the same category is always the same colour.
- Never place two pastel full-bleed sections adjacent to each other.
- Maximum two pastel full-bleed sections on the homepage.
- Pastels **support** navy, gold and cream. They never replace them. If a screenshot of the
  page reads as "pastel site", the balance is wrong.

**Product photography supplies the brightness.** The interface stays calm; the products are
the colour. This is the single most important rule for keeping the page child-friendly
without becoming chaotic.

**Avoid**

- **Multiple competing large pastel surfaces.** The rule is about *surface area and
  competition*, not a headcount: two full-bleed pastel bands, or a pastel hero next to a
  pastel promo panel, will read as chaotic. A row of six small category tiles each in a
  different approved pastel is fine and is exactly what the pastels are for — small tiles
  read as a set, not as competing sections.
- Strongly gendered pink/blue styling; no "for girls" / "for boys" colour coding
- Saturated primary red/blue/yellow blocks
- Gradients, except a barely-perceptible tint within a single pastel
- Drop shadows heavier than a soft 1–2 px ambient lift
- Neon, glow, or high-contrast "sale" red

### 3.4 Accessibility rules

- Body and secondary text must clear **4.5:1**; large text (≥24 px, or ≥19 px bold) must
  clear **3:1**.
- Navy on cream ≈ 13.4:1 ✔ · `#4A5A6E` on cream ≈ 6.6:1 ✔ · Navy on every supporting pastel
  clears AA comfortably ✔ · Cream on navy ≈ 13.4:1 ✔ · Navy on gold ≈ 7.6:1 ✔
- Gold on cream ≈ 1.7:1 ✘ — banned. Slate on cream ≈ 1.9:1 ✘ — banned for text.
- Colour is never the only carrier of meaning: stock state, sale state, validation errors and
  selected filters all need text or an icon in addition to colour.
- Focus states: a visible 2 px navy outline with 2 px offset on cream surfaces; gold on navy
  surfaces. Never remove the focus ring.
- Minimum touch target 44×44 px; minimum spacing 8 px between adjacent tap targets.
- Body text never below 14 px; product names and prices never below 14 px.

### 3.5 Light storefront, dark mode later — settled

The launch storefront is **light/cream**, and **the visible theme toggle is removed**. This is
locked (D-07), not an open question.

- Ship light/cream only.
- The dark tokens already in `globals.css` may remain in place, unused, so that post-launch
  dark-mode work has a starting point.
- No design work, QA time or component variant is spent on dark before launch, and no
  component may depend on a theme switch existing.

---

## 4. Typography direction

**Faces (unchanged from Phase 1):**

| Face | Use |
| --- | --- |
| **Lora** (serif) | Display headings in English — homepage section headings, page titles, the occasional editorial pull quote. Carries the "premium" half of the brand. |
| **Manrope** (sans) | All UI: navigation, buttons, labels, product names, prices, forms, tables, body text. Carries the "commerce" half. |
| **Noto Sans Bengali** | Every Bangla run, headings included. Lora has no Bengali glyphs. |

**Rules**

- Lora is for headings only, and only where a heading is doing brand work. Product names,
  card titles, prices, filters and buttons are **always Manrope** — serif product names read
  as editorial, not as shoppable.
- Bangla runs are wrapped in an element with `lang="bn"` and a Bangla type class; the Bengali
  subset is loaded only where used. This replaces the old locale-wide `html[lang='bn']` switch.
- When Bangla and English sit adjacent, size Bangla ~1 point larger — Bengali counters read
  smaller at the same nominal size.
- Latin runs inside Bangla text (brand name, phone numbers, prices, email) keep Manrope via
  the existing `.latin` class.

**Scale (mobile → desktop)**

| Role | Size | Face | Weight |
| --- | --- | --- | --- |
| Page H1 | 28 → 40 px | Lora | 500 |
| Section heading | 22 → 30 px | Lora | 500 |
| Section eyebrow | 11 → 12 px, uppercase, `0.16em` tracking | Manrope | 600 |
| Card / product name | 14 → 16 px | Manrope | 600 |
| Price | 15 → 17 px | Manrope | 700, navy |
| Compare-at price | 13 → 14 px, strikethrough, `#4A5A6E` | Manrope | 400 |
| Body | 15 → 16 px, line-height 1.6 | Manrope | 400 |
| Secondary / meta | 13 → 14 px, `#4A5A6E` | Manrope | 400 |
| Button | 14 → 15 px | Manrope | 600 |
| Badge | 11 → 12 px, uppercase | Manrope | 600 |

Maximum line length for prose: ~68 characters. Headings never exceed two lines on mobile.

---

## 5. Header and navigation structure

Three stacked layers, in this order.

### 5.1 Announcement and delivery bar

- Navy background, cream text, ~32–36 px tall, one line.
- Content: a delivery or support message. **Must be founder-supplied fact** — no invented
  free-delivery threshold, no invented delivery time. Until real copy exists, the bar carries
  the phone number and support hours or is omitted entirely.
- Optional right-side: phone number as a `tel:` link.
- Dismissible on mobile is acceptable; not required.
- No countdown timers, no marquee scroll.

### 5.2 Commerce header (sticky)

Desktop, left → right:

```text
[Logo]   [All Categories ▾]   [────────── Search ──────────]   [Account] [Wishlist] [Cart •]
```

- **Logo** — Renvura wordmark, links home. Fixed height; never scaled per breakpoint by CSS
  transform.
- **All Categories** — opens a mega menu: top-level categories in columns, with second-level
  categories listed beneath, plus a "Shop by Age" column. Cream/white panel, navy text, thin
  slate border, generous padding. Opens on click, not hover, and is keyboard-operable.
- **Search** — the widest element in the header. This is deliberate: search is a primary
  discovery path, and the mega menu is the secondary one. Placeholder in English. Suggestions
  dropdown matches English names and Bangla `searchAliases`.
- **Account / Wishlist / Cart** — icons with a count badge on cart and wishlist. Cart badge
  is gold with navy text.
- Sticky on scroll, condensing to logo + search + cart. Elevation on scroll is a 1 px slate
  border, not a shadow.

Mobile, left → right:

```text
[☰]  [Logo]  [Search icon] [Cart •]
```

- Search expands to a full-width overlay on tap.
- The drawer opened by `☰` contains: category tree (accordion), Shop by Age, Offers, Account,
  Wishlist, Track Order, Help/Contact, and the phone number.
- A secondary horizontally scrollable category strip may sit under the header on mobile —
  the fastest path to a category on a small screen.

### 5.3 Footer (full e-commerce footer)

Navy background, cream text, `#A5AAB5`-toned separators.

Columns: **Shop** (top categories, age bands, offers, new arrivals) · **Help** (contact,
FAQ, track order, shipping, returns) · **Company** (about, blog, child safety) ·
**Contact & follow** (phone `01883-115898`, email `hello@renvura.com`, WhatsApp, social,
location).

Below: payment-method row (only logos Renvura is actually integrated with — no aspirational
badges), copyright line, and policy links.

---

## 6. Homepage section order

### 6.0 This is a recommended default, not a fixed layout

The order below is the **recommended default merchandising order** — a sensible starting
point for a store with a young catalogue and no behavioural data yet. It is not locked.

**Sections are data/configuration-driven.** Their presence and order are stored as
configuration, not hardcoded in the page component, so the founder can reorder or omit
sections in response to inventory, active campaigns and observed customer behaviour without a
deployment. A seasonal push, a thin category, a collection that is selling — all are reasons
to change the order, and the system must allow it.

**Four structural constraints always hold**, whatever the configuration:

1. **Header and hero stay at the top.** The announcement bar, commerce header and hero are
   fixed in position.
2. **Product discovery and merchandising come before founder content.** Categories, ages,
   product grids and offers precede any expertise or story content.
3. **Founder content is never the hero** and always appears below the primary product
   sections.
4. **The footer is last.**

Everything between the hero and the footer is reorderable within those constraints, and any
section may be omitted when its data does not exist.

### 6.1 Recommended default order

| # | Section | Purpose | Notes |
| --- | --- | --- | --- |
| 1 | **Announcement / delivery bar** | Immediate reassurance | Navy, one line, founder-supplied fact only. *Fixed position* |
| 2 | **Commerce header** | Navigation and search | Sticky; §5.2. *Fixed position* |
| 3 | **Product-focused hero** | Show what is sold and start a purchase | §6.2. *Fixed position* |
| 4 | **Shop by category** | Primary discovery | Circular/rounded pastel tiles, horizontally scrollable on mobile, 5–8 visible |
| 5 | **Shop by age** | Renvura's differentiating axis | Soft wide pills, one pastel per band, whole row visible on mobile via scroll |
| 6 | **Featured Products** | **First real product cards — prices, images, add-to-cart** | The default early product grid. See §6.3 |
| 7 | **Promotional category banners** | Merchandising | Three across on desktop, one-and-a-peek on mobile; each links to a real category or collection |
| 8 | **Best Sellers** | Social proof through popularity | **Only when derived from real completed-order data** (§6.3). Omitted entirely until then |
| 9 | **Curated collections** | Higher order value, gift framing | Bundles and themed sets; where the founder's curation shows |
| 10 | **New arrivals** | Freshness and repeat-visit reason | Same grid as Featured Products |
| 11 | **Offers / seasonal campaigns** | Urgency | Only when a real, active campaign exists; otherwise omitted entirely |
| 12 | **Why parents choose Renvura** | Trust | Four items: icon + short heading + one line. Only claims that are true (COD available, easy contact, curated selection, delivery coverage) |
| 13 | **Founder / expert trust section** | Credibility | **Small.** One row: photo, name, credentials in one line, one sentence, a text link to `/about`. Not a hero, not full-bleed, no long biography. Always below the product sections |
| 14 | **Helpful articles** | SEO and education | Three article cards |
| 15 | **Customer reviews** | Strongest trust signal in BD | Real reviews only. Section absent until real reviews exist — no seeded testimonials, ever |
| 16 | **Newsletter / WhatsApp support** | Capture and assist | Single-field email capture plus a WhatsApp click-to-chat. No modal popup on load |
| 17 | **Complete e-commerce footer** | Navigation and trust | §5.3. *Fixed position* |

Section numbers describe this default arrangement only. Do not treat a section's number as
part of its identity — the founder section is "the small founder trust section, below the
product sections", not "section 13".

### 6.2 Featured Products, and why not "Best Sellers"

**"Featured Products" is the default label and the default early grid.** It is honest at any
stage: featured means "we chose to show these", which is exactly what is happening. It works
on day one with a ten-product catalogue.

**"Best Sellers" may only appear when it is derived from real completed-order data.**
Labelling a hand-picked grid "Best Sellers" is a fabricated claim (D-12) and, worse, an easily
detected one — customers notice when the "best seller" has no reviews and no order history.
Until sales data exists, the Best Sellers section is omitted, not renamed and not seeded.

Once real order data accumulates, both sections can coexist: Best Sellers derived
automatically, Featured Products curated by the founder.

The same discipline applies to card badges — a `Bestseller` badge is derived, never typed.

### 6.3 Products near the first screen

**Customers must see real product cards early.** Concretely, on a 360 px mobile viewport, a
customer should reach the first product grid — images, names and prices — within roughly one
scroll of the hero, not five.

This is why Featured Products sits at position 6, immediately after the two navigation rails,
rather than behind the promotional banners. The hero establishes what Renvura sells; category
and age tiles are compact (one horizontally scrolling row each, ~180 px tall); then real,
buyable products appear.

Supporting rules:

- Hero height on mobile ≤ 70vh, so the category rail is partly visible on first paint (§6.4).
- Category and age rails are **single rows**, not wrapped grids, on mobile. A wrapped
  three-row category grid pushes products below the fold and defeats the purpose.
- The hero should itself contain a product or a price wherever real data allows.
- If a homepage arrangement puts the first product grid below the promotional banners *and*
  the banners are image-heavy, move Featured Products above them. Products before decoration.

### 6.4 Hero direction

The hero is **product-focused**, not founder-focused and not statement-focused.

- Left: a short benefit-led heading (Lora, ≤7 words), one supporting line (`#4A5A6E`), one
  gold primary CTA ("Shop All Products" or a real campaign), one text-link secondary CTA.
- Right: a real product or lifestyle photograph on a soft pastel or cream field.
- Contains a **price or a product** where possible — the reference stores do this and it
  works. No price appears until real prices exist.
- One image only, `priority`, correctly sized, with reserved dimensions.
- No auto-rotating carousel at launch. If a rotator is later justified, it must be
  CSS-scroll-snap based, pause on interaction, and add no library.
- Total hero height on mobile ≤ 70vh so that the next section is partly visible on first
  paint — the visitor must see that categories exist without scrolling deliberately.

### 6.5 Rhythm

- Section vertical padding: 48 px mobile → 80 px desktop. Consistent.
- Sections are separated by space and by background changes, not by horizontal rules.
- At most two pastel full-bleed bands on the whole page, never adjacent.
- Maximum content width 1280 px, with 16 px mobile / 24 px tablet / 32 px desktop gutters.

---

## 7. Product-card direction

One card component, used everywhere. Consistency across grids is what makes a catalogue look
professional.

**Anatomy (top → bottom):**

1. **Image** — square (1:1), object-fit contain on a warm-white or very light pastel tile,
   8–12 px rounded. Fixed aspect ratio, always. One optional second image on hover (desktop
   only, no layout shift, never on mobile).
2. **Badge** — top-left, at most **one** at a time, in priority order: `Sale` → `New` →
   `Bestseller`. Small, uppercase, pill. Sale uses gold-on-navy or navy-on-gold; New uses a
   pastel; Bestseller uses navy. Never a percentage unless the discount is real and computed.
3. **Wishlist icon** — top-right, always present and always operable on both desktop and
   mobile. It may be lower-contrast at rest and strengthen on hover/focus, but it must never
   be `opacity: 0` or `display: none` until hover — that makes it keyboard- and
   touch-inaccessible.
4. **Category / eyebrow label** — 11–12 px, uppercase, `#4A5A6E`. Optional but recommended;
   this is the premium reference's key card device.
5. **Product name** — Manrope 600, navy, clamped to two lines. Never truncated mid-word
   without an ellipsis.
6. **Price row** — current price (navy, 700); compare-at price to its right, struck through,
   `#4A5A6E`, only when a real prior price exists.
7. **Rating** — small stars + count. Rendered only when the product has real reviews.
8. **Age chip** *(optional)* — small pastel pill, e.g. `3–5 yrs`. Only when `ageRange` is set.
9. **Action** — "Add to Cart" as a full-width secondary button (navy outline on white),
   **always visible and always operable on both desktop and mobile.** It is never revealed by
   hover. Hover and focus may enhance it — deepen the border, fill the background, lift the
   card — but the only available action on a card must never be hidden behind a pointer
   event. Hover does not exist on touch, and it does not exist for keyboard or screen-reader
   users. The gold fill is reserved for page-level primary CTAs; a grid of gold buttons
   destroys the restraint.

**Card rules**

- **Hover may enhance presentation; it may never be the only route to an action.** Anything a
  card can do must be reachable by tap and by keyboard, with a visible focus ring.
- No visible card border and no drop shadow at rest. Separation comes from whitespace and the
  image tile. On hover/focus: a slate border and a small lift.
- **Hover states must not shift layout.** Reserve the border at rest — a 1 px `transparent`
  border, or an `outline`/`box-shadow` that sits outside the layout box — so adding a visible
  border on hover changes colour only, never geometry. Adding a border to a card that had
  none moves every neighbour by a pixel and is visible as a jitter across the grid.
- No colour swatches on cards (both toy references do this; it adds noise and a click that
  goes nowhere useful on mobile).
- No countdown timers, no "only 2 left" unless stock tracking is real.
- Out-of-stock: image at 60% opacity, an "Out of stock" text label, action button disabled —
  never hidden from the grid without reason.
- Every card is one link target for the image + name; the wishlist and add-to-cart controls
  are separate, properly labelled buttons.

**Grid:** 2 columns mobile, 3 tablet, 4 desktop. 12 px mobile / 24 px desktop gaps. Rows must
align — enforce equal card heights, and clamp the name to two lines to guarantee it.

---

## 8. Category and age navigation direction

### 8.1 Category tiles (homepage section 4)

- Circular or squircle image on a pastel disc, ~96 px mobile / ~128 px desktop.
- Category name in navy beneath, centred, 14–15 px, 600, one line.
- Pastel assigned per category as data (`accentToken`), stable across the site.
- Horizontally scrollable on mobile with scroll-snap and a visible partial next tile — never
  a dot-paginated carousel requiring a library.
- 5–8 categories on the homepage, with a "View all categories" text link. Not every category.

### 8.2 Age pills (homepage section 5)

- Wide, soft-cornered rectangles or generous pills — not brush strokes (that is the reference
  theme's signature; avoid it).
- One pastel per band, in the same order every time.
- Two lines: the band label (`3–5 years`, navy, 600) and an optional supporting line.
- Row is horizontally scrollable on mobile; all bands visible on desktop.
- Age bands are data-driven (see PROJECT_SPECIFICATION §3.3); the design must not hard-code
  five bands.

### 8.3 Category and listing pages

- Breadcrumb → H1 (category name) → optional short description (English, plus Bangla beneath
  when present) → filter/sort bar → grid → pagination.
- Filters as a left sidebar on desktop, a bottom sheet on mobile. Filter facets: category,
  age, price range, brand, availability, plus optional developmental facets **only when
  products in that result set carry them**.
- Applied filters shown as removable chips above the grid.
- Sort: Relevance · Newest · Price low→high · Price high→low · Popularity.
- Pagination over infinite scroll — better for SEO, memory and mid-range devices.
- Empty state is designed, not an accident: a clear message, the applied filters, and a way
  to clear them.

### 8.4 Product detail page

Order: breadcrumb → gallery (left/top) and buy-box (right/below) → tabs or stacked sections.

Buy box: name → rating → price (+ compare-at) → short description → variant selectors →
quantity → **Add to Cart** (gold, navy text) → **Order via Cash on Delivery** (navy outline,
opens the one-click modal) → delivery/return summary (real facts only) → trust row.

Below: full English description → **Bangla detailed explanation** when present → specification
table from `attributes[]` → optional expert note (in a distinct soft-sky panel with a small
founder attribution) → optional age guidance and milestones → optional safety warning (soft
blush panel, navy text) → reviews → related products → recently viewed.

**Every optional block is absent, not empty, when the data is missing.** No section headings
without content.

---

## 9. Mobile behaviour

Mobile is the primary design target, not an adaptation.

- Design and review mobile first at 360 px width.
- Sticky header condenses on scroll; a sticky bottom **Add to Cart** bar appears on product
  pages once the buy box scrolls out of view.
- Horizontal scrollers (categories, age pills, product rails) use CSS scroll-snap with a
  partially visible next item as the affordance. No JS carousel library.
- Filters open as a bottom sheet with an explicit Apply button — never live-refiltering on
  every tap over a slow connection.
- Search opens full-screen with the keyboard focused and recent/suggested terms shown.
- 44×44 px minimum targets; 8 px minimum gap between adjacent targets.
- Tables (specifications) scroll inside their own container; the page body never scrolls
  horizontally.
- No hover-dependent functionality anywhere: everything reachable on hover on desktop must be
  reachable by tap on mobile.
- Modals are full-screen sheets on mobile, centred dialogs on desktop (HeroUI Modal).

---

## 10. Image and photography direction

- **Product photography carries the colour of the site.** Interface colour stays restrained
  precisely so photography can be vivid.
- Consistent treatment across the catalogue: square crop, product centred, generous margin
  within the frame, on a plain warm-white or very light pastel background. A mixed-background
  catalogue is the single fastest way to look untrustworthy.
- Lifestyle photography (a child using the product) is used in the hero, promotional banners
  and article cards — not in the grid.
- **Licensed stock photography is permitted.** It must be properly licensed for commercial
  use, and where people are recognisable it must carry appropriate model releases. Keep the
  licence record with the asset.
- **Stock imagery must never imply that its subjects are Renvura customers.** No stock photo
  may be captioned, framed or placed so as to read as a customer, a testimonial, a review, an
  unboxing, a "real family using this product", or user-submitted content. Use it for mood,
  context and lifestyle framing — not as evidence.
- **Photographs commissioned, captured or owned directly by Renvura require the founder's
  explicit permission, and documented consent where a person is identifiable** — a signed
  release from the parent or guardian for any identifiable child, kept on file. That
  requirement is not satisfied by a stock licence and vice versa; the two paths have
  different obligations.
- Every image needs meaningful `alt` text in English. Decorative images get `alt=""` and
  `aria-hidden`.
- Technical: `next/image`, AVIF/WebP, correct `sizes`, explicit width/height, lazy below the
  fold, exactly one `priority` image (the hero). Product images served at no more than 2×
  their rendered size.
- Illustration, where used, is flat, single-colour, from the supporting palette, and small —
  a section accent, never a section subject. Maximum two illustrative accents per screen.
- No reference-theme illustrations, mascots, doodles or product photographs may be used, even
  as placeholders during development. Use plain neutral placeholder tiles instead.

---

## 11. Trust and founder-content placement

Trust is distributed, not concentrated in one hero.

| Signal | Placement |
| --- | --- |
| Contact phone number | Announcement bar and footer; `tel:` link on mobile |
| COD availability | Product page buy box, checkout, "Why parents choose Renvura" |
| Delivery and return summary | Product page buy box (real facts only), checkout, footer links |
| Policies | Footer, always linked, never buried behind a "more" toggle |
| Customer reviews | Product pages, and the homepage reviews section once real reviews exist |
| Payment methods | Footer row; only integrated methods |
| WhatsApp support | Floating button and the homepage support section |
| **Founder / expert credibility** | **A small homepage trust section below the product sections, `/about` (full), and as an attributed expert note on the products that carry one** |

**Founder section rules**

- Maximum: one photo (~96 px, circular), name, one credential line, one sentence, one text
  link to `/about`. On a single row on desktop.
- Not full-bleed. Not above the fold. Never the hero.
- **Always below the primary product sections** — categories, ages and product grids come
  first. This holds under every homepage configuration (§6.0), so it does not depend on the
  section keeping any particular position number.
- Occupies less vertical space than any single product grid on the page.
- The full story, credentials, philosophy and mission live on `/about`, where they belong and
  where they can be as long as they deserve.

**Expert notes on product pages**

- Rendered in a soft-sky panel with a small attribution line ("Note from Abdullah Al Masum,
  M.Ed.").
- Bangla-first is appropriate here — this is exactly the content that earns Bangla.
- Present on the minority of products that have one. Their absence must not create an empty
  or apologetic block.

---

## 12. Use and avoid

### Use

- Linen Cream / warm white backgrounds, navy text, gold used once or twice per screen
- `#4A5A6E` for every piece of secondary text
- Supporting pastels on category cards, age pills, promo banners, badges and small illustrations
- One consistent product card everywhere, with Add to Cart always visible and operable
- Real product cards early on the homepage — "Featured Products" until sales data exists
- Generous whitespace between sections; space as the separator
- A transparent 1 px border (or outline/shadow) at rest so hover changes colour, not geometry
- Licensed stock photography with proper model releases, used for mood and never as evidence
- Small uppercase eyebrow labels above section headings
- Square product images on a consistent light tile
- CSS scroll-snap rails for horizontal scrolling
- Server components by default; client components only where interaction demands it
- Real data or an honest empty state — never a fabricated placeholder
- Bangla exactly where it helps: explanations, usage, expert notes, safety, delivery
- One pastel per category/age band, assigned as data and stable across the site

### Avoid

- Gold text on cream — banned outright, enforced by test
- Slate Gray as body text — banned
- Any theme's colours, wordmark, illustrations, product photography, copy or code
- Multiple competing **large** pastel surfaces (small multi-pastel tile sets are fine)
- Multiple large or competing **gold** elements (a small logo accent, cart badge and one CTA
  together are fine)
- Adjacent pastel full-bleed sections
- Rainbow palettes, gradients, neon, glow, heavy shadows
- Gendered pink/blue category styling
- Auto-rotating hero carousels; carousel and animation libraries
- Cloud/wave section dividers, doodle scatter, crayon lettering, sticker badges
- Serif type on product names, prices, buttons or filters
- Fabricated prices, discounts, delivery promises, safety claims, reviews or stock counts
- A "Best Sellers" section not derived from real completed-order data
- Seeded or invented testimonials in the reviews section
- Stock imagery presented, captioned or framed as a real Renvura customer
- A founder-led homepage hero, or founder content above any product section
- Add to Cart, wishlist, or any sole action revealed only on hover
- Hover states that add a border to a borderless card and shift the grid
- A visible theme toggle at launch
- Hardcoding the homepage section order in the page component
- Popup modals on page load
- Infinite scroll on listing pages
- Locale toggles, `/bn` and `/en` routes, duplicate translated pages, hreflang
- Hover-only functionality
- Any new dependency added because a reference theme did something
