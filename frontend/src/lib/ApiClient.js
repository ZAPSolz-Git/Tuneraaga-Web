import axios from "axios";
import { getAuthHeader } from "./supabaseClient";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ---- request interceptor: attach the Supabase session token ----
apiClient.interceptors.request.use(
  async (config) => {
    const authHeader = await getAuthHeader();
    if (authHeader.Authorization) {
      config.headers.Authorization = authHeader.Authorization;
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