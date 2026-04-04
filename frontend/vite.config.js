import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const viteBase = (() => {
  const raw = process.env.VITE_BASE_PATH
  if (raw == null || raw === '') return '/'
  const t = String(raw).trim()
  if (t === '/') return '/'
  const withSlash = t.startsWith('/') ? t : `/${t}`
  return withSlash.endsWith('/') ? withSlash : `${withSlash}/`
})()

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  define: {
    global: 'window',
  },
  base: viteBase,
})