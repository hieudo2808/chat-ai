export type SyncOperation = 'create' | 'update' | 'delete';

export type SyncChange = {
    entity: 'character' | 'message' | 'model_profile';
    operation: SyncOperation;
    localId: string;
    serverId?: string;
    data?: unknown;
    localUpdatedAt: string;
    version: number;
};

export type SyncResult = {
    localId: string;
    serverId?: string;
    status: 'synced' | 'error' | 'conflict';
    serverUpdatedAt?: string;
    version?: number;
    error?: string;
};

export type PushSyncResponse = {
    results: SyncResult[];
    serverTime: string;
};

export async function pushSync(changes: SyncChange[], token: string): Promise<PushSyncResponse> {
    const baseUrl = import.meta.env?.VITE_API_URL || 'http://localhost:8787';
    
    const response = await fetch(`${baseUrl}/sync/push`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ changes })
    });

    if (!response.ok) {
        throw new Error(`Sync push failed: ${response.status}`);
    }

    return response.json();
}

export type PullSyncResponse = {
    serverTime: string;
    changes: SyncChange[];
};

export async function pullSync(since: string | null, token: string): Promise<PullSyncResponse> {
    const baseUrl = import.meta.env?.VITE_API_URL || 'http://localhost:8787';
    
    let url = `${baseUrl}/sync/pull`;
    if (since) {
        url += `?since=${encodeURIComponent(since)}`;
    }

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error(`Sync pull failed: ${response.status}`);
    }

    return response.json();
}
