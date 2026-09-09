import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';

function getKey(): Buffer {
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY must be configured before encrypting credentials');
  }
  return scryptSync(ENCRYPTION_KEY, 'salt', 32);
}

export interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
}

export function encryptData(data: unknown): EncryptedData {
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

export function decryptData(encryptedData: EncryptedData): unknown {
  const key = getKey();
  const iv = Buffer.from(encryptedData.iv, 'hex');
  const authTag = Buffer.from(encryptedData.authTag, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
}

export function encryptCredentials(credentials: Record<string, unknown>): EncryptedData {
  return encryptData(credentials);
}

export function decryptCredentials(encrypted: string, iv: string, authTag: string): Record<string, unknown> {
  return decryptData({ encrypted, iv, authTag }) as Record<string, unknown>;
}
