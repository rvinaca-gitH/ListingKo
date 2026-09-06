import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-insecure-key-change-in-production';
const ALGORITHM = 'aes-256-gcm';

// Derive a key from the encryption key
function getKey(): Buffer {
  return scryptSync(ENCRYPTION_KEY, 'salt', 32);
}

export interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
}

/**
 * Encrypt sensitive data (like API credentials)
 */
export function encryptData(data: any): EncryptedData {
  const key = getKey();
  const iv = randomBytes(16);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

/**
 * Decrypt sensitive data (like API credentials)
 */
export function decryptData(encryptedData: EncryptedData): any {
  const key = getKey();
  const iv = Buffer.from(encryptedData.iv, 'hex');
  const authTag = Buffer.from(encryptedData.authTag, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
}

/**
 * Encrypt a credential object (for storing in database)
 */
export function encryptCredentials(credentials: Record<string, any>): { encrypted: string; iv: string; authTag: string } {
  return encryptData(credentials);
}

/**
 * Decrypt a credential object (for retrieving from database)
 */
export function decryptCredentials(encrypted: string, iv: string, authTag: string): Record<string, any> {
  return decryptData({ encrypted, iv, authTag });
}
