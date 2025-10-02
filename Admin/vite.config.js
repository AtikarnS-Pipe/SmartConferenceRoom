import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const backend = "http://localhost:4000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // ✅ เปลี่ยน base เป็น '/' แทน '/admin/'
  base: '/admin',
  server: {
    host: true,
    port: 5170,
    proxy: {
      '/api1/admin/login': backend,
      '/api1/admin/sse': backend,
      '/api1/admin/schedule': backend,
      '/api1/account/refreshtoken': backend,
      '/api1/account/createhousekeeper': backend,
      '/api1/account/otp/send': backend,
      '/api1/account/otp/verify': backend,
      '/api1/account/changeadminpw': backend,
      '/api1/account/edithousekeeper': backend,
      '/api1/account/deletehousekeeper': backend,
      '/api1/account/member': backend,
      '/api1/account/auth': backend,
      '/api1/account/housekeepers': backend,
      '/api1/account/signout': backend,
      '/api1/account/logsmonitoring': backend,
      '/api1/account/me': backend,
      '/api1/superadmin/createadmin': backend,
      '/api1/superadmin/deleteadmin': backend,
      '/api1/admin/delete': backend,
    },
    allowedHosts: [
      'smartconf.tcc-technology.com',
    ],
  }
});