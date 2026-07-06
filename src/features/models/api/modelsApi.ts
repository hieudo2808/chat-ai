import type { AiModelProfile } from '~/types';

export async function testModelProfile(profile: AiModelProfile): Promise<boolean> {
    // TODO: Connect to real backend API: POST /models/:id/test
    // For now, we simulate a successful call after a short delay
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (profile.baseUrl && profile.modelName) {
                resolve(true);
            } else {
                reject(new Error("Invalid configuration"));
            }
        }, 1000);
    });
}
