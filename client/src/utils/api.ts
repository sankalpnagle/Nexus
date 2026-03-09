import axios from "axios";

const API_BASE_URL = import.meta.env.PROD
  ? "/api"
  : (import.meta.env.VITE_API_URL ?? "/api");

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("nexus_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("nexus_token");
      if (!window.location.pathname.includes("/auth"))
        window.location.href = "/auth";
    }
    return Promise.reject(err);
  },
);

export default api;
