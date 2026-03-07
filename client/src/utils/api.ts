import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('nexus_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('nexus_token');
      if (!window.location.pathname.includes('/auth')) window.location.href = '/auth';
    }
    return Promise.reject(err);
  }
);

export default api;
