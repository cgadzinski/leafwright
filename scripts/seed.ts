/**
 * Generates the committed seed data in `seed/*.json`.
 *
 * Run once with `pnpm seed`. The faker seed and reference date are fixed so the output is
 * stable; ids in the JSON are referenced by tests and the traffic bot, so do not regenerate
 * casually.
 */
import { faker } from "@faker-js/faker";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { hashPassword } from "../lib/auth/password";
import { priceCart } from "../lib/commerce/cart";
import { formatOrderNumber } from "../lib/commerce/order-number";
import {
  CATEGORIES,
  COLLECTIONS,
  type Address,
  type Care,
  type Category,
  type ChatMessage,
  type Conversation,
  type Order,
  type OrderLine,
  type OrderStatus,
  type Product,
  type ProductVariant,
  type Promo,
  type Rating,
  type Store,
  type User,
} from "../lib/db/schema";

faker.seed(20261001);

const NOW = new Date("2026-10-01T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;
const DEMO_PASSWORD = "leafwright-demo";
const OUT_DIR = path.resolve(import.meta.dirname, "../seed");

const iso = (date: Date) => date.toISOString();
const daysAgo = (days: number) => new Date(NOW.getTime() - days * DAY);
const pad = (n: number, width = 4) => String(n).padStart(width, "0");
const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/['’"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function between(from: Date, to: Date): Date {
  if (to.getTime() <= from.getTime()) return new Date(from.getTime() + 60_000);
  return faker.date.between({ from, to });
}

// Stores

const storeSeeds: Array<Omit<Store, "id" | "createdAt" | "description">> = [
  {
    slug: "fernhollow-nursery",
    name: "Fernhollow Nursery",
    plan: "pro",
    region: "Portland, OR",
    payoutAccountLast4: "4821",
  },
  {
    slug: "dry-creek-succulents",
    name: "Dry Creek Succulents",
    plan: "growth",
    region: "Tucson, AZ",
    payoutAccountLast4: "9037",
  },
  {
    slug: "kiln-and-vine",
    name: "Kiln & Vine",
    plan: "growth",
    region: "Asheville, NC",
    payoutAccountLast4: "2264",
  },
  {
    slug: "moss-lane",
    name: "Moss Lane",
    plan: "starter",
    region: "Burlington, VT",
    trialEndsAt: iso(new Date(NOW.getTime() + 11 * DAY)),
  },
];

const storeDescriptions: Record<string, string> = {
  "fernhollow-nursery":
    "A family-run greenhouse in the Willamette Valley growing tropicals and rare aroids since 1998.",
  "dry-creek-succulents":
    "Desert-grown succulents and cacti, shipped bare-root from the Sonoran foothills.",
  "kiln-and-vine":
    "Small-batch ceramic planters thrown in the Blue Ridge, paired with hardy houseplants.",
  "moss-lane": "A new corner nursery in Vermont focused on beginner-friendly plants and care kits.",
};

const stores: Store[] = storeSeeds.map((seed, index) => ({
  id: `store_${seed.slug.split("-")[0]}`,
  ...seed,
  description: storeDescriptions[seed.slug],
  createdAt: iso(seed.plan === "starter" ? daysAgo(3) : daysAgo(400 + index * 90)),
}));

// Products

const PRODUCT_NAMES: Record<Category, string[]> = {
  tropicals: [
    "Monstera Deliciosa",
    "Fiddle Leaf Fig",
    "Bird of Paradise",
    "Golden Pothos",
    "Philodendron Brasil",
    "Rubber Plant Burgundy",
    "Calathea Orbifolia",
    "Peace Lily",
    "Alocasia Polly",
    "Heartleaf Philodendron",
    "Snake Plant Laurentii",
    "ZZ Plant",
  ],
  succulents: [
    "Echeveria Perle von Nurnberg",
    "Jade Plant",
    "Aloe Vera",
    "Burro's Tail",
    "Haworthia Zebra",
    "String of Pearls",
    "Panda Plant",
    "Golden Barrel Cactus",
    "Bunny Ear Cactus",
    "Ghost Plant",
    "Lithops Trio",
    "Hen and Chicks",
  ],
  planters: [
    "Classic Terracotta Pot",
    "Glazed Stoneware Planter",
    "Speckled Ceramic Pot",
    "Matte Black Cylinder",
    "Hanging Macrame Planter",
    "Self-Watering Planter",
    "Fluted Clay Pot",
    "Concrete Minimalist Planter",
    "Woven Seagrass Basket",
    "Footed Ceramic Bowl",
    "Terracotta Saucer Set",
    "Tall Ribbed Planter",
  ],
  tools: [
    "Pruning Snips",
    "Soil Moisture Meter",
    "Brass Plant Mister",
    "Long-Spout Watering Can",
    "Indoor Potting Mix",
    "Horticultural Perlite",
    "Bamboo Stake Set",
    "Leaf Shine Cloths",
    "Pebble Humidity Tray",
    "Neem Oil Concentrate",
    "Hand Trowel",
    "Full-Spectrum Grow Bulb",
  ],
  rare: [
    "Variegated Monstera Albo",
    "Philodendron Pink Princess",
    "Anthurium Clarinervium",
    "Monstera Thai Constellation",
    "Alocasia Dragon Scale",
    "Hoya Kerrii Variegata",
    "Philodendron Gloriosum",
    "Begonia Maculata",
    "Syngonium Albo",
    "Scindapsus Treubii Moonlight",
    "Calathea White Fusion",
    "Variegated String of Hearts",
  ],
};

const PRICE_RANGES: Record<Category, [number, number]> = {
  tropicals: [1800, 6500],
  succulents: [900, 3200],
  planters: [1400, 8900],
  tools: [800, 4500],
  rare: [4500, 24900],
};

const DESCRIPTIONS: Record<Category, string[]> = {
  tropicals: [
    "Lush, fast-growing foliage that fills a bright corner in a season.",
    "A forgiving tropical that tolerates the occasional missed watering.",
    "Glossy leaves and an upright habit that suits shelves and plant stands.",
  ],
  succulents: [
    "Grown slow and hard in desert sun, so it arrives compact and colorful.",
    "Store-and-forget watering: let the soil dry completely between drinks.",
    "A tidy rosette that stays small on a windowsill for years.",
  ],
  planters: [
    "Wheel-thrown and glazed by hand; every piece is slightly different.",
    "Drainage hole and matching saucer included.",
    "Fired stoneware that won't wick moisture away from roots.",
  ],
  tools: [
    "The one tool we reach for every week in the greenhouse.",
    "Simple, durable, and sized for houseplants rather than the garden.",
    "Makes routine care faster so it actually happens.",
  ],
  rare: [
    "Propagated in-house from our own mother plants, never tissue culture.",
    "Collector-grade variegation, photographed before shipping.",
    "Ships potted and acclimated with a care card for the first month.",
  ],
};

function careFor(category: Category): Care {
  if (category === "planters" || category === "tools") {
    return { light: "medium", water: "low", petSafe: true, difficulty: "easy" };
  }
  const light = faker.helpers.weightedArrayElement<Care["light"]>([
    { weight: category === "succulents" ? 1 : 3, value: "low" },
    { weight: 4, value: "medium" },
    { weight: category === "succulents" ? 5 : 2, value: "bright" },
  ]);
  const water =
    category === "succulents"
      ? "low"
      : faker.helpers.arrayElement<Care["water"]>(["low", "medium", "medium", "high"]);
  const difficulty =
    category === "rare"
      ? faker.helpers.arrayElement<Care["difficulty"]>(["moderate", "expert", "expert"])
      : faker.helpers.arrayElement<Care["difficulty"]>(["easy", "easy", "moderate"]);
  return { light, water, petSafe: faker.datatype.boolean({ probability: 0.4 }), difficulty };
}

function variantsFor(category: Category, productIndex: number): ProductVariant[] {
  const id = (label: string) => `var_${pad(productIndex)}_${slugify(label)}`;
  switch (category) {
    case "tropicals":
    case "rare":
      return [
        {
          id: id("4in"),
          label: '4" pot',
          priceDelta: 0,
          inventory: faker.number.int({ min: 2, max: 20 }),
        },
        {
          id: id("6in"),
          label: '6" pot',
          priceDelta: 1200,
          inventory: faker.number.int({ min: 1, max: 12 }),
        },
        {
          id: id("8in"),
          label: '8" pot',
          priceDelta: 2800,
          inventory: faker.number.int({ min: 0, max: 6 }),
        },
      ];
    case "succulents":
      return [
        {
          id: id("2in"),
          label: '2" pot',
          priceDelta: 0,
          inventory: faker.number.int({ min: 5, max: 40 }),
        },
        {
          id: id("4in"),
          label: '4" pot',
          priceDelta: 600,
          inventory: faker.number.int({ min: 2, max: 20 }),
        },
      ];
    case "planters":
      return [
        {
          id: id("small"),
          label: "Small",
          priceDelta: 0,
          inventory: faker.number.int({ min: 3, max: 25 }),
        },
        {
          id: id("medium"),
          label: "Medium",
          priceDelta: 900,
          inventory: faker.number.int({ min: 3, max: 20 }),
        },
        {
          id: id("large"),
          label: "Large",
          priceDelta: 2200,
          inventory: faker.number.int({ min: 1, max: 10 }),
        },
      ];
    case "tools":
      return [];
  }
}

const products: Product[] = [];
let productIndex = 0;
stores.forEach((store, storeIndex) => {
  // Per store: 12 published, 2 drafts, 1 archived, spread across the categories.
  const statuses: Product["status"][] = faker.helpers.shuffle([
    ...Array<Product["status"]>(12).fill("published"),
    "draft",
    "draft",
    "archived",
  ]);
  let slot = 0;
  for (const category of CATEGORIES) {
    const names = PRODUCT_NAMES[category].slice(storeIndex * 3, storeIndex * 3 + 3);
    for (const name of names) {
      productIndex += 1;
      const status = statuses[slot++];
      const [min, max] = PRICE_RANGES[category];
      const price = Math.round(faker.number.int({ min, max }) / 100) * 100 - 1;
      const createdAt = between(new Date(store.createdAt), daysAgo(20));
      const variants = variantsFor(category, productIndex);
      const inventory = variants.length
        ? variants.reduce((sum, variant) => sum + variant.inventory, 0)
        : faker.number.int({ min: 0, max: 60 });
      products.push({
        id: `prod_${pad(productIndex)}`,
        storeId: store.id,
        slug: slugify(name),
        name,
        description: `${faker.helpers.arrayElement(DESCRIPTIONS[category])} ${faker.helpers.arrayElement(DESCRIPTIONS[category])}`,
        category,
        price,
        compareAtPrice: faker.datatype.boolean({ probability: 0.25 }) ? price + 500 : undefined,
        status,
        inventory,
        images: [`/products/${category}.svg`],
        variants,
        care: careFor(category),
        source: "seed",
        createdAt: iso(createdAt),
        publishedAt:
          status === "published"
            ? iso(between(createdAt, new Date(createdAt.getTime() + 5 * DAY)))
            : undefined,
      });
    }
  }
});

// Users

const users: User[] = [];
const addresses: Address[] = [];
let userIndex = 0;
let addressIndex = 0;
const usedEmails = new Set<string>();

function uniqueEmail(first: string, last: string, domain: string): string {
  let base = `${slugify(first)}.${slugify(last)}`;
  let email = `${base}@${domain}`;
  let n = 1;
  while (usedEmails.has(email)) {
    n += 1;
    base = `${slugify(first)}.${slugify(last)}${n}`;
    email = `${base}@${domain}`;
  }
  usedEmails.add(email);
  return email;
}

function makeUser(role: User["role"], storeId?: string, domain = "example.com"): User {
  userIndex += 1;
  const first = faker.person.firstName();
  const last = faker.person.lastName();
  const createdAt = between(daysAgo(730), daysAgo(30));
  return {
    id: `user_${pad(userIndex)}`,
    email: uniqueEmail(first, last, domain),
    name: `${first} ${last}`,
    role,
    storeId,
    passwordHash: hashPassword(DEMO_PASSWORD, faker.string.hexadecimal({ length: 32, prefix: "" })),
    phone: faker.datatype.boolean({ probability: 0.6 })
      ? faker.phone.number({ style: "national" })
      : undefined,
    followedStoreIds: [],
    createdAt: iso(createdAt),
    lastSignInAt: iso(between(daysAgo(30), NOW)),
  };
}

for (const store of stores) {
  const domain = `${store.slug}.example.com`;
  users.push(makeUser("owner", store.id, domain));
  users.push(makeUser("staff", store.id, domain));
  users.push(makeUser("staff", store.id, domain));
}

const shoppers: User[] = [];
for (let i = 0; i < 40; i += 1) {
  const shopper = makeUser("shopper");
  shopper.followedStoreIds = faker.helpers.arrayElements(
    stores.map((store) => store.id),
    faker.number.int({ min: 0, max: 2 }),
  );
  shoppers.push(shopper);
  users.push(shopper);

  const addressCount = faker.helpers.weightedArrayElement([
    { weight: 1, value: 0 },
    { weight: 5, value: 1 },
    { weight: 3, value: 2 },
    { weight: 1, value: 3 },
  ]);
  for (let a = 0; a < addressCount; a += 1) {
    addressIndex += 1;
    addresses.push({
      id: `addr_${pad(addressIndex)}`,
      userId: shopper.id,
      label: a === 0 ? "Home" : faker.helpers.arrayElement(["Work", "Parents", "Studio"]),
      line1: faker.location.streetAddress(),
      line2: faker.datatype.boolean({ probability: 0.3 })
        ? faker.location.secondaryAddress()
        : undefined,
      city: faker.location.city(),
      region: faker.location.state({ abbreviated: true }),
      postalCode: faker.location.zipCode("#####"),
      country: "US",
      isDefault: a === 0,
    });
  }
}

// Promos

const promoSeeds: Array<Pick<Promo, "code" | "type" | "value"> & { active: boolean }> = [
  { code: "FERN15", type: "percent", value: 15, active: true },
  { code: "FERNSPRING", type: "fixed", value: 1000, active: false },
  { code: "DRYSHIP", type: "free_shipping", value: 0, active: true },
  { code: "DRY5", type: "fixed", value: 500, active: false },
  { code: "KILN20", type: "percent", value: 20, active: true },
  { code: "KILNFALL", type: "free_shipping", value: 0, active: false },
  { code: "MOSS10", type: "percent", value: 10, active: true },
  { code: "MOSSOPEN", type: "fixed", value: 800, active: false },
];

const promos: Promo[] = promoSeeds.map((seed, index) => {
  const store = stores[Math.floor(index / 2)];
  return {
    id: `promo_${pad(index + 1, 2)}`,
    storeId: store.id,
    code: seed.code,
    type: seed.type,
    value: seed.value,
    startsAt: iso(seed.active ? daysAgo(30) : daysAgo(150)),
    endsAt: iso(seed.active ? new Date(NOW.getTime() + 180 * DAY) : daysAgo(95)),
    isActive: seed.active,
    usageCount: 0,
  };
});

// Orders

const ORDER_SHARE: Record<string, number> = {
  store_fernhollow: 60,
  store_dry: 40,
  store_kiln: 40,
  store_moss: 20,
};

function weekdayWeightedDate(): Date {
  for (;;) {
    const candidate = between(daysAgo(90), daysAgo(0.25));
    const day = candidate.getUTCDay();
    const keep = day === 0 ? 0.45 : day === 6 ? 0.6 : 1;
    if (faker.number.float() <= keep) return candidate;
  }
}

function statusFor(placedAt: Date): OrderStatus {
  const ageDays = (NOW.getTime() - placedAt.getTime()) / DAY;
  if (ageDays > 21) {
    return faker.helpers.weightedArrayElement<OrderStatus>([
      { weight: 70, value: "delivered" },
      { weight: 22, value: "fulfilled" },
      { weight: 8, value: "refunded" },
    ]);
  }
  if (ageDays > 7) {
    return faker.helpers.weightedArrayElement<OrderStatus>([
      { weight: 55, value: "fulfilled" },
      { weight: 30, value: "delivered" },
      { weight: 10, value: "paid" },
      { weight: 5, value: "refunded" },
    ]);
  }
  return faker.helpers.weightedArrayElement<OrderStatus>([
    { weight: 40, value: "placed" },
    { weight: 35, value: "paid" },
    { weight: 25, value: "fulfilled" },
  ]);
}

const merchantByStore = new Map(
  stores.map((store) => [
    store.id,
    users.find((u) => u.storeId === store.id && u.role === "owner")!,
  ]),
);

const orderDrafts: Array<{ storeId: string; placedAt: Date }> = [];
for (const store of stores) {
  for (let i = 0; i < ORDER_SHARE[store.id]; i += 1) {
    orderDrafts.push({ storeId: store.id, placedAt: weekdayWeightedDate() });
  }
}
orderDrafts.sort((a, b) => a.placedAt.getTime() - b.placedAt.getTime());

const orders: Order[] = orderDrafts.map((draft, index) => {
  const storeProducts = products.filter(
    (product) => product.storeId === draft.storeId && product.status === "published",
  );
  const picked = faker.helpers.arrayElements(storeProducts, faker.number.int({ min: 1, max: 4 }));
  const cartLines = picked.map((product) => ({
    productId: product.id,
    variantId: product.variants.length
      ? faker.helpers.arrayElement(product.variants).id
      : undefined,
    quantity: faker.helpers.weightedArrayElement([
      { weight: 7, value: 1 },
      { weight: 2, value: 2 },
      { weight: 1, value: 3 },
    ]),
  }));

  const isGuest = faker.datatype.boolean({ probability: 0.15 });
  const shopper = isGuest ? undefined : faker.helpers.arrayElement(shoppers);
  const shopperAddresses = shopper ? addresses.filter((a) => a.userId === shopper.id) : [];
  const shippingMethod = faker.helpers.weightedArrayElement<Order["shippingMethod"]>([
    { weight: 8, value: "standard" },
    { weight: 2, value: "express" },
  ]);

  const activePromo = promos.find((promo) => promo.storeId === draft.storeId && promo.isActive);
  const usePromo = Boolean(activePromo) && faker.datatype.boolean({ probability: 0.18 });
  const totals = priceCart({
    lines: cartLines,
    products: storeProducts,
    promo: usePromo ? activePromo : undefined,
    shippingMethod,
    now: NOW,
  });
  const group = totals.groups[0];
  if (usePromo && activePromo) activePromo.usageCount += 1;

  const lines: OrderLine[] = group.lines.map((priced) => ({
    productId: priced.product.id,
    slug: priced.product.slug,
    name: priced.product.name,
    variantId: priced.variant?.id,
    variantLabel: priced.variant?.label,
    unitPrice: priced.unitPrice,
    quantity: priced.line.quantity,
    image: priced.product.images[0],
  }));

  const status = statusFor(draft.placedAt);
  const shipped = status === "fulfilled" || status === "delivered";
  const fulfilledAt = shipped
    ? between(draft.placedAt, new Date(Math.min(draft.placedAt.getTime() + 3 * DAY, NOW.getTime())))
    : undefined;
  const addressSource = shopperAddresses.find((a) => a.isDefault) ?? shopperAddresses[0];
  const customerName = shopper?.name ?? faker.person.fullName();

  const notes: Order["notes"] = [];
  if (faker.datatype.boolean({ probability: 0.2 })) {
    notes.push({
      id: `note_${pad(index + 1)}`,
      authorId: merchantByStore.get(draft.storeId)!.id,
      body: faker.helpers.arrayElement([
        "Customer asked for extra padding around the pot.",
        "Gift order; no invoice in the box.",
        "Held one day for a cold snap on the route.",
        "Swapped to a healthier specimen before packing.",
        "Customer confirmed the apartment number by email.",
      ]),
      createdAt: iso(between(draft.placedAt, fulfilledAt ?? NOW)),
    });
  }

  return {
    id: `order_${pad(index + 1)}`,
    number: formatOrderNumber(10001 + index),
    storeId: draft.storeId,
    customerId: shopper?.id,
    guestEmail: shopper
      ? undefined
      : faker.internet.email({ provider: "example.com" }).toLowerCase(),
    lines,
    subtotal: group.subtotal,
    discount: group.discount,
    shipping: group.shipping,
    tax: group.tax,
    total: group.total,
    status,
    shippingAddress: {
      name: customerName,
      phone: shopper?.phone,
      line1: addressSource?.line1 ?? faker.location.streetAddress(),
      line2: addressSource?.line2,
      city: addressSource?.city ?? faker.location.city(),
      region: addressSource?.region ?? faker.location.state({ abbreviated: true }),
      postalCode: addressSource?.postalCode ?? faker.location.zipCode("#####"),
      country: "US",
    },
    shippingMethod,
    promoCode: usePromo ? activePromo?.code : undefined,
    trackingNumber: shipped
      ? `1Z${faker.string.alphanumeric({ length: 16, casing: "upper" })}`
      : undefined,
    notes,
    source: "seed",
    placedAt: iso(draft.placedAt),
    fulfilledAt: fulfilledAt ? iso(fulfilledAt) : undefined,
  };
});

// Conversations

const SHOPPER_THREADS: Array<[string, string]> = [
  [
    "Low-light plant for a bedroom",
    "For a bedroom with little direct sun, a Snake Plant Laurentii or ZZ Plant will be happiest. Both tolerate low light and only need water every two to three weeks. If you want something leafier, the Heartleaf Philodendron handles shade well too.",
  ],
  [
    "Pet-safe under $30",
    "Pet-safe picks under $30 include the Haworthia Zebra and the Hen and Chicks from Dry Creek, and the Peperomia-style trailing options from Moss Lane. Avoid pothos and philodendron if your cat likes to chew.",
  ],
  [
    "Gift for a beginner",
    "A Golden Pothos in a Glazed Stoneware Planter is a classic beginner gift: forgiving, fast-growing, and good-looking. Add the Soil Moisture Meter so they know when to water.",
  ],
  [
    "Something dramatic for a bright living room",
    "A Bird of Paradise or Fiddle Leaf Fig fills a bright room quickly. Both want a few hours of direct sun and consistent watering once the top inch of soil dries.",
  ],
  [
    "Do succulents need special soil?",
    "Yes, a fast-draining mix. Blend our Indoor Potting Mix with Horticultural Perlite about two to one, and pick a pot with a drainage hole like the Classic Terracotta Pot.",
  ],
];

const MERCHANT_THREADS: Array<[string, string]> = [
  [
    "Why were sales down last week?",
    "Revenue dipped about 12% week over week. Order count held steady, but average order value fell because two of your higher-priced rare plants went out of stock mid-week. Restocking those should recover most of the gap.",
  ],
  [
    "What should I restock?",
    'Your three fastest sellers over the last 30 days are running low: Monstera Deliciosa (6" pot), Golden Pothos, and the Speckled Ceramic Pot in medium. Each has under five units left at the current sell-through rate.',
  ],
  [
    "How fast am I shipping?",
    "Median time from order to fulfillment is 1.4 days, down from 2.1 days last month. About 8% of orders took longer than three days, mostly weekend orders fulfilled on Monday.",
  ],
];

const conversations: Conversation[] = [];
for (let i = 0; i < 20; i += 1) {
  const persona: Conversation["persona"] = i < 14 ? "shopper" : "merchant";
  const [question, answer] = faker.helpers.arrayElement(
    persona === "shopper" ? SHOPPER_THREADS : MERCHANT_THREADS,
  );
  const createdAt = between(daysAgo(60), daysAgo(0.5));
  const user =
    persona === "merchant"
      ? faker.helpers.arrayElement(users.filter((u) => u.role !== "shopper"))
      : faker.datatype.boolean({ probability: 0.6 })
        ? faker.helpers.arrayElement(shoppers)
        : undefined;
  const messages: ChatMessage[] = [
    { id: `msg_${pad(i + 1)}_1`, role: "user", content: question, createdAt: iso(createdAt) },
    {
      id: `msg_${pad(i + 1)}_2`,
      role: "assistant",
      content: answer,
      createdAt: iso(new Date(createdAt.getTime() + 4000)),
    },
  ];
  const ratings: Rating[] = faker.datatype.boolean({ probability: 0.7 })
    ? [
        {
          messageId: messages[1].id,
          value: faker.helpers.weightedArrayElement([
            { weight: 4, value: "up" as const },
            { weight: 1, value: "down" as const },
          ]),
          createdAt: iso(new Date(createdAt.getTime() + 15000)),
        },
      ]
    : [];
  conversations.push({
    id: `conv_${pad(i + 1, 2)}`,
    persona,
    userId: user?.id,
    storeId: user?.storeId,
    messages,
    ratings,
    source: "seed",
    createdAt: iso(createdAt),
  });
}

// Write

const output = { stores, users, addresses, products, orders, promos, conversations } as const;

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, rows] of Object.entries(output)) {
  const collection = name as keyof typeof output;
  const schema = COLLECTIONS[collection];
  const parsed = rows.map((row) => schema.parse(row));
  writeFileSync(path.join(OUT_DIR, `${name}.json`), `${JSON.stringify(parsed, null, 2)}\n`);
  console.log(`${name}: ${parsed.length}`);
}
