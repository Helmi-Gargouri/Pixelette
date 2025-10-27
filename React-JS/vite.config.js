import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@auth': resolve(__dirname, '../react-app2/src/pages/Auth'),
    },
  },
  server: {
    port: 5174,
    fs: {
      // 👇 On autorise le dossier de ton autre app
      allow: [
        resolve(__dirname, '../react-app2'),
        // 👇 Et on autorise aussi le dossier courant (react-js)
        resolve(__dirname, '.'),
      ],
    },
  },
});
