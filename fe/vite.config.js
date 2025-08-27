// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// const backend = "http://backend:4000";

export default defineConfig({
  plugins: [react()],
  base: '/user/', // Add this line for proper asset path
  server: {
    host: true,
    port: 5173,
    // proxy: { // effect on dev, build need to use nginx
    //   '/user/sse': backend,
    //   '/user/key': backend,
    //   '/user/admin-key': backend,
    //   '/user/ms/delete': backend,
    //   '/user/ms/create': backend,
    //   '/user/endmeeting': backend,
    //   '/user/closedoor': backend,
    //   '/user/search-pin': backend,
    // },
    // allowedHosts: [ // มีผลเฉพาะตอนรัน dev (npm run dev)
    //   'smartconf.tcc-technology.com',
    // ],
  },
});


