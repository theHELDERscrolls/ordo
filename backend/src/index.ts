import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { connectDb } from './config/db.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Connect to MongoDB before accepting traffic; fail loudly if the DB is unreachable.
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
