import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const backend = "http://localhost:4000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // ✅ เปลี่ยน base เป็น '/' แทน '/admin/'
  base: '/',
  server: {
    host: true,
    port: 5170,
    proxy: {
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