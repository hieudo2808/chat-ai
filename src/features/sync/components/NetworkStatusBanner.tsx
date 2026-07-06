import React from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export const NetworkStatusBanner: React.FC = () => {
    const { isOnline } = useNetworkStatus();

    if (isOnline) {
        return null;
    }

    return (
        <div className="network-status-banner">
            ⚠️ You are offline. Some features like chat may be unavailable.
        </div>
    );
};
