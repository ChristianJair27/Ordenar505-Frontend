// src/https/axiosWrapper.js
import axios from "axios";
import store from "../redux/store";
import { removeUser } from "../redux/slices/userSlice";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://192.168.1.78";

// ---------- helpers de sesión (multi-perfil) ----------
const ACCESS_PREFIX = "access_token:";       // p.ej. access_token:23
const CURRENT_UID_KEY = "current_user_id";   // p.ej. "23"

export const setActiveUser = (userId) => {
  if (userId == null) return;
  localStorage.setItem(CURRENT_UID_KEY, String(userId));
};

export const setAccessTokenForUser = (userId, token) => {
  if (userId == null) return;
  if (token) localStorage.setItem(`${ACCESS_PREFIX}${userId}`, token);
  else localStorage.removeItem(`${ACCESS_PREFIX}${userId}`);
};

export const getActiveUserId = () => localStorage.getItem(CURRENT_UID_KEY);

export const getActiveAccessToken = () => {
  // 1) intenta por usuario activo
  const uid = getActiveUserId();
  if (uid) {
    const byUser = localStorage.getItem(`${ACCESS_PREFIX}${uid}`);
    if (byUser) return byUser;
  }
  // 2) retro-compat: clave vieja única
  return localStorage.getItem("access_token") || null;
};

export const clearAllAccessTokens = () => {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(ACCESS_PREFIX) || k === "access_token")
    .forEach((k) => localStorage.removeItem(k));
  localStorage.removeItem(CURRENT_UID_KEY);
};

// ---------- axios instance ----------
export const axiosWrapper = axios.create({
  baseURL: API_URL,
  withCredentials: false, // si no usas cookies HttpOnly
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 20000,
});

// ---------- REQUEST ----------
axiosWrapper.interceptors.request.use(
  (config) => {
    const t = getActiveAccessToken();
    if (t) config.headers.Authorization = `Bearer ${t}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------- RESPONSE ----------
axiosWrapper.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;
    const here = window.location.pathname;

    if (status === 401) {
      try { store.dispatch(removeUser()); } catch {}
      // solo limpia el token del usuario activo
      const uid = getActiveUserId();
      if (uid) localStorage.removeItem(`${ACCESS_PREFIX}${uid}`);
      // también la clave vieja si existiera
      localStorage.removeItem("access_token");

      if (here !== "/profiles") window.location.href = "/profiles";
    }

    return Promise.reject({
      status,
      message: data?.message || "Error de conexión",
      data,
    });
  }
);
