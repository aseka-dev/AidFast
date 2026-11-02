import jwt from 'jsonwebtoken';

export interface TokenPayload {
    userId: string;
    pharmacyId?: string;
}

const generateToken = (payload: TokenPayload): string => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }

    return jwt.sign(
        payload,
        secret,
        {
            expiresIn: '1d',
            issuer: 'aidfast-api'
        }
    );
};

export default generateToken;