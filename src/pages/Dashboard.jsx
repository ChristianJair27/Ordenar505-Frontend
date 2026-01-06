import React, { useEffect } from "react";
import Metrics from "../components/dashboard/Metrics";

const Dashboard = () => {
  useEffect(() => {
    document.title = "La Peña de Santiago - Panel Inteligente";
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header limpio y profesional */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                La Peña de Santiago
              </h1>
              <p className="text-xl text-gray-600 mt-2">
                Panel de administración inteligente
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-sm">Fecha actual</p>
              <p className="text-2xl font-semibold text-gray-900">
                {new Date().toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal - con espacio y elegancia */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Aquí va todo el contenido de Metrics, con fondo blanco y diseño profesional */}
          <Metrics />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;