import axios from "axios";
import { removeUser } from "../redux/slices/userSlice";
import store from "../redux/store";

const defaultHeader = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

// 1. Corrige el nombre de la variable de entorno
const API_URL = import.meta.env.VITE_BACKEND_URL || 'https://a74c611b8875.ngrok-free.app';

export const axiosWrapper = axios.create({
  baseURL: API_URL, // Usa la variable corregida
  withCredentials: true, // Para cookies
  headers: { ...defaultHeader },
});

// Interceptor de solicitud
axiosWrapper.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  
  // 2. Solo agregar Authorization si existe token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.debug("✅ Token agregado a headers");
  }
  
  console.debug(`📨 Enviando petición a: ${config.url}`);
  return config;
}, (error) => {
  console.error("❌ Error en interceptor de solicitud:", error);
  return Promise.reject(error);
});

// Interceptor de respuesta
axiosWrapper.interceptors.response.use(
  (response) => {
    console.debug(`📬 Respuesta recibida de: ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;
    
    // 3. Mejor manejo de errores
    console.error(`❌ Error en petición (${status}):`, {
      url: error.config.url,
      message: data?.message || error.message,
      data
    });

    if (status === 401) {
      console.warn("⛔ Sesión expirada - Redirigiendo a login");
      store.dispatch(removeUser());
      localStorage.removeItem("token");
      window.location.href = "/auth";
    }
    
    // 4. Mantén el formato de error consistente
    return Promise.reject({
      status,
      message: data?.message || "Error de conexión",
      data
    });
  }
);