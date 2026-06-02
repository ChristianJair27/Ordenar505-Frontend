import PropTypes from "prop-types";
import { FaUserEdit, FaUtensils, FaReceipt, FaPrint, FaPlusCircle } from "react-icons/fa";
import { BsClockHistory, BsCheckCircleFill } from "react-icons/bs";
import { MdTableRestaurant } from "react-icons/md";
import { getAvatarName } from "../../utils/index";
import { useNavigate } from "react-router-dom";
import { formatDateAndTime } from "../../utils";
import { axiosWrapper } from "../../https/axiosWrapper";
import { enqueueSnackbar } from "notistack";
import { useState } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import QRCode from "qrcode";

const FACTURACION_URL = "https://lapeñadesantiago.com/facturacion";

const OrderCard = ({
  order,
  isCompleted = false,
  onInvoiceClick = () => {},
}) => {
  const navigate = useNavigate();
  const userData = useSelector((s) => s.user);
  const isAdmin  = String(userData?.role || "").toLowerCase() === "admin";

  const [waiterModalOpen, setWaiterModalOpen] = useState(false);
  const [waiters,         setWaiters]         = useState([]);
  const [selectedWaiter,  setSelectedWaiter]  = useState(null);

  const loadWaiters = async () => {
    try {
      let res = await axiosWrapper.get(`/api/user/users?role=waiter`);
      let arr = res?.data?.data || res?.data?.users || [];
      if (!arr.length) {
        res = await axiosWrapper.get(`/api/user?role=waiter`);
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
    if (!selectedWaiter) { enqueueSnackbar("Selecciona un mesero.", { variant: "warning" }); return; }
    try {
      await axiosWrapper.put(`/api/order/${order.id}/assign-waiter`, { waiter_id: selectedWaiter });
      enqueueSnackbar("Mesero actualizado.", { variant: "success" });
      setWaiterModalOpen(false);
      window.location.reload();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || "Error al actualizar mesero.", { variant: "error" });
    }
  };

  /* ── Datos del order ── */
  const customerName = order.customerDetails?.name || order.name || order.customer_name || "Cliente";
  const avatarName   = getAvatarName(customerName);
  const orderDate    = order?.order_date || order?.created_at;
  const formattedDate = !orderDate || isNaN(new Date(orderDate))
    ? "—" : formatDateAndTime(orderDate);
  const tableNo      = String(order?.table_no || order?.table?.table_no || order?.table_id || "N/A");
  const orderId      = order.id ? String(order.id).slice(-6) : "N/A";

  let items = order?.items || [];
  if (typeof items === "string") { try { items = JSON.parse(items); } catch { items = []; } }
  const itemCount = Array.isArray(items) ? items.length : 0;

  const totalWithTax = Number(order.total_with_tax || order.totalWithTax || order.total || 0).toFixed(2);

  const status     = String(order.order_status || order.status || order.orderStatus || "").toLowerCase();
  const isReady    = status.includes("ready") || status.includes("listo");
  const isCanceled = status.includes("cancel");

  /* ── Impresión rápida ── */
  const handleQuickPrint = async () => {
    let safeItems = order?.items || [];
    if (typeof safeItems === "string") { try { safeItems = JSON.parse(safeItems); } catch { safeItems = []; } }
    const dateStr = new Date(order?.order_date || Date.now()).toLocaleString("es-MX");
    const ordId = order?.id ?? "N/A";
    const folioUrl = `${FACTURACION_URL}?folio=${ordId}`;

    let qrImg = "";
    try {
      const dataUrl = await QRCode.toDataURL(folioUrl, { width: 140, margin: 1, errorCorrectionLevel: "M" });
      qrImg = `<img src="${dataUrl}" width="110" height="110" style="display:block;margin:2mm auto 1mm"/>`;
    } catch {}

    const html = `<!doctype html><html><head><meta charset="utf-8"/>
<title>Ticket</title>
<style>
@page{size:58mm auto;margin:0 2mm}
html,body{margin:0;padding:0;width:54mm;font-family:'Courier New',Courier,monospace;font-size:14px;line-height:1.5}
.r{width:54mm;box-sizing:border-box;padding:2mm 0 8mm}
h2{text-align:center;margin:1mm 0;font-size:17px;font-weight:900;letter-spacing:0.5px}
h3{text-align:center;margin:1.5mm 0 1mm;font-size:14px;font-weight:700}
p{margin:1mm 0;font-size:13px}
.center{text-align:center}
.muted{color:#222;text-align:center;font-size:13px}
.line{border-top:1px dashed #000;margin:2.5mm 0}
.solid{border-top:2px solid #000;margin:2.5mm 0}
.row{display:flex;justify-content:space-between;font-size:16px;font-weight:900}
.items{list-style:none;padding:0;margin:0}
.item{display:flex;justify-content:space-between;margin:1.2mm 0;font-size:13px}
.item-name{flex:1;padding-right:2mm;word-break:break-word}
.item-price{white-space:nowrap;font-weight:700}
.folio-box{border:2px solid #000;padding:2mm;margin:2mm 0;text-align:center}
.folio-label{font-size:12px;margin-bottom:0.5mm}
.folio-num{font-size:20px;font-weight:900;letter-spacing:3px}
.fac-title{font-size:13px;font-weight:700;text-align:center;margin-bottom:1mm}
.fac-url{font-size:11px;text-align:center;word-break:break-all}
.fac-note{font-size:11px;text-align:center;margin-top:1.5mm;line-height:1.4}
*{page-break-inside:avoid}
</style></head><body><div class="r">
<h2>La Peña de Santiago</h2>
<p class="muted">-- ¡Gracias por su visita! --</p>
<div class="solid"></div>
<p><b>Orden:</b> #${ordId}</p>
<p><b>Nombre:</b> ${order?.name||order?.customer_name||'N/A'}</p>
<p><b>Mesa:</b> ${tableNo}</p>
<p><b>Fecha:</b> ${dateStr}</p>
<div class="line"></div>
<h3>-- Platillos --</h3>
<ul class="items">${safeItems.map(it=>`<li class="item"><span class="item-name">${it.item_name||it.name||'Artículo'}${it.quantity?` x${it.quantity}`:''}</span><span class="item-price">$${Number(it.price??it.total??0).toFixed(2)}</span></li>`).join('')}</ul>
<div class="line"></div>
<p class="center muted">* Precios incluyen todos los cargos</p>
<div class="row"><span>TOTAL:</span><span>$${Number(order?.total??order?.total_with_tax??0).toFixed(2)}</span></div>
<div class="line"></div>
<p class="center" style="font-size:11px"><b>Método:</b> ${order?.payment_method||'Pendiente'}</p>
<div class="solid"></div>
<p class="fac-title">¿Necesitas factura? Escanea el QR o visita:</p>
<p class="fac-url">${FACTURACION_URL}</p>
${qrImg}
<div class="folio-box"><p class="folio-label">Tu número de folio es:</p><p class="folio-num">${ordId}</p></div>
<p class="fac-note">Tienes <b>24 horas</b> después de tu consumo<br/>para solicitar tu factura.</p>
<div class="line"></div>
<p class="center muted"><b>¡Vuelva pronto!</b></p>
</div><script>setTimeout(function(){window.print();window.close();},100);</script></body></html>`;

    const w = window.open("", "_blank", "width=400,height=900");
    if (!w) return;
    w.document.open(); w.document.write(html); w.document.close();
  };

  const handleAddItems = () => {
    navigate(`/menu?mode=append&orderId=${order.id}`, {
      state: { mode: "append", orderId: order.id, lockRemoval: true },
      replace: false,
    });
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-200">

        {/* ── Cabecera de la tarjeta ── */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-white/20 rounded-xl p-1.5">
              <FaUtensils className="text-white text-sm" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">Orden #{orderId}</p>
              <p className="text-indigo-200 text-[10px] mt-0.5">{formattedDate}</p>
            </div>
          </div>
          {/* Badge de estado */}
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
            isCanceled ? "bg-red-100 text-red-700"
            : isReady  ? "bg-emerald-100 text-emerald-700"
            : "bg-amber-100 text-amber-700"
          }`}>
            {isCanceled ? "Cancelada" : isReady ? "Lista ✓" : "En prep."}
          </span>
        </div>

        {/* ── Cuerpo ── */}
        <div className="px-4 py-3 space-y-3">

          {/* Cliente + mesa + artículos */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
              {avatarName}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-800 font-semibold text-sm truncate">{customerName}</p>
              <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <MdTableRestaurant size={12} /> Mesa {tableNo}
                </span>
                <span>{itemCount} artículo{itemCount !== 1 ? "s" : ""}</span>
              </div>
            </div>
            {/* Total */}
            <div className="text-right shrink-0">
              <p className="text-[10px] text-gray-400 font-medium">Total</p>
              <p className="text-indigo-700 font-black text-lg leading-none">${totalWithTax}</p>
            </div>
          </div>

          {/* Barra de estado */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
            isReady    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
            : isCanceled ? "bg-red-50 text-red-600 border border-red-100"
            : "bg-amber-50 text-amber-700 border border-amber-100"
          }`}>
            {isReady
              ? <BsCheckCircleFill size={14} />
              : <BsClockHistory    size={14} />}
            {isReady    ? "Listo para servir"
            : isCanceled ? "Pedido cancelado"
            : "En preparación en cocina"}
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-2 pt-1">
            {!isCompleted && !isCanceled && (
              <button onClick={handleAddItems}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition">
                <FaPlusCircle size={11} /> Agregar
              </button>
            )}
            {isAdmin && !isCompleted && !isCanceled && (
              <button onClick={openChangeWaiter}
                className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition">
                <FaUserEdit size={11} /> Mesero
              </button>
            )}
            <button onClick={handleQuickPrint}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition">
              <FaPrint size={11} /> Ticket
            </button>
            {!isCompleted ? (
              <button onClick={() => navigate(`/orden/${order.id}`)}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition ml-auto">
                <FaReceipt size={11} /> Confirmar
              </button>
            ) : (
              <button onClick={() => onInvoiceClick(order)}
                className="flex items-center gap-1.5 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition ml-auto">
                <FaPrint size={11} /> Ver Orden
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal Cambiar Mesero (solo admin) ── */}
      {waiterModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-base font-bold text-gray-900 mb-1">Cambiar mesero</h3>
            <p className="text-sm text-gray-500 mb-4">Selecciona el nuevo mesero para la orden #{orderId}.</p>
            <select
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-4"
              value={selectedWaiter || ""}
              onChange={(e) => setSelectedWaiter(Number(e.target.value))}
            >
              <option value="" disabled>Selecciona un mesero</option>
              {waiters.map((w) => (
                <option key={w.id} value={w.id}>{w.name || w.full_name || w.email || `ID ${w.id}`}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button onClick={() => setWaiterModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button onClick={assignWaiter}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition">
                Confirmar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

OrderCard.propTypes = {
  order: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    customerDetails: PropTypes.object,
    name: PropTypes.string,
    customer_name: PropTypes.string,
    order_date: PropTypes.string,
    created_at: PropTypes.string,
    table_no: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    table_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    table: PropTypes.shape({ table_no: PropTypes.oneOfType([PropTypes.string, PropTypes.number]) }),
    items: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
    total_with_tax: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    totalWithTax: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    order_status: PropTypes.string,
    status: PropTypes.string,
    orderStatus: PropTypes.string,
  }).isRequired,
  isCompleted: PropTypes.bool,
  onInvoiceClick: PropTypes.func,
};

export default OrderCard;
