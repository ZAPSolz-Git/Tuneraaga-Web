import axios from "axios";
import { getAuthHeader } from "./supabaseClient";

const isDev = import.meta.env.DEV;

const rawBaseURL = isDev
  ? import.meta.env.VITE_DEV_API_URL || "http://localhost:5000"
  : import.meta.env.VITE_API_URL || "https://back.tuneraaga.in";

const baseURL = String(rawBaseURL).replace(/\/+$/, "");

if (isDev) {
  console.info("[apiClient] mode: development, baseURL:", baseURL);
}

const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const authHeader = await getAuthHeader();
      if (authHeader?.Authorization) {
        config.headers.Authorization = authHeader.Authorization;
      }
    } catch (err) {
      console.warn("[apiClient] could not read auth session:", err);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      console.warn("[apiClient] 401 Unauthorized, session may have expired");
    }
    return Promise.reject(error);
  },
);

export default apiClient;
