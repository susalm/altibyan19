import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/dist/**', '**/node_modules/**', '**/.cache/**', '**/tmp/**', '**/.git/**'],
      },
    },
    json: {
      stringify: true,
    },
    build: {
      target: 'es2020',
      cssCodeSplit: true,
      reportCompressedSize: false,
      sourcemap: false,
      minify: 'esbuild',
      chunkSizeWarningLimit: 5000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('motion')) return 'vendor-motion';
              return 'vendor';
            }
            if (
              id.includes('mukhtasar_full') ||
              id.includes('tafsir_muyassar_full') ||
              id.includes('tafsir_sadi_full') ||
              id.includes('aysar_full') ||
              id.includes('english_translation')
            ) {
              return 'tafsir-data';
            }
          },
        },
      },
    },
  };
});
