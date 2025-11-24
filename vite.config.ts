import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';  // This is the import line

export default defineConfig({
    plugins: [react()],
    server: {
        headers: {
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cross-Origin-Opener-Policy': 'same-origin',
        },
    },
});