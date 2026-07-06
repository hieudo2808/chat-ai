import { Env } from '../index';

export async function handleSyncPush(request: Request, env: Env): Promise<Response> {
    try {
        const body: any = await request.json();
        const changes = body.changes || [];
        const results = [];
        const now = new Date().toISOString();

        for (const change of changes) {
            try {
                if (change.entity === 'character') {
                    if (change.operation === 'create' || change.operation === 'update') {
                        const id = change.serverId || change.localId;
                        const data = change.data;

                        await env.DB.prepare(
                            `INSERT INTO characters (id, user_id, name, avatar, description, personality, scenario, first_message, updated_at) 
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                             ON CONFLICT(id) DO UPDATE SET 
                                name=excluded.name, 
                                avatar=excluded.avatar, 
                                description=excluded.description,
                                personality=excluded.personality,
                                scenario=excluded.scenario,
                                first_message=excluded.first_message,
                                updated_at=excluded.updated_at`,
                        )
                            .bind(
                                id,
                                'user-1', // Mock user for now since auth isn't fully passed in this test yet
                                data.name || '',
                                data.avatar || '',
                                data.description || '',
                                data.personality || '',
                                data.scenario || '',
                                data.firstMessage || '',
                                now,
                            )
                            .run();

                        results.push({
                            localId: change.localId,
                            serverId: id,
                            status: 'synced',
                            serverUpdatedAt: now,
                        });
                    }
                }
                // Handle models similarly...
            } catch (err) {
                results.push({
                    localId: change.localId,
                    status: 'error',
                    error: err instanceof Error ? err.message : 'Unknown error',
                });
            }
        }

        return new Response(JSON.stringify({ results, serverTime: now }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
    }
}

export async function handleSyncPull(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const since = url.searchParams.get('since');

    // In real app, bind user_id
    let charQuery = `SELECT * FROM characters`;
    let modelQuery = `SELECT * FROM model_profiles`;
    const params: string[] = [];

    if (since) {
        charQuery += ` WHERE updated_at > ?`;
        modelQuery += ` WHERE updated_at > ?`;
        params.push(since);
    }

    const [charsResult, modelsResult] = await Promise.all([
        env.DB.prepare(charQuery)
            .bind(...params)
            .all(),
        env.DB.prepare(modelQuery)
            .bind(...params)
            .all(),
    ]);

    const changes = [
        ...(charsResult.results || []).map((row: any) => ({
            entity: 'character',
            operation: 'update',
            serverId: row.id,
            localUpdatedAt: row.updated_at,
            data: {
                id: row.id,
                name: row.name,
                avatar: row.avatar,
                description: row.description,
                personality: row.personality,
                scenario: row.scenario,
                firstMessage: row.first_message,
            },
        })),
        ...(modelsResult.results || []).map((row: any) => ({
            entity: 'model_profile',
            operation: 'update',
            serverId: row.id,
            localUpdatedAt: row.updated_at,
            data: {
                id: row.id,
                name: row.name,
                provider: row.provider,
                baseUrl: row.base_url,
                modelName: row.model_name,
            },
        })),
    ];

    return new Response(JSON.stringify({ changes, serverTime: new Date().toISOString() }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}
