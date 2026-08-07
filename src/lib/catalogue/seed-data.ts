import type { AccentToken, ComplianceField, EvidenceSourceType } from '@/lib/catalogue/types';

/**
 * Phase 2B initial catalogue content.
 *
 * Renvura copy, written for parents — not supplier listing text. Every name,
 * summary and description here describes what is **visible in the product
 * media**. Nothing asserts an age, a material, a certification, a safety
 * property or a developmental outcome (D-12).
 *
 * Supplier information from the reference pages is preserved, but only as
 * `evidence` entries with `sourceType: 'marketplace-listing'` — which
 * `hasProbativeEvidence()` treats as **non-probative**, so it can never carry a
 * claim to `verified` and therefore can never reach the storefront (§7.2).
 *
 * These records seed as **demo drafts** (`isDemo: true`, `status: 'draft'`),
 * which means: not publicly reachable, not indexed, no `Product`/`Offer`
 * markup, and blocked from production by the runtime guard in
 * `@/lib/catalogue/demo`.
 */

/* -------------------------------------------------------------------------- */
/* Categories                                                                  */
/* -------------------------------------------------------------------------- */

export type CategorySeed = {
  slug: string;
  name: string;
  parentSlug?: string;
  description?: string;
  accentToken?: AccentToken;
  searchAliases?: string[];
  sortOrder: number;
};

/**
 * Only the founder-confirmed initial tree. No empty Baby Essentials, Feeding or
 * Clothing placeholders — the model supports them, and they arrive with real
 * products rather than as empty shelves (§11.1.2).
 */
export const CATEGORY_SEEDS: readonly CategorySeed[] = [
  {
    slug: 'learning-educational',
    name: 'Learning & Educational',
    description:
      'Hands-on toys and materials for early learning — matching, sorting, counting and first number work.',
    accentToken: 'soft-sky',
    searchAliases: ['learning', 'educational', 'শিক্ষামূলক', 'শেখার খেলনা'],
    sortOrder: 10,
  },
  {
    slug: 'activity-matching',
    name: 'Activity & Matching',
    parentSlug: 'learning-educational',
    description: 'Boards and books with pieces to match, fit, thread and fasten.',
    accentToken: 'soft-mint',
    searchAliases: ['activity', 'matching', 'busy board', 'ম্যাচিং'],
    sortOrder: 10,
  },
  {
    slug: 'sorting-fine-motor',
    name: 'Sorting & Fine Motor',
    parentSlug: 'learning-educational',
    description: 'Stacking, threading and sorting sets that ask for careful hands.',
    accentToken: 'soft-lavender',
    searchAliases: ['sorting', 'fine motor', 'stacking', 'সাজানো'],
    sortOrder: 20,
  },
  {
    slug: 'numbers-math',
    name: 'Numbers & Math',
    parentSlug: 'learning-educational',
    description: 'Counting frames, number cards and first addition and subtraction.',
    accentToken: 'soft-sunshine',
    searchAliases: ['numbers', 'math', 'counting', 'abacus', 'গণিত', 'সংখ্যা'],
    sortOrder: 30,
  },
];

/* -------------------------------------------------------------------------- */
/* Age bands                                                                   */
/* -------------------------------------------------------------------------- */

export type AgeBandSeed = {
  slug: string;
  label: string;
  minMonths: number;
  maxMonths: number;
  accentToken: AccentToken;
  sortOrder: number;
};

/**
 * Founder-confirmed browsing bands. Inclusive month bounds, contiguous and
 * non-overlapping, so every month belongs to exactly one band (§3.3).
 *
 * These are **navigation** bands. They deliberately do not imply that any
 * product has been assessed as suitable for a band — no seeded product declares
 * an `ageRange`, because no age suitability has been verified.
 */
export const AGE_BAND_SEEDS: readonly AgeBandSeed[] = [
  { slug: '0-11-months', label: '0–11 months', minMonths: 0, maxMonths: 11, accentToken: 'soft-blush', sortOrder: 10 },
  { slug: '1-2-years', label: '1–2 years', minMonths: 12, maxMonths: 35, accentToken: 'soft-sky', sortOrder: 20 },
  { slug: '3-5-years', label: '3–5 years', minMonths: 36, maxMonths: 71, accentToken: 'soft-mint', sortOrder: 30 },
  { slug: '6-8-years', label: '6–8 years', minMonths: 72, maxMonths: 107, accentToken: 'soft-lavender', sortOrder: 40 },
  { slug: '9-12-years', label: '9–12 years', minMonths: 108, maxMonths: 155, accentToken: 'soft-sunshine', sortOrder: 50 },
];

/* -------------------------------------------------------------------------- */
/* Products                                                                    */
/* -------------------------------------------------------------------------- */

export type MediaSeed = {
  /** Filename inside the product's reference folder. */
  file: string;
  alt: string;
  /** Optional gallery caption. */
  caption?: string;
};

export type EvidenceSeed = {
  field: ComplianceField;
  sourceType: EvidenceSourceType;
  sourceRef: string;
};

export type ProductSeed = {
  /** Folder under `assets/reference/products/`. */
  folder: string;
  slug: string;
  name: string;
  categorySlug: string;
  shortDescription: string;
  description: string;
  descriptionBn?: string;
  features: string[];
  searchAliases: string[];
  seo: { metaTitle: string; metaDescription: string };
  /** Ordered; the first entry is the primary image. */
  images: MediaSeed[];
  video?: MediaSeed;
  /** Supplier observations — recorded, never verified (§7.2). */
  evidence: EvidenceSeed[];
  /** Why specific files in the folder are not storefront media. */
  excluded: { file: string; reason: string }[];
};

export const PRODUCT_SEEDS: readonly ProductSeed[] = [
  {
    folder: '01-fruit-matching-board',
    slug: 'wooden-fruit-and-number-learning-board',
    name: 'Wooden Fruit and Number Learning Board',
    categorySlug: 'activity-matching',
    shortDescription:
      'One wooden board with seven activities — fruit and number matching, shape fitting, stacking rings, magnetic fishing and bead threading.',
    description:
      'A single wooden board that holds several different activities, so one toy keeps its interest as a child moves between them.\n\nCut-out recesses take chunky fruit pieces — orange, banana, strawberry, pear, avocado, watermelon and grapes — each sitting in its own matching shape. A row of numbers from 1 to 9 fits into recesses illustrated with animals, and separate wooden shapes and math symbols let numbers be laid out as simple sums.\n\nThe set also includes stacking rings on wooden pegs, a magnetic fishing rod with fish pieces, and a threading cord for stringing the same fish onto a line.\n\nPieces are chunky and easy for small hands to lift and place.',
    descriptionBn:
      'একটি কাঠের বোর্ডেই কয়েক ধরনের খেলা রাখা হয়েছে, তাই বাচ্চা একঘেয়ে না হয়ে এক খেলা থেকে আরেক খেলায় যেতে পারে।\n\nবোর্ডের খাঁজে ফলের টুকরো বসানো যায় — কমলা, কলা, স্ট্রবেরি, নাশপাতি, অ্যাভোকাডো, তরমুজ ও আঙুর। ১ থেকে ৯ পর্যন্ত সংখ্যার টুকরোগুলো আলাদা খাঁজে বসে, আর যোগ-বিয়োগের চিহ্ন দিয়ে সহজ অঙ্ক সাজানো যায়।\n\nসঙ্গে আছে রিং সাজানোর খুঁটি, চুম্বকের ছিপ দিয়ে মাছ ধরার খেলা এবং সুতোয় মাছ গাঁথার সুযোগ।\n\nটুকরোগুলো মোটা ও ধরতে সহজ।',
    features: [
      'Fruit pieces that sit in matching cut-out recesses',
      'Numbers 1 to 9 with illustrated recesses',
      'Wooden shapes and math symbols for laying out simple sums',
      'Stacking rings on wooden pegs',
      'Magnetic fishing rod with fish pieces',
      'Threading cord for stringing the fish',
    ],
    searchAliases: [
      'fruit matching board',
      'number board',
      'wooden learning board',
      'fishing game',
      'shape sorter',
      'কাঠের বোর্ড',
      'সংখ্যা শেখার খেলনা',
      'ফল মেলানো',
    ],
    seo: {
      metaTitle: 'Wooden Fruit and Number Learning Board',
      metaDescription:
        'A wooden board combining fruit and number matching, shape fitting, stacking rings, magnetic fishing and bead threading in one set.',
    },
    images: [
      {
        file: 'image-04.jpg',
        alt: 'Wooden learning board with numbers 1 to 9, fruit pieces, coloured shapes and stacking rings',
        caption: 'The complete set',
      },
      {
        file: 'image-01.jpg',
        alt: 'Four activities on the board: placing a pear piece, fitting the number three, animal-illustrated number recesses, and laying out a multiplication sum',
        caption: 'Matching, numbers, animals and simple sums',
      },
      {
        file: 'image-02.png',
        alt: 'Stacking rings on numbered pegs, fish pieces threaded on a cord, and a magnetic fishing rod above the board',
        caption: 'Stacking, threading and magnetic fishing',
      },
    ],
    video: {
      file: 'demo.mp4',
      alt: 'Short clip showing the board’s matching, stacking and fishing activities in use',
    },
    evidence: [
      { field: 'materials', sourceType: 'marketplace-listing', sourceRef: 'Supplier listing states "Wood". Not independently confirmed.' },
      { field: 'countryOfOrigin', sourceType: 'marketplace-listing', sourceRef: 'Supplier listing states origin "Mainland China". Not independently confirmed.' },
      { field: 'manufacturer', sourceType: 'marketplace-listing', sourceRef: 'Supplier listing brand "Child Jupiter". Not independently confirmed.' },
    ],
    excluded: [
      { file: 'image-03.png', reason: 'Burned-in safety claim "NO BURRS, NO HAND INJURY" — D-12 bans unverified safety claims.' },
      { file: 'image-05.png', reason: 'Carries the SF Express courier logo — D-12 bans third-party brand logos, and supplier shipping detail must not be exposed.' },
      { file: 'image-06.png', reason: 'Burned-in "0–3 Years" age claim and "Montessori" positioning — both unverified (D-12).' },
      { file: 'reference-page.png', reason: 'Internal sourcing reference only.' },
    ],
  },

  {
    folder: '02-felt-learning-board',
    slug: 'felt-activity-book-with-carry-bag',
    name: 'Felt Activity Book with Carry Bag',
    categorySlug: 'activity-matching',
    shortDescription:
      'A soft felt book of hands-on pages — buckles, laces, zips, a clock face and matching pieces — that folds shut into a bag with handles.',
    description:
      'A quiet-time activity book made from soft felt, with a different task on every page and nothing to lose on the floor: pieces attach directly to the page.\n\nPages include buckles, press-studs, a zip, a shoe to lace, ribbon weaving, a movable clock face, counting rods with beads, and picture pages for animals, shapes, colours and the alphabet.\n\nThe whole book folds shut and fastens into a bag with carry handles and shoulder straps, so it travels to a waiting room or a car journey without coming apart.',
    descriptionBn:
      'নরম ফেল্ট কাপড়ে তৈরি একটি অ্যাক্টিভিটি বই, যার প্রতিটি পাতায় আলাদা কাজ — আর টুকরোগুলো পাতার সঙ্গেই লাগানো থাকে বলে হারিয়ে যায় না।\n\nপাতাগুলোতে আছে বাকল, বোতাম, চেইন, জুতোর ফিতা বাঁধা, ফিতা বোনা, ঘড়ির কাঁটা ঘোরানো, পুঁতি দিয়ে গোনা, আর পশু-আকৃতি-রঙ-বর্ণমালার ছবি।\n\nবইটি ভাঁজ করে হাতল ও কাঁধের ফিতাসহ ব্যাগ হয়ে যায়, তাই যাত্রাপথে বা অপেক্ষার সময় সঙ্গে নেওয়া সহজ।',
    features: [
      'Buckles, press-studs and a working zip',
      'Shoe-lacing panel and ribbon weaving',
      'Movable clock face',
      'Counting rods with sliding beads',
      'Picture pages for animals, shapes, colours and letters',
      'Folds into a bag with handles and shoulder straps',
    ],
    searchAliases: [
      'busy book',
      'felt book',
      'quiet book',
      'activity book',
      'travel toy',
      'ফেল্ট বই',
      'কাপড়ের বই',
      'শান্ত খেলা',
    ],
    seo: {
      metaTitle: 'Felt Activity Book with Carry Bag',
      metaDescription:
        'A soft felt activity book with buckles, laces, zips, a clock face and matching pages, folding into a bag with carry handles.',
    },
    images: [
      {
        file: 'image-03.png',
        alt: 'Felt activity book opened to show buckles, a clock face, counting rods, ribbon weaving and a shoe-lacing panel, beside the closed book showing its alphabet page',
        caption: 'Pages and closed book',
      },
      {
        file: 'image-01.png',
        alt: 'Child turning the pages of the open felt activity book, with the folded bag and shoulder-strap versions shown alongside',
        caption: 'In use, and folded for carrying',
      },
      {
        file: 'image-02.png',
        alt: 'Felt book pages laid out flat: fasteners, a clock, animal matching, weather, colours, shapes, body parts and counting',
        caption: 'Every page in the book',
      },
    ],
    video: {
      file: 'demo.mp4',
      alt: 'Short clip showing the felt book’s pages, fasteners and folding carry bag',
    },
    evidence: [
      { field: 'materials', sourceType: 'marketplace-listing', sourceRef: 'Supplier listing describes felt/cloth construction. Not independently confirmed.' },
      { field: 'countryOfOrigin', sourceType: 'marketplace-listing', sourceRef: 'Supplier listing states origin "Mainland China". Not independently confirmed.' },
    ],
    excluded: [{ file: 'reference-page.png', reason: 'Internal sourcing reference only.' }],
  },

  {
    folder: '03-Geometric Bead Stacking Pillars',
    slug: 'rainbow-bead-sorting-columns',
    name: 'Rainbow Bead Sorting Columns',
    categorySlug: 'sorting-fine-motor',
    shortDescription:
      'Six wooden posts on a solid base, with rounded beads in six colours to lift, sort and stack into even columns.',
    description:
      'A calm, repetitive sorting set: six wooden posts stand on one solid base, and rounded beads in six colours slide down over them.\n\nBeads can be sorted by colour into matching columns, counted as they are stacked, or arranged into patterns across the posts. Because every bead is the same size and shape, the only variable is colour and quantity — which keeps the task clear for a child who is still working out sorting.\n\nThe beads are large and rounded, with a hole wide enough to drop over a post without careful aiming.',
    descriptionBn:
      'ছয়টি কাঠের খুঁটি একটি শক্ত বেসের ওপর দাঁড়ানো, আর ছয় রঙের গোল পুঁতি সেগুলোর ওপর দিয়ে গলিয়ে দেওয়া যায়।\n\nরঙ অনুযায়ী পুঁতি আলাদা করে সাজানো যায়, গুনে গুনে ওঠানো যায়, কিংবা খুঁটিগুলোতে নকশা করে বসানো যায়। সব পুঁতির আকার এক বলে শুধু রঙ আর সংখ্যাই আলাদা — এতে কাজটা বাচ্চার কাছে পরিষ্কার থাকে।\n\nপুঁতিগুলো বড় ও গোলাকার, আর ছিদ্র যথেষ্ট চওড়া বলে খুঁটিতে বসাতে বেশি নিশানা লাগে না।',
    features: [
      'Six wooden posts on a single base',
      'Rounded beads in six colours',
      'Sort by colour, count, or build patterns',
      'Wide bead holes that drop easily over a post',
    ],
    searchAliases: [
      'bead stacking',
      'colour sorting',
      'stacking columns',
      'threading beads',
      'পুঁতি সাজানো',
      'রঙ মেলানো',
    ],
    seo: {
      metaTitle: 'Rainbow Bead Sorting Columns',
      metaDescription:
        'Six wooden posts on a solid base with rounded beads in six colours, for sorting, counting and stacking.',
    },
    images: [
      {
        file: 'image-04.png',
        alt: 'Six wooden posts on a base, each stacked with beads of a single colour — purple, blue, red, green, yellow and orange',
        caption: 'Sorted into six colour columns',
      },
      {
        file: 'image-01.jpg',
        alt: 'Bead columns part-built at different heights, with loose beads resting on the base and floor',
        caption: 'Part-way through sorting',
      },
    ],
    video: {
      file: 'demo.mp4',
      alt: 'Short clip showing beads being sorted onto the wooden posts',
    },
    evidence: [
      { field: 'materials', sourceType: 'marketplace-listing', sourceRef: 'Supplier listing states "Toy Material: Wood". Not independently confirmed.' },
      { field: 'countryOfOrigin', sourceType: 'marketplace-listing', sourceRef: 'Supplier listing states "Country/Region of Origin: Mainland China", "Origin: Zhejiang Province". Not independently confirmed.' },
      { field: 'manufacturer', sourceType: 'marketplace-listing', sourceRef: 'Supplier listing brand "Smart Player". Not independently confirmed.' },
    ],
    excluded: [
      { file: 'image-02.jpg', reason: 'Shows a different variant (geometric shape blocks), not this product.' },
      { file: 'image-03.jpg', reason: 'Shows a different variant (flat geometric shapes with pattern cards), not this product.' },
      { file: 'image-05.jpg', reason: 'Shows a different variant (cone-shaped stacking beads), not this product.' },
      { file: 'image-06.jpg', reason: 'Shows a different variant (mixed geometric beads with threading cords), not this product.' },
      { file: 'image-07.jpg', reason: 'Retail box carrying "3+ years" and developmental claims — unverified (D-12).' },
      { file: 'reference-page.png', reason: 'Internal sourcing reference only.' },
    ],
  },

  {
    folder: '04-number-recognition-beads',
    slug: 'number-and-bead-matching-set',
    name: 'Number and Bead Matching Set',
    categorySlug: 'numbers-math',
    shortDescription:
      'Number cards, coloured beads, silicone cups and three lifting tools — tongs, chopsticks and a spoon — for counting and colour sorting.',
    description:
      'A counting set built around one idea: read the number, then place that many beads.\n\nCards show a numeral, its English word and a row of coloured dots, so the quantity can be checked by matching beads onto the dots. Seven silicone cups hold the beads for sorting by colour, and loose wooden number tiles from 0 to 9 with plus, minus, multiply and equals symbols let simple sums be laid out beside the cards.\n\nThree tools are included for lifting beads — chunky tongs, wooden chopsticks and a small wooden spoon — so the same activity can be made easier or harder without changing the set.',
    descriptionBn:
      'এই সেটের মূল ভাবনা সহজ: সংখ্যাটা দেখো, তারপর ততগুলো পুঁতি বসাও।\n\nকার্ডে সংখ্যা, তার ইংরেজি নাম আর রঙিন ফোঁটার সারি থাকে — ফোঁটার ওপর পুঁতি বসিয়ে মিলিয়ে নেওয়া যায়। সাতটি সিলিকন বাটিতে রঙ অনুযায়ী পুঁতি আলাদা করা যায়, আর ০ থেকে ৯ পর্যন্ত কাঠের সংখ্যা ও যোগ-বিয়োগের চিহ্ন দিয়ে সহজ অঙ্ক সাজানো যায়।\n\nপুঁতি তোলার জন্য তিন রকম জিনিস আছে — চিমটা, কাঠি আর ছোট চামচ — তাই একই খেলা সহজ বা কঠিন করে নেওয়া যায়।',
    features: [
      'Number cards with numeral, English word and matching dots',
      'Wooden number tiles 0–9 with +, −, × and = symbols',
      'Seven silicone cups for colour sorting',
      'Coloured beads',
      'Three lifting tools: tongs, chopsticks and a wooden spoon',
    ],
    searchAliases: [
      'number matching',
      'counting beads',
      'clip beads',
      'colour sorting cups',
      'tongs game',
      'সংখ্যা গোনা',
      'পুঁতি তোলা',
      'গণনা খেলা',
    ],
    seo: {
      metaTitle: 'Number and Bead Matching Set',
      metaDescription:
        'Number cards, coloured beads, sorting cups and three lifting tools for counting, matching and colour sorting.',
    },
    images: [
      {
        file: 'image-05.jpg',
        alt: 'Everything in the set laid out: seven cups of coloured beads, number cards, wooden numerals and symbols, tongs, chopsticks and a spoon',
        caption: 'The complete set',
      },
      {
        file: 'image-01.jpg',
        alt: 'Hand using orange tongs to lift a bead into a silicone cup, with number cards from two to ten arranged above',
        caption: 'Lifting beads with the tongs',
      },
      {
        file: 'image-06.jpg',
        alt: 'Close-up of wooden chopsticks picking up a bead, beside number cards and cups of sorted beads',
        caption: 'Chopsticks for a harder version',
      },
      {
        file: 'image-04.jpg',
        alt: 'Open box holding cups of beads and wooden numerals, with number cards fanned out in front',
        caption: 'How the set arrives',
      },
    ],
    video: {
      file: 'demo.mp4',
      alt: 'Short clip showing beads being lifted with tongs and matched onto the number cards',
    },
    evidence: [
      { field: 'materials', sourceType: 'marketplace-listing', sourceRef: 'Supplier listing describes wooden numerals with silicone cups. Not independently confirmed.' },
      { field: 'countryOfOrigin', sourceType: 'marketplace-listing', sourceRef: 'Supplier listing states origin "Mainland China". Not independently confirmed.' },
    ],
    excluded: [
      { file: 'image-02.jpg', reason: 'Retail box in shot shows a legible "36 Months" age claim — unverified (D-12).' },
      { file: 'image-03.jpg', reason: 'Retail box carrying a "36+ Months" age claim — unverified (D-12).' },
      { file: 'reference-page.png', reason: 'Internal sourcing reference only.' },
    ],
  },

  {
    folder: '05-math-abacus-frame',
    slug: 'ten-row-wooden-abacus-with-number-cards',
    name: 'Ten-Row Wooden Abacus with Number Cards',
    categorySlug: 'numbers-math',
    shortDescription:
      'A standing wooden abacus with ten rows of coloured beads, plus number and symbol cards that slot into the frame to build sums.',
    description:
      'A wooden counting frame that stands on its own, with ten rows of ten beads in repeating colours so quantities can be seen as well as counted.\n\nA slotted rail across the top holds number and symbol cards, so a sum can be set up in view — 4 + 8 = 12 — and then worked out by sliding beads along the rows beneath it. Cards run from 1 to 28, with plus, minus and equals symbols, and a reference table of worked examples is included.\n\nThe frame is open on both sides, so two children can use it from either side at the same time.',
    descriptionBn:
      'কাঠের একটি গণনা ফ্রেম, যা নিজে নিজেই দাঁড়িয়ে থাকে। দশটি সারিতে দশটি করে রঙিন পুঁতি থাকায় সংখ্যা গোনার পাশাপাশি চোখেও দেখা যায়।\n\nওপরের খাঁজে সংখ্যা ও চিহ্নের কার্ড বসানো যায় — যেমন ৪ + ৮ = ১২ — তারপর নিচের সারিতে পুঁতি সরিয়ে হিসাবটা মিলিয়ে নেওয়া যায়। কার্ডে ১ থেকে ২৮ পর্যন্ত সংখ্যা এবং যোগ-বিয়োগের চিহ্ন আছে, সঙ্গে উদাহরণের একটি তালিকাও আছে।\n\nফ্রেমের দুই পাশ খোলা, তাই দুজন একসঙ্গে দুই দিক থেকে ব্যবহার করতে পারে।',
    features: [
      'Ten rows of ten beads in repeating colours',
      'Slotted top rail for number and symbol cards',
      'Number cards from 1 to 28 with +, − and = symbols',
      'Reference table of worked examples',
      'Open on both sides for two children',
      'Free-standing wooden frame',
    ],
    searchAliases: [
      'abacus',
      'counting frame',
      'math frame',
      'addition subtraction',
      'অ্যাবাকাস',
      'গণনা ফ্রেম',
      'যোগ বিয়োগ',
    ],
    seo: {
      metaTitle: 'Ten-Row Wooden Abacus with Number Cards',
      metaDescription:
        'A free-standing wooden abacus with ten rows of coloured beads and slot-in number cards for building and solving simple sums.',
    },
    images: [
      {
        file: 'image-01.jpg',
        alt: 'Free-standing wooden abacus with ten rows of coloured beads and number cards reading four plus eight equals twelve',
        caption: 'The abacus with a sum set up',
      },
      {
        file: 'image-03.jpg',
        alt: 'Abacus shown with its full set of number cards from one to twenty-eight and a table of worked examples',
        caption: 'Everything included',
      },
      {
        file: 'image-02.png',
        alt: 'Abacus alongside labelled number cards and the formulas table, showing the three parts of the set',
        caption: 'Frame, cards and table',
      },
      {
        file: 'image-05.jpg',
        alt: 'Child’s hand sliding coloured beads along the top rows of the abacus',
        caption: 'Sliding the beads',
      },
      {
        file: 'image-04.png',
        alt: 'Child pointing at a bead row while working through the sum three plus seven equals ten set in the top rail',
        caption: 'Working out a sum',
      },
    ],
    video: {
      file: 'demo.mp4',
      alt: 'Short clip showing beads being moved along the abacus rows to solve a card sum',
    },
    evidence: [
      { field: 'materials', sourceType: 'marketplace-listing', sourceRef: 'Supplier listing describes a wooden frame with wooden beads. Not independently confirmed.' },
      { field: 'countryOfOrigin', sourceType: 'marketplace-listing', sourceRef: 'Supplier listing states origin "Mainland China". Not independently confirmed.' },
    ],
    excluded: [{ file: 'reference-page.png', reason: 'Internal sourcing reference only.' }],
  },
];

/** Files that must never become storefront media, whatever else changes. */
export const NEVER_STOREFRONT_MEDIA = ['reference-page.png'] as const;
