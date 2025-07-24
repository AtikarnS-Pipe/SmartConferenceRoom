/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // เปิดใช้งาน dark mode แบบ class-based
  theme: {
    extend: {
      fontFamily: {
        'display': ['kanit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
