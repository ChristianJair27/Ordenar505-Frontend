import React, { useEffect } from "react";
import Metrics from "../components/dashboard/Metrics";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { MdDashboard } from "react-icons/md";

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "La Peña de Santiago - Panel Admin";
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header consistente con el resto de la app */}
      <div className="bg-gradient-to-r from-indigo-700 to-violet-700 px-5 py-4 flex items-center justify-between sticky top-0 z-30 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="bg-white/15 text-white p-2 rounded-xl hover:bg-white/25 transition"
            title="Volver al inicio"
          >
            <FiArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-white text-lg font-bold flex items-center gap-2">
              <MdDashboard size={18} />
              Panel de Administración
            </h1>
            <p className="text-indigo-200 text-[11px]">La Peña de Santiago</p>
          </div>
        </div>
        <p className="text-indigo-200 text-xs capitalize hidden sm:block">
          {new Date().toLocaleDateString("es-ES", {
            weekday: "long", day: "numeric", month: "long", year: "numeric",
          })}
        </p>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Metrics />
      </main>
    </div>
  );
};

export default Dashboard;
