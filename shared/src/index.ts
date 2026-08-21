/**
 * API contract shared between backend and frontend.
 *
 * Each Zod schema is the single source of truth: it validates at runtime and
 * produces the static type via `z.infer`. No framework code (Express, Mongoose,
 * React) belongs here.
 *
 * @packageDocumentation
 */
import { z } from 'zod';

/**
 * White-label sub-object embedded in a {@link businessSchema}. Only the brand
 * colour and image URLs are per tenant; the neutral theme layers live in the
 * frontend CSS, not the database.
 */
export const brandingSchema = z.object({
  logoUrl: z.url().optional(),
  faviconUrl: z.url().optional(),
  accentColor: z
    .string()
    .regex(
      /^#[0-9a-fA-F]{6}$/,
      'accentColor must be a 6-digit hex like #1a2b3c',
    ),
});
export type Branding = z.infer<typeof brandingSchema>;

/** The tenant, in the shape the API returns. */
export const businessSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  slug: z.string().min(1),
  branding: brandingSchema,
});
export type Business = z.infer<typeof businessSchema>;

/** Roles a user can hold inside their business. */
export const userRoles = ['admin', 'employee'] as const;
export const userRoleSchema = z.enum(userRoles);
export type UserRole = z.infer<typeof userRoleSchema>;

/**
 * A user, in the shape the API returns. Never carries `passwordHash`: the
 * contract describes what the frontend may see, not what the database stores.
 */
export const userSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  email: z.email(),
  name: z.string().min(1),
  role: userRoleSchema,
});
export type User = z.infer<typeof userSchema>;

/**
 * Login request body, validated at the API boundary and reused by the frontend
 * form. `password` only has to be non-empty: strength rules belong to
 * registration, which Ordo does not expose.
 */
export const loginSchema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
});
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * A successful login: the token plus the resolved tenant context, so the
 * frontend can theme the shell without a second request.
 */
export const loginResponseSchema = z.object({
  token: z.string(),
  user: userSchema,
  business: businessSchema,
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

/**
 * Derived from `stock` against `minStock` (the reorder point), never stored.
 * Declaring the buckets here keeps the API, the UI badges and the filters
 * agreeing on one threshold.
 */
export const stockStatuses = ['in', 'low', 'out'] as const;
export const stockStatusSchema = z.enum(stockStatuses);
export type StockStatus = z.infer<typeof stockStatusSchema>;

/**
 * A product, in the shape the API returns. `businessId` identifies the tenant and
 * `sku` the product within it. Quantities allow decimals, for goods sold by weight.
 */
export const productSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  name: z.string().min(1),
  sku: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  supplier: z.string().optional(),
  unit: z.string().min(1),
  stock: z.number().nonnegative(),
  minStock: z.number().nonnegative(),
  costPrice: z.number().nonnegative(),
  salePrice: z.number().nonnegative(),
  stockStatus: stockStatusSchema,
});
export type Product = z.infer<typeof productSchema>;

/**
 * Creation input. The client never sets `id`, `businessId` (taken from the
 * session) or the derived `stockStatus`.
 */
export const createProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  unit: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  supplier: z.string().optional(),
  stock: z.number().nonnegative().default(0),
  minStock: z.number().nonnegative().default(0),
  costPrice: z.number().nonnegative().default(0),
  salePrice: z.number().nonnegative().default(0),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

/**
 * The input side of {@link createProductSchema}, where defaulted fields are
 * optional. React Hook Form needs it for its input generic; the resolver still
 * outputs {@link CreateProductInput}.
 */
export type CreateProductFormInput = z.input<typeof createProductSchema>;

/** Update input: any subset of the creatable fields. */
export const updateProductSchema = createProductSchema.partial();
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

/**
 * What a stock movement did to a product's stock. `in` and `out` are recorded by
 * hand; `adjust` is written by the system when a stock correction arrives through
 * another path (the product form, a CSV import), so the ledger explains every
 * number the catalogue shows.
 */
export const movementTypes = ['in', 'out', 'adjust'] as const;
export const movementTypeSchema = z.enum(movementTypes);
export type MovementType = z.infer<typeof movementTypeSchema>;

/**
 * One recorded change to a product's stock. The product's name and SKU and the
 * author's name are resolved server-side and flattened in here, so the history
 * table renders from a single request.
 */
export const movementSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  productId: z.string(),
  productName: z.string(),
  productSku: z.string(),
  type: movementTypeSchema,
  quantity: z.number().positive(),
  resultingStock: z.number().nonnegative(),
  reason: z.string().optional(),
  userId: z.string(),
  userName: z.string(),
  createdAt: z.string(),
});
export type Movement = z.infer<typeof movementSchema>;

/**
 * Creation input. Only `in` and `out` are user-creatable: an `adjust` is written
 * by the system when a correction arrives through another path, so it can never
 * be forged as a plain entry.
 */
export const createMovementSchema = z.object({
  productId: z.string().min(1),
  type: z.enum(['in', 'out']),
  quantity: z.number().positive(),
  reason: z.string().max(120).optional(),
});
export type CreateMovementInput = z.infer<typeof createMovementSchema>;

/** Paginated envelope returned by `GET /movements`. */
export const movementListResponseSchema = z.object({
  items: z.array(movementSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
});
export type MovementListResponse = z.infer<typeof movementListResponseSchema>;

/** Paginated envelope returned by `GET /products`. */
export const productListResponseSchema = z.object({
  items: z.array(productSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
});
export type ProductListResponse = z.infer<typeof productListResponseSchema>;

/**
 * The panel's four figures. Everything here is computable from the current
 * inventory alone, because nothing records stock movement over time yet.
 */
export const dashboardStatsSchema = z.object({
  productCount: z.number().int().nonnegative(),
  lowStockCount: z.number().int().nonnegative(),
  outOfStockCount: z.number().int().nonnegative(),
  inventoryValue: z.number().nonnegative(),
});
export type DashboardStats = z.infer<typeof dashboardStatsSchema>;

/** One category's share of the inventory's capital. */
export const categoryValueSchema = z.object({
  category: z.string(),
  value: z.number().nonnegative(),
  productCount: z.number().int().nonnegative(),
});
export type CategoryValue = z.infer<typeof categoryValueSchema>;

/** One product's stock valued at cost. */
export const productValueSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string(),
  value: z.number().nonnegative(),
});
export type ProductValue = z.infer<typeof productValueSchema>;

/**
 * Where the inventory's capital sits, for the panel's two charts. Both views come
 * from one aggregation over the same `stock * costPrice`, so they cannot disagree
 * about the total they are shares of. `topProducts` is ranked highest first and
 * capped server-side: the tail of a value ranking is flat by definition.
 */
export const inventoryBreakdownSchema = z.object({
  totalValue: z.number().nonnegative(),
  productCount: z.number().int().nonnegative(),
  byCategory: z.array(categoryValueSchema),
  topProducts: z.array(productValueSchema),
});
export type InventoryBreakdown = z.infer<typeof inventoryBreakdownSchema>;

/**
 * Distinct filter values, so the inventory's category and supplier selects fill
 * independently of which page is loaded.
 */
export const productFacetsSchema = z.object({
  categories: z.array(z.string()),
  suppliers: z.array(z.string()),
});
export type ProductFacets = z.infer<typeof productFacetsSchema>;
