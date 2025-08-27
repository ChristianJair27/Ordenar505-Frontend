import axios from "axios";
import { removeUser } from "../redux/slices/userSlice";
import store from "../redux/store";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://192.168.1.78"; // ajusta si quieres

export const axiosWrapper = axios.create({
  baseURL: API_URL,
  withCredentials: false, // no usas cookies para auth
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 20000,
});

// REQUEST
axiosWrapper.interceptors.request.use(
  (config) => {
    const t = localStorage.getItem("access_token"); // 👈 clave única
    if (t) config.headers.Authorization = `Bearer ${t}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE
axiosWrapper.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;
    const here = window.location.pathname;

    if (status === 401) {
      store.dispatch(removeUser());
      localStorage.removeItem("access_token");
      // evita loop si ya estás en /profiles
      if (here !== "/profiles") window.location.href = "/profiles";
    }

    return Promise.reject({
      status,
      message: data?.message || "Error de conexión",
      data,
    });
  }
);
