import { normalizeCharacter } from '../utils/normalizeCharacter';
import { extractCharacterDataFromPng } from '../utils/pngParser';
import type { Character } from '../types';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export async function importCharacterCard(file: File): Promise<Character> {
    if (!file) {
        throw new Error('Không tìm thấy file import');
    }

    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'json') {
        const text = await file.text();
        let raw;
        try {
            raw = JSON.parse(text);
        } catch {
            throw new Error('File JSON không hợp lệ');
        }
        return normalizeCharacter(raw);
    }

    if (extension === 'png') {
        const buffer = await file.arrayBuffer();
        const raw = extractCharacterDataFromPng(buffer);
        const character = normalizeCharacter(raw);
        
        // Convert PNG image data to Base64 data URL and set as avatar
        const base64 = arrayBufferToBase64(buffer);
        character.avatar = `data:image/png;base64,${base64}`;
        
        return character;
    }

    throw new Error('Chỉ hỗ trợ file .json hoặc .png');
}
