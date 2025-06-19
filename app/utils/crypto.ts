import crypto from 'crypto';
import { HMAC_SECRET_KEY } from './config/constant';
// Load secret key from environment variable
const secretKey = HMAC_SECRET_KEY;

if (!secretKey) {
  throw new Error('Missing SECRET_KEY in environment variables');
}

// Encrypt function
export function encrypt(text: crypto.BinaryLike) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-ctr', Buffer.from(secretKey, 'hex'), iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

// Decrypt function
export function decrypt(text: string) {
  const [iv, encryptedText] = text.split(':');
  const decipher = crypto.createDecipheriv('aes-256-ctr', Buffer.from(secretKey, 'hex'), Buffer.from(iv, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedText, 'hex')), decipher.final()]);
  return decrypted.toString();
}

// const decryptedToken = decrypt(store_details.access_token);
// const encryptedToken = encrypt(accessToken);