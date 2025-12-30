import React, { useState, useRef, useEffect } from "react";
import { FaHome, FaUtensils, FaUsers, FaPlus, FaMinus, FaPhone } from "react-icons/fa";
import { MdOutlineReceiptLong } from "react-icons/md";
import { useNavigate, useLocation } from "react-router-dom";
import Modal from "./Modal";
import { useDispatch } from "react-redux";
import { setCustomer } from "../../redux/slices/customerSlice";
import { enqueueSnackbar } from "notistack";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [guestCount, setGuestCount] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const modalRef = useRef(null);

  // ✅ Ocultar BottomNav en estas rutas
  const HIDE_ON = ["/menu"]; // agrega "/tables" si también quieres ocultarlo ahí
  if (HIDE_ON.includes(location.pathname)) return null;

  // Cerrar modal al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isModalOpen]);

  const openModal = () => {
    setGuestCount(1);
    setCustomerName("");
    setCustomerPhone("");
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const incrementGuest = () => {
    if (guestCount >= 10) {
      enqueueSnackbar("Máximo 10 comensales permitidos.", { variant: "info" });
      return;
    }
    setGuestCount((prev) => prev + 1);
  };

  const decrementGuest = () => {
    if (guestCount <= 1) {
      enqueueSnackbar("Mínimo 1 comensal requerido.", { variant: "info" });
      return;
    }
    setGuestCount((prev) => prev - 1);
  };

  // Activo por ruta
  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    if (path === "/tables") return location.pathname.startsWith("/tables") || location.pathname.startsWith("/menu");
    return location.pathname.startsWith(path);
  };

  const handleCreateOrder = () => {
    if (!customerName.trim()) {
      enqueueSnackbar("Por favor, ingresa el nombre del cliente.", { variant: "error" });
      return;
    }

    // ✅ OJO: tu slice puede esperar {name, phone, guests}. Si ya lo cambiaste a customerName/customerPhone, ok.
    dispatch(setCustomer({ customerName, customerPhone, guests: guestCount }));

    navigate("/tables");
    closeModal();
    enqueueSnackbar("¡Cliente y comensales configurados! Selecciona una mesa.", { variant: "success" });
  };

  const navItems = [
    { path: "/", icon: <FaHome />, label: "Inicio" },
    { path: "/orders", icon: <MdOutlineReceiptLong />, label: "Órdenes" },
  ];

  return (
    <>
      {/* Barra de navegación inferior */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl border-t border-gray-100 h-20 flex justify-around items-center px-4 z-40 md:h-24">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center p-2 pt-3 rounded-xl transition-all duration-300 ease-in-out flex-1 mx-1 md:mx-2 group
                ${
                  active
                    ? "text-blue-600 bg-blue-50 shadow-md transform scale-105"
                    : "text-gray-500 hover:text-blue-500 hover:bg-gray-100"
                }`}
              aria-current={active ? "page" : undefined}
            >
              <span
                className={`text-2xl md:text-3xl ${
                  active ? "text-blue-600" : "text-gray-500 group-hover:text-blue-500"
                } transition-colors duration-300`}
              >
                {item.icon}
              </span>
              <span
                className={`text-xs md:text-sm mt-1 font-medium ${
                  active ? "text-blue-700 font-semibold" : "text-gray-600 group-hover:text-blue-600"
                } transition-colors duration-300`}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Botón flotante */}
        <button
          disabled={isActive("/tables") || isActive("/menu")}
          onClick={() => navigate("/tables")}
          className={`absolute -top-7 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full flex items-center justify-center 
            bg-gradient-to-br from-green-500 to-green-700 text-white text-3xl shadow-xl 
            hover:scale-110 hover:shadow-2xl active:scale-95 transition-all duration-300 ease-in-out
            ${(isActive("/tables") || isActive("/menu")) && "opacity-60 cursor-not-allowed pointer-events-none grayscale"}`}
          aria-label="Crear nueva orden"
          title="Crear Nueva Orden"
        >
          <FaUtensils size={28} />
        </button>
      </nav>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title="Nueva Orden" innerRef={modalRef}>
        <div className="space-y-6 p-4">
          <div>
            <label htmlFor="customerName" className="block text-gray-800 text-base font-semibold mb-2">
              <FaUsers className="inline-block mr-2 text-blue-500" />
              Nombre del Cliente <span className="text-red-500">*</span>
            </label>
            <input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              type="text"
              placeholder="Ej. Juan Pérez"
              className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400 text-lg shadow-sm transition-all"
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="customerPhone" className="block text-gray-800 text-base font-semibold mb-2">
              <FaPhone className="inline-block mr-2 text-blue-500" />
              Teléfono (Opcional)
            </label>
            <input
              id="customerPhone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              type="tel"
              placeholder="+52 123 456 7890"
              className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400 text-lg shadow-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-gray-800 text-base font-semibold mb-2">
              <FaUsers className="inline-block mr-2 text-blue-500" />
              Número de Comensales
            </label>
            <div className="flex items-center justify-between bg-blue-50 px-5 py-3 rounded-lg border border-blue-200 shadow-sm">
              <button
                onClick={decrementGuest}
                className="text-blue-600 hover:text-blue-800 text-3xl font-bold p-2 rounded-full hover:bg-blue-100 transition-colors disabled:text-gray-400 disabled:hover:bg-transparent"
                disabled={guestCount <= 1}
                aria-label="Restar comensal"
              >
                <FaMinus />
              </button>
              <span className="font-extrabold text-2xl text-gray-900 mx-4 w-12 text-center">
                {guestCount}
              </span>
              <button
                onClick={incrementGuest}
                className="text-blue-600 hover:text-blue-800 text-3xl font-bold p-2 rounded-full hover:bg-blue-100 transition-colors disabled:text-gray-400 disabled:hover:bg-transparent"
                disabled={guestCount >= 10}
                aria-label="Sumar comensal"
              >
                <FaPlus />
              </button>
            </div>
          </div>

          <button
            onClick={handleCreateOrder}
            className="w-full bg-blue-600 text-white rounded-lg py-4 mt-6 hover:bg-blue-700 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl active:scale-98 flex items-center justify-center"
          >
            <FaUtensils className="mr-3" />
            Crear Orden
          </button>
        </div>
      </Modal>
    </>
  );
};

export default BottomNav;
