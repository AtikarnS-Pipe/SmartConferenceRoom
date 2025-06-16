// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    host: true,
    port: 5173,
    proxy: {
      '/user/sse': 'http://localhost:4000', // เปลี่ยนเป็น port ของ backend จริง
    },
  },
});

