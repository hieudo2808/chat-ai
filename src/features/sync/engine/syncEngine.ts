import { getPendingMutations, markMutationStatus } from './mutationQueue';
import type { SyncChange } from '../services/syncApi';
import { pushSync, pullSync } from '../services/syncApi';
import { resolvePullConflicts } from './conflictResolver';

export async function processSyncQueue(token: string): Promise<void> {
    const mutations = await getPendingMutations();
    if (mutations.length === 0) return;

    await Promise.all(mutations.map(async (m) => {
        await markMutationStatus(m.id, 'processing');
    }));

    try {
        const changes: SyncChange[] = mutations.map(m => ({
            entity: m.entity,
            operation: m.operation,
            localId: m.localId,
            data: m.payload,
            localUpdatedAt: new Date(m.createdAt).toISOString(),
            version: 1
        }));
        const response = await pushSync(changes, token);

        if (response && response.results) {
            await Promise.all(mutations.map(async (mutation) => {
                const result = response.results.find((r: any) => r.localId === mutation.localId);
                if (result) {
                    if (result.status === 'synced') {
                        await markMutationStatus(mutation.id, 'synced', { serverId: result.serverId });
                    } else if (result.status === 'conflict') {
                        await markMutationStatus(mutation.id, 'conflict');
                    } else {
                        await markMutationStatus(mutation.id, 'failed', { 
                            retryCount: mutation.retryCount + 1,
                            lastError: result.error || 'Unknown error'
                        });
                    }
                }
            }));
        }
    } catch (error: unknown) {
        // Network error or backend down
        await Promise.all(mutations.map(async (m) => {
            await markMutationStatus(m.id, 'failed', {
                retryCount: m.retryCount + 1,
                lastError: (error as Error).message || 'Network error'
            });
        }));
    }
}

export async function syncPull(token: string, since?: string): Promise<void> {
    const response = await pullSync(since || null, token);
    if (response && response.changes && response.changes.length > 0) {
        await resolvePullConflicts(response.changes);
    }
}
