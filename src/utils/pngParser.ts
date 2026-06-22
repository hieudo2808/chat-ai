export function extractCharacterDataFromPng(buffer: ArrayBuffer): unknown {
    const u8 = new Uint8Array(buffer);
    const view = new DataView(buffer);

    // Kiểm tra magic number của PNG: 89 50 4E 47 0D 0A 1A 0A
    const magic = [137, 80, 78, 71, 13, 10, 26, 10];
    for (let i = 0; i < 8; i++) {
        if (u8[i] !== magic[i]) {
            throw new Error('Không phải file PNG hợp lệ');
        }
    }

    let pos = 8;
    const textChunks: Record<string, string> = {};

    while (pos < buffer.byteLength) {
        // Lấy length (4 bytes)
        const length = view.getUint32(pos, false);
        
        // Lấy type (4 bytes)
        const typeStr = String.fromCharCode(u8[pos+4], u8[pos+5], u8[pos+6], u8[pos+7]);
        
        // Data bắt đầu từ pos+8, dài length
        if (typeStr === 'tEXt') {
            const chunkData = u8.slice(pos+8, pos+8+length);
            // Tìm byte null (0x00) để tách keyword và text
            const nullIndex = chunkData.indexOf(0);
            if (nullIndex !== -1) {
                const keywordBytes = chunkData.slice(0, nullIndex);
                const textBytes = chunkData.slice(nullIndex + 1);
                
                const decoder = new TextDecoder('latin1');
                const keyword = decoder.decode(keywordBytes);
                const text = decoder.decode(textBytes);
                
                textChunks[keyword] = text;
            }
        }
        
        // Next chunk: length(4) + type(4) + data(length) + crc(4)
        pos += 12 + length;
    }

    const targetKey = ['chara', 'ccv3'].find(key => key in textChunks);
    if (!targetKey) {
        throw new Error('Không tìm thấy metadata Character Card trong ảnh PNG');
    }

    try {
        const base64Data = textChunks[targetKey];
        const decoded = atob(base64Data);
        // decodeURIComponent(escape()) handles utf-8 encoding inside base64/atob
        const utf8Decoded = decodeURIComponent(escape(decoded));
        return JSON.parse(utf8Decoded);
    } catch (error) {
        throw new Error('Dữ liệu Character Card trong ảnh bị lỗi hoặc không thể giải mã', { cause: error });
    }
}
