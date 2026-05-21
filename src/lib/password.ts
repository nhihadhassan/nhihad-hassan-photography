import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

const SCHEME = "s1";
const SALT_BYTES = 16;
const KEY_LENGTH = 64;
// Uses Node's default scrypt cost params (N=2^14=16384, r=8, p=1).
// Roughly 60-100ms on modern hardware — long enough to slow brute force,
// short enough for UX.

export async function hashPassword(plain: string): Promise<string> {
  if (typeof plain !== "string" || plain.length === 0) {
    throw new Error("Password cannot be empty.");
  }
  const salt = randomBytes(SALT_BYTES);
  const key = (await scryptAsync(
    plain.normalize("NFKC"),
    salt,
    KEY_LENGTH,
  )) as Buffer;
  return `${SCHEME}$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  if (!plain || !stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== SCHEME) return false;

  let saltHex: string;
  let keyHex: string;
  try {
    [, saltHex, keyHex] = parts;
  } catch {
    return false;
  }

  let storedKey: Buffer;
  let salt: Buffer;
  try {
    salt = Buffer.from(saltHex, "hex");
    storedKey = Buffer.from(keyHex, "hex");
  } catch {
    return false;
  }
  if (salt.length === 0 || storedKey.length === 0) return false;

  const derived = (await scryptAsync(
    plain.normalize("NFKC"),
    salt,
    storedKey.length,
  )) as Buffer;

  if (derived.length !== storedKey.length) return false;
  return timingSafeEqual(derived, storedKey);
}
