import PropTypes from "prop-types";
import { FaCheckDouble, FaUtensils, FaReceipt, FaPrint } from "react-icons/fa";
import { BsClockHistory, BsCheckCircleFill } from "react-icons/bs";
import { getAvatarName } from "../../utils/index";
import { useNavigate } from "react-router-dom";
import { formatDateAndTime } from "../../utils";
const OrderCard = ({ 
  order, 
  isCompleted = false, 
  onInvoiceClick = () => {} 
}) => {
  const navigate = useNavigate();

  // Verificación segura de propiedades con valores por defecto
  const customerName = order.customerDetails?.name || order.name || order.customer_name || "Cliente";
  const avatarName = getAvatarName(customerName);

  const orderDate = order?.order_date || order?.created_at;
  const formattedDate = !orderDate || isNaN(new Date(orderDate))
    ? "Fecha inválida"
    : formatDateAndTime(orderDate);

  const tableNo = String(order?.table_no || order?.table?.table_no || order?.table_id || "N/A");

  let items = order?.items || [];
  if (typeof items === "string") {
    try {
      items = JSON.parse(items);
    } catch (e) {
      items = [];
    }
  }
  const itemCount = items.length;

  const totalWithTax = Number(
    order.total_with_tax || 
    order.totalWithTax || 
    order.total || 
    0
  ).toFixed(2);

  // Verificación flexible del estado
  const status = String(order.order_status || order.status || order.orderStatus || "").toLowerCase();
  const isReady = status.includes("ready") || status.includes("listo");

  const formatOrderId = (id) => {
    return id ? String(id).slice(-6) : 'N/A';
  };

  return (
    <div className="w-full max-w-lg bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-200 mb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-white/20 rounded-full p-2 mr-3">
              <FaUtensils className="text-white text-lg" />
            </div>
            <h2 className="text-xl font-bold text-white">
              Orden #{formatOrderId(order.id)}
            </h2>
          </div>
          <span className="text-white/90 text-sm">{formattedDate}</span>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="bg-blue-100 text-blue-800 rounded-full p-3 text-lg font-bold">
            {avatarName}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800">{customerName}</h3>
            <div className="flex items-center text-gray-600 mt-1">
              <span className="mr-2">Mesa:</span>
              <span className="font-medium">{tableNo}</span>
            </div>
            <div className="flex items-center text-gray-600 mt-1">
              <span className="mr-2">Artículos:</span>
              <span className="font-medium">{itemCount}</span>
            </div>
          </div>
        </div>

        {/* Estado del pedido */}
        <div className={`rounded-lg p-3 mb-4 ${
          isReady ? 'bg-green-50 border border-green-100' : 'bg-yellow-50 border border-yellow-100'
        }`}>
          <div className="flex items-center">
            {isReady ? (
              <>
                <BsCheckCircleFill className="text-green-500 text-xl mr-2" />
                <span className="text-green-800 font-medium">Listo para servir</span>
              </>
            ) : (
              <>
                <BsClockHistory className="text-yellow-500 text-xl mr-2" />
                <span className="text-yellow-800 font-medium">
                  {status.includes("cancel") ? "Cancelada" : "En preparación"}
                </span>
              </>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1 ml-7">
            {isReady ? 'El pedido está listo para entregar' : 
             status.includes("cancel") ? 'Pedido cancelado' : 'Estamos preparando tu pedido'}
          </p>
        </div>

        {/* Total */}
        <div className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-3">
          <span className="text-gray-700 font-semibold">Total:</span>
          <span className="text-xl font-bold text-blue-600">${totalWithTax}</span>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3 mt-6">
          {!isCompleted ? (
            <button
              onClick={() => navigate(`/orden/${order.id}`)}
              className="flex items-center bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <FaReceipt className="mr-2" />
              Generar Factura
            </button>
          ) : (
            <button
              onClick={() => onInvoiceClick(order)}
              className="flex items-center bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <FaPrint className="mr-2" />
              Ver Factura
            </button>
          )}
        </div>
      </div>
    </div>
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
    table: PropTypes.shape({
      table_no: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    }),
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