import { useState, useRef } from 'react';
import { processSyncQueue, syncPull } from '../engine/syncEngine';

export function useSync() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSynced, setLastSynced] = useState<string | null>(null);
    const lastSyncedRef = useRef<string | null>(null);

    const sync = async (token: string) => {
        if (!token) return;
        setIsSyncing(true);
        try {
            // First push local pending mutations
            await processSyncQueue(token);
            
            // Then pull from server
            await syncPull(token, lastSyncedRef.current || undefined);
            
            const now = new Date().toISOString();
            lastSyncedRef.current = now;
            setLastSynced(now);
            setIsSyncing(false);
        } catch (error) {
            console.error('Sync failed', error);
            setIsSyncing(false);
        }
    };

    return {
        isSyncing,
        lastSynced,
        sync
    };
}
