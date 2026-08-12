// API contract shared between backend and frontend.
// A Zod schema here is the single source of truth: it validates at runtime AND
// produces the static TypeScript type via z.infer. No framework code (Express,
// Mongoose, React) belongs here.
import { z } from 'zod';

// Branding: embedded white-label sub-object of a Business. Only the brand color
// and image URLs are stored per tenant; the neutral theme layers live in the
// frontend CSS, not in the database.
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

// Business = the tenant. This is the public/wire shape the API returns.
export const businessSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  slug: z.string().min(1),
  branding: brandingSchema,
});
export type Business = z.infer<typeof businessSchema>;

// Roles a user can hold inside their business. Single source of truth for both sides.
export const userRoles = ['admin', 'employee'] as const;
export const userRoleSchema = z.enum(userRoles);
export type UserRole = z.infer<typeof userRoleSchema>;

// User = public/wire shape. It NEVER contains passwordHash: the contract is what
// the frontend is allowed to see, not what the database stores.
export const userSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  email: z.email(),
  name: z.string().min(1),
  role: userRoleSchema,
});
export type User = z.infer<typeof userSchema>;

// Login request body. Validated at the API trust boundary and reused by the
// frontend form. password only needs to be non-empty here: strength rules belong
// to registration (which Ordo does not expose), not to login.
export const loginSchema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
});
export type LoginInput = z.infer<typeof loginSchema>;

// What a successful login returns: a token plus the resolved tenant context
// (the user and their business, so the frontend can theme the shell immediately).
export const loginResponseSchema = z.object({
  token: z.string(),
  user: userSchema,
  business: businessSchema,
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

// Stock status is DERIVED from stock vs minStock (the reorder point), never stored.
// Single source of truth for the threshold, shared by API, UI badges and filters.
export const stockStatuses = ['in', 'low', 'out'] as const;
export const stockStatusSchema = z.enum(stockStatuses);
export type StockStatus = z.infer<typeof stockStatusSchema>;

// Product = public/wire shape. `businessId` identifies the tenant; `sku` is the
// product's identity within that tenant. Quantities allow decimals (e.g. kg).
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
  imageUrl: z.url().optional(),
  stockStatus: stockStatusSchema,
});
export type Product = z.infer<typeof productSchema>;

// Create input: the client never sets `id`, `businessId` (taken from the session)
// or the derived `stockStatus`. Quantities and prices default to 0.
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
  imageUrl: z.url().optional(),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;
// Input side of the schema (fields with a default are optional here). Forms need
// this for react-hook-form's input generic; the resolver still outputs CreateProductInput.
export type CreateProductFormInput = z.input<typeof createProductSchema>;

// Update input: any subset of the creatable fields.
export const updateProductSchema = createProductSchema.partial();
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// Paginated list envelope returned by GET /products.
export const productListResponseSchema = z.object({
  items: z.array(productSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
});
export type ProductListResponse = z.infer<typeof productListResponseSchema>;

// The dashboard snapshot: figures computable from the current inventory alone
// (no historical stock movements yet).
export const dashboardStatsSchema = z.object({
  productCount: z.number().int().nonnegative(),
  lowStockCount: z.number().int().nonnegative(),
  outOfStockCount: z.number().int().nonnegative(),
  inventoryValue: z.number().nonnegative(),
});
export type DashboardStats = z.infer<typeof dashboardStatsSchema>;

// Distinct values for the inventory filters, so the UI can populate its category
// and supplier selects independently of pagination.
export const productFacetsSchema = z.object({
  categories: z.array(z.string()),
  suppliers: z.array(z.string()),
});
export type ProductFacets = z.infer<typeof productFacetsSchema>;
