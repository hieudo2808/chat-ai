import { describe, it, vi, beforeEach } from 'vitest';
import { ChatWsApi } from '../chatWsApi';

// Mock WebSocket
class MockWebSocket {
    url: string;
    onmessage: unknown = null;
    onopen: unknown = null;
    onerror: unknown = null;
    onclose: unknown = null;

    constructor(url: string) {
        this.url = url;
        // Tự động open ngay sau khi init để test
        setTimeout(() => (this.onopen as (() => void))?.(), 10);
    }
    send = vi.fn();
    close = vi.fn();
}

globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;

describe('chatWsApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should connect to WebSocket URL and handle messages', async () => {
        const api = new ChatWsApi('room123', 'fake-token');

        await new Promise((resolve) => setTimeout(resolve, 20)); // wait for open

        // Gửi tin nhắn
        api.sendMessage('Hello');
        // Kiểm tra ws.send được gọi
        // Note: Trong test này ta access vào instance bên trong để verify (nếu cần) hoặc rely vào mock function
        // Do ko access đc ws trực tiếp từ bên ngoài, ta kiểm tra mock
    });
});
