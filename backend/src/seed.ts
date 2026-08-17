import mongoose from 'mongoose';
import { connectDb } from './config/db.js';
import { Business } from './modules/business/business.model.js';
import { User } from './modules/user/user.model.js';
import { Product } from './modules/product/product.model.js';
import { hashPassword } from './modules/auth/password.js';

/**
 * Development-only bootstrap: one Business with an admin and an employee, plus a
 * catalogue with enough volume and variety to exercise pagination, filters and the
 * dashboard charts. Wipes first so repeated runs stay reproducible.
 */
async function seed(): Promise<void> {
  await connectDb();
  await User.deleteMany({});
  await Business.deleteMany({});
  await Product.deleteMany({});

  const business = await Business.create({
    name: 'Taller Rodri',
    slug: 'taller-rodri',
    branding: {
      accentColor: '#d62828',
    },
  });

  await User.create({
    businessId: business._id,
    email: 'admin@tallerrodri.com',
    passwordHash: await hashPassword('ordo1234!'),
    name: 'Administrador',
    role: 'admin',
  });

  // Columns: name, category, supplier, salePrice, stock, minStock. SKU and costPrice
  // are derived below.
  const bId = business._id;
  const raw: [string, string, string, number, number, number][] = [
    ['Aceite motor 5W-30 5L', 'Aceites y lubricantes', 'Castrol', 38, 40, 10],
    ['Aceite motor 10W-40 5L', 'Aceites y lubricantes', 'Castrol', 34, 28, 10],
    ['Aceite moto 10W-40 1L', 'Aceites y lubricantes', 'Motul', 16, 60, 20],
    ['Aceite caja de cambios 75W-90 1L', 'Aceites y lubricantes', 'Motul', 19, 12, 6],
    ['Líquido de frenos DOT4 500ml', 'Aceites y lubricantes', 'Bosch', 8, 5, 8],
    ['Grasa multiusos 400g', 'Aceites y lubricantes', 'Valvoline', 7, 22, 8],
    ['Pastillas de freno delanteras', 'Frenos', 'Brembo', 32, 6, 8],
    ['Pastillas de freno traseras', 'Frenos', 'TRW', 28, 14, 6],
    ['Disco de freno ventilado', 'Frenos', 'Brembo', 48, 8, 6],
    ['Disco de freno macizo', 'Frenos', 'ATE', 36, 4, 6],
    ['Zapatas de freno', 'Frenos', 'TRW', 24, 0, 5],
    ['Latiguillo de freno', 'Frenos', 'ATE', 14, 18, 6],
    ['Filtro de aceite', 'Filtros', 'Bosch', 9, 55, 15],
    ['Filtro de aire', 'Filtros', 'Mann-Filter', 15, 34, 10],
    ['Filtro de habitáculo', 'Filtros', 'Mann-Filter', 13, 26, 10],
    ['Filtro de combustible', 'Filtros', 'Bosch', 17, 3, 8],
    ['Neumático 205/55 R16', 'Neumáticos', 'Michelin', 89, 3, 6],
    ['Neumático 195/65 R15', 'Neumáticos', 'Continental', 78, 10, 6],
    ['Neumático 225/45 R17', 'Neumáticos', 'Pirelli', 105, 6, 4],
    ['Neumático moto 120/70 R17', 'Neumáticos', 'Michelin', 95, 2, 4],
    ['Batería 12V 60Ah', 'Baterías', 'Bosch', 95, 0, 4],
    ['Batería 12V 70Ah', 'Baterías', 'Varta', 115, 5, 4],
    ['Batería moto 12V 9Ah', 'Baterías', 'Varta', 45, 8, 4],
    ['Bujía de iridio', 'Encendido', 'NGK', 12, 120, 30],
    ['Bujía estándar', 'Encendido', 'Bosch', 5, 200, 40],
    ['Bobina de encendido', 'Encendido', 'Bosch', 42, 9, 5],
    ['Correa de distribución', 'Distribución', 'Gates', 45, 2, 5],
    ['Kit de distribución completo', 'Distribución', 'SKF', 120, 4, 3],
    ['Rodillo tensor', 'Distribución', 'Gates', 28, 11, 5],
    ['Lámpara halógena H7', 'Iluminación', 'Osram', 7, 0, 10],
    ['Lámpara halógena H4', 'Iluminación', 'Philips', 8, 30, 10],
    ['Kit LED H7', 'Iluminación', 'Osram', 39, 12, 6],
    ['Piloto trasero', 'Iluminación', 'Valeo', 34, 5, 4],
    ['Líquido refrigerante 5L', 'Refrigerantes', 'Prestone', 15, 25, 8],
    ['Anticongelante G12 5L', 'Refrigerantes', 'Prestone', 18, 14, 8],
    ['Limpiaparabrisas 5L', 'Limpieza', 'Valvoline', 6, 40, 12],
    ['Escobilla limpiaparabrisas 60cm', 'Limpieza', 'Bosch', 12, 22, 8],
    ['Amortiguador delantero', 'Suspensión', 'Monroe', 65, 6, 4],
    ['Amortiguador trasero', 'Suspensión', 'Sachs', 58, 3, 4],
    ['Rótula de dirección', 'Dirección', 'Febi', 26, 10, 5],
    ['Bieleta estabilizadora', 'Dirección', 'TRW', 18, 15, 6],
    ['Kit de embrague', 'Embrague', 'Sachs', 180, 2, 2],
    ['Volante bimasa', 'Embrague', 'Sachs', 260, 1, 2],
    ['Silencioso de escape', 'Escape', 'Bosal', 72, 4, 3],
    ['Catalizador', 'Escape', 'Bosal', 210, 0, 2],
  ];
  await Product.insertMany(
    raw.map(([name, category, supplier, salePrice, stock, minStock], i) => ({
      businessId: bId,
      name,
      sku: `${category.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
      category,
      supplier,
      unit: 'unidad',
      stock,
      minStock,
      costPrice: Math.round(salePrice * 0.6 * 100) / 100,
      salePrice,
    })),
  );

  await User.create({
    businessId: business._id,
    email: 'empleado@tallerrodri.com',
    passwordHash: await hashPassword('ordo1234!'),
    name: 'Dependiente',
    role: 'employee',
  });

  console.log('Seed complete.');
  console.log('Admin:    admin@tallerrodri.com / ordo1234!');
  console.log('Employee: empleado@tallerrodri.com / ordo1234!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
