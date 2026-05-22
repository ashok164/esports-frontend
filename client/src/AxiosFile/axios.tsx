import axios from "axios";
import { API_BASE_URL } from "../Routes/ApiRoutes/apiRoutes";

const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("tournament_auth_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

const http = {
  get: (url: string, config?: any) => instance.get(url, config),
  post: (url: string, data?: any, config?: any) => instance.post(url, data, config),
  put: (url: string, data?: any, config?: any) => instance.put(url, data, config),
  patch: (url: string, data?: any, config?: any) => instance.patch(url, data, config),
  delete: (url: string, config?: any) => instance.delete(url, config),
};

export default http;
