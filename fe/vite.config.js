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
      '/user/key': 'http://localhost:4000', // สำหรับการตรวจสอบ PIN User
      '/user/admin-key': 'http://localhost:4000', // สำหรับการตรวจสอบ PIN Admin
      '/user/ms/delete': 'http://localhost:4000', // สำหรับลบ event
      '/user/ms/create': 'http://localhost:4000', // สำหรับสร้าง event
      '/user/endmeeting': 'http://localhost:4000', // สำหรับสิ้นสุดการประชุม
      '/user/closedoor': 'http://localhost:4000', // สำหรับปิดประตู
    },
  },
});

