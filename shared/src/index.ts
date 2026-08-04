// API contract shared between backend and frontend.
// A Zod schema here is the single source of truth: it validates at runtime AND
// produces the static TypeScript type via z.infer. No framework code (Express,
// Mongoose, React) belongs here.
import { z } from 'zod';

// Branding: embedded white-label sub-object of a Business. Only the brand color
// and image URLs are stored per tenant; the neutral theme layers live in the
// frontend CSS, not in the database.
export const brandingSchema = z.object({
  displayName: z.string().min(1),
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
export const userRoles = ['owner', 'staff'] as const;
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
  email: z.email(),
  password: z.string().min(1),
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
