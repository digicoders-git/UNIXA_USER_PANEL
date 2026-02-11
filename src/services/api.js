import axios from "axios";

// Environment variable handling
const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
});

// Request Interceptor: Add Authorization Header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("user-token"); // Ensure consistent key
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; 
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Unauthorized (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear storage and redirect to login if token is invalid
      localStorage.removeItem("user-token");
      localStorage.removeItem("user-data");
      // Optionally redirect: window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
