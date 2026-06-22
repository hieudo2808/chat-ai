import { describe, it, expect } from 'vitest';
import { extractCharacterDataFromPng } from '../src/utils/pngParser';

describe('pngParser', () => {
    function createMockPngBuffer(keyword: string, payload: string): ArrayBuffer {
        const encoder = new TextEncoder();
        const magic = [137, 80, 78, 71, 13, 10, 26, 10];
        
        const type = encoder.encode('tEXt');
        const data = encoder.encode(`${keyword}\0${payload}`);
        
        const length = data.length;
        
        const buffer = new ArrayBuffer(8 + 4 + 4 + length + 4);
        const view = new DataView(buffer);
        const u8 = new Uint8Array(buffer);
        
        // Magic
        u8.set(magic, 0);
        
        // Length
        view.setUint32(8, length, false);
        
        // Type
        u8.set(type, 12);
        
        // Data
        u8.set(data, 16);
        
        // CRC (fake)
        view.setUint32(16 + length, 0, false);
        
        return buffer;
    }

    it('throws error for invalid magic number', () => {
        const buffer = new ArrayBuffer(10);
        expect(() => extractCharacterDataFromPng(buffer)).toThrow('Không phải file PNG hợp lệ');
    });

    it('extracts and decodes chara chunk', () => {
        const mockJson = { name: 'Luna', description: 'Test' };
        const base64Data = btoa(JSON.stringify(mockJson));
        
        const buffer = createMockPngBuffer('chara', base64Data);
        
        const result = extractCharacterDataFromPng(buffer);
        expect(result).toEqual(mockJson);
    });

    it('throws error if chara keyword not found', () => {
        const buffer = createMockPngBuffer('Software', 'Photoshop');
        expect(() => extractCharacterDataFromPng(buffer)).toThrow('Không tìm thấy metadata Character Card');
    });
});
