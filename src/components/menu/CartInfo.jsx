import React, { useEffect, useRef, useMemo } from "react";
import { RiDeleteBin6Line } from "react-icons/ri";
import { FaRegEdit, FaShoppingCart, FaUtensils } from "react-icons/fa"; // Añadimos FaUtensils
import { useDispatch, useSelector } from "react-redux";
import { removeItem } from "../../redux/slices/cartSlice"; // Asegúrate de que esta ruta sea correcta

const CartInfo = () => {
  const cartData = useSelector((state) => state.cart);
  const scrollRef = useRef();
  const dispatch = useDispatch();

  // Desplazarse al final cuando el carrito se actualiza
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [cartData]);

  const handleRemove = (itemId, itemName) => {
    // Confirmación más amigable y clara
    if (window.confirm(`¿Estás seguro de que quieres eliminar "${itemName}" del pedido?`)) {
      dispatch(removeItem(itemId));
    }
  };

  // Calcular subtotal y total usando useMemo para optimización
  const subtotal = useMemo(() => {
    return cartData.reduce((sum, item) => sum + Number(item.price || 0), 0);
  }, [cartData]);

  // Si tienes impuestos o descuentos, los aplicarías aquí
  const total = subtotal; // Por ahora, total es igual al subtotal

  return (
    <div className="bg-white rounded-xl shadow-2xl h-full flex flex-col border border-gray-100 animate-fade-in">
      {/* Header del carrito */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-6 py-5 rounded-t-xl shadow-md flex items-center justify-between">
        <div className="flex items-center">
          <FaShoppingCart className="text-white text-2xl mr-3" />
          <h1 className="text-2xl font-bold text-white">Tu Pedido</h1>
        </div>
        {/* Aquí podrías mostrar el número de mesa si lo pasas como prop o lo obtienes de Redux */}
        {/* Ejemplo asumiendo que tienes un estado global o prop para la mesa: */}
        {/* <span className="text-blue-100 text-lg font-semibold">Mesa #12</span> */}
      </div>

      {/* Resumen rápido de artículos */}
      <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center text-gray-700">
        <span className="text-sm font-medium">
          <span className="font-bold text-blue-600">{cartData.length}</span>{" "}
          {cartData.length === 1 ? "artículo" : "artículos"} en el carrito
        </span>
        {/* Si quieres mostrar info de mesa aquí, puedes tomarla de customerData como en CustomerInfo */}
        {/* <span className="text-sm text-gray-500">Mesa #12</span> */}
      </div>

      {/* Lista de artículos del carrito */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide" // Espacio extra arriba y abajo
        ref={scrollRef}
      >
        {cartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="bg-blue-100 rounded-full p-5 mb-4 shadow-inner">
              <FaUtensils className="text-blue-500 text-4xl" /> {/* Nuevo ícono */}
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">¡Tu carrito está vacío!</h3>
            <p className="text-gray-600 text-base">
              Agrega platillos de nuestro delicioso menú para comenzar tu pedido.
            </p>
          </div>
        ) : (
          <div className="space-y-4"> {/* Aumentamos el espacio entre ítems */}
            {cartData.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 ease-in-out group"
              >
                <div className="flex justify-between items-start mb-2">
                  {/* Información del ítem */}
                  <div className="flex-1 pr-3">
                    <h3 className="font-semibold text-lg text-gray-900 leading-tight">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">{item.quantity}</span> × $
                      {Number(item.pricePerQuantity || 0).toFixed(2)} c/u
                    </p>
                    {item.notes && (
                      <p className="text-xs text-gray-500 mt-2 italic border-l-2 border-gray-200 pl-2">
                        Notas: {item.notes}
                      </p>
                    )}
                  </div>
                  {/* Precio total del ítem */}
                  <span className="font-bold text-xl text-blue-600 whitespace-nowrap">
                    ${Number(item.price || 0).toFixed(2)}
                  </span>
                </div>

                {/* Acciones para el ítem */}
                <div className="flex justify-end space-x-2 mt-3 pt-3 border-t border-gray-100">
                  {/* Botón de Editar (puedes implementar la lógica luego) */}
                  <button
                    onClick={() => console.log("Editar ítem:", item.id)} // Placeholder para editar
                    className="text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
                    aria-label={`Editar ${item.name}`}
                    title="Editar cantidad o notas"
                  >
                    <FaRegEdit className="text-base" />
                  </button>
                  {/* Botón de Eliminar */}
                  <button
                    onClick={() => handleRemove(item.id, item.name)}
                    className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
                    aria-label={`Eliminar ${item.name}`}
                    title="Eliminar del pedido"
                  >
                    <RiDeleteBin6Line className="text-base" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sección de Resumen de Totales y Botón de Acción */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-5 shadow-inner">
        <div className="space-y-3 mb-5">
          <div className="flex justify-between text-base text-gray-700">
            <span className="font-medium">Subtotal:</span>
            <span className="font-semibold">${subtotal.toFixed(2)}</span>
          </div>

          {/* Puedes añadir impuestos, descuentos, etc. aquí */}
          {/* <div className="flex justify-between text-sm text-gray-600">
            <span className="">Impuestos (IVA):</span>
            <span className="font-medium">$X.XX</span>
          </div> */}

          <div className="flex justify-between text-xl font-bold border-t border-dashed border-gray-300 pt-3">
            <span className="text-gray-900">Total del Pedido:</span>
            <span className="text-blue-600">${total.toFixed(2)}</span>
          </div>
        </div>

        
      </div>

      {/* Estilos para ocultar la scrollbar de forma más suave */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default CartInfo;