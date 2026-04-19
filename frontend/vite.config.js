import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import pkg from './package.json' assert { type: 'json' }

const viteBase = (() => {
  const raw = process.env.VITE_BASE_PATH
  if (raw == null || raw === '') {
    const homepage = pkg.homepage || '/'
    try {
      const url = new URL(homepage)
      const path = url.pathname
      return path === '/' ? '/' : path.endsWith('/') ? path : `${path}/`
    } catch {
      return '/'
    }
  }

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