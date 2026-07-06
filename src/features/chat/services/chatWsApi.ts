export class ChatWsApi {
    private ws: WebSocket;
    private onMessageCb?: (data: unknown) => void;

    constructor(roomId: string, token: string) {
        // Lấy domain từ env hoặc hardcode localhost trong dev
        const baseUrl = import.meta.env?.VITE_API_URL?.replace('http', 'ws') || 'ws://localhost:8787';
        const url = `${baseUrl}/ws/chat?roomId=${roomId}&token=${token}`;
        
        this.ws = new WebSocket(url);
        
        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.onMessageCb?.(data);
            } catch (err) {
                console.error('WS message error', err);
            }
        };
    }

    onMessage(cb: (data: unknown) => void) {
        this.onMessageCb = cb;
    }

    sendMessage(content: string, characterId?: string, settings?: unknown, apiMessages?: unknown[]) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'chat', content, characterId, settings, apiMessages }));
        } else {
            console.error('WS is not open');
        }
    }

    close() {
        this.ws.close();
    }
}
