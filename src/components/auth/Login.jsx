import React, { useState } from "react";
import { FaLock, FaEnvelope, FaSignInAlt } from "react-icons/fa";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { login } from "../../https/index";
import { enqueueSnackbar } from "notistack";
import { useDispatch } from "react-redux";
import { setUser } from "../../redux/slices/userSlice";
import { useNavigate } from "react-router-dom";
import { axiosWrapper } from "../../https/axiosWrapper";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false); // opcional; react-query también tiene estado

  const handleChange = (e) => {
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const loginMutation = useMutation({
    mutationFn: (reqData) => login(reqData), // tu helper en https/index.js
    onSuccess: async (res) => {
      try {
        // Normaliza posibles formas de respuesta
        const payload = res?.data?.data || res?.data || {};
        const token =
          payload?.token ||
          payload?.accessToken ||
          res?.data?.token ||
          res?.data?.accessToken;

        if (!token) {
          enqueueSnackbar("No se recibió token del servidor.", { variant: "error" });
          return;
        }

        // ✅ Guarda el token válido para todo el flujo
        localStorage.setItem("access_token", token);
        localStorage.removeItem("token"); // limpia la vieja clave por compatibilidad

        // Intenta tomar user de la respuesta; si no viene, consulta /users/me
        let user =
          payload?.user ||
          res?.data?.user ||
          null;

        if (!user) {
          const me = await axiosWrapper.get("/users/me");
          user = me?.data;
        }

        if (!user) {
          enqueueSnackbar("No se pudo obtener el perfil de usuario.", { variant: "warning" });
        } else {
          const { id, name, email, phone, role } = user;
          dispatch(setUser({ id, name, email, phone, role }));
        }

        enqueueSnackbar("Sesión iniciada", { variant: "success" });
        navigate("/", { replace: true });
      } catch (e) {
        enqueueSnackbar(e?.message || "Error finalizando el inicio de sesión", { variant: "error" });
      }
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || "Credenciales inválidas";
      enqueueSnackbar(msg, { variant: "error" });
    },
    onSettled: () => setIsLoading(false),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    loginMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-1">Correo Electrónico</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaEnvelope className="text-gray-400" />
          </div>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="ejemplo@restro.com"
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/5 border border-white/10 rounded-lg focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all text-white placeholder-gray-400"
            autoComplete="username"
            required
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-1">Contraseña</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaLock className="text-gray-400" />
          </div>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/5 border border-white/10 rounded-lg focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all text-white placeholder-gray-400"
            autoComplete="current-password"
            required
          />
        </div>
      </div>

      {/* Submit */}
      <motion.button
        type="submit"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-gray-900 bg-yellow-400 hover:bg-yellow-300 transition-all mt-4 disabled:bg-yellow-500 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Procesando...
          </>
        ) : (
          <>
            <FaSignInAlt />
            Iniciar Sesión
          </>
        )}
      </motion.button>
    </form>
  );
};

export default Login;
