import type { AiModelProfile } from '~/types';

export async function testModelProfile(profile: AiModelProfile): Promise<boolean> {
    try {
        // Chuẩn hóa baseUrl (xóa dấu slash ở cuối nếu có)
        const baseUrl = profile.baseUrl.replace(/\/$/, '');
        const url = `${baseUrl}/models`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (profile.apiKey) {
            headers['Authorization'] = `Bearer ${profile.apiKey}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers,
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            throw new Error(`Lỗi kết nối: ${response.status} ${response.statusText} - ${errorText}`);
        }

        return true;
    } catch (error) {
        console.error('Test connection failed:', error);
        throw error;
    }
}
