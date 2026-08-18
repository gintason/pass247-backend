import axios from 'axios';

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
    // fall back to cookie
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

    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
export { fetchCSRFToken, getCSRFTokenFromCookie };