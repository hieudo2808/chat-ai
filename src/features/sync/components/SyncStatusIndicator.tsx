import React, { useEffect } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useSync } from '../hooks/useSync';
import { useAuthStore } from '~/stores/authStore';

export const SyncStatusIndicator: React.FC = () => {
    const { isAuthenticated } = useAuthStore();
    const { isOnline } = useNetworkStatus();
    const { sync } = useSync();

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!isAuthenticated || !token || !isOnline) return;

        // Initial sync
        sync(token);

        // Periodic sync every 30 seconds
        const intervalId = setInterval(() => {
            const currentToken = localStorage.getItem('access_token');
            if (currentToken) {
                sync(currentToken);
            }
        }, 30000);

        return () => clearInterval(intervalId);
    }, [isAuthenticated, isOnline, sync]);

    if (!isAuthenticated) return null;

    return null;
};
