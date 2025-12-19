import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        port: 5173,
        host: '0.0.0.0',
        https: true,
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                renderer: 'src/renderer.ts'
            }
        }
    }
});

