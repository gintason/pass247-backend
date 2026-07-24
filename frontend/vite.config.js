import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Two different ports are in play, and mixing them up causes confusing
// 404/403 errors:
//
//   * Vite (below) serves the app — this is the ORIGIN the browser sees,
//     and the one that must appear in Django's CORS_ALLOWED_ORIGINS and
//     CSRF_TRUSTED_ORIGINS.
//   * DJANGO_ORIGIN is where /api requests get proxied TO. It must match
//     whatever port `manage.py runserver` is using.
//
// Example: `runserver 8080` -> DJANGO_ORIGIN=http://localhost:8080 in .env,
// while Django's CORS/CSRF lists still need http://localhost:5173.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.DJANGO_ORIGIN || 'http://localhost:8000'

  return {
    plugins: [react()],
    server: {
      // Pinned rather than left to Vite's default. strictPort makes startup
      // FAIL if 5173 is taken, instead of silently moving to 5174 — a
      // silent move changes the browser origin and breaks CORS/CSRF in a
      // way that looks like a backend bug.
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': { target, changeOrigin: true, secure: false },
        '/media': { target, changeOrigin: true, secure: false },
        '/static': { target, changeOrigin: true, secure: false },
      },
    },
  }
})
