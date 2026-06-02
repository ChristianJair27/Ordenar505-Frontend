import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import QRCode from "qrcode";
import { axiosWrapper } from "../https/axiosWrapper";
import Invoice from "../components/invoice/Invoice";
import { FiArrowLeft, FiPrinter, FiCreditCard, FiDollarSign } from "react-icons/fi";
import { FaCheckCircle, FaUserEdit, FaPlusCircle } from "react-icons/fa";
import { enqueueSnackbar } from "notistack";
import { getAvatarName } from "../utils";
import { formatDateAndTime } from "../utils";

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [showInvoice, setShowInvoice] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [waiterModalOpen, setWaiterModalOpen] = useState(false);
  const [waiters, setWaiters] = useState([]);
  const [selectedWaiter, setSelectedWaiter] = useState(null);
  const user = useSelector((state) => state.user.user);

  // Usa una sola base para todo
  const BASE = import.meta.env.VITE_BACKEND_URL;

  const fetchOrder = async () => {
    try {
      // Primero intenta plural
      try {
        const res = await axiosWrapper.get(`${BASE}/api/orders/${id}`, { withCredentials: true });
        setOrder(res.data.data || res.data);
        return;
      } catch (e) {
        if (!(e?.response?.status === 404)) throw e;
      }
      // Fallback singular
      const res2 = await axiosWrapper.get(`${BASE}/api/order/${id}`, { withCredentials: true });
      setOrder(res2.data.data || res2.data);
    } catch (error) {
      console.error("Error al obtener la orden:", error);
      enqueueSnackbar("No se pudo cargar la orden.", { variant: "error" });
    }
  };

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      // 1) Turno activo del CAJERO (usuario actual)
      const shiftResp = await axiosWrapper.get(`${BASE}/api/turno-actual`, {
        params: { user_id: user?.id },
        withCredentials: true,
      });
      const shift = shiftResp?.data;
      if (!shift) {
        enqueueSnackbar("No tienes un turno activo. Abre un turno primero.", {
          variant: "error",
          autoHideDuration: 5000,
        });
        return;
      }

      const amount = Number(order?.total_with_tax ?? order?.total ?? 0);
      if (!amount || Number.isNaN(amount)) {
        enqueueSnackbar("El total de la orden es inválido.", { variant: "error" });
        return;
      }

      // 2) ID del MESERO/CREADOR desde la ORDEN (dueño real de la venta)
      const waiterId = order?.user_id ?? null;
      const waiterName = order?.name ?? null;

      if (!waiterId) {
        enqueueSnackbar(
          "La orden no tiene user_id del mesero/creador. No se registrará la venta para evitar atribuirla mal.",
          { variant: "error", autoHideDuration: 6000 }
        );
        console.warn("Order sin user_id; order:", order);
        return;
      }

      // 3) Registrar movimiento de caja: DUEÑO = mesero (waiterId)
      await axiosWrapper.post(`${BASE}/api/cash-register`, {
        type: "venta",
        amount,                               // ✅ número
        payment_method: paymentMethod || "efectivo",
        order_id: Number(order.id),           // ✅ asegura número
        cashier_id: user?.id ?? null,         // ✅ quién cobra
        description: `Pago de Orden #${order.id} | Mesero: ${waiterName ?? "N/D"}`, // ✅ sin llave extra
        shift_id: shift?.id ?? null,
      }, { withCredentials: true });

      // 4) Actualizar orden como pagada
      const body = {
        orderStatus: "pagado",
        paymentMethod: paymentMethod,
        shift_id: shift.id,
        // Si tu backend guarda también quién cobró, puedes enviar:
        cashier_id: user?.id ?? null,
        // cashier_name: user?.name ?? null,
      };

      try {
        await axiosWrapper.put(`${BASE}/api/orders/${order.id}`, body, { withCredentials: true });
      } catch (e) {
        if (!(e?.response?.status === 404)) throw e;
        await axiosWrapper.put(`${BASE}/api/order/${order.id}`, body, { withCredentials: true });
      }

      // 5) Refrescar y mostrar factura
      await fetchOrder();
      enqueueSnackbar("¡Pago confirmado!", { variant: "success" });
      setShowInvoice(true);
    } catch (error) {
      console.error("Error al confirmar el pago:", error?.response?.data || error.message);
      enqueueSnackbar("No se pudo confirmar el pago.", { variant: "error" });
    } finally {
      setIsProcessing(false);
    }
  };

  // Cargar meseros
  const loadWaiters = async () => {
    try {
      let res = await axiosWrapper.get(`${BASE}/api/user/users?role=waiter`);
      let arr = res?.data?.data || res?.data?.users || [];
      if (!arr.length) {
        res = await axiosWrapper.get(`${BASE}/api/user?role=waiter`);
        arr = res?.data?.data || res?.data?.users || [];
      }
      setWaiters(arr);
    } catch (err) {
      enqueueSnackbar(`No pude cargar meseros. ${err?.response?.status || ""}`, { variant: "error" });
    }
  };

  const openChangeWaiter = async () => {
    setWaiterModalOpen(true);
    if (!waiters.length) await loadWaiters();
  };

  const assignWaiter = async () => {
    if (!selectedWaiter) {
      enqueueSnackbar("Selecciona un mesero.", { variant: "warning" });
      return;
    }
    try {
      await axiosWrapper.put(`${BASE}/api/order/${order.id}/assign-waiter`, {
        waiter_id: selectedWaiter,
      });
      enqueueSnackbar("Mesero actualizado.", { variant: "success" });
      setWaiterModalOpen(false);
      
      // Actualizar la orden después de cambiar el mesero
      await fetchOrder();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || "Error al actualizar mesero.", { variant: "error" });
    }
  };

  const FACTURACION_URL = "https://lapeñadesantiago.com/facturacion";

  const handleQuickPrint = async () => {
    let safeItems = order?.items || [];
    if (typeof safeItems === "string") {
      try { safeItems = JSON.parse(safeItems); } catch { safeItems = []; }
    }

    const dateStr = new Date(order?.order_date || Date.now()).toLocaleString("es-MX");
    const folioUrl = `${FACTURACION_URL}?folio=${order?.id}`;
    let qrImg = "";
    try {
      const qrDataUrl = await QRCode.toDataURL(folioUrl, {
        width: 140, margin: 1, errorCorrectionLevel: "M",
        color: { dark: "#000000", light: "#ffffff" },
      });
      qrImg = `<img src="${qrDataUrl}" width="110" height="110" style="display:block;margin:2mm auto 1mm" />`;
    } catch {}

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>La Peña de Santiago - Ticket</title>
  <style>
    @page { size: 58mm auto; margin: 0 2mm; }
    html, body {
      margin: 0; padding: 0;
      width: 54mm;
      font-family: 'Courier New', Courier, monospace;
      font-size: 14px;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .receipt { width: 54mm; box-sizing: border-box; padding: 2mm 0 8mm; }
    h2 { text-align: center; margin: 1mm 0; font-size: 17px; font-weight: 900; letter-spacing: 0.5px; }
    h3 { text-align: center; margin: 1.5mm 0 1mm; font-size: 14px; font-weight: 700; }
    p { margin: 1mm 0; font-size: 13px; }
    .center { text-align: center; }
    .muted { color: #222; text-align: center; font-size: 13px; }
    .line { border-top: 1px dashed #000; margin: 2.5mm 0; }
    .line-solid { border-top: 2px solid #000; margin: 2.5mm 0; }
    .row { display: flex; justify-content: space-between; align-items: baseline; }
    .items { list-style: none; padding: 0; margin: 0; }
    .item { display: flex; justify-content: space-between; margin: 1.2mm 0; font-size: 13px; }
    .item-name { flex: 1; padding-right: 2mm; word-break: break-word; }
    .item-price { white-space: nowrap; font-weight: 700; }
    .total { font-size: 16px; font-weight: 900; }
    .folio-box { border: 2px solid #000; padding: 2mm; margin: 2mm 0; text-align: center; }
    .folio-label { font-size: 12px; margin-bottom: 0.5mm; }
    .folio-num { font-size: 20px; font-weight: 900; letter-spacing: 3px; }
    .facturacion-section { margin-top: 3mm; }
    .facturacion-title { font-size: 13px; font-weight: 700; text-align: center; margin-bottom: 1mm; }
    .facturacion-url { font-size: 11px; text-align: center; word-break: break-all; }
    .facturacion-note { font-size: 11px; text-align: center; margin-top: 1.5mm; line-height: 1.4; }
    * { page-break-inside: avoid; }
  </style>
</head>
<body>
<div class="receipt">
  <h2>La Peña de Santiago</h2>
  <p class="muted">-- ¡Gracias por su visita! --</p>
  <div class="line-solid"></div>
  <div>
    <p><b>Orden:</b> #${order?.id ?? "N/A"}</p>
    <p><b>Nombre:</b> ${order?.name || order?.customer_name || "N/A"}</p>
    <p><b>Teléfono:</b> ${order?.phone || "N/A"}</p>
    <p><b>Comensales:</b> ${order?.guests || "N/A"}</p>
    <p><b>Mesa:</b> ${(order?.table?.table_no ?? order?.table_no ?? order?.table_id) || "N/A"}</p>
    <p><b>Fecha:</b> ${dateStr}</p>
  </div>
  <div class="line"></div>
  <h3>-- Platillos --</h3>
  <ul class="items">
    ${safeItems.map(it => `
    <li class="item">
      <span class="item-name">${it.item_name || it.name || "Artículo"} x${it.quantity || 1}</span>
      <span class="item-price">$${Number(it.price ?? it.total ?? 0).toFixed(2)}</span>
    </li>`).join("")}
  </ul>
  <div class="line"></div>
  <p class="center muted">* Precios incluyen todos los cargos</p>
  <div class="row total">
    <span>TOTAL:</span>
    <span>$${Number(order?.total ?? order?.total_with_tax ?? order?.totalWithTax ?? 0).toFixed(2)}</span>
  </div>
  <div class="line"></div>
  <p class="center" style="font-size:13px"><b>Método de pago:</b> ${order?.payment_method || "Pendiente"}</p>
  <div class="line-solid"></div>
  <div class="facturacion-section">
    <p class="facturacion-title">¿Necesitas factura? Escanea el QR o visita:</p>
    <p class="facturacion-url">${FACTURACION_URL}</p>
    ${qrImg}
    <div class="folio-box">
      <p class="folio-label">Tu número de folio es:</p>
      <p class="folio-num">${order?.id}</p>
    </div>
    <p class="facturacion-note">Tienes <b>24 horas</b> después de tu consumo<br/>para solicitar tu factura.</p>
  </div>
  <div class="line"></div>
  <p class="center muted"><b>¡Vuelva pronto!</b></p>
</div>
<script>
  setTimeout(function() { window.print(); window.close(); }, 100);
</script>
</body>
</html>`;

    const w = window.open("", "_blank", "width=400,height=900");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  // Ir al menú para AGREGAR artículos a esta orden
  
const handleAddItems = () => {
  navigate(`/menu?mode=append&orderId=${order.id}&returnTo=/`, {
    state: {
      mode: "append",
      orderId: order.id,
      lockRemoval: true,
      returnTo: "/",               // ← nuevo
    },
  });
};

  if (!order)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-pulse text-xl text-gray-600">Cargando orden...</div>
      </div>
    );

  // Verificación segura de propiedades con valores por defecto
  const customerName =
    order.customerDetails?.name ||
    order.name ||
    order.customer_name ||
    "Cliente";
  const avatarName = getAvatarName(customerName);

  // CORRECCIÓN: Definir orderDate antes de usarlo
  const orderDate = order?.order_date || order?.created_at;
  const formattedDate =
    !orderDate || isNaN(new Date(orderDate))
      ? "Fecha inválida"
      : formatDateAndTime(orderDate);

  const tableNo = String(
    order?.table_no || order?.table?.table_no || order?.table_id || "N/A"
  );

  // Normalizar items (array o stringified)
  let itemsList = order?.items || [];
  if (typeof itemsList === "string") {
    try {
      itemsList = JSON.parse(itemsList);
    } catch (e) {
      itemsList = [];
    }
  }
  const itemCount = Array.isArray(itemsList) ? itemsList.length : 0;

  // Estado
  const status = String(
    order.order_status || order.status || order.orderStatus || ""
  ).toLowerCase();
  const isCanceled = status.includes("cancel");

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
            <p
              className={`inline-flex items-center ${
                order.order_status === "pagado" ? "text-green-300" : "text-yellow-300"
              }`}
            >
              {order.order_status === "pagado" && <FaCheckCircle className="mr-1" />}
              {order.order_status}
            </p>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      {order.order_status !== "pagado" && !isCanceled && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleAddItems}
              className="flex items-center bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
              title="Agregar artículos a esta orden"
            >
              <FaPlusCircle className="mr-1" />
              Agregar artículos
            </button>

            <button
              onClick={openChangeWaiter}
              className="flex items-center bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
              title="Reasignar esta orden a otro mesero"
            >
              <FaUserEdit className="mr-1" />
              Cambiar mesero
            </button>

            <button
              onClick={handleQuickPrint}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
              title="Imprimir ticket de cliente (58mm)"
            >
              <FiPrinter className="mr-1" />
              Imprimir Ticket
            </button>
          </div>
        </div>
      )}

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
              {itemsList.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="py-3 px-4">{item.item_name}</td>
                  <td className="py-3 px-4 text-center">x{item.quantity}</td>
                  <td className="py-3 px-4 text-right">${item.price}</td>
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
            <span className="font-bold text-lg text-blue-600">
              ${Number(order.total_with_tax || 0).toFixed(2)}
            </span>
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
                className={`p-4 border rounded-lg flex flex-col items-center transition-all ${
                  paymentMethod === "efectivo" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <FiDollarSign className="text-2xl mb-2" />
                <span>Efectivo</span>
              </button>
              <button
                onClick={() => setPaymentMethod("tarjeta")}
                className={`p-4 border rounded-lg flex flex-col items-center transition-all ${
                  paymentMethod === "tarjeta" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <FiCreditCard className="text-2xl mb-2" />
                <span>Tarjeta</span>
              </button>
            </div>

            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className={`w-full py-4 rounded-lg font-bold text-white flex items-center justify-center gap-2 ${
                isProcessing ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
              } transition-colors`}
            >
              {isProcessing ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
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

      {/* Modal Cambiar Mesero */}
      {waiterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-3">Cambiar mesero</h3>
            <p className="text-sm text-gray-600 mb-4">
              Selecciona el nuevo mesero responsable de esta orden.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mesero
              </label>
              <select
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={selectedWaiter || ""}
                onChange={(e) => setSelectedWaiter(Number(e.target.value))}
              >
                <option value="" disabled>Selecciona un mesero</option>
                {waiters.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name || w.full_name || w.email || `ID ${w.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setWaiterModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={assignWaiter}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

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