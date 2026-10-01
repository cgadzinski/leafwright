import { z } from "zod";

// Shared enums

export const PlanSchema = z.enum(["starter", "growth", "pro"]);
export type Plan = z.infer<typeof PlanSchema>;

export const RoleSchema = z.enum(["shopper", "owner", "staff"]);
export type Role = z.infer<typeof RoleSchema>;

export const MerchantRoleSchema = z.enum(["owner", "staff"]);
export type MerchantRole = z.infer<typeof MerchantRoleSchema>;

export const CategorySchema = z.enum(["tropicals", "succulents", "planters", "tools", "rare"]);
export type Category = z.infer<typeof CategorySchema>;
export const CATEGORIES = CategorySchema.options;

export const ProductStatusSchema = z.enum(["draft", "published", "archived"]);
export type ProductStatus = z.infer<typeof ProductStatusSchema>;

export const OrderStatusSchema = z.enum(["placed", "paid", "fulfilled", "delivered", "refunded"]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const PromoTypeSchema = z.enum(["percent", "fixed", "free_shipping"]);
export type PromoType = z.infer<typeof PromoTypeSchema>;

export const ShippingMethodSchema = z.enum(["standard", "express"]);
export type ShippingMethod = z.infer<typeof ShippingMethodSchema>;

export const PersonaSchema = z.enum(["shopper", "merchant"]);
export type Persona = z.infer<typeof PersonaSchema>;

/** Where a record came from. Bot-created records are cleaned up on a schedule. */
export const RecordSourceSchema = z.enum(["seed", "app", "bot"]);
export type RecordSource = z.infer<typeof RecordSourceSchema>;

export const LightSchema = z.enum(["low", "medium", "bright"]);
export const WaterSchema = z.enum(["low", "medium", "high"]);
export const DifficultySchema = z.enum(["easy", "moderate", "expert"]);

// Primitives

const Id = z.string().min(1);
const Timestamp = z.iso.datetime();
/** Money is stored as integer cents. */
const Cents = z.number().int().nonnegative();

// Entities

export const StoreSchema = z.object({
  id: Id,
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  plan: PlanSchema,
  trialEndsAt: Timestamp.optional(),
  region: z.string().min(1),
  payoutAccountLast4: z.string().length(4).optional(),
  createdAt: Timestamp,
});
export type Store = z.infer<typeof StoreSchema>;

export const UserSchema = z.object({
  id: Id,
  email: z.email(),
  name: z.string().min(1),
  role: RoleSchema,
  storeId: Id.optional(),
  passwordHash: z.string().min(1),
  phone: z.string().optional(),
  followedStoreIds: z.array(Id),
  createdAt: Timestamp,
  lastSignInAt: Timestamp,
});
export type User = z.infer<typeof UserSchema>;

export const AddressSchema = z.object({
  id: Id,
  userId: Id,
  label: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  region: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().length(2),
  isDefault: z.boolean(),
});
export type Address = z.infer<typeof AddressSchema>;

/** A shipping address snapshot stored on an order. */
export const PostalAddressSchema = AddressSchema.omit({
  id: true,
  userId: true,
  label: true,
  isDefault: true,
}).extend({
  name: z.string().min(1),
  phone: z.string().optional(),
});
export type PostalAddress = z.infer<typeof PostalAddressSchema>;

export const ProductVariantSchema = z.object({
  id: Id,
  label: z.string().min(1),
  priceDelta: z.number().int(),
  inventory: z.number().int().nonnegative(),
});
export type ProductVariant = z.infer<typeof ProductVariantSchema>;

export const CareSchema = z.object({
  light: LightSchema,
  water: WaterSchema,
  petSafe: z.boolean(),
  difficulty: DifficultySchema,
});
export type Care = z.infer<typeof CareSchema>;

export const ProductSchema = z.object({
  id: Id,
  storeId: Id,
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  category: CategorySchema,
  price: Cents,
  compareAtPrice: Cents.optional(),
  status: ProductStatusSchema,
  inventory: z.number().int().nonnegative(),
  images: z.array(z.string().min(1)),
  variants: z.array(ProductVariantSchema),
  care: CareSchema,
  source: RecordSourceSchema.default("app"),
  createdAt: Timestamp,
  publishedAt: Timestamp.optional(),
});
export type Product = z.infer<typeof ProductSchema>;

export const CartLineSchema = z.object({
  productId: Id,
  variantId: Id.optional(),
  quantity: z.number().int().positive(),
});
export type CartLine = z.infer<typeof CartLineSchema>;

export const CartSchema = z.object({
  id: Id,
  userId: Id.optional(),
  lines: z.array(CartLineSchema),
  promoCode: z.string().optional(),
  updatedAt: Timestamp,
});
export type Cart = z.infer<typeof CartSchema>;

export const OrderLineSchema = z.object({
  productId: Id,
  slug: z.string().min(1),
  name: z.string().min(1),
  variantId: Id.optional(),
  variantLabel: z.string().optional(),
  unitPrice: Cents,
  quantity: z.number().int().positive(),
  image: z.string().optional(),
});
export type OrderLine = z.infer<typeof OrderLineSchema>;

export const OrderNoteSchema = z.object({
  id: Id,
  authorId: Id,
  body: z.string().min(1),
  createdAt: Timestamp,
});
export type OrderNote = z.infer<typeof OrderNoteSchema>;

export const OrderSchema = z.object({
  id: Id,
  number: z.string().regex(/^LW-\d{5,}$/),
  storeId: Id,
  customerId: Id.optional(),
  guestEmail: z.email().optional(),
  lines: z.array(OrderLineSchema).min(1),
  subtotal: Cents,
  discount: Cents,
  shipping: Cents,
  tax: Cents,
  total: Cents,
  status: OrderStatusSchema,
  shippingAddress: PostalAddressSchema,
  shippingMethod: ShippingMethodSchema,
  promoCode: z.string().optional(),
  trackingNumber: z.string().optional(),
  notes: z.array(OrderNoteSchema),
  source: RecordSourceSchema.default("app"),
  placedAt: Timestamp,
  fulfilledAt: Timestamp.optional(),
});
export type Order = z.infer<typeof OrderSchema>;

export const PromoSchema = z.object({
  id: Id,
  storeId: Id,
  code: z.string().min(1).toUpperCase(),
  type: PromoTypeSchema,
  /** Percent off (0–100) for `percent`, cents for `fixed`, ignored for `free_shipping`. */
  value: z.number().int().nonnegative(),
  startsAt: Timestamp,
  endsAt: Timestamp,
  isActive: z.boolean(),
  usageCount: z.number().int().nonnegative(),
});
export type Promo = z.infer<typeof PromoSchema>;

export const ChatRoleSchema = z.enum(["user", "assistant"]);
export type ChatRole = z.infer<typeof ChatRoleSchema>;

export const ChatMessageSchema = z.object({
  id: Id,
  role: ChatRoleSchema,
  content: z.string(),
  createdAt: Timestamp,
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const RatingSchema = z.object({
  messageId: Id,
  value: z.enum(["up", "down"]),
  createdAt: Timestamp,
});
export type Rating = z.infer<typeof RatingSchema>;

export const ConversationSchema = z.object({
  id: Id,
  persona: PersonaSchema,
  userId: Id.optional(),
  storeId: Id.optional(),
  messages: z.array(ChatMessageSchema),
  ratings: z.array(RatingSchema),
  source: RecordSourceSchema.default("app"),
  createdAt: Timestamp,
});
export type Conversation = z.infer<typeof ConversationSchema>;

export const InviteSchema = z.object({
  id: Id,
  storeId: Id,
  email: z.email(),
  role: MerchantRoleSchema,
  sentAt: Timestamp,
});
export type Invite = z.infer<typeof InviteSchema>;

// Collections

export const COLLECTIONS = {
  stores: StoreSchema,
  users: UserSchema,
  addresses: AddressSchema,
  products: ProductSchema,
  carts: CartSchema,
  orders: OrderSchema,
  promos: PromoSchema,
  conversations: ConversationSchema,
  invites: InviteSchema,
} as const;

export type Collection = keyof typeof COLLECTIONS;
export type Record<C extends Collection> = z.infer<(typeof COLLECTIONS)[C]>;
