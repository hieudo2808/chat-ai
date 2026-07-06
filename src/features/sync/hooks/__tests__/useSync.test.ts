// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSync } from '../useSync';
import { processSyncQueue, syncPull } from '../../engine/syncEngine';

vi.mock('../../engine/syncEngine', () => ({
    processSyncQueue: vi.fn(),
    syncPull: vi.fn()
}));

describe('useSync', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should call processSyncQueue then syncPull', async () => {
        const { result } = renderHook(() => useSync());

        await act(async () => {
            await result.current.sync('test-token');
        });

        expect(processSyncQueue).toHaveBeenCalledWith('test-token');
        expect(syncPull).toHaveBeenCalledWith('test-token', undefined);
        expect(result.current.isSyncing).toBe(false);
    });

    it('should handle errors gracefully', async () => {
        vi.mocked(processSyncQueue).mockRejectedValueOnce(new Error('Test error'));

        const { result } = renderHook(() => useSync());

        await act(async () => {
            await result.current.sync('test-token');
        });

        expect(processSyncQueue).toHaveBeenCalledWith('test-token');
        expect(syncPull).not.toHaveBeenCalled();
        expect(result.current.isSyncing).toBe(false);
    });
});
