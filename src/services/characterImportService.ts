import { normalizeCharacter } from '../utils/normalizeCharacter';
import { extractCharacterDataFromPng } from '../utils/pngParser';
import type { Character } from '../types';

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
        return normalizeCharacter(raw);
    }

    throw new Error('Chỉ hỗ trợ file .json hoặc .png');
}
