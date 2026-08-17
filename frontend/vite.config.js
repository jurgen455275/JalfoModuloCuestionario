import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: ['jalfomodulocuestionario-1.onrender.com'],
    proxy: {
      '/api': {
        target: 'https://jalfomodulocuestionario.onrender.com/',
        changeOrigin: true,
      },
    },
  },
});
