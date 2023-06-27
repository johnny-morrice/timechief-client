
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
    base: "",
    plugins: [solidPlugin()],
    build: {
        target: 'esnext',
        outDir: 'frontend-dist',
        minify: true,
    }
});