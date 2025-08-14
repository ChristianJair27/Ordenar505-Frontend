import React, { useEffect, useState } from "react"; // Importar useState
import BottomNav from "../components/shared/BottomNav";
import BackButton from "../components/shared/BackButton";
import { MdRestaurantMenu, MdTableRestaurant, MdShoppingCart } from "react-icons/md"; // Nuevo icono para el carrito
import { FiUser } from "react-icons/fi";
import MenuContainer from "../components/menu/MenuContainer";
import CustomerInfo from "../components/menu/CustomerInfo";
import CartInfo from "../components/menu/CartInfo";
import Bill from "../components/menu/Bill";
import { useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion"; // Para animaciones del drawer

const Menu = () => {
  useEffect(() => {
    document.title = "La Peña De Santiago | Menú"; // Revertí a Patita para consistencia
  }, []);

  const customerData = useSelector((state) => state.customer);
  const cartItems = useSelector((state) => state.cart.items); // Asumiendo que guardas los items del carrito aquí

  // Estado para controlar la visibilidad del carrito en móvil
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Calcula el número total de ítems en el carrito
  const totalCartItems = (cartItems || []).reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white shadow-sm z-20"> {/* Aumentado z-index */}
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-2xl font-bold text-gray-800">Menú del Restaurante</h1>
        </div>

        {/* Info de Cliente/Mesa (Visible en todas las pantallas) */}
        <div className="flex items-center gap-4 bg-blue-50 rounded-lg px-4 py-2 border border-blue-100">
          <div className="p-2 bg-blue-100 rounded-full text-blue-600">
            <MdRestaurantMenu className="text-xl" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <FiUser className="text-gray-500" />
              <span className="font-medium text-gray-800">
                {customerData.customerName || "Cliente no asignado"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MdTableRestaurant className="text-gray-500" />
              <span className="text-sm text-gray-600">
                Mesa: {customerData.table?.tableNo || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Botón de Carrito para Móviles (Solo visible en pantallas pequeñas) */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="md:hidden relative p-3 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
          aria-label="Ver carrito"
        >
          <MdShoppingCart className="text-2xl" />
          {totalCartItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {totalCartItems}
            </span>
          )}
        </button>
      </div>

      {/* Contenido principal */}
      <main className="flex flex-1 overflow-hidden"> {/* Eliminamos flex-col/md:flex-row aquí para el diseño */}
        {/* Sección izquierda - Menú (Visible siempre) */}
        <div className="flex-1 overflow-y-auto p-6">
          <MenuContainer />
        </div>

        {/* Sección derecha - Resumen (Carrrito/Factura) - Solo visible en MD y pantallas más grandes */}
        {/* Este div ya no es el que se apila en móvil, se oculta completamente */}
        <div className="hidden md:flex md:w-96 border-l border-gray-200 bg-white flex-col flex-shrink-0 pb-16">
          <div className="p-4 border-b border-gray-200">
            <CustomerInfo />
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <CartInfo />
          </div>
          <div className="bg-white border-t border-gray-200 p-4 shadow-lg flex-shrink-0 mb-16" >
            <Bill />
          </div>
        </div>
      </main>

      {/* Carrito como Drawer/Panel Lateral para Móviles */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed inset-y-0 right-0 w-full xs:w-80 sm:w-96 bg-white shadow-xl flex flex-col z-50 md:hidden" // z-index alto para estar encima de todo
          >
            {/* Encabezado del Drawer */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <MdShoppingCart className="mr-2 text-green-600" /> Tu Carrito
              </h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {/* Contenido del Carrito en el Drawer */}
            <div className="flex-1 overflow-y-auto p-4">
              <CartInfo />
              
            </div>

            {/* Total y Botón de Orden en el Drawer */}
            <div className="bg-white border-t border-gray-200 p-4 shadow-lg flex-shrink-0">
              <Bill />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay (oscurece el fondo cuando el carrito está abierto en móvil) */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ type: "tween", duration: 0.3 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black z-40 md:hidden" // z-index justo debajo del drawer
          />
        )}
      </AnimatePresence>

      {/* Barra de navegación inferior */}
      <BottomNav />
    </div>
  );
};

export default Menu;