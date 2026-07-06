import { env } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

describe('ChatRoomDO', () => {
	it('should accept WebSocket upgrade and echo messages', async () => {
		const id = env.CHAT_ROOM.idFromName('test-room-1');
		const stub = env.CHAT_ROOM.get(id);

		// Tạo request nâng cấp lên WebSocket gửi cho DO
		const request = new Request('http://localhost/ws', {
			headers: { Upgrade: 'websocket' },
		});
		
		const response = await stub.fetch(request);

		expect(response.status).toBe(101);
		expect(response.webSocket).toBeDefined();

		const ws = response.webSocket;
		if (!ws) throw new Error('No websocket returned');

		// Chấp nhận kết nối phía client
		ws.accept();

		// Chờ nhận tin nhắn qua WebSocket
		const messages: string[] = [];
		ws.addEventListener('message', (event: any) => {
			messages.push(event.data as string);
		});

		// Gửi tin nhắn test
		ws.send(JSON.stringify({ type: 'chat', content: 'Hello DO' }));

		// Đợi 1 chút để DO xử lý (mock echo)
		await new Promise(resolve => setTimeout(resolve, 50));

		// Expect nhận được response (tạm thời mong đợi DO sẽ echo lại hoặc gửi status)
		expect(messages.length).toBeGreaterThan(0);
		expect(messages[0]).toContain('Hello DO');
		
		ws.close();
	});

	it('should save messages in SQLite and return via GET /messages', async () => {
		const id = env.CHAT_ROOM.idFromName('test-room-2');
		const stub = env.CHAT_ROOM.get(id);

		// 1. Post a message directly via fetch (or WS, but let's test a simple post API if needed, or just WS)
		const requestWS = new Request('http://localhost/ws', { headers: { Upgrade: 'websocket' } });
		const wsResponse = await stub.fetch(requestWS);
		const ws = wsResponse.webSocket;
		if (!ws) throw new Error('No websocket');
		ws.accept();

		ws.send(JSON.stringify({ type: 'chat', characterId: 'char-1', content: 'Hi AI' }));
		await new Promise(resolve => setTimeout(resolve, 50));
		ws.close();

		// 2. Fetch messages
		const request = new Request('http://localhost/messages');
		const response = await stub.fetch(request);
		
		expect(response.status).toBe(200);
		const data = await response.json() as any[];
		
		expect(data.length).toBeGreaterThanOrEqual(1);
		const userMsg = data.find(m => m.content === 'Hi AI');
		expect(userMsg).toBeDefined();
		expect(userMsg.role).toBe('user');
	});
});
