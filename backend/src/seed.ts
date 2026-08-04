import mongoose from 'mongoose';
import { connectDb } from './config/db.js';
import { Business } from './business/business.model.js';
import { User } from './user/user.model.js';
import { hashPassword } from './auth/password.js';

// Dev-only bootstrap: provisions one Business and its owner so login works end to
// end. Wipes first so it stays reproducible (safe: development database only).
async function seed(): Promise<void> {
  await connectDb();
  await User.deleteMany({});
  await Business.deleteMany({});

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

  console.log('Seed complete.');
  console.log('Login: admin@tallerrodri.com / ordo1234!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
