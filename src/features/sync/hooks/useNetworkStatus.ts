import { useState, useEffect, useRef } from 'react';

const HEALTH_CHECK_URL = import.meta.env?.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/health` 
    : 'http://localhost:8787/health';

export function useNetworkStatus(checkIntervalMs = 60000) {
    const [isOnline, setIsOnline] = useState<boolean>(() => 
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );
    const [lastOnlineAt, setLastOnlineAt] = useState<string | undefined>(undefined);
    const [lastOfflineAt, setLastOfflineAt] = useState<string | undefined>(undefined);
    const intervalRef = useRef<number | null>(null);

    const checkHealth = async () => {
        if (!navigator.onLine) {
            handleOffline();
            return;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
            
            const res = await fetch(HEALTH_CHECK_URL, {
                signal: controller.signal,
                cache: 'no-store'
            });
            clearTimeout(timeoutId);
            
            if (res.ok) {
                handleOnline();
            } else {
                handleOffline();
            }
        } catch {
            // Fetch failed, probably network is down or backend is down
            handleOffline();
        }
    };

    const handleOnline = () => {
        setIsOnline(true);
        setLastOnlineAt(new Date().toISOString());
    };

    const handleOffline = () => {
        setIsOnline(false);
        setLastOfflineAt(new Date().toISOString());
    };

    // eslint-disable-next-line react-doctor/no-fetch-in-effect
    useEffect(() => {
        window.addEventListener('online', checkHealth);
        window.addEventListener('offline', handleOffline);

        // Initial check
        checkHealth();

        if (checkIntervalMs > 0) {
            intervalRef.current = window.setInterval(checkHealth, checkIntervalMs);
        }

        return () => {
            window.removeEventListener('online', checkHealth);
            window.removeEventListener('offline', handleOffline);
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checkIntervalMs]); // Using isOnline in effect dependencies might cause re-trigger, so we use state setter carefully

    return {
        isOnline,
        lastOnlineAt,
        lastOfflineAt,
        checkHealth
    };
}
