import bcrypt from "bcryptjs";

const ROUNDS = 10;

export async function hashFilePassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export function verifyFilePassword(plain: string, hash: string): boolean {
  if (!plain || !hash) return false;
  return bcrypt.compareSync(plain, hash);
}
