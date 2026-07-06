/* eslint-disable @typescript-eslint/no-unused-vars */
import jwt from '@tsndr/cloudflare-worker-jwt';

export type GuestJwtPayload = {
    sub: string;
    type: 'guest';
    iat?: number;
    exp?: number;
};

export async function signJwt(payload: GuestJwtPayload, secret: string): Promise<string> {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + (30 * 24 * 60 * 60); // 30 days
    
    return jwt.sign({
        ...payload,
        iat,
        exp
    }, secret);
}

export async function verifyJwt(token: string, secret: string): Promise<GuestJwtPayload | null> {
    try {
        const isValid = await jwt.verify(token, secret);
        if (!isValid) return null;
        
        const { payload } = jwt.decode(token);
        return payload as GuestJwtPayload;
    } catch (error) {
        return null;
    }
}
