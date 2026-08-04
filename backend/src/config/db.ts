import mongoose from 'mongoose';
import { env } from './env.js';

// Opens the single shared connection Mongoose reuses across the app.
export async function connectDb(): Promise<void> {
  await mongoose.connect(env.mongodbUri);
  console.log('MongoDB connected');
}
