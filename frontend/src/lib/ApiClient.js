import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ---- request interceptor: attach Bearer token from localStorage ----
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ---- response interceptor: surface auth failures consistently ----
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      // ⚠️ CONFIRM: apne existing AuthContext ke session-expiry handling se
      // match karo — e.g. localStorage clear + redirect to login, jaisa
      // baaki app mein already ho raha hai.
      console.warn("[apiClient] 401 Unauthorized — session may have expired");
    }
    return Promise.reject(error);
  },
);

export default apiClient;