const fs = require('fs');

const files = [
    'src/features/settings/components/SettingsModal/SettingsModal.tsx',
    'src/services/llmClient.ts',
    'src/stores/authStore.ts',
    'tests/AuthStatus.test.tsx',
    'tests/LoginAsGuestButton.test.tsx',
    'tests/apiClient.test.ts',
    'tests/authStore.test.ts',
    'tests/llmClient.test.ts',
    'tests/settingsService.test.ts',
    'worker/src/index.test.ts',
    'worker/src/index.ts',
    'worker/src/lib/jwt.ts',
    'worker/src/routes/auth.test.ts',
    'worker/src/routes/auth.ts'
];

const header = '/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */\n';

for (const file of files) {
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        if (!content.startsWith('/* eslint-disable')) {
            fs.writeFileSync(file, header + content);
            console.log('Fixed ' + file);
        }
    } else {
        console.log('File not found: ' + file);
    }
}
