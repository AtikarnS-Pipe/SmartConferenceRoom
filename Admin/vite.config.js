import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/admin/',
  server: {
    host: true,
    port: 5170,
    proxy: {
      '/rooms': 'http://backend:4000',
      '/admin/login': 'http://backend:4000',
      '/admin/sse': 'http://backend:4000',
      '/admin/schedule': 'http://backend:4000',
      '/account/refreshtoken': 'http://backend:4000',
      '/account/createhousekeeper': 'http://backend:4000',
      '/account/changeadminpw': 'http://backend:4000',
      '/account/edithousekeeper': 'http://backend:4000',
      '/account/deletehousekeeper': 'http://backend:4000',
      '/account/member': 'http://backend:4000',
      '/account/auth': 'http://backend:4000',
      '/account/housekeepers': 'http://backend:4000',
      '/account/signout': 'http://backend:4000',
      '/account/getname': 'http://backend:4000',
      '/account/logsmonitoring': 'http://backend:4000',
      '/account/me': 'http://backend:4000',
      '/account/checkpin': 'http://backend:4000',
      '/superadmin/createadmin': 'http://backend:4000',
      '/superadmin/deleteadmin': 'http://backend:4000',
    },
    allowedHosts: [
      'smartconf.tcc-technology.com',
    ],
  }
});

