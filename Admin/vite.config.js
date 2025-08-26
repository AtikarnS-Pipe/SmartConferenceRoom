import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const backend = "http://backend:4000";
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/admin/',
  server: {
    host: true,
    port: 5170,
    proxy: {
      '/rooms': backend,
      '/admin/login': backend,
      '/admin/sse': backend,
      '/admin/schedule': backend,
      '/account/refreshtoken': backend,
      '/account/createhousekeeper': backend,
      '/account/changeadminpw': backend,
      '/account/edithousekeeper': backend,
      '/account/deletehousekeeper': backend,
      '/account/member': backend,
      '/account/auth': backend,
      '/account/housekeepers': backend,
      '/account/signout': backend,
      '/account/getname': backend,
      '/account/logsmonitoring': backend,
      '/account/me': backend,
      '/account/checkpin': backend,
      '/superadmin/createadmin': backend,
      '/superadmin/deleteadmin': backend,
    },
    allowedHosts: [
      'smartconf.tcc-technology.com',
    ],
  }
});

