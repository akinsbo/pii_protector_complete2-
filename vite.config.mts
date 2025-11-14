// vite.config.ts
import { defineConfig } from 'vite';
// export default defineConfig({ server: { port: 5173, strictPort: true } });
import react from '@vitejs/plugin-react'; // or vue/svelte, depending
import path from 'path';

    // root: path.join(__dirname, '.'),

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        host: '0.0.0.0',
    },
});

