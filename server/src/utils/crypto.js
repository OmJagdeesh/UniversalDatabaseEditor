import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a hex-encoded string: iv + authTag + ciphertext.
 */
export function encrypt(plaintext) {
  const key = Buffer.from(env.credentialSecret, 'hex');
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  // Concatenate iv + authTag + ciphertext for easy storage
  return iv.toString('hex') + authTag.toString('hex') + encrypted;
}

/**
 * Decrypts a hex-encoded string produced by encrypt().
 */
export function decrypt(encryptedHex) {
  const key = Buffer.from(env.credentialSecret, 'hex');

  const ivHex = encryptedHex.slice(0, IV_LENGTH * 2);
  const authTagHex = encryptedHex.slice(IV_LENGTH * 2, IV_LENGTH * 2 + AUTH_TAG_LENGTH * 2);
  const ciphertextHex = encryptedHex.slice(IV_LENGTH * 2 + AUTH_TAG_LENGTH * 2);

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
