import axios from "axios";

const api = axios.create({
  baseURL: "https://arca-backend-208y.onrender.com",
});

// ✅ interceptor: adiciona token automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("arca_token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;