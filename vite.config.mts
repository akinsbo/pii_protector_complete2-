/**
 * @fileoverview Vite configuration for Ledebe Protector development server.
 * Configures build settings, server options, and development environment.
 * 
 * @author Olaolu
 * @version 1.0.0
 * @since December 2025
 * @license MIT
 */

import { defineConfig } from 'vite';

export default defineConfig({
    root: './',
    server: {
        port: 5173,
        host: '0.0.0.0',
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: './index.html'
            }
        }
    }
});

