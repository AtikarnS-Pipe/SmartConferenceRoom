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
      '/rooms': 'https:backendcf.tcctech.work',
      '/admin/login': 'https:backendcf.tcctech.work',
      '/admin/sse': 'https:backendcf.tcctech.work',
      '/account/auth': 'https:backendcf.tcctech.work'
    }
  }
})
