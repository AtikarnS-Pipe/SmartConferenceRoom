import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  server:{
    host: true, // 👈 เปิดให้เข้าจากเครื่องอื่นได้
    port: 5170, // หรือพอร์ตอื่น
    proxy: {
      '/admin/login': 'http://localhost:4000',
      '/admin/sse': 'http://localhost:4000',
      '/admin/schedule': 'http://localhost:4000',
      '/account/refreshtoken': 'http://localhost:4000',
      '/account/createhousekeeper': 'http://localhost:4000',
      '/account/changeadminpw': 'http://localhost:4000',
      '/account/edithousekeeper': 'http://localhost:4000',
      '/account/deletehousekeeper': 'http://localhost:4000',
      '/account/member': 'http://localhost:4000',
      '/account/auth': 'http://localhost:4000',
      '/account/housekeepers': 'http://localhost:4000',
      '/account/signout': 'http://localhost:4000',
      '/account/getname': 'http://localhost:4000',
      '/account/logsmonitoring': 'http://localhost:4000',
      '/account/me': 'http://localhost:4000',
      '/account/checkpin': 'http://localhost:4000',
      '/superadmin/createadmin': 'http://localhost:4000',
      '/superadmin/deleteadmin': 'http://localhost:4000',
    }
  }
})
