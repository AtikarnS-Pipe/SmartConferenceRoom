import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const backend_URL = "https://backendcf.tcctech.work"
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  server:{
    host: true, // 👈 เปิดให้เข้าจากเครื่องอื่นได้
    port: 5170, // หรือพอร์ตอื่นได้
    proxy: {
      '/rooms': backend_URL,
      '/admin/login': backend_URL,
      '/admin/sse': backend_URL,
      '/admin/schedule': backend_URL,
      '/account/refreshtoken': backend_URL,
      '/account/createhousekeeper': backend_URL,
      '/account/changeadminpw': backend_URL,
      '/account/edithousekeeper': backend_URL,
      '/account/deletehousekeeper': backend_URL,
      '/account/member': backend_URL,
      '/account/auth': backend_URL,
      '/account/housekeepers': backend_URL,
      '/account/signout': backend_URL,
      '/account/getname': backend_URL,
      '/account/logsmonitoring': backend_URL,
      '/account/me': backend_URL,
      '/superadmin/createadmin': backend_URL,
      '/superadmin/deleteadmin': backend_URL,
    }
  }
})
