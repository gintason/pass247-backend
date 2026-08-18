import axios from 'axios';

// Shared axios client for the whole app.
//
// Why this exists: several components were calling the bare `axios` import
// directly, with no `withCredentials` and no CSRF token attached. Since the
// backend uses session-cookie authentication with CORS_ALLOW_CREDENTIALS,
// requests made that way can silently fail to carry/receive the session
// cookie in any cross-origin setup (e.g. Vite dev server talking to Django
// on a different port), and POST/PUT/DELETE requests will be rejected by
// Django's CSRF protection once a view is no longer @csrf_exempt.
//
// Use this `api` client anywhere you would have used `axios` for a call to
// our own backend.

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

const getCSRFTokenFromCookie = () => {
  const name = 'csrftoken';
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(name + '=')) {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }
  return null;
};

const fetchCSRFToken = async () => {
  try {
    const response = await api.get('/api/exams/csrf/');
    if (response.data.csrfToken) {
      return response.data.csrfToken;
    }
  } catch {
    // fall through to cookie check below
  }
  return getCSRFTokenFromCookie();
};

api.interceptors.request.use(
  async (config) => {
    if (config.method && config.method !== 'get') {
      let csrfToken = getCSRFTokenFromCookie();
      if (!csrfToken) {
        csrfToken = await fetchCSRFToken();
      }
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
export { fetchCSRFToken, getCSRFTokenFromCookie };
