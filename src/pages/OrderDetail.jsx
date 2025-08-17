import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { axiosWrapper } from "../https/axiosWrapper";
import Invoice from "../components/invoice/Invoice";
import { FiArrowLeft, FiPrinter, FiCreditCard, FiDollarSign } from "react-icons/fi";
import { FaCheckCircle } from "react-icons/fa";
import { enqueueSnackbar } from "notistack";

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [showInvoice, setShowInvoice] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const user = useSelector((state) => state.user.user);

  const fetchOrder = async () => {
    const API_URL = import.meta.env.VITE_API_URL;
    try {
      const res = await axiosWrapper.get(`${API_URL}/api/orders/${id}`);
      setOrder(res.data.data);
    } catch (error) {
      console.error("Error al obtener la orden:", error);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {


// 1. Verificar si hay turno activo primero
      const shiftResponse = await axiosWrapper.get('/api/turno-actual', {
        params: { user_id: user?.id }
      });

      if (!shiftResponse.data) {
        enqueueSnackbar("No tienes un turno activo. Por favor abre un turno primero.", { 
          variant: "error",
          autoHideDuration: 5000
        });
        return;
      }


      await axiosWrapper.post(`${import.meta.env.VITE_BACKEND_URL}/api/cash-register`, {
        type: "venta",
        amount: order.total_with_tax,
        payment_method: paymentMethod,
        order_id: order.id,
        description: "Pago de Orden",
        user_id: user?.id || null,
        shift_id: shiftResponse.data.id // Incluir el ID del turno
      }, {
        withCredentials: true
      });

      await axiosWrapper.put(`${import.meta.env.VITE_BACKEND_URL}/api/orders/${order.id}`, {
        status: "pagado",
        payment_method: paymentMethod,
        shift_id: shiftResponse.data.id
      });

      await fetchOrder();
      setShowInvoice(true);
    } catch (error) {
      console.error("Error al confirmar el pago:", error.response?.data || error.message);
      alert("No tienes un turno activo.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!order) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-pulse text-xl text-gray-600">Cargando orden...</div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Detalle de Orden</h1>
          <button 
            onClick={() => window.history.back()}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
          >
            <FiArrowLeft /> Volver
          </button>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold">Cliente:</p>
            <p>{order.name || "Consumidor final"}</p>
          </div>
          <div>
            <p className="font-semibold">Mesa:</p>
            <p>{order.table?.table_no || "N/A"}</p>
          </div>
          <div>
            <p className="font-semibold">Fecha:</p>
            <p>{new Date(order.order_date).toLocaleString()}</p>
          </div>
          <div>
            <p className="font-semibold">Estado:</p>
            <p className={`inline-flex items-center ${order.order_status === 'pagado' ? 'text-green-300' : 'text-yellow-300'}`}>
              {order.order_status === 'pagado' && <FaCheckCircle className="mr-1" />}
              {order.order_status}
            </p>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FiPrinter /> Detalle del Pedido
        </h2>
        
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left">Producto</th>
                <th className="py-3 px-4 text-center">Cantidad</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-3 px-4">{item.item_name}</td>
                  <td className="py-3 px-4 text-center">x{item.quantity}</td>
                  <td className="py-3 px-4 text-right">${(item.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span>Subtotal:</span>
            <span className="font-medium">${Number(order.total || 0).toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between py-2">
            <span className="font-bold text-lg">Total:</span>
            <span className="font-bold text-lg text-blue-600">${Number(order.total_with_tax || 0).toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Section */}
        {order.order_status !== "pagado" ? (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FiCreditCard /> Método de Pago
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setPaymentMethod("efectivo")}
                className={`p-4 border rounded-lg flex flex-col items-center transition-all ${paymentMethod === 'efectivo' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
              >
                <FiDollarSign className="text-2xl mb-2" />
                <span>Efectivo</span>
              </button>
              <button
                onClick={() => setPaymentMethod("tarjeta")}
                className={`p-4 border rounded-lg flex flex-col items-center transition-all ${paymentMethod === 'tarjeta' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
              >
                <FiCreditCard className="text-2xl mb-2" />
                <span>Tarjeta</span>
              </button>
            </div>

            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className={`w-full py-4 rounded-lg font-bold text-white flex items-center justify-center gap-2 ${isProcessing ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} transition-colors`}
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </>
              ) : (
                <>Confirmar Pago</>
              )}
            </button>
          </div>
        ) : (
          <div className="mt-8">
            <button
              onClick={() => setShowInvoice(true)}
              className="w-full py-4 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-colors"
            >
              <FiPrinter /> Imprimir Factura
            </button>
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      {showInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <Invoice orderInfo={order} setShowInvoice={setShowInvoice} />
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;