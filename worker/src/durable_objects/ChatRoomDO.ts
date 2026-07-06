import { DurableObject } from "cloudflare:workers";
import { Env } from "../index";

export class ChatRoomDO extends DurableObject {
	// Khởi tạo bảng messages trong SQLite nếu chưa có
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.ctx.storage.sql.exec(`
			CREATE TABLE IF NOT EXISTS messages (
				id TEXT PRIMARY KEY,
				character_id TEXT NOT NULL,
				role TEXT NOT NULL,
				content TEXT NOT NULL,
				status TEXT NOT NULL,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
			)
		`);
	}

	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === '/messages' && request.method === 'GET') {
			const cursor = this.ctx.storage.sql.exec("SELECT * FROM messages ORDER BY created_at ASC");
			const messages = cursor.toArray();
			return new Response(JSON.stringify(messages), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		if (request.headers.get('Upgrade') !== 'websocket') {
			return new Response('Expected Upgrade: websocket', { status: 426 });
		}

		const webSocketPair = new WebSocketPair();
		const client = webSocketPair[0];
		const server = webSocketPair[1];

		this.ctx.acceptWebSocket(server);

		return new Response(null, {
			status: 101,
			webSocket: client,
		});
	}

	webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
		try {
			const data = JSON.parse(message as string);
			if (data.type === 'chat') {
				const msgId = crypto.randomUUID();
				const charId = data.characterId || 'unknown';
				
				// Save user message to SQLite
				this.ctx.storage.sql.exec(`
					INSERT INTO messages (id, character_id, role, content, status)
					VALUES (?, ?, 'user', ?, 'delivered')
				`, msgId, charId, data.content);

				// Call LLM and stream back
				import('../lib/llmClient').then(({ streamChatCompletion }) => {
					let fullReply = '';
					streamChatCompletion({
						settings: data.settings,
						messages: data.apiMessages,
						onToken: (token) => {
							fullReply += token;
							ws.send(JSON.stringify({ type: 'token', content: token }));
						}
					}).then(() => {
						// Save assistant message when done
						const botMsgId = crypto.randomUUID();
						this.ctx.storage.sql.exec(`
							INSERT INTO messages (id, character_id, role, content, status)
							VALUES (?, ?, 'assistant', ?, 'delivered')
						`, botMsgId, charId, fullReply);

						ws.send(JSON.stringify({ type: 'done' }));
					}).catch((err) => {
						console.error('LLM error:', err);
						ws.send(JSON.stringify({ type: 'error', error: err.message }));
					});
				});
			}
		} catch {
			ws.send(JSON.stringify({ error: 'Invalid message' }));
		}
	}

	webSocketClose() {
		// Cleanup if needed
	}
}
