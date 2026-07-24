// Central runtime configuration for the frontend.
//
// Why this exists: several components previously hardcoded absolute hosts
// (e.g. 'http://localhost:8080' in PracticeSession.jsx, 'http://localhost:8000'
// for blog images). Those work on a dev machine but break in production,
// because the browser then tries to reach localhost on the *visitor's*
// machine. There was no environment-config mechanism in the app at all
// (`import.meta.env` was unused), so hardcoding was the path of least
// resistance.
//
// Default is an empty string, meaning "same origin" - correct for production,
// where Django serves the built React app, and correct in development, where
// Vite's dev proxy (see vite.config.js) forwards /api to Django.
//
// To point the frontend at a different backend, create a .env file:
//   VITE_API_BASE_URL=http://localhost:8000
// Vite only exposes variables prefixed with VITE_.

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

// Build an absolute URL for a server-provided relative path (e.g. media
// files like /media/blog/x.png). If the path is already absolute, return it
// unchanged so Cloudinary/CDN URLs pass through untouched.
export function mediaUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const base = API_BASE_URL || '';
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

export default { API_BASE_URL, mediaUrl };
