import { readFileSync } from 'node:fs';
import mongoose from 'mongoose';
import { connectDb } from './config/db.js';
import { parseCsv } from './lib/csv.js';
import { Business } from './modules/business/business.model.js';
import { User } from './modules/user/user.model.js';
import { Product } from './modules/product/product.model.js';
import { StockMovement } from './modules/movement/movement.model.js';
import { hashPassword } from './modules/auth/password.js';

const { ObjectId } = mongoose.Types;

/**
 * How far back the opening "Stock inicial" movement is dated. Older than any row
 * in movements.csv, so a product's history starts where its stock did.
 */
const OPENING_DAYS_AGO = 120;

/** Relative dates, so a database seeded today always looks recently active. */
const dateDaysAgo = (days: number): Date => new Date(Date.now() - days * 86_400_000);

/**
 * The seed files live next to the compiled output as well as next to the source,
 * so the same relative URL resolves from `src/` under tsx and from `dist/`.
 */
function readSeedCsv(name: string): Record<string, string>[] {
  return parseCsv(readFileSync(new URL(`../seed/${name}.csv`, import.meta.url), 'utf8'));
}

/** Turns a missing natural key into a named error instead of a validation failure. */
function required<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`Seed refers to an unknown ${what}`);
  return value;
}

type MovementDoc = {
  businessId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  type: string;
  quantity: number;
  resultingStock: number;
  reason: string | undefined;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
};

/**
 * Development-only bootstrap, built entirely from the CSV files in `backend/seed`.
 * They are related by natural keys (`slug`, `email`, `sku`) rather than ids, which
 * is what keeps them editable in a spreadsheet; the ids are resolved here.
 *
 * Wipes first, so repeated runs stay reproducible.
 */
async function seed(): Promise<void> {
  await connectDb();
  await Promise.all([
    Business.deleteMany({}),
    User.deleteMany({}),
    Product.deleteMany({}),
    StockMovement.deleteMany({}),
  ]);

  const businesses = readSeedCsv('businesses').map((row) => ({
    _id: new ObjectId(),
    slug: row.slug,
    name: row.name,
    branding: { accentColor: row.accentColor },
  }));
  const businessIds = new Map(businesses.map((b) => [b.slug, b._id]));
  const businessIdOf = (slug: string) =>
    required(businessIds.get(slug), `business "${slug}"`);
  await Business.insertMany(businesses);

  const userRows = readSeedCsv('users');
  const users = await Promise.all(
    userRows.map(async (row) => ({
      _id: new ObjectId(),
      businessId: businessIdOf(row.businessSlug),
      email: row.email,
      name: row.name,
      role: row.role,
      passwordHash: await hashPassword(row.password),
    })),
  );
  const userIds = new Map(users.map((u) => [u.email, u._id]));
  const userIdOf = (email: string) => required(userIds.get(email), `user "${email}"`);
  await User.insertMany(users);

  // The opening stock is attributed to whoever administers the business.
  const adminIds = new Map(
    userRows
      .filter((r) => r.role === 'admin')
      .map((r) => [String(businessIdOf(r.businessSlug)), userIdOf(r.email)]),
  );
  const adminIdOf = (businessId: mongoose.Types.ObjectId) =>
    required(adminIds.get(String(businessId)), `admin for business "${businessId}"`);

  // `stock` in the file is the OPENING stock: the movements below run forward from
  // it, and what a product is finally saved with is where the ledger leaves it.
  const products = readSeedCsv('products').map((row) => ({
    _id: new ObjectId(),
    businessId: businessIdOf(row.businessSlug),
    name: row.name,
    sku: row.sku,
    description: row.description || undefined,
    category: row.category || undefined,
    supplier: row.supplier || undefined,
    unit: row.unit,
    stock: Number(row.stock),
    minStock: Number(row.minStock),
    costPrice: Number(row.costPrice),
    salePrice: Number(row.salePrice),
  }));
  // The SKU is unique per business, not globally, so the key needs both.
  const productsBySku = new Map(products.map((p) => [`${p.businessId}/${p.sku}`, p]));

  const movements: MovementDoc[] = products
    .filter((product) => product.stock > 0)
    .map((product) => ({
      businessId: product.businessId,
      productId: product._id,
      type: 'in',
      quantity: product.stock,
      resultingStock: product.stock,
      reason: 'Stock inicial',
      userId: adminIdOf(product.businessId),
      createdAt: dateDaysAgo(OPENING_DAYS_AGO),
    }));

  // Oldest first: a running stock only means anything applied in order.
  const movementRows = readSeedCsv('movements')
    .map((row) => ({
      businessSlug: row.businessSlug,
      sku: row.sku,
      userEmail: row.userEmail,
      type: row.type,
      quantity: Number(row.quantity),
      reason: row.reason || undefined,
      daysAgo: Number(row.daysAgo),
    }))
    .sort((a, b) => b.daysAgo - a.daysAgo);

  let skipped = 0;
  for (const row of movementRows) {
    const product = productsBySku.get(`${businessIdOf(row.businessSlug)}/${row.sku}`);
    if (!product) throw new Error(`Seed refers to an unknown product "${row.sku}"`);

    // An `adjust` in the seed is always a downward correction: breakage, or a
    // recount finding less than the shelf claimed.
    const delta = row.type === 'in' ? row.quantity : -row.quantity;
    if (product.stock + delta < 0) {
      console.warn(
        `Skipped ${row.type} of ${row.quantity} on ${row.sku}: only ${product.stock} in stock`,
      );
      skipped++;
      continue;
    }

    product.stock += delta;
    movements.push({
      businessId: product.businessId,
      productId: product._id,
      type: row.type,
      quantity: row.quantity,
      resultingStock: product.stock,
      reason: row.reason,
      userId: userIdOf(row.userEmail),
      createdAt: dateDaysAgo(row.daysAgo),
    });
  }

  await Product.insertMany(products);
  // The explicit `createdAt` is the whole point of the `daysAgo` column, so the
  // automatic timestamps have to stay out of the way.
  await StockMovement.insertMany(movements, { timestamps: false });

  console.log(
    `Seed complete: ${businesses.length} business, ${users.length} users, ` +
      `${products.length} products, ${movements.length} movements` +
      (skipped ? ` (${skipped} skipped)` : ''),
  );
  for (const row of userRows) console.log(`${row.role}: ${row.email} / ${row.password}`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
