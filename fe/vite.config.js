// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backend = "http://localhost:4000";

export default defineConfig({
  plugins: [react()],
  base: '/user/', // Add this line for proper asset path
  server: {
    host: true,
    port: 5173,
    proxy: { // effect on dev, build need to use nginx
      '/api2/user/sse': backend,
      '/api2/user/key': backend,
      '/api2/user/admin-key': backend,
      '/api2/user/ms/delete': backend,
      '/api2/user/ms/create': backend,
      '/api2/user/endmeeting': backend,
      '/api2/user/closedoor': backend,
      '/api2/user/search-pin': backend,
    },
    allowedHosts: [ // มีผลเฉพาะตอนรัน dev (npm run dev)
      'smartconf.tcc-technology.com',
    ],
  },
});


