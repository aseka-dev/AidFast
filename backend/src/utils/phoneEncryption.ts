
import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
    const key = process.env.PHONE_ENCRYPTION_KEY;

    if (!key) {
        throw new Error('PHONE_ENCRYPTION_KEY is not configured');
    }

    const decodedKey = Buffer.from(key, 'hex');

    if (
        key.length !== 64 ||
        !/^[0-9a-fA-F]{64}$/.test(key) ||
        decodedKey.length !== 32
    ) {
        throw new Error('Invalid PHONE_ENCRYPTION_KEY');
    }

    return decodedKey;
}

export function encryptPhone(phone: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(
        ALGORITHM,
        getEncryptionKey(),
        iv
    );

    const encrypted = Buffer.concat([
        cipher.update(phone, 'utf8'),
        cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    return [
        iv.toString('hex'),
        authTag.toString('hex'),
        encrypted.toString('hex')
    ].join(':');
}

export function decryptPhone(encryptedPhone: string): string {
    const parts = encryptedPhone.split(':');

    if (parts.length !== 3) {
        throw new Error('Invalid encrypted phone format');
    }

    const [ivHex, tagHex, encryptedHex] = parts;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(tagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    if (iv.length !== 12 || authTag.length !== 16) {
        throw new Error('Invalid encrypted phone data');
    }

    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        getEncryptionKey(),
        iv
    );

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
    ]);

    return decrypted.toString('utf8');
}
