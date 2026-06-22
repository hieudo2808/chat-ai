import { describe, it, expect, beforeEach } from 'vitest';
import { dbPromise } from '../src/db/appDb';
import { 
    getMessagesByCharacterId, 
    saveMessage, 
    updateMessage,
    deleteMessagesByCharacterId 
} from '../src/services/messageService';

describe('MessageService', () => {
    beforeEach(async () => {
        const db = await dbPromise;
        await db.clear('messages');
    });

    it('returns empty array when no messages exist', async () => {
        const msgs = await getMessagesByCharacterId('char_1');
        expect(msgs).toEqual([]);
    });

    it('saves and retrieves messages by characterId, ordered by time', async () => {
        await saveMessage({ id: 'msg_1', characterId: 'char_1', role: 'user', content: 'A' });
        // sleep a bit to ensure time difference
        await new Promise(r => setTimeout(r, 10));
        await saveMessage({ id: 'msg_2', characterId: 'char_1', role: 'assistant', content: 'B' });
        await saveMessage({ id: 'msg_3', characterId: 'char_2', role: 'user', content: 'C' });

        const msgs = await getMessagesByCharacterId('char_1');
        expect(msgs.length).toBe(2);
        expect(msgs[0].content).toBe('A');
        expect(msgs[1].content).toBe('B');

        const msgs2 = await getMessagesByCharacterId('char_2');
        expect(msgs2.length).toBe(1);
    });

    it('updates a message', async () => {
        await saveMessage({ id: 'msg_1', characterId: 'char_1', role: 'assistant', content: 'hello' });
        await updateMessage('msg_1', { content: 'hello world' });

        const msgs = await getMessagesByCharacterId('char_1');
        expect(msgs[0].content).toBe('hello world');
    });

    it('deletes messages by characterId', async () => {
        await saveMessage({ id: 'msg_1', characterId: 'char_1', role: 'user', content: 'A' });
        await saveMessage({ id: 'msg_2', characterId: 'char_2', role: 'user', content: 'B' });

        await deleteMessagesByCharacterId('char_1');

        expect((await getMessagesByCharacterId('char_1')).length).toBe(0);
        expect((await getMessagesByCharacterId('char_2')).length).toBe(1);
    });
});
