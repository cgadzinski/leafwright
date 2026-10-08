import type { Rng } from "./rng";

export type Persona = "shopper" | "merchant";

/**
 * What a conversation asks for. `supported` stays inside the assistant's job, `unsupported`
 * asks for something the assistant has no tool or permission for, and `off-topic` is not about
 * the store at all.
 */
export type Scope = "supported" | "unsupported" | "off-topic";

export interface Intent {
  /** Stable name so conversations can be grouped by what the person wanted. */
  name: string;
  scope: Scope;
  /** Ways a person opens with this ask; one is picked per conversation. */
  openers: readonly string[];
  /** Follow-ups that stay on the same ask. */
  followUps: readonly string[];
  /** Index of the panel's suggestion chip that asks the same thing, if any. */
  suggestion?: number;
}

export interface ConversationPlan {
  persona: Persona;
  intent: string;
  scope: Scope;
  /** The intent a later turn pivots to, when the conversation drifts into an unsupported ask. */
  pivot?: string;
  /** Suggestion chip clicked for the first turn instead of typing. */
  suggestion?: number;
  turns: string[];
  /** Scope of each turn; differs from `scope` only on the turn that pivots. */
  turnScopes: Scope[];
}

export const SHOPPER_INTENTS: readonly Intent[] = [
  {
    name: "low-light",
    scope: "supported",
    suggestion: 0,
    openers: [
      "Low-light plant for a bedroom",
      "my apartment barely gets any sun, what can survive?",
      "Need something for a north-facing window",
      "what plants are ok in an office with no windows",
    ],
    followUps: [
      "Which of those is the easiest?",
      "Anything that trails or hangs?",
      "Are any of them under $25?",
      "How often would I need to water that first one?",
    ],
  },
  {
    name: "pet-safe",
    scope: "supported",
    suggestion: 1,
    openers: [
      "Pet-safe under $30",
      "I have two cats who chew everything. what's safe?",
      "dog friendly plants for a sunny living room?",
      "Is there anything non-toxic that's also kind of big?",
    ],
    followUps: [
      "Are those definitely safe for cats?",
      "What about something taller?",
      "Can I see more options?",
      "Which one needs the least light?",
    ],
  },
  {
    name: "beginner-gift",
    scope: "supported",
    suggestion: 2,
    openers: [
      "Gift for a beginner",
      "Looking for a housewarming gift, my friend kills every plant",
      "what's a good first plant for my teenager's room",
      "birthday present for my mom, she likes succulents",
    ],
    followUps: [
      "Does that come with a pot?",
      "Something a bit more special, maybe around $60?",
      "Which one ships best?",
    ],
  },
  {
    name: "budget",
    scope: "supported",
    openers: [
      "What's the cheapest plant you have?",
      "anything under $15?",
      "I want to fill a shelf with small plants on a budget",
    ],
    followUps: ["Any of those pet-safe?", "What about planters to go with them?"],
  },
  {
    name: "care-question",
    scope: "supported",
    openers: [
      "How much light does a monstera need?",
      "Is the aloe vera hard to keep alive?",
      "how often do I water a snake plant",
      "Do your succulents need special soil?",
    ],
    followUps: ["What pot size would you recommend?", "Do you sell the soil for that?"],
  },
  {
    name: "rare-plants",
    scope: "supported",
    openers: [
      "Do you have anything rare or variegated?",
      "looking for a pink princess philodendron",
      "What's the most unusual plant in the catalog?",
    ],
    followUps: ["Is that one hard to care for?", "Which store sells it?"],
  },
  {
    name: "order-status",
    scope: "unsupported",
    openers: [
      "Where is my order?",
      "can you check on order LW-10482 for me",
      "My plant was supposed to arrive yesterday, what's going on",
      "Has my order shipped yet?",
    ],
    followUps: [
      "Can you just look it up by my email?",
      "Who do I talk to then?",
      "Is there a tracking number somewhere?",
    ],
  },
  {
    name: "returns-refunds",
    scope: "unsupported",
    openers: [
      "My fern arrived with brown leaves, I want a refund",
      "How do I return a planter?",
      "can you cancel my last order",
      "The pot came cracked. Can you send a replacement?",
    ],
    followUps: ["Can you start the return for me?", "How long do refunds take?"],
  },
  {
    name: "delivery-scheduling",
    scope: "unsupported",
    openers: [
      "Can I pick a delivery date? I'm away next week",
      "Will this arrive before Saturday if I order now?",
      "can you hold my order until the weather warms up",
    ],
    followUps: ["What if I pay for express?", "Can you add a note for the courier?"],
  },
  {
    name: "subscription",
    scope: "unsupported",
    openers: [
      "Do you have a plant of the month subscription?",
      "can I get fertilizer sent automatically every 2 months",
      "Is there a membership with discounts?",
    ],
    followUps: ["Can you set that up for me anyway?", "Any plans to add that?"],
  },
  {
    name: "plant-diagnosis",
    scope: "unsupported",
    openers: [
      "If I upload a photo can you tell me what's wrong with my plant?",
      "my pothos has yellow leaves with brown spots, can I send you a picture",
      "What plant is this? I can share a photo",
    ],
    followUps: ["Where do I attach the photo?", "Ok, it's droopy and the soil is wet. Help?"],
  },
  {
    name: "cart-actions",
    scope: "unsupported",
    openers: [
      "Add the snake plant to my cart",
      "can you put two of those in my basket and check out",
      "Apply my promo code for me",
    ],
    followUps: ["Why can't you just add it?", "Ok how do I do it myself?"],
  },
  {
    name: "price-match",
    scope: "unsupported",
    openers: [
      "I saw this monstera cheaper at another shop, will you match it?",
      "Can I get a discount if I buy 10 plants?",
      "Do you have any coupon codes right now?",
    ],
    followUps: ["What about for a first order?", "Can you ask the store for me?"],
  },
  {
    name: "restock-alert",
    scope: "unsupported",
    openers: [
      "Can you tell me when the string of pearls is back in stock?",
      "Email me if the variegated monstera drops in price",
    ],
    followUps: ["Is there a waitlist I can join?"],
  },
  {
    name: "store-pickup",
    scope: "unsupported",
    openers: [
      "Can I pick up my order at the nursery instead of shipping?",
      "Do you ship to Canada?",
      "What are Fernhollow's opening hours?",
    ],
    followUps: ["Is there a phone number for the store?"],
  },
  {
    name: "chit-chat",
    scope: "off-topic",
    openers: [
      "hi",
      "are you a real person?",
      "What's the weather going to be like this weekend?",
      "tell me a plant joke",
      "Can you help me write a poem for my garden club?",
    ],
    followUps: ["ok, then what can you do?", "Fine, recommend me something green"],
  },
];

export const MERCHANT_INTENTS: readonly Intent[] = [
  {
    name: "sales-dip",
    scope: "supported",
    suggestion: 0,
    openers: [
      "Why were sales down last week?",
      "revenue looks lower than usual, what happened",
      "Was last month better or worse than the one before?",
    ],
    followUps: [
      "Which products dropped the most?",
      "What about the last 7 days only?",
      "What should I do about it this week?",
    ],
  },
  {
    name: "restock",
    scope: "supported",
    suggestion: 1,
    openers: [
      "What should I restock?",
      "which products are about to run out",
      "What's selling fastest right now?",
    ],
    followUps: ["How many units should I order?", "What about planters specifically?"],
  },
  {
    name: "fulfillment-speed",
    scope: "supported",
    suggestion: 2,
    openers: [
      "How fast am I shipping?",
      "are orders going out on time",
      "What's my average time from order to shipped?",
    ],
    followUps: ["Is that good compared to before?", "How do I get that number down?"],
  },
  {
    name: "top-products",
    scope: "supported",
    openers: [
      "What are my top 5 products over the last 90 days?",
      "Which plants bring in the most revenue?",
    ],
    followUps: ["Should I raise the price on any of them?"],
  },
  {
    name: "create-promo",
    scope: "unsupported",
    openers: [
      "Create a 15% off promo for succulents this weekend",
      "can you set up a free shipping code for orders over $50",
      "Turn off the SPRING promo",
    ],
    followUps: ["Can you do it if I give you the code name?", "Where do I do that then?"],
  },
  {
    name: "change-prices",
    scope: "unsupported",
    openers: [
      "Raise the price of all my tropicals by 10%",
      "mark the bench pruner set as out of stock",
      "Update the description on my best seller",
    ],
    followUps: ["Can you at least draft the new prices?", "Is there a bulk edit somewhere?"],
  },
  {
    name: "refund-order",
    scope: "unsupported",
    openers: [
      "Refund order LW-10391, the plant died in transit",
      "Cancel the last order from June Okafor",
      "A customer wants a partial refund, can you do that?",
    ],
    followUps: ["Who can process refunds then?"],
  },
  {
    name: "email-customers",
    scope: "unsupported",
    openers: [
      "Email everyone who bought a monstera about our new soil mix",
      "can you message customers whose orders are late",
      "Send a thank-you note to my top 10 customers",
    ],
    followUps: ["Can you at least give me their emails?", "Could you draft the email for me?"],
  },
  {
    name: "forecast",
    scope: "unsupported",
    openers: [
      "Forecast my revenue for next month",
      "How much should I expect to sell over the holidays?",
      "predict which plants will sell out in spring",
    ],
    followUps: ["Even a rough guess is fine", "What would you need to forecast it?"],
  },
  {
    name: "customer-insights",
    scope: "unsupported",
    openers: [
      "How many of my customers are repeat buyers?",
      "Where are most of my customers located?",
      "Which customers haven't ordered in 3 months?",
    ],
    followUps: ["Can you break that down by state?"],
  },
  {
    name: "benchmark",
    scope: "unsupported",
    openers: [
      "How am I doing compared to the other nurseries on Leafwright?",
      "What are other stores charging for monsteras?",
    ],
    followUps: ["Just a ballpark average is fine"],
  },
  {
    name: "integrations",
    scope: "unsupported",
    openers: [
      "Export this month's sales to QuickBooks",
      "can you sync my inventory with my Shopify store",
      "Post my new arrivals to Instagram",
    ],
    followUps: ["Is there an API I can use instead?"],
  },
  {
    name: "chit-chat",
    scope: "off-topic",
    openers: [
      "hello?",
      "Write me a caption for a photo of our greenhouse",
      "what's a good name for a fern?",
    ],
    followUps: ["ok, what can you actually help with?"],
  },
];

/** Follow-ups that fit after any reply. */
const GENERIC_FOLLOW_UPS: Record<Persona, readonly string[]> = {
  shopper: [
    "thanks!",
    "Can you explain that more simply?",
    "hmm, anything else?",
    "That's not really what I asked",
  ],
  merchant: [
    "thanks",
    "Can you put that in a short list?",
    "That doesn't look right to me",
    "And what should I do first?",
  ],
};

const SCOPE_WEIGHTS = [
  { value: "supported" as const, weight: 50 },
  { value: "unsupported" as const, weight: 40 },
  { value: "off-topic" as const, weight: 10 },
];

const TURN_WEIGHTS = [
  { value: 1, weight: 35 },
  { value: 2, weight: 35 },
  { value: 3, weight: 20 },
  { value: 4, weight: 10 },
];

/** Share of multi-turn supported conversations whose later turn asks for something unsupported. */
export const PIVOT_SHARE = 0.3;
/** Share of first turns that use the matching suggestion chip when the intent has one. */
const SUGGESTION_SHARE = 0.5;

export function intentsFor(persona: Persona): readonly Intent[] {
  return persona === "shopper" ? SHOPPER_INTENTS : MERCHANT_INTENTS;
}

/** Picks what a conversation is about and the messages the person sends, in order. */
export function planConversation(rng: Rng, persona: Persona): ConversationPlan {
  const intents = intentsFor(persona);
  const scope = rng.weighted(SCOPE_WEIGHTS).value;
  const intent = rng.pick(intents.filter((candidate) => candidate.scope === scope));
  const turnCount = rng.weighted(TURN_WEIGHTS).value;

  const suggestion =
    intent.suggestion !== undefined && rng.chance(SUGGESTION_SHARE) ? intent.suggestion : undefined;
  // An intent's first opener is the text of its suggestion chip.
  const turns = [suggestion !== undefined ? intent.openers[0] : rng.pick(intent.openers)];
  const turnScopes: Scope[] = [scope];

  const pivotIntent =
    scope === "supported" && turnCount > 1 && rng.chance(PIVOT_SHARE)
      ? rng.pick(intents.filter((candidate) => candidate.scope === "unsupported"))
      : undefined;
  const pivotAt = pivotIntent ? rng.int(1, turnCount - 1) : -1;

  const followUps = rng.shuffle(intent.followUps);
  for (let i = 1; i < turnCount; i += 1) {
    if (i === pivotAt && pivotIntent) {
      turns.push(rng.pick(pivotIntent.openers));
      turnScopes.push("unsupported");
      continue;
    }
    turnScopes.push(scope);
    const next = followUps.length > 0 && rng.chance(0.8) ? followUps.shift() : undefined;
    turns.push(next ?? rng.pick(GENERIC_FOLLOW_UPS[persona]));
  }

  return {
    persona,
    intent: intent.name,
    scope,
    pivot: pivotIntent?.name,
    suggestion,
    turns,
    turnScopes,
  };
}

export function describeConversation(plan: ConversationPlan): string {
  const pivot = plan.pivot ? ` → ${plan.pivot}` : "";
  return `${plan.scope} ${plan.intent}${pivot}, ${plan.turns.length} turn${plan.turns.length === 1 ? "" : "s"}`;
}
