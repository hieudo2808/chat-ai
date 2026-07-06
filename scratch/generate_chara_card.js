const fs = require('fs');
const path = require('path');

function createMockPngBuffer(keyword, payload) {
    const magic = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const type = Buffer.from('tEXt');
    const data = Buffer.concat([Buffer.from(keyword + '\0'), Buffer.from(payload)]);
    const lengthBuf = Buffer.alloc(4);
    lengthBuf.writeUint32BE(data.length);
    const crcBuf = Buffer.alloc(4); // CRC fake
    
    return Buffer.concat([magic, lengthBuf, type, data, crcBuf]);
}

const mockJson = {
    name: 'Mona Lisa',
    description: 'Bức chân dung nổi tiếng của Leonardo da Vinci.',
    personality: 'Bí ẩn, mỉm cười nhẹ nhàng và thích trò chuyện về nghệ thuật.',
    first_mes: 'Xin chào! Tôi đang mỉm cười và sẵn sàng trò chuyện cùng bạn đây.'
};
const base64Data = Buffer.from(JSON.stringify(mockJson)).toString('base64');
const buffer = createMockPngBuffer('chara', base64Data);

const dir = path.join(__dirname, '../tests/fixtures');
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}
fs.writeFileSync(path.join(dir, 'test_character_card.png'), buffer);
console.log('Successfully generated test_character_card.png');
