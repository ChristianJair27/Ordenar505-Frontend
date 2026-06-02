import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaCheck } from "react-icons/fa6";
import QRCode from "qrcode";

const FACTURACION_URL = "https://lapeñadesantiago.com/facturacion";

const Invoice = ({ orderInfo: order, setShowInvoice }) => {
  const invoiceRef = useRef(null);
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    if (!order?.id) return;
    const url = `${FACTURACION_URL}?folio=${order.id}`;
    QRCode.toDataURL(url, {
      width: 140,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    }).then(setQrDataUrl).catch(() => {});
  }, [order?.id]);

  if (!order || !order.items || !order.total) return null;

  const buildPrintHTML = () => {
    const dateStr = new Date(order.order_date).toLocaleString("es-MX");
    const folioUrl = `${FACTURACION_URL}?folio=${order.id}`;
    const qrImg = qrDataUrl ? `<img src="${qrDataUrl}" width="110" height="110" style="display:block;margin:2mm auto 1mm" />` : "";

    return `<!doctype html>
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
    .receipt {
      width: 54mm;
      box-sizing: border-box;
      padding: 2mm 0 8mm;
    }
    h2 {
      text-align: center;
      margin: 1mm 0;
      font-size: 17px;
      font-weight: 900;
      letter-spacing: 0.5px;
    }
    h3 {
      text-align: center;
      margin: 1.5mm 0 1mm;
      font-size: 14px;
      font-weight: 700;
    }
    p { margin: 1mm 0; font-size: 13px; }
    .center { text-align: center; }
    .muted { color: #222; text-align: center; font-size: 13px; }
    .line { border-top: 1px dashed #000; margin: 2.5mm 0; }
    .line-solid { border-top: 2px solid #000; margin: 2.5mm 0; }
    .row { display: flex; justify-content: space-between; align-items: baseline; }
    .items { list-style: none; padding: 0; margin: 0; }
    .item {
      display: flex;
      justify-content: space-between;
      margin: 1.2mm 0;
      font-size: 13px;
    }
    .item-name { flex: 1; padding-right: 2mm; word-break: break-word; }
    .item-price { white-space: nowrap; font-weight: 700; }
    .total { font-size: 16px; font-weight: 900; }
    .folio-box {
      border: 2px solid #000;
      padding: 2mm;
      margin: 2mm 0;
      text-align: center;
    }
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
    <p><b>Orden:</b> #${order.id}</p>
    <p><b>Nombre:</b> ${order.name || "N/A"}</p>
    <p><b>Teléfono:</b> ${order.phone || "N/A"}</p>
    <p><b>Comensales:</b> ${order.guests || "N/A"}</p>
    <p><b>Mesa:</b> ${order.table?.table_no || "N/A"}</p>
    <p><b>Fecha:</b> ${dateStr}</p>
  </div>

  <div class="line"></div>

  <h3>-- Platillos --</h3>
  <ul class="items">
    ${order.items.map(it => `
    <li class="item">
      <span class="item-name">${it.item_name} x${it.quantity}</span>
      <span class="item-price">$${Number(it.price).toFixed(2)}</span>
    </li>`).join("")}
  </ul>

  <div class="line"></div>

  <p class="center muted">* Precios incluyen todos los cargos</p>
  <div class="row total">
    <span>TOTAL:</span>
    <span>$${Number(order.total).toFixed(2)}</span>
  </div>

  <div class="line"></div>

  <p class="center" style="font-size:13px"><b>Método de pago:</b> ${order.payment_method || "Pendiente"}</p>

  <div class="line-solid"></div>

  <div class="facturacion-section">
    <p class="facturacion-title">¿Necesitas factura? Escanea el QR o visita:</p>
    <p class="facturacion-url">${FACTURACION_URL}</p>
    ${qrImg}
    <div class="folio-box">
      <p class="folio-label">Tu número de folio es:</p>
      <p class="folio-num">${order.id}</p>
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
  };

  const handlePrint = () => {
    const w = window.open("", "_blank", "width=400,height=900");
    if (!w) return;
    w.document.open();
    w.document.write(buildPrintHTML());
    w.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white p-4 rounded-lg shadow-lg w-[400px] max-h-[90vh] overflow-y-auto">
        <div ref={invoiceRef}>
          <div className="flex justify-center mb-4">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 150 }}
              className="w-12 h-12 border-8 border-green-500 rounded-full flex items-center justify-center shadow-lg bg-green-500"
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="text-2xl text-white"
              >
                <FaCheck />
              </motion.span>
            </motion.div>
          </div>

          <h2 className="text-xl font-bold text-center mb-2">La Peña de Santiago</h2>
          <p className="text-gray-600 text-center">¡Gracias por su visita!</p>
          <div className="border-t border-dashed my-3" />

          <div className="text-sm text-gray-700">
            <p><strong>Orden ID:</strong> {order.id}</p>
            <p><strong>Nombre:</strong> {order.name || "N/A"}</p>
            <p><strong>Teléfono:</strong> {order.phone || "N/A"}</p>
            <p><strong>Comensales:</strong> {order.guests || "N/A"}</p>
            <p><strong>Mesa:</strong> {order.table?.table_no || "N/A"}</p>
            <p><strong>Fecha:</strong> {new Date(order.order_date).toLocaleString("es-MX")}</p>
          </div>

          <div className="border-t border-dashed my-3" />

          <div>
            <h3 className="text-sm font-semibold">Platillos</h3>
            <ul className="text-sm text-gray-700">
              {order.items.map((item, i) => (
                <li key={i} className="flex justify-between text-xs">
                  <span>{item.item_name} x{item.quantity}</span>
                  <span>${Number(item.price).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-dashed my-3" />

          <p className="text-center mt-2 text-xs text-gray-500">
            * Los precios ya incluyen todos los cargos.
          </p>
          <div className="flex justify-between">
            <span className="font-bold">Total:</span>
            <span className="font-bold">${Number(order.total).toFixed(2)}</span>
          </div>

          <div className="border-t border-dashed my-3" />

          <div className="mb-2 text-xs text-center">
            <p><strong>Método de pago:</strong> {order.payment_method || "Pendiente"}</p>
          </div>

          <div className="border-t border-solid my-3" />

          {/* Sección facturación en preview */}
          <div className="text-center text-xs text-gray-700 mt-2">
            <p className="font-semibold">¿Necesitas factura? Escanea el QR o visita:</p>
            <p className="text-indigo-600 break-all">{FACTURACION_URL}</p>
            {qrDataUrl && (
              <img src={qrDataUrl} alt="QR Facturación" className="mx-auto my-2 w-28 h-28" />
            )}
            <div className="border border-gray-400 rounded p-2 my-2 inline-block">
              <p className="text-[10px] text-gray-500">Tu número de folio es:</p>
              <p className="text-lg font-black tracking-widest">{order.id}</p>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">
              Tienes <strong>24 horas</strong> después de tu consumo para solicitar tu factura.
            </p>
          </div>
        </div>

        <div className="flex justify-between mt-4">
          <button onClick={handlePrint} className="text-blue-500 hover:underline text-xs px-4 py-2 rounded-lg">
            Imprimir ticket
          </button>
          <button
            onClick={() => {
              setShowInvoice(false);
              window.location.reload();
            }}
            className="text-red-500 hover:underline text-xs px-4 py-2 rounded-lg"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
