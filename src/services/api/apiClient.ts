export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const fullUrl = url.startsWith('/') ? `${API_BASE_URL}${url}` : url;
    const token = localStorage.getItem('access_token');
    
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {})
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(fullUrl, {
        ...options,
        headers
    });
}
