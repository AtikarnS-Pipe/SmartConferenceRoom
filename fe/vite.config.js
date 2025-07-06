// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    host: true,
    port: 5173,
    proxy: {
<<<<<<< HEAD
      '/user/sse': 'http://localhost:4000', // เปลี่ยนเป็น port ของ backend จริง
      '/user/key': 'http://localhost:4000',
=======
      '/user/sse': 'https:backendcf.tcctech.work', // เปลี่ยนเป็น port ของ backend จริง
      '/user/key': 'https:backendcf.tcctech.work', 
>>>>>>> 81eb435e53fa6d458b0aab24f99fb219be1ee509
    },
  },
});

