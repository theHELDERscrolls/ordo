import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

// Hashes a plaintext password. bcrypt embeds the salt inside the resulting hash.
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

// Compares a plaintext password against a stored hash in constant time.
export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
