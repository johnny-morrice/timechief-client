
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
    base: "",
    plugins: [solidPlugin()],
    optimizeDeps: {
        include: ['fabric'],
    },
    build: {
        target: 'esnext',
        outDir: 'frontend-dist',
        minify: false,
    }
});