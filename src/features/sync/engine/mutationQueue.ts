import { dbPromise } from '../../../db/appDb';
import { createId } from '../../../utils/id';

export type OfflineMutation = {
    id: string;
    entity: 'character' | 'message' | 'model_profile';
    operation: 'create' | 'update' | 'delete';
    localId: string;
    serverId?: string;
    payload: unknown;
    status: 'pending' | 'processing' | 'synced' | 'failed' | 'conflict';
    retryCount: number;
    lastError?: string;
    createdAt: string;
    updatedAt: string;
    lastAttemptAt?: string;
    idempotencyKey: string;
};

export async function addMutation(params: {
    entity: 'character' | 'message' | 'model_profile';
    operation: 'create' | 'update' | 'delete';
    localId: string;
    serverId?: string;
    payload: unknown;
}): Promise<void> {
    const db = await dbPromise;
    const now = new Date().toISOString();

    // Check for existing pending mutations for the same entity and localId
    const pendingMutations = await db.getAllFromIndex('offline_mutations', 'status', 'pending');
    const existing = pendingMutations.find(
        (m) => m.entity === params.entity && m.localId === params.localId
    );

    if (existing) {
        // Compact logic
        if (existing.operation === 'create' && params.operation === 'update') {
            existing.payload = params.payload;
            existing.updatedAt = now;
            await db.put('offline_mutations', existing);
            return;
        }

        if (existing.operation === 'update' && params.operation === 'update') {
            existing.payload = params.payload;
            existing.updatedAt = now;
            await db.put('offline_mutations', existing);
            return;
        }

        if (existing.operation === 'create' && params.operation === 'delete') {
            // Created then deleted offline -> just discard
            await db.delete('offline_mutations', existing.id);
            return;
        }

        if (existing.operation === 'update' && params.operation === 'delete') {
            existing.operation = 'delete';
            existing.payload = params.payload;
            existing.updatedAt = now;
            await db.put('offline_mutations', existing);
            return;
        }

        // If something else like create -> create (shouldn't happen), or delete -> update (shouldn't happen)
        // just fallback to overwriting
        existing.operation = params.operation;
        existing.payload = params.payload;
        existing.updatedAt = now;
        await db.put('offline_mutations', existing);
        return;
    }

    const newMutation: OfflineMutation = {
        id: createId(),
        entity: params.entity,
        operation: params.operation,
        localId: params.localId,
        serverId: params.serverId,
        payload: params.payload,
        status: 'pending',
        retryCount: 0,
        createdAt: now,
        updatedAt: now,
        idempotencyKey: createId()
    };

    await db.put('offline_mutations', newMutation);
}

export async function getPendingMutations(): Promise<OfflineMutation[]> {
    const db = await dbPromise;
    const [pending, failed] = await Promise.all([
        db.getAllFromIndex('offline_mutations', 'status', 'pending'),
        db.getAllFromIndex('offline_mutations', 'status', 'failed')
    ]);

    const maxRetries = 5;
    const eligibleFailed = failed.filter((m) => m.retryCount < maxRetries);

    const all = [...pending, ...eligibleFailed];
    
    // Sort by createdAt ascending (FIFO)
    return all.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function markMutationStatus(
    id: string, 
    status: OfflineMutation['status'], 
    updates?: Partial<OfflineMutation>
): Promise<void> {
    const db = await dbPromise;
    const mutation = await db.get('offline_mutations', id);
    if (!mutation) return;

    mutation.status = status;
    mutation.updatedAt = new Date().toISOString();
    
    if (updates) {
        Object.assign(mutation, updates);
    }

    await db.put('offline_mutations', mutation);
}
