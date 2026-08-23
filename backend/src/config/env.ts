import { existsSync } from 'node:fs';

// Hosts like Render inject real environment variables, so a file is only loaded
// when one exists locally.
if (existsSync('.env')) process.loadEnvFile();

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

/**
 * Validated at import time, so a missing variable fails the process immediately
 * with a clear message instead of surfacing as a cryptic error later.
 */
export const env = {
  port: Number(process.env.PORT) || 3000,
  mongodbUri: required('MONGODB_URI'),
  jwtSecret: required('JWT_SECRET'),
  // Unset means any origin, which is what local development and a REST client want.
  corsOrigin: process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()) ?? '*',
};
