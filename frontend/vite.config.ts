import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api/controls': {
        target: 'http://controls-service:3001',
        changeOrigin: true,
      },
      '/api/risk': {
        target: 'http://risk-service:3008',
        changeOrigin: true,
      },
    },
  },
});
