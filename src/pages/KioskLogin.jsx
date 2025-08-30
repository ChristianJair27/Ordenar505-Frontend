// src/pages/KioskLogin.jsx
import { useEffect, useState } from "react";
import { axiosWrapper } from "../https/axiosWrapper";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/slices/userSlice";
import { enqueueSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaSearch, FaSyncAlt } from "react-icons/fa";
import logo from "../assets/images/pena-logo.png";

const initials = (name = "") => {
  const p = String(name).trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "M";
  return (p[0][0] + (p[1]?.[0] ?? "")).toUpperCase();
};

const tileColor = (name = "") => {
  const h = Array.from(name).reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return `hsl(${h} 70% 40%)`;
};

export default function KioskLogin() {
  const [waiters, setWaiters] = useState([]);
  const [filteredWaiters, setFilteredWaiters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Filtrar meseros según término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredWaiters(waiters);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = waiters.filter(waiter => 
        waiter.name.toLowerCase().includes(term) || 
        (waiter.role && waiter.role.toLowerCase().includes(term))
      );
      setFilteredWaiters(filtered);
    }
  }, [waiters, searchTerm]);

  const fetchWaiters = async (showLoading = true) => {
    if (showLoading) setRefreshing(true);
    try {
      const API = import.meta.env.VITE_BACKEND_URL;
      const { data } = await axiosWrapper.get(`${API}/api/auth/kiosk/waiters`);
      setWaiters(data?.data || []);
    } catch (e) {
      enqueueSnackbar("No se pudo cargar la lista de meseros", { variant: "error" });
    } finally {
      if (showLoading) setRefreshing(false);
    }
  };

  useEffect(() => {
    document.title = "La Peña de Santiago | Perfiles de Meseros";
    fetchWaiters(false); // Carga inicial sin mostrar spinner
  }, []);

  const enterAs = async (w) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const API = import.meta.env.VITE_BACKEND_URL;
      const { data } = await axiosWrapper.post(`${API}/api/auth/kiosk/waiter-login`, {
        user_id: w.id,
      });
      const { token, user } = data?.data || {};
      if (!token || !user) throw new Error("Respuesta inválida");

      localStorage.setItem("access_token", token);
      dispatch(setUser(user));
      enqueueSnackbar(`¡Bienvenido, ${user.name}!`, { variant: "success" });

      // Usar navigate en lugar de window.location para una transición más suave
      navigate("/", { replace: true });
    } catch (e) {
      enqueueSnackbar("No se pudo iniciar sesión", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Efecto de burbujas decorativas */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-40 h-40 rounded-full bg-blue-600 opacity-10 blur-xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-60 h-60 rounded-full bg-yellow-500 opacity-10 blur-xl"></div>
      </div>

      <div className="w-full max-w-4xl z-10 flex flex-col items-center">
        {/* Logo and Brand */}
        <div className="flex flex-col items-center mb-8">
          <img 
            src={logo} 
            alt="La Peña de Santiago Logo" 
            className="h-64 w-64 mb-3 rounded-lg shadow-lg object-cover" 
          />
          <p className="text-gray-400 mt-1">Sistema de Punto de Venta</p>
        </div>

        {/* Card con efecto de cristal */}
        <div className="backdrop-blur-sm bg-white/5 rounded-xl shadow-lg overflow-hidden border border-white/10 w-full">
          {/* Header */}
          <div className="bg-white/10 px-6 py-4 border-b border-white/10">
            <h2 className="text-2xl font-semibold text-white text-center">
              ¿Quién toma la orden?
            </h2>
            <p className="text-gray-300 text-center text-sm mt-1">
              Selecciona tu perfil para comenzar
            </p>
          </div>

          {/* Contenido */}
          <div className="p-6">
            {/* Barra de búsqueda */}
            <div className="relative max-w-md mx-auto mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar mesero..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white placeholder-gray-400"
              />
              <button
                onClick={() => fetchWaiters()}
                disabled={refreshing}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-yellow-400 transition-colors"
                title="Actualizar lista"
              >
                <FaSyncAlt className={refreshing ? "animate-spin" : ""} />
              </button>
            </div>

            {/* Grid de meseros */}
            <div className="flex-1">
              {filteredWaiters.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-lg text-gray-400">
                    {searchTerm ? "No se encontraron meseros" : "No hay meseros disponibles"}
                  </p>
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm("")}
                      className="mt-4 text-yellow-400 hover:text-yellow-300 font-medium"
                    >
                      Limpiar búsqueda
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredWaiters.map((w) => (
                    <button
                      key={w.id}
                      disabled={loading}
                      onClick={() => enterAs(w)}
                      className="group rounded-xl overflow-hidden shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 bg-white/5 border border-white/10 hover:border-yellow-400/30"
                      title={w.name}
                    >
                      <div className="aspect-square w-full relative flex items-center justify-center bg-white/5">
                        {w.avatar_url ? (
                          <img
                            src={w.avatar_url}
                            alt={w.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : null}
                        {!w.avatar_url && (
                          <div
                            className="w-20 h-20 flex items-center justify-center text-3xl font-black rounded-full"
                            style={{ background: tileColor(w.name) }}
                          >
                            {initials(w.name)}
                          </div>
                        )}
                        {loading && (
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      <div className="p-3 text-center">
                        <div className="font-semibold truncate text-white">{w.name}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {w.role === "waiter" ? "Mesero" : w.role}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-6 text-sm text-gray-400 text-center">
                ¿No ves tu perfil? Pídele al admin que te habilite.
              </div>
            </div>
          </div>
        </div>

        {/* Botón especial para Admin */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate("/auth")}
            className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-lg text-white font-bold border border-white/10"
          >
            <FaUserCircle className="mr-2 text-xl" />
            Ingresar como Administrador
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Design by Revolution505.
          </p>
        </div>
      </div>
    </div>
  );
}