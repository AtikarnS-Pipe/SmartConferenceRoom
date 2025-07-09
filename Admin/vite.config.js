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
      '/rooms': 'http://localhost:4000',
      '/admin/login': 'http://localhost:4000',
      '/admin/sse': 'http://localhost:4000',
      '/account/auth': 'http://localhost:4000',
      '/account/otp/send': 'http://localhost:4000',
      '/account/otp/verify': 'http://localhost:4000',
      '/account/otp/reset': 'http://localhost:4000',
      '/admin/schedule': 'http://localhost:4000',
      '/account/refreshtoken': 'http://localhost:4000',
      '/account/createhousekeeper': 'http://localhost:4000',
      '/account/Changeadminpin': 'http://localhost:4000',
      '/account/edithousekeeper': 'http://localhost:4000',
    }
  }
})
