import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { connectDb } from './config/db.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { productRouter } from './modules/product/product.routes.js';
import { movementRouter } from './modules/movement/movement.routes.js';
import { dashboardRouter } from './modules/dashboard/dashboard.routes.js';

const app = express();

// `Content-Disposition` is not one of the headers CORS exposes by default, and the
// browser hides what it does not expose: without this the CSV export would download
// under a name the client had to invent instead of the one the server sends.
app.use(cors({ origin: env.corsOrigin, exposedHeaders: ['Content-Disposition'] }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRouter);
app.use('/products', productRouter);
app.use('/movements', movementRouter);
app.use('/dashboard', dashboardRouter);

/** Refuses to accept traffic until MongoDB is reachable. */
async function start(): Promise<void> {
  await connectDb();
  app.listen(env.port, () => {
    console.log(`backend listening on port ${env.port}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
