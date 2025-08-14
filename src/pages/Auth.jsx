// Auth.js (Componente padre)
import React, { useEffect, useState } from "react";
import logo from "../assets/images/pena-logo.png";
import Register from "../components/auth/Register";
import Login from "../components/auth/Login";

const Auth = () => {
  useEffect(() => {
    document.title = "La Peña de Santiago | Auth";
  }, []);

  const [isRegister, setIsRegister] = useState(false);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Efecto de burbujas decorativas */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-40 h-40 rounded-full bg-blue-600 opacity-10 blur-xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-60 h-60 rounded-full bg-yellow-500 opacity-10 blur-xl"></div>
        
      </div>

      <div className="w-full max-w-md z-10">
        {/* Logo and Brand */}
        <div className="flex flex-col items-center mb-8">
          <img 
            src={logo} 
            alt="Restro Logo" 
            className="h-120 w-120 mb-3 rounded-lg shadow-lg object-cover" 
          />
          {/* <h1 className="text-3xl font-bold text-yellow-400">La Peña de Santiago</h1> */}
          <p className="text-gray-400 mt-1">Sistema de Punto de Venta</p>
        </div>

        {/* Auth Card con efecto de cristal */}
        <div className="backdrop-blur-sm bg-white/5 rounded-xl shadow-lg overflow-hidden border border-white/10">
          {/* Header */}
          <div className="bg-white/10 px-6 py-4 border-b border-white/10">
            <h2 className="text-2xl font-semibold text-white text-center">
              {isRegister ? "Crear Cuenta" : "Bienvenido"}
            </h2>
            <p className="text-gray-300 text-center text-sm mt-1">
              {isRegister ? "Regístrate para acceder al sistema" : "Inicia sesión para continuar"}
            </p>
          </div>

          {/* Form */}
          <div className="p-6">
            {isRegister ? (
              <Register setIsRegister={setIsRegister} />
            ) : (
              <Login />
            )}

            
          </div>
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
};

export default Auth;