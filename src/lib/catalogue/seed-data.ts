import type {
  AccentToken,
  CatalogueAvailability,
  ComplianceField,
  EvidenceSourceType,
} from '@/lib/catalogue/types';

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
  /**
   * Added for the remote-control bumper cars.
   *
   * A battery-powered battle toy is not a learning product, and filing it under
   * "Learning & Educational" to avoid creating a category would be exactly the
   * dishonest classification D-01 guards against — "no category is privileged in
   * code. Categories are data." Toys and play equipment are explicitly in scope
   * (§3.1), so this is ordinary catalogue work, not a re-architecture.
   *
   * Top level with no children: §3.2 requires the storefront to render sensibly
   * with one level, and a single-product subcategory would be structure for its
   * own sake.
   */
  {
    slug: 'toys-play',
    name: 'Toys & Play',
    description:
      'Remote control, outdoor and active play for indoors and out — the toys that are not about a lesson.',
    accentToken: 'soft-blush',
    searchAliases: [
      'toys',
      'play',
      'remote control',
      'rc',
      'outdoor',
      'binoculars',
      'খেলনা',
      'রিমোট কন্ট্রোল',
      'বাইরের খেলা',
    ],
    sortOrder: 20,
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

/**
 * Founder-approved storefront prices, in whole taka.
 *
 * `selling` is what the customer pays; `display` is the higher reference price
 * shown struck through. Both are explicit business data supplied by the founder
 * — never derived at runtime from supplier cost, freight or margin.
 *
 * Converted to integer minor units (poisha) by the seed, so no float amount
 * ever reaches the database or a price label.
 */
export type PriceSeed = { display: number; selling: number };

export type ProductSeed = {
  /** Folder under `assets/reference/products/`. */
  folder: string;
  slug: string;
  name: string;
  categorySlug: string;
  /**
   * `available` products carry a founder-approved price; `coming-soon` products
   * carry none and must never be given one here. `assertSeedPricingIntegrity()`
   * enforces both halves, so the two fields cannot drift.
   */
  availability: CatalogueAvailability;
  /** Present if and only if `availability` is `available`. */
  price?: PriceSeed;
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
    slug: '7-in-1-wooden-montessori-learning-board',
    name: '7-in-1 Wooden Montessori Learning Board',
    categorySlug: 'activity-matching',
    availability: 'available',
    price: { display: 2990, selling: 2490 },
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
      metaTitle: '7-in-1 Wooden Montessori Learning Board',
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
    slug: 'toddler-montessori-busy-book-and-travel-bag',
    name: 'Toddler Montessori Busy Book & Travel Bag',
    categorySlug: 'activity-matching',
    availability: 'available',
    price: { display: 2790, selling: 2090 },
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
      metaTitle: 'Toddler Montessori Busy Book & Travel Bag',
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
    slug: 'rainbow-wooden-abacus-and-counting-stacker',
    name: 'Rainbow Wooden Abacus & Counting Stacker',
    categorySlug: 'sorting-fine-motor',
    availability: 'available',
    price: { display: 2290, selling: 1690 },
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
      metaTitle: 'Rainbow Wooden Abacus & Counting Stacker',
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
    slug: 'smart-chopstick-and-clip-bead-math-set',
    name: 'Smart Chopstick & Clip-Bead Math Set',
    categorySlug: 'numbers-math',
    availability: 'available',
    price: { display: 1990, selling: 1490 },
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
      metaTitle: 'Smart Chopstick & Clip-Bead Math Set',
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
    folder: '05-remote-control-battle-bumper-cars',
    slug: 'interactive-rc-ejection-battle-cars',
    name: 'Interactive RC Ejection Battle Cars',
    categorySlug: 'toys-play',
    availability: 'available',
    price: { display: 3490, selling: 2890 },
    shortDescription:
      'Two remote-controlled bumper cars with their own handsets, four pop-up character figures and a rechargeable battery set.',
    description:
      'Two bumper cars, two handsets, and one obvious idea: drive into the other car and try to knock its rider out first.\n\nEach car carries a small character figure on a sprung seat. A direct hit pops the other player’s figure off, which settles who won without anyone keeping score. The cars steer forwards, backwards, left and right, and both handsets have their own on/off switch so two players can run at once without interfering.\n\nThe set arrives complete: two cars, two handsets, four character figures, a USB charging cable, batteries, a screwdriver for the battery covers, and a retail box.\n\nIt is a noisy, competitive game rather than a quiet one — best on a hard floor with a bit of room.',
    descriptionBn:
      'দুটি বাম্পার কার, দুটি রিমোট — আর খেলাটা সোজা: অন্য গাড়িতে ধাক্কা দিয়ে তার চালককে আগে ফেলে দাও।\n\nপ্রতিটি গাড়ির ওপর স্প্রিং-লাগানো আসনে একটি করে ছোট চরিত্র বসে থাকে। ঠিকমতো ধাক্কা লাগলে সেটি ছিটকে পড়ে, তাই কে জিতল তা নিয়ে আলাদা হিসাব রাখতে হয় না। গাড়ি সামনে-পিছনে ও ডানে-বাঁয়ে চলে, আর দুটি রিমোটেই আলাদা সুইচ থাকায় দুজন একসঙ্গে খেলতে পারে।\n\nবাক্সে থাকে দুটি গাড়ি, দুটি রিমোট, চারটি চরিত্র, ইউএসবি চার্জিং কেবল, ব্যাটারি, ব্যাটারি কভার খোলার স্ক্রুড্রাইভার এবং প্যাকিং বক্স।\n\nএটি শান্ত খেলা নয় — শক্ত মেঝেতে একটু খোলা জায়গায় খেলাই ভালো।',
    features: [
      'Two remote-controlled cars with separate handsets',
      'Four character figures on sprung seats that pop off on impact',
      'Forward, reverse, left and right steering',
      'On/off switch on each handset so two can play at once',
      'USB charging cable, batteries and screwdriver included',
    ],
    searchAliases: [
      'bumper cars',
      'remote control car',
      'rc car',
      'battle cars',
      'two player toy',
      'বাম্পার কার',
      'রিমোট কন্ট্রোল গাড়ি',
      'রিমোট গাড়ি',
    ],
    seo: {
      metaTitle: 'Interactive RC Ejection Battle Cars',
      metaDescription:
        'Two remote-controlled bumper cars with their own handsets and pop-off character figures, for head-to-head play.',
    },
    images: [
      {
        file: 'image-01.png',
        alt: 'Red and blue remote-control bumper cars with two handsets, four character figures, and the included charging cable, batteries, screwdriver and box',
        caption: 'Everything in the set',
      },
    ],
    video: {
      file: 'demo.mp4',
      alt: 'Short clip showing the two bumper cars being driven into each other and a character figure popping off',
    },
    evidence: [
      { field: 'materials', sourceType: 'marketplace-listing', sourceRef: 'Supplier listing states "Toy Material: Plastic". Not independently confirmed.' },
      { field: 'countryOfOrigin', sourceType: 'marketplace-listing', sourceRef: 'Supplier listing states "Country Of Origin: Chenghai". Not independently confirmed.' },
      { field: 'manufacturer', sourceType: 'marketplace-listing', sourceRef: 'Supplier listing brand recorded as "Other"; product code "Ks-134". No manufacturer identified.' },
      {
        field: 'ageSafetyNote',
        sourceType: 'marketplace-listing',
        sourceRef:
          'Supplier listing categorises this as "3c Configuration Category: Toys For Ages 14+" and "Applicable Age: Youth (15-35 Years Old)". Contains small figures, loose batteries and a screwdriver. Requires founder review and a verified age-safety assessment before publishing (D-16).',
      },
    ],
    excluded: [
      { file: 'image-02.png', reason: 'Byte-identical duplicate of image-01.png; a gallery repeating the same photograph reads as broken.' },
      { file: 'reference-page.png', reason: 'Internal sourcing reference only.' },
    ],
  },

  /* ------------------------------------------------------------------------ */
  /* Coming soon — founder-selected, not yet priced or orderable              */
  /*                                                                          */
  /* Six products the founder has chosen but not yet committed to. They carry */
  /* `availability: 'coming-soon'` and **no price at all** — not zero, not a  */
  /* placeholder, not a sourcing-sheet cost. Everything else is the same work */
  /* as products 1–5: Renvura copy describing what is visible in the media,   */
  /* supplier claims recorded as non-probative evidence, nothing asserted     */
  /* about age, material, safety or development.                             */
  /* ------------------------------------------------------------------------ */

  {
    folder: '09-children-enlightenment-telescope',
    slug: 'kids-explorer-binoculars-outdoor-nature',
    name: 'Kids Explorer Binoculars — Outdoor Nature',
    categorySlug: 'toys-play',
    availability: 'coming-soon',
    shortDescription:
      'Lightweight binoculars shaped for a child’s hands and face, with a neck cord for carrying them outdoors.',
    description:
      'Binoculars built to a child’s proportions rather than scaled down from an adult pair — a wide soft eyepiece the whole face rests against, and a body chunky enough to hold with two hands.\n\nA cord threads through the body so they hang around the neck between looks, which is what usually stops a pair of binoculars being left behind in a garden.\n\nIntended for looking at what is already outside: birds on a wire, a plane, the far side of a field.',
    descriptionBn:
      'বাচ্চাদের হাত ও মুখের মাপে তৈরি একটি বাইনোকুলার — চোখের অংশটি চওড়া ও নরম, আর শরীরটা দুই হাতে ধরার মতো মোটা।\n\nগলায় ঝোলানোর জন্য একটি ফিতা লাগানো আছে, তাই বাইরে নিয়ে গেলে হাতছাড়া হয় না।\n\nবাইরে যা এমনিতেই দেখা যায় — পাখি, উড়োজাহাজ, দূরের গাছপালা — সেগুলো কাছ থেকে দেখার জন্য।',
    features: [
      'Wide soft eyepiece that rests against the face',
      'Chunky body sized for two small hands',
      'Neck cord for carrying between looks',
    ],
    searchAliases: [
      'binoculars',
      'kids binoculars',
      'telescope',
      'nature',
      'outdoor',
      'bird watching',
      'দূরবীন',
      'বাইনোকুলার',
      'বাইরের খেলা',
    ],
    seo: {
      metaTitle: 'Kids Explorer Binoculars — Outdoor Nature',
      metaDescription:
        'Lightweight binoculars shaped for a child’s hands and face, with a neck cord for outdoor use.',
    },
    images: [
      {
        file: 'image-02.jpg',
        alt: 'Child outdoors holding blue, green and yellow binoculars up to their eyes, with the neck cord hanging down',
        caption: 'In use outdoors',
      },
    ],
    video: {
      file: 'demo.mp4',
      alt: 'Short clip showing the binoculars being held and used outdoors',
    },
    evidence: [
      {
        field: 'manufacturer',
        sourceType: 'marketplace-listing',
        sourceRef:
          'Listing title references "American Learning Resources"; item number 5260 and the packaging in the reference images read "GeoSafari Jr. Kidnoculars" (Educational Insights). Whether this is the genuine branded product or a copy is NOT established, and no reseller authorisation exists. Founder decision required before publishing.',
      },
      {
        field: 'materials',
        sourceType: 'marketplace-listing',
        sourceRef: 'Supplier listing categorises this as a plastic toy. Not independently confirmed.',
      },
      {
        field: 'ageSafetyNote',
        sourceType: 'marketplace-listing',
        sourceRef:
          'Supplier listing states "Applicable Age: Children (4-6 Years Old)"; the packaging photograph shows a "3+" marking and a warning label. Neither is verified, and neither is rendered.',
      },
      {
        field: 'certifications',
        sourceType: 'marketplace-listing',
        sourceRef:
          'Supplier listing quotes 3C certification code 2021012202402172. No certificate document obtained; not verified.',
      },
    ],
    excluded: [
      { file: 'image-01.jpg', reason: 'Retail packaging showing a legible "3+" age marking and a warning label — unverified age and safety claims (D-12, D-16).' },
      { file: 'image-03.jpg', reason: 'Burned-in "SUPPORTS STEM LEARNING" overlay — a developmental claim Renvura has not verified (D-12).' },
      { file: 'image-04.jpg', reason: 'Same packaging composition as image-01.jpg, with the same "3+" marking and warning label.' },
      { file: 'reference-page.png', reason: 'Internal sourcing reference only.' },
    ],
  },

  {
    folder: '11-shape-number-awareness-board',
    slug: '3-in-1-wooden-shape-number-and-symbol-puzzle-board',
    name: '3-in-1 Wooden Shape, Number & Symbol Puzzle Board',
    categorySlug: 'activity-matching',
    availability: 'coming-soon',
    shortDescription:
      'One wooden board holding numbers 0 to 9, math symbols and geometric shapes, each piece lifting out of its own cut-out.',
    description:
      'A single beech-coloured board with four rows of chunky painted pieces, each sitting in a recess cut to its exact outline.\n\nThe top two rows hold the numbers 0 to 9 plus a plus and a minus sign. The third row adds multiplication, division, equals and a star and circle. The bottom row is geometric: square, triangle, trapezoid, pentagon and hexagon.\n\nEvery piece has a finger hole or a shape wide enough to grip, so pieces come out and go back without help.',
    descriptionBn:
      'একটি কাঠের বোর্ডে চার সারি রঙিন টুকরো, প্রতিটি টুকরো নিজের মাপের খাঁজে বসানো।\n\nউপরের দুই সারিতে ০ থেকে ৯ সংখ্যা এবং যোগ ও বিয়োগের চিহ্ন। তৃতীয় সারিতে গুণ, ভাগ, সমান চিহ্নসহ তারা ও গোল আকৃতি। নিচের সারিতে জ্যামিতিক আকার — চৌকো, ত্রিভুজ, পঞ্চভুজ, ষড়ভুজ।\n\nপ্রতিটি টুকরো ধরার মতো চওড়া, তাই বাচ্চা নিজেই তুলতে ও বসাতে পারে।',
    features: [
      'Numbers 0 to 9 in cut-out recesses',
      'Plus, minus, multiply, divide and equals symbols',
      'Geometric shapes: square, triangle, trapezoid, pentagon and hexagon',
      'Single board — no loose tray or box to keep track of',
    ],
    searchAliases: [
      'shape puzzle board',
      'number puzzle',
      'wooden puzzle board',
      'shape sorter',
      'symbols',
      'কাঠের ধাঁধা',
      'সংখ্যা বোর্ড',
      'আকৃতি',
    ],
    seo: {
      metaTitle: '3-in-1 Wooden Shape, Number & Symbol Puzzle Board',
      metaDescription:
        'A wooden inset board with numbers 0 to 9, math symbols and geometric shapes, each piece in its own cut-out.',
    },
    images: [
      {
        file: 'image-03.jpg',
        alt: 'Wooden board with numbers 0 to 9 and math symbols in coloured cut-outs, above a row of geometric shapes',
        caption: 'The complete board',
      },
    ],
    video: {
      file: 'demo.mp4',
      alt: 'Short clip showing pieces being lifted from and returned to the board',
    },
    evidence: [
      { field: 'materials', sourceType: 'marketplace-listing', sourceRef: 'Supplier listing states "Material: Wood". Not independently confirmed.' },
      { field: 'countryOfOrigin', sourceType: 'marketplace-listing', sourceRef: 'Supplier listing states origin "Yunhe, Zhejiang, China". Not independently confirmed.' },
      {
        field: 'ageSafetyNote',
        sourceType: 'marketplace-listing',
        sourceRef:
          'Supplier listing states "Applicable Age: Infants And Young Children (0-3 Years Old)". The board carries small loose pieces; unverified and not rendered.',
      },
    ],
    excluded: [
      { file: 'image-01.jpg', reason: 'Multi-variant hero showing alphabet and number boards that are not this product, with burned-in Chinese marketing text.' },
      { file: 'image-02.jpg', reason: 'Byte-identical duplicate of image-01.jpg.' },
      { file: 'image-04.jpg', reason: 'Shows the shapes-only variant, not the shape-number-symbol board selected on the reference page.' },
      { file: 'image-05.jpg', reason: 'Shows the numbers-and-symbols variant without geometric shapes — a different board.' },
      { file: 'reference-page.png', reason: 'Internal sourcing reference only.' },
    ],
  },

  {
    folder: '10-shape-building-blocks-string-rope',
    slug: 'wooden-shape-threading-and-lacing-beads-set',
    name: 'Wooden Shape Threading & Lacing Beads Set',
    categorySlug: 'sorting-fine-motor',
    availability: 'coming-soon',
    shortDescription:
      'A tray of chunky wooden beads in cubes, cylinders, spheres and faceted shapes, with two laces for threading them.',
    description:
      'A shallow wooden tray holding rows of painted beads, each drilled through so a lace passes cleanly.\n\nThe shapes are deliberately mixed — cubes, short cylinders, round beads and faceted blocks — so threading is not one repeated motion. Two laces with stiffened ends come with the set, which is what makes threading possible without an adult holding the string.\n\nThe tray keeps everything in one place rather than loose in a bag.',
    descriptionBn:
      'একটি কাঠের ট্রেতে সারি করে রাখা রঙিন পুঁতি, প্রতিটির মাঝখানে ফুটো করা যাতে সুতো সহজে যায়।\n\nআকারগুলো ইচ্ছে করেই আলাদা — চৌকো, লম্বাটে, গোল ও কাটা-কোণা — তাই গাঁথার কাজটা একঘেয়ে হয় না। সঙ্গে দুটি ফিতা আছে, যাদের মাথা শক্ত করা, তাই বাচ্চা নিজেই গাঁথতে পারে।\n\nসব কিছু ট্রেতেই থাকে, ব্যাগে ছড়িয়ে যায় না।',
    features: [
      'Chunky wooden beads in cubes, cylinders, spheres and faceted shapes',
      'Two laces with stiffened ends',
      'Shallow wooden tray that holds the whole set',
    ],
    searchAliases: [
      'threading beads',
      'lacing beads',
      'wooden beads',
      'stringing toy',
      'fine motor',
      'পুঁতি গাঁথা',
      'কাঠের পুঁতি',
      'সুতো',
    ],
    seo: {
      metaTitle: 'Wooden Shape Threading & Lacing Beads Set',
      metaDescription:
        'Chunky wooden beads in mixed shapes with two laces, held in a shallow wooden tray.',
    },
    images: [
      {
        file: 'image-02.jpg',
        alt: 'Wooden tray filled with rows of coloured cylindrical and cube beads, with a red lace and a green lace laid out below',
        caption: 'The complete set',
      },
      {
        file: 'image-01.jpg',
        alt: 'Coloured wooden beads threaded onto a green lace, curving out of the wooden tray',
        caption: 'Threaded on a lace',
      },
      {
        file: 'image-03.jpg',
        alt: 'Close-up of a red lace being threaded through the hole in a yellow round bead',
        caption: 'Threading close up',
      },
      {
        file: 'image-04.jpg',
        alt: 'A hand holding a faceted blue bead, showing its size against the fingers',
        caption: 'Bead size in the hand',
      },
    ],
    evidence: [
      {
        field: 'manufacturer',
        sourceType: 'marketplace-listing',
        sourceRef:
          'All reference photographs carry a "GOODCOW" watermark. Whether that is the manufacturer, the photographer or a reseller is not established.',
      },
      { field: 'materials', sourceType: 'marketplace-listing', sourceRef: 'Supplier listing describes painted wooden beads. Not independently confirmed.' },
      {
        field: 'ageSafetyNote',
        sourceType: 'marketplace-listing',
        sourceRef:
          'Loose beads and cords are visible in the product media. No verified age-safety assessment exists; none is rendered.',
      },
    ],
    excluded: [{ file: 'reference-page.png', reason: 'Internal sourcing reference only.' }],
  },

  {
    folder: '08-greedy-caterpillar-string-game',
    slug: 'greedy-caterpillar-wooden-lacing-and-threading-toy',
    name: 'Greedy Caterpillar Wooden Lacing & Threading Toy',
    categorySlug: 'sorting-fine-motor',
    availability: 'coming-soon',
    shortDescription:
      'A green caterpillar on a cord that threads through wooden food pieces, with picture cards setting the order to follow.',
    description:
      'The lace ends in a wooden caterpillar rather than a plain tip, so the threading has a character doing it — the caterpillar eats its way through a line of food.\n\nThe pieces are printed wooden food: watermelon, strawberry, pear, apple, pizza, burger, cheese, chocolate, cupcake, ice cream, a lollipop and more, each with a hole through the middle.\n\nPicture cards show a sequence of foods across the days of the week, so there is an order to follow rather than only free threading.',
    descriptionBn:
      'সুতোর মাথায় একটি কাঠের সবুজ শুঁয়োপোকা লাগানো, তাই গাঁথার খেলাটা গল্পের মতো হয় — শুঁয়োপোকা এক এক করে খাবারের ভেতর দিয়ে যায়।\n\nটুকরোগুলো কাঠের উপর আঁকা খাবার — তরমুজ, স্ট্রবেরি, নাশপাতি, আপেল, পিৎজা, বার্গার, পনির, চকলেট, কাপকেক, আইসক্রিম, ললিপপ — প্রতিটির মাঝখানে ফুটো।\n\nসঙ্গে ছবির কার্ড আছে, যেখানে সপ্তাহের দিন অনুযায়ী খাবারের ক্রম দেওয়া, তাই শুধু এলোমেলো গাঁথা নয়, ক্রম মিলিয়েও খেলা যায়।',
    features: [
      'Wooden caterpillar threading cord',
      'Printed wooden food pieces, each drilled through',
      'Picture cards setting a food order across the days of the week',
    ],
    searchAliases: [
      'caterpillar threading',
      'lacing toy',
      'wooden food',
      'stringing game',
      'sequence cards',
      'শুঁয়োপোকা',
      'সুতো গাঁথা',
      'কাঠের খাবার',
    ],
    seo: {
      metaTitle: 'Greedy Caterpillar Wooden Lacing & Threading Toy',
      metaDescription:
        'A wooden caterpillar cord that threads through printed wooden food pieces, with day-of-the-week sequence cards.',
    },
    images: [
      {
        file: 'image-04.jpg',
        alt: 'Wooden food pieces — watermelon, strawberry, pear, apple, pizza, cheese, chocolate, ice cream and a lollipop — with a green caterpillar cord threaded through several of them',
        caption: 'The complete set',
      },
      {
        file: 'image-01.jpg',
        alt: 'Hands threading the green caterpillar cord through a wooden plum piece, above a picture card showing a food order',
        caption: 'Threading, with a card to follow',
      },
    ],
    video: {
      file: 'demo.mp4',
      alt: 'Short clip showing the caterpillar cord being threaded through the wooden food pieces',
    },
    evidence: [
      { field: 'materials', sourceType: 'marketplace-listing', sourceRef: 'Supplier listing states "Material: Wood". Not independently confirmed.' },
      { field: 'countryOfOrigin', sourceType: 'marketplace-listing', sourceRef: 'Supplier listing states origin "Mainland China". Not independently confirmed.' },
      {
        field: 'manufacturer',
        sourceType: 'marketplace-listing',
        sourceRef:
          'Supplier listing brand recorded as "Other"; product code "Tb 54". Reference photographs show two different retail boxes ("Treehole" and "WoodDad") for the same set, so the brand is not established.',
      },
      {
        field: 'ageSafetyNote',
        sourceType: 'marketplace-listing',
        sourceRef:
          'Supplier listing states "Applicable Age: Children (4-6 Years Old)"; one retail box in the reference images reads "36+ Months" and carries a choking-hazard warning. Unverified, and not rendered.',
      },
    ],
    excluded: [
      { file: 'image-02.jpg', reason: 'Burned-in Chinese instructional overlay — supplier marketing text, not Renvura copy.' },
      { file: 'image-03.jpg', reason: 'Shows a different product entirely (a caterpillar shape-matching board with pattern cards), not this threading set.' },
      { file: 'image-05.jpg', reason: 'Retail box branded "WoodDad", which conflicts with the other box in this same folder — the brand is unestablished (D-12).' },
      { file: 'image-06.jpg', reason: 'Retail box branded "Treehole" carrying a legible "36+ Months" age claim and a choking-hazard warning — unverified (D-12, D-16).' },
      { file: 'reference-page.png', reason: 'Internal sourcing reference only.' },
    ],
  },

  {
    folder: '07-Ten-level-calculation-rack-set',
    slug: '10-row-wooden-abacus-and-math-learning-frame',
    name: '10-Row Wooden Abacus & Math Learning Frame',
    categorySlug: 'numbers-math',
    availability: 'coming-soon',
    shortDescription:
      'A standing ten-row bead frame with number cards that slot into the top rail, so a sum can be set out and then counted.',
    description:
      'A wooden frame holding ten wire rows of ten beads, coloured a row at a time so a count can be seen at a glance rather than counted one by one.\n\nThe top rail is slotted, so number and symbol cards stand up in it. A sum is set out along the rail — 4 + 8 = — and then worked out by sliding beads, which puts the written form and the counted form side by side.\n\nIt stands on its own on a table rather than needing to be held.',
    descriptionBn:
      'একটি কাঠের ফ্রেমে দশটি তারে দশটি করে পুঁতি, প্রতি সারিতে আলাদা রঙ — তাই এক নজরে গোনা যায়, একটা একটা করে গুনতে হয় না।\n\nউপরের কাঠের পাটিতে খাঁজ কাটা, সেখানে সংখ্যা ও চিহ্নের কার্ড দাঁড় করানো যায়। উপরে অঙ্কটা সাজিয়ে — যেমন ৪ + ৮ = — নিচে পুঁতি সরিয়ে উত্তর বের করা যায়।\n\nফ্রেমটি টেবিলে নিজেই দাঁড়ায়, ধরে রাখতে হয় না।',
    features: [
      'Ten rows of ten beads, coloured row by row',
      'Slotted top rail that holds number and symbol cards upright',
      'Number cards and a printed reference sheet',
      'Stands on a table on its own',
    ],
    searchAliases: [
      'abacus',
      'counting frame',
      'bead frame',
      'math frame',
      'number cards',
      'addition',
      'অ্যাবাকাস',
      'গোনার ফ্রেম',
      'যোগ বিয়োগ',
    ],
    seo: {
      metaTitle: '10-Row Wooden Abacus & Math Learning Frame',
      metaDescription:
        'A standing ten-row wooden bead frame with a slotted rail for number cards, so a sum can be set out and counted.',
    },
    images: [
      {
        file: 'image-01.jpg',
        alt: 'Standing wooden bead frame with ten coloured rows, showing the cards 4 + 8 = in the top rail and number cards laid out below',
        caption: 'Setting out a sum',
      },
      {
        file: 'image-05.jpg',
        alt: 'The bead frame beside its number card sheet and printed reference sheet, on a white background',
        caption: 'What is in the set',
      },
      {
        file: 'image-02.jpg',
        alt: 'A hand sliding beads along the top row of the wooden frame',
        caption: 'Sliding the beads',
      },
    ],
    video: {
      file: 'demo.mp4',
      alt: 'Short clip showing number cards being placed in the rail and beads slid along the rows',
    },
    evidence: [
      { field: 'materials', sourceType: 'marketplace-listing', sourceRef: 'Supplier listing states "Material: Wooden". Not independently confirmed.' },
      {
        field: 'manufacturer',
        sourceType: 'marketplace-listing',
        sourceRef: 'Supplier listing brand recorded as "None"; product code "Jsj—01". No manufacturer identified.',
      },
      {
        field: 'ageSafetyNote',
        sourceType: 'marketplace-listing',
        sourceRef:
          'Supplier listing states "Applicable Age: Children (4-6 Years Old)" and "Wooden Toys For Under 14 Years Old". Unverified, and not rendered.',
      },
    ],
    excluded: [
      { file: 'image-03.jpg', reason: 'Burned-in Chinese marketing overlay ("学习加减法") — supplier copy, not Renvura copy.' },
      { file: 'image-04.jpg', reason: 'Shows the counting-sticks bundle variant, not the "Ten-Level Calculation Rack Set (Including Number Cards + Formula Sheet)" selected on the reference page.' },
      { file: 'reference-page.png', reason: 'Internal sourcing reference only.' },
    ],
  },

  {
    folder: '06-digital-stick',
    slug: 'wooden-counting-sticks-and-number-cards-set',
    name: 'Wooden Counting Sticks & Number Cards Set',
    categorySlug: 'numbers-math',
    availability: 'coming-soon',
    shortDescription:
      'A divided wooden box of coloured counting sticks with wooden number and symbol blocks, for laying sums out on a table.',
    description:
      'A shallow wooden box divided into compartments: four colours of counting stick in the lower half, wooden number and symbol blocks in the upper.\n\nThe sticks are the counting part — three blue sticks and four green ones laid on the table are a sum you can see. The blocks are the writing part: digits 0 to 9 and the plus, minus, multiply, divide and equals signs, so the same sum can be set out in figures next to it.\n\nEverything returns to its own compartment, so the box is also where the set lives.',
    descriptionBn:
      'কাঠের একটি বাক্স ভাগ করা খোপে — নিচের অংশে চার রঙের গোনার কাঠি, উপরের অংশে সংখ্যা ও চিহ্নের কাঠের টুকরো।\n\nকাঠিগুলো দিয়ে গোনা হয় — টেবিলে তিনটি নীল আর চারটি সবুজ কাঠি রাখলে অঙ্কটা চোখে দেখা যায়। টুকরোগুলো দিয়ে সেই একই অঙ্ক সংখ্যায় সাজানো যায়: ০ থেকে ৯ এবং যোগ, বিয়োগ, গুণ, ভাগ ও সমান চিহ্ন।\n\nসব কিছু নিজের খোপে ফিরে যায়, তাই বাক্সটাই সেটের জায়গা।',
    features: [
      'Counting sticks in four colours',
      'Wooden blocks for the digits 0 to 9',
      'Plus, minus, multiply, divide and equals blocks',
      'Divided wooden box that holds the whole set',
    ],
    searchAliases: [
      'counting sticks',
      'number sticks',
      'math sticks',
      'number blocks',
      'counting rods',
      'গোনার কাঠি',
      'সংখ্যা শেখা',
      'গণিত',
    ],
    seo: {
      metaTitle: 'Wooden Counting Sticks & Number Cards Set',
      metaDescription:
        'Coloured wooden counting sticks with number and symbol blocks in a divided wooden box, for laying out simple sums.',
    },
    images: [
      {
        file: 'image-01.jpg',
        alt: 'Open wooden box of red, blue, green and yellow counting sticks with number and symbol blocks above, and sticks laid out on the table as a sum',
        caption: 'The complete set',
      },
      {
        file: 'image-05.jpg',
        alt: 'The divided wooden box seen from an angle, showing the stick compartments and the row of number blocks',
        caption: 'Inside the box',
      },
    ],
    video: {
      file: 'demo.mp4',
      alt: 'Short clip showing the counting sticks and number blocks being laid out',
    },
    evidence: [
      {
        field: 'manufacturer',
        sourceType: 'marketplace-listing',
        sourceRef:
          'Reference photographs show a retail box printed "Mathematical Intelligence Stick" with a patent number 201120250555.3. No manufacturer name is given and none is confirmed.',
      },
      { field: 'materials', sourceType: 'marketplace-listing', sourceRef: 'Supplier listing describes painted wooden sticks and blocks. Not independently confirmed.' },
      {
        field: 'ageSafetyNote',
        sourceType: 'marketplace-listing',
        sourceRef:
          'The retail box in the reference images reads "3+" and carries a choking-hazard warning. Thin loose sticks are visible in the product media. Unverified, and not rendered.',
      },
    ],
    excluded: [
      { file: 'image-02.jpg', reason: 'Burned-in Chinese marketing overlay including a "安全 水性漆" (safe water-based paint) claim — an unverified material and safety claim (D-12).' },
      { file: 'image-03.jpg', reason: 'Retail box carrying a legible "3+" age marking and a choking-hazard warning — unverified (D-12, D-16).' },
      { file: 'image-04.jpg', reason: 'Same packaging composition as image-03.jpg, with the same age marking and warning.' },
      { file: 'image-06.jpg', reason: 'Near-identical re-encode of image-01.jpg; a gallery repeating the same photograph reads as broken.' },
      { file: 'image-07.jpg', reason: 'Retail box carrying the same "3+" marking and choking-hazard warning as image-03.jpg.' },
      { file: 'reference-page.png', reason: 'Internal sourcing reference only.' },
    ],
  },
];

/**
 * The seed's pricing invariant, enforced rather than trusted.
 *
 * An `available` product must carry a founder-approved price; a `coming-soon`
 * product must carry none. Both halves matter: the first stops a sellable
 * product rendering "Price to be confirmed", and the second stops a sourcing
 * cost or a stale price surviving a product's move to Coming Soon and being
 * shown as a real one (D-12).
 *
 * Throws rather than returns, and runs in the seed before any write, so the
 * database can never hold the inconsistent combination in the first place.
 */
export function assertSeedPricingIntegrity(seeds: readonly ProductSeed[] = PRODUCT_SEEDS): void {
  for (const seed of seeds) {
    if (seed.availability === 'available' && seed.price === undefined) {
      throw new Error(`${seed.slug}: availability is "available" but no price is set.`);
    }
    if (seed.availability === 'coming-soon' && seed.price !== undefined) {
      throw new Error(
        `${seed.slug}: availability is "coming-soon" but a price is set. Coming Soon products carry no price.`,
      );
    }
  }
}

/** Files that must never become storefront media, whatever else changes. */
export const NEVER_STOREFRONT_MEDIA = ['reference-page.png'] as const;
