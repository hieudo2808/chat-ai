/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { signJwt, verifyJwt, GuestJwtPayload } from '../lib/jwt';

export async function handleGuestLogin(request: Request, env: any): Promise<Response> {
    try {
        const guestId = `guest_${crypto.randomUUID()}`;
        const payload: GuestJwtPayload = {
            sub: guestId,
            type: 'guest'
        };

        const secret = env.JWT_SECRET;
        if (!secret) {
            return new Response(JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Missing JWT_SECRET' } }), { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const token = await signJwt(payload, secret);

        // Đảm bảo user có trong DB
        const { ensureUser } = await import('../repositories/userRepository');
        await ensureUser(env.DB, guestId, 'guest');

        return new Response(JSON.stringify({ 
            token, 
            user: { id: guestId, type: 'guest' } 
        }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Failed to login' } }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function handleAuthMe(request: Request, env: any): Promise<Response> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: { code: 'AUTH_MISSING_TOKEN', message: 'Missing or invalid Authorization header' } }), { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const token = authHeader.split(' ')[1];
    const secret = env.JWT_SECRET;
    
    if (!secret) {
        return new Response(JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Missing JWT_SECRET' } }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const decoded = await verifyJwt(token, secret);
    if (!decoded) {
        return new Response(JSON.stringify({ error: { code: 'AUTH_INVALID_TOKEN', message: 'Invalid or expired token' } }), { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({ 
        user: { id: decoded.sub, type: decoded.type } 
    }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}
