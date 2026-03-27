import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;
const BASE_URL = API_URL?.replace('/api', '') || 'http://localhost:5000';

export const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
};

const api = axios.create({
  baseURL: API_URL,
});

// Request Interceptor: Add Authorization Header
api.interceptors.request.use(
  (config) => {
    try {
      const tokenData = localStorage.getItem("userToken");
      if (tokenData) {
        const { token } = JSON.parse(tokenData);
        if (token) config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {}
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Unauthorized (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("userToken");
      localStorage.removeItem("userData");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
