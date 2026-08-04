import { existsSync } from 'node:fs';

// Load a local .env in development. Hosts like Render inject real environment
// variables instead of a file, so we only load one when it exists.
if (existsSync('.env')) process.loadEnvFile();

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

// Validated at import time: the process fails fast with a clear message if a
// required variable is missing, instead of crashing later with a cryptic error.
export const env = {
  port: Number(process.env.PORT) || 3000,
  mongodbUri: required('MONGODB_URI'),
};
