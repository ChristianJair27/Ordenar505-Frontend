import React, { useState, useRef, useEffect } from "react";
import { FaSearch, FaBell, FaUserCircle, FaChevronDown, FaStore } from "react-icons/fa";
import { IoLogOut } from "react-icons/io5";
import { MdDashboard, MdPointOfSale } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { useMutation } from "@tanstack/react-query";
import { logout } from "../../https";
import { removeUser } from "../../redux/slices/userSlice";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/images/logoHorizon.png";

const Header = () => {
  const userData = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const userButtonRef = useRef(null); // Ref para el botón de usuario

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Si el clic no fue en el dropdown ni en el botón que lo abre
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        userButtonRef.current &&
        !userButtonRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside); // Corregido: Usar handleClickOutside aquí
    };
  }, []);

  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      localStorage.removeItem("token");
      dispatch(removeUser());
      navigate("/auth");
    },
    onError: (error) => {
      console.error("Logout error:", error);
      // Opcional: mostrar un snackbar de error de logout
      // enqueueSnackbar("Error al cerrar sesión.", { variant: "error" });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-700 to-blue-900 shadow-xl border-b border-blue-900">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3"> {/* Altura y padding ajustados */}
          {/* Logo y marca */}
          <div
            onClick={() => navigate("/")}
            className="flex items-center gap-3 cursor-pointer group" // Añadimos 'group' para efectos de hover
          >
            <img src={logo} className="h-24 w-auto filter brightness-125 saturate-150 group-hover:scale-105 transition-transform duration-200" alt="La Patita Del Santiago Logo" /> {/* Ajuste de tamaño y efectos */}
            <span className="text-white text-2xl font-extrabold tracking-tight group-hover:text-blue-200 transition-colors hidden sm:block">
              
            </span>
          </div>


          {/* Controles de usuario y notificaciones */}
          <div className="flex items-center space-x-4 lg:space-x-6">
            {/* Botón de Dashboard (Solo para Admin) */}
            {userData.role === "admin" && (
              <button
                onClick={() => navigate("/dashboard")}
                className="p-3 rounded-full text-blue-200 hover:text-white hover:bg-blue-600 transition-colors duration-200 shadow-md flex items-center justify-center group"
                title="Panel de Administración"
                aria-label="Ir al Panel de Administración"
              >
                <MdDashboard className="text-2xl group-hover:scale-110 transition-transform" />
                <span className="hidden lg:inline ml-2 text-base font-semibold">Dashboard</span>
              </button>
            )}

            {/* Botón de Cajero (Solo para Cajero) */}
            {userData.role === "cajero" && (
              <button
                onClick={() => navigate("/cashier-dashboard")}
                className="p-3 rounded-full text-green-200 hover:text-white hover:bg-green-600 transition-colors duration-200 shadow-md flex items-center justify-center group"
                title="Mi Caja"
                aria-label="Ir a Mi Caja"
              >
                <MdPointOfSale className="text-2xl group-hover:scale-110 transition-transform" />
                <span className="hidden lg:inline ml-2 text-base font-semibold">Mi Caja</span>
              </button>
            )}

            {/* Botón de Notificaciones */}
            <button
              className="p-3 rounded-full text-blue-200 hover:text-white hover:bg-blue-600 relative transition-colors duration-200 shadow-md flex items-center justify-center group"
              title="Notificaciones"
              aria-label="Ver Notificaciones"
            >
              <FaBell className="text-2xl group-hover:scale-110 transition-transform" />
              {/* Indicador de nuevas notificaciones */}
              <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-red-500 border-2 border-blue-900 animate-pulse"></span>
            </button>

            {/* Menú de Usuario desplegable */}
            <div className="relative" ref={dropdownRef}>
              <button
                ref={userButtonRef} // Asignamos la ref aquí
                className="flex items-center space-x-2 p-2 pr-3 rounded-full bg-blue-800 hover:bg-blue-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-md"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <FaUserCircle className="text-3xl text-blue-300" /> {/* Ícono de usuario más grande */}
                <div className="ml-2 text-left hidden lg:block"> {/* Ocultar en md, mostrar en lg+ */}
                  <p className="text-sm font-semibold text-white truncate max-w-[120px]">
                    {userData.name || "Usuario"}
                  </p>
                  <p className="text-xs text-blue-200 opacity-80 capitalize">
                    {userData.role || "Rol"}
                  </p>
                </div>
                <FaChevronDown className={`text-blue-300 ml-2 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
              </button>

              {/* Menú desplegable */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-2 z-50 border border-gray-200 animate-dropdown-fade-in origin-top-right">
                  {/* Información del usuario en el dropdown */}
                  <div className="px-4 py-3 border-b border-gray-100 mb-2">
                    <p className="text-sm font-semibold text-gray-800">
                      {userData.name || "Usuario"}
                    </p>
                    <p className="text-xs text-gray-500 capitalize mt-1">
                      {userData.role || "Rol"}
                    </p>
                  </div>
                  {/* Enlaces del dropdown */}
                  {userData.role === "admin" && (
                    <button
                      onClick={() => { navigate("/dashboard"); setIsDropdownOpen(false); }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 w-full text-left transition-colors"
                    >
                      <MdDashboard className="mr-3 text-lg" />
                      Panel de Administración
                    </button>
                  )}
                  {userData.role === "cajero" && (
                    <button
                      onClick={() => { navigate("/cashier-dashboard"); setIsDropdownOpen(false); }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-green-600 w-full text-left transition-colors"
                    >
                      <MdPointOfSale className="mr-3 text-lg" />
                      Mi Caja
                    </button>
                  )}
                   <button
                    onClick={() => { /* Navegar a perfil de usuario si existe */ setIsDropdownOpen(false); }}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-purple-600 w-full text-left transition-colors"
                  >
                    <FaUserCircle className="mr-3 text-lg" />
                    Mi Perfil
                  </button>
                  <div className="border-t border-gray-100 my-2"></div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors font-medium"
                  >
                    <IoLogOut className="mr-3 text-lg" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Estilos para animación del dropdown */}
      <style>{`
        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-5px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-dropdown-fade-in {
          animation: dropdownFadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </header>
  );
};

export default Header;