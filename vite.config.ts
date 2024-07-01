import { defineConfig, normalizePath } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'node:path';
import { createRequire } from 'node:module';
import dts from 'vite-plugin-dts';

const require = createRequire(import.meta.url);
const cMapsDir = normalizePath(
    path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'cmaps'),
);
const standardFontsDir = normalizePath(
    path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'standard_fonts'),
);

export default defineConfig({
    build: {
        lib: {
            entry: normalizePath(path.join('src', 'index.ts')),
            name: 'virtual-pdf-reader',
            fileName: 'virtual-pdf-reader'
        },
        rollupOptions: {
            external: ['react']
        }
    },
    plugins: [
        dts(),
        react(),
        viteStaticCopy({
            targets: [
                { src: cMapsDir, dest: '' },
                { src: standardFontsDir, dest: '' },
            ],
        }),
    ],
});

