import { useState, useEffect } from "react";
import BottomNav from "../components/shared/BottomNav";
import OrderCard from "../components/orders/OrderCard";
import BackButton from "../components/shared/BackButton";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getOrders } from "../https/index";
import { useSnackbar } from "notistack";
import Invoice from "../components/invoice/Invoice";
import { FiRefreshCw } from "react-icons/fi";
import { FaUtensils, FaFilter } from "react-icons/fa";

const Orders = () => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [filter, setFilter] = useState("progress"); // 'progress' o 'completed'
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    document.title = "La Peña de Santiago | Órdenes";
  }, []);

  const { 
    data: ordersResponse, 
    isError, 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ["orders"],
    queryFn: getOrders,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (isError) {
      enqueueSnackbar("Error al cargar las órdenes", { variant: "error" });
    }
  }, [isError, enqueueSnackbar]);

  // Extraer y filtrar órdenes según el filtro seleccionado
  const ordersData = ordersResponse?.data?.data || [];

  const filteredOrders = ordersData.filter(order => {
    const status = String(order.order_status || order.status || "").toLowerCase();
    
    if (filter === "progress") {
      return !status.includes("complete") && 
             !status.includes("pagado") && 
             !status.includes("cancel") &&
             !status.includes("finaliz");
    } else { // 'completed'
      return status.includes("complete") || 
             status.includes("pagado") ||
             status.includes("finaliz");
    }
  });

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-2xl font-bold text-gray-800">
              {filter === "progress" ? "Órdenes en Progreso" : "Órdenes Completadas"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
                onClick={() => setFilter(prev => prev === "progress" ? "completed" : "progress")}
              >
                <FaFilter />
                {filter === "progress" ? "Ver Completadas" : "Ver en Progreso"}
              </button>
            </div>
            <button 
              onClick={() => refetch()}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <FiRefreshCw className={`${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 overflow-auto p-6 bg-gray-100">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                isCompleted={filter === "completed"}
                onInvoiceClick={() => {
                  setSelectedOrder(order);
                  setShowInvoice(true);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="bg-gray-200 rounded-full p-6 mb-4">
              <FaUtensils className="text-gray-500 text-4xl" />
            </div>
            <p className="text-xl text-gray-500 mb-2">
              {filter === "progress" 
                ? "No hay órdenes en progreso" 
                : "No hay órdenes completadas"}
            </p>
            <p className="text-gray-400 mb-4">
              {ordersData.length > 0 
                ? `Hay órdenes pero no están ${filter === "progress" ? "en progreso" : "completadas"}` 
                : "No se encontraron órdenes"}
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        )}
      </main>

      {/* Barra de navegación inferior */}
      <BottomNav />

      {/* Modal de factura */}
      {showInvoice && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <Invoice 
              orderInfo={selectedOrder} 
              setShowInvoice={setShowInvoice} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;