import axios from "axios";
import toast from "react-hot-toast";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

api.interceptors.response.use(
  (res) => res.data, // backend ya devuelve { ok, data, error }
  (err) => {
    const payload = err.response?.data;
    const code = payload?.error?.code;
    const msg = payload?.error?.message || err.message || "Error de red";
    // No spammear toast en queries deshabilitadas
    if (err.config?._silent !== true) {
      toast.error(`${code ? `[${code}] ` : ""}${msg}`);
    }
    return Promise.reject(payload || { ok: false, error: { message: msg, code } });
  }
);

export const setSilent = (config = {}) => ({ ...config, _silent: true });
