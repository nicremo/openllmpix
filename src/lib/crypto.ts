/**
 * Client-side encryption for API keys stored in localStorage.
 *
 * Uses Web Crypto API (AES-GCM) to encrypt sensitive data.
 * The encryption key is derived from a combination of:
 * - A random salt stored alongside the encrypted data
 * - The browser's origin (provides some binding to the domain)
 *
 * Note: This is NOT perfect security - a determined attacker with
 * access to the browser could still extract keys. But it:
 * - Prevents casual inspection of localStorage
 * - Makes keys unreadable if localStorage is exported
 * - Provides defense in depth
 */

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;

/**
 * Derive an encryption key from a password-like input.
 */
async function deriveKey(salt: Uint8Array): Promise<CryptoKey> {
  // Use origin as part of the key material (binds to domain)
  const keyMaterial = new TextEncoder().encode(
    window.location.origin + "-nano-banana-secure-storage"
  );

  const importedKey = await crypto.subtle.importKey(
    "raw",
    keyMaterial,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: "SHA-256",
    },
    importedKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt a string value.
 * Returns a base64-encoded string containing: salt + iv + ciphertext
 */
export async function encrypt(plaintext: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(salt);

  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded
  );

  // Combine salt + iv + ciphertext
  const combined = new Uint8Array(
    salt.length + iv.length + ciphertext.byteLength
  );
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

  // Return as base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a string value.
 * Expects a base64-encoded string containing: salt + iv + ciphertext
 */
export async function decrypt(encrypted: string): Promise<string> {
  try {
    // Decode from base64
    const combined = new Uint8Array(
      atob(encrypted)
        .split("")
        .map((c) => c.charCodeAt(0))
    );

    // Extract salt, iv, and ciphertext
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH);

    const key = await deriveKey(salt);

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    throw new Error("Failed to decrypt data - may be corrupted or from different origin");
  }
}

/**
 * Check if Web Crypto API is available.
 */
export function isCryptoAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof crypto !== "undefined" &&
    typeof crypto.subtle !== "undefined"
  );
}
