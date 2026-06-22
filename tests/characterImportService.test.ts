import { describe, it, expect } from 'vitest';
import { importCharacterCard } from '../src/services/characterImportService';

class MockFile {
    name: string;
    content: string | ArrayBuffer;
    constructor(content: string | ArrayBuffer, name: string) {
        this.name = name;
        this.content = content;
    }
    async text() {
        return typeof this.content === 'string' ? this.content : '';
    }
    async arrayBuffer() {
        return this.content instanceof ArrayBuffer ? this.content : new ArrayBuffer(0);
    }
}

describe('characterImportService', () => {
    it('throws error for unsupported extension', async () => {
        await expect(importCharacterCard({ name: 'test.txt' } as unknown as File)).rejects.toThrow('Chỉ hỗ trợ file .json và .png');
    });

    it('parses json file successfully', async () => {
        const validJson = JSON.stringify({ name: 'Alice' });
        const file = new MockFile(validJson, 'char.json') as unknown as File;
        
        const result = await importCharacterCard(file);
        expect(result.name).toBe('Alice');
    });

    it('throws error for invalid json', async () => {
        const file = {
            name: 'test.json',
            text: async () => 'invalid json'
        } as unknown as File;
        await expect(importCharacterCard(file)).rejects.toThrow('File JSON không hợp lệ');
    });

    it('parses png file successfully', async () => {
        // Create a minimal mock PNG buffer with chara text chunk
        const encoder = new TextEncoder();
        const magic = [137, 80, 78, 71, 13, 10, 26, 10];
        
        const type = encoder.encode('tEXt');
        const data = encoder.encode('chara\0' + btoa(JSON.stringify({ name: 'PNG Char' })));
        
        const length = data.length;
        const buffer = new ArrayBuffer(8 + 4 + 4 + length + 4);
        const view = new DataView(buffer);
        const u8 = new Uint8Array(buffer);
        
        u8.set(magic, 0);
        view.setUint32(8, length, false);
        u8.set(type, 12);
        u8.set(data, 16);
        view.setUint32(16 + length, 0, false); // CRC
        
        const file = new MockFile(buffer, 'char.png') as unknown as File;
        
        const result = await importCharacterCard(file);
        expect(result.name).toBe('PNG Char');
    });
});
