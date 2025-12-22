import React, { useEffect, useState, useRef } from "react";
import BottomNav from "../components/shared/BottomNav";
import BackButton from "../components/shared/BackButton";
import { MdRestaurantMenu, MdTableRestaurant, MdShoppingCart } from "react-icons/md";
import { FiUser } from "react-icons/fi";
import MenuContainer from "../components/menu/MenuContainer";
import CartInfo from "../components/menu/CartInfo";
import Bill from "../components/menu/Bill";
import { useSelector, useDispatch } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useSearchParams } from "react-router-dom";
import axios from "axios";

import { setCustomer } from "../redux/slices/customerSlice";
import { removeAllItems, importItems } from "../redux/slices/cartSlice";

const Menu = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    document.title = "La Peña De Santiago | Menú";
  }, []);

  // ---- Params/State de navegación
  const mode = location.state?.mode || searchParams.get("mode");       // "append" | null
  const orderId = location.state?.orderId || searchParams.get("orderId");
  const lockRemoval =
    location.state?.lockRemoval === true ||
    searchParams.get("lockRemoval") === "true";

  // ---- Store
  const user = useSelector((state) => state.user);
  const customerData = useSelector((state) => state.customer);
  const cartItems = useSelector((state) => state.cart.items) || [];

  // ---- Mesa bloqueada al agregar artículos
  const [lockedTable, setLockedTable] = useState(null);

  // Limpia cualquier “selectedTable” cuando es append para evitar defaults previos
  useEffect(() => {
    if (mode === "append") {
      try { localStorage.removeItem("selectedTable"); } catch {}
      try { sessionStorage.removeItem("selectedTable"); } catch {}
    }
  }, [mode]);

  const creatorName =
    user?.name ?? user?.full_name ?? user?.username ?? "Usuario";

  // Preferir mesa bloqueada cuando es append
  const tableShown =
    (mode === "append" && lockedTable != null)
      ? lockedTable
      : (
          customerData?.table?.tableNo ??
          customerData?.table?.tableNumber ??
          customerData?.table?.tableId ??
          "N/A"
        );

  const [isCartOpen, setIsCartOpen] = useState(false);
  const totalCartItems = cartItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  // Guarda el orderId previo para detectar cambios
  const prevOrderIdRef = useRef(null);

  // 1) Si NO es append o NO hay orderId => limpiar carrito al entrar
  useEffect(() => {
    if (mode !== "append" || !orderId) {
      dispatch(removeAllItems());
      prevOrderIdRef.current = null;
      setLockedTable(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, orderId]);

  // 2) Si sí es append y cambia el orderId => limpiar antes de re-hidratar
  useEffect(() => {
    if (mode === "append" && orderId) {
      const curr = String(orderId);
      const prev = prevOrderIdRef.current;
      if (prev && prev !== curr) {
        dispatch(removeAllItems());
        setLockedTable(null);
      }
      prevOrderIdRef.current = curr;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, orderId]);

  // 3) Hidratar cuando venimos de "Agregar artículos" y FIJAR mesa
  useEffect(() => {
    const hydrateFromOrder = async () => {
      if (mode !== "append" || !orderId) return;
      try {
        const { data } = await axios.get(`${API_URL}/api/orders/${orderId}`);
        const order = data?.data || data || {};

        const table_no =
          order?.table?.table_no ?? order?.table_no ?? order?.table_id ?? null;

        setLockedTable(table_no); // 👉 mesa fija

        // Mesa/cliente al store
        dispatch(
          setCustomer({
            ...customerData,
            name: order?.name || order?.customer_name || customerData?.name || "",
            phone: order?.phone || customerData?.phone || "",
            guests: order?.guests || customerData?.guests || 1,
            table: { tableNo: table_no, tableId: table_no, tableNumber: table_no },
            orderId: order?.id,
          })
        );

        // Items -> cart
        let items = order?.items || [];
        if (typeof items === "string") {
          try { items = JSON.parse(items); } catch { items = []; }
        }
        const normalized = (Array.isArray(items) ? items : []).map((it) => ({
  id: it.item_id ?? it.id ?? it._id ?? `${it.name}-${it.price}`,
  name: it.item_name ?? it.name ?? "Artículo",
  quantity: Number(it.quantity ?? 1),
  // 👇 usa el total que ya viene (price/total en DB)
  price: Number(it.price ?? it.total ?? 0),
  // (opcional) si ya no usas unitario, puedes omitir pricePerQuantity
  // pricePerQuantity: Number(it.unit_price ?? 0),
  categoryId: it.category_id ?? it.categoryId ?? null,
  notes: it.notes ?? "",
  __existing: true
}));


        dispatch(removeAllItems());
        dispatch(importItems(normalized));
      } catch (err) {
        console.error("Error hidratando orden:", err);
      }
    };

    hydrateFromOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, orderId, API_URL]);

  // 4) Reimponer mesa bloqueada si algún componente intenta pisarla
  useEffect(() => {
    if (mode !== "append") return;
    if (lockedTable == null) return;

    const current =
      customerData?.table?.tableNo ??
      customerData?.table?.tableNumber ??
      customerData?.table?.tableId ??
      null;

    if (current !== lockedTable) {
      dispatch(setCustomer({
        ...customerData,
        table: { tableNo: lockedTable, tableId: lockedTable, tableNumber: lockedTable },
      }));
    }
  }, [mode, lockedTable, customerData?.table, dispatch]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white shadow-sm z-20">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-2xl font-bold text-gray-800">Menú del Restaurante</h1>
        </div>

        {/* Info de Usuario/Mesa */}
        <div className="flex items-center gap-4 bg-blue-50 rounded-lg px-4 py-2 border border-blue-100">
          <div className="p-2 bg-blue-100 rounded-full text-blue-600">
            <MdRestaurantMenu className="text-xl" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <FiUser className="text-gray-500" />
              <span className="font-medium text-gray-800">{creatorName}</span>
            </div>
            <div className="flex items-center gap-2">
              <MdTableRestaurant className="text-gray-500" />
              <span className="text-sm text-gray-600">Mesa: {tableShown}</span>
            </div>
          </div>
        </div>

        {/* Botón Carrito (móvil) */}
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
      <main className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <MenuContainer
            lockRemoval={lockRemoval}
            orderId={orderId}
            mode={mode}
            lockedTable={lockedTable}
            lockTableSelection={mode === "append"}
          />
        </div>

        <div className="hidden md:flex md:w-96 border-l border-gray-200 bg-white flex-col flex-shrink-0 pb-16">
          <div className="flex-1 overflow-y-auto p-4">
            <CartInfo lockRemoval={lockRemoval} lockedTable={lockedTable} />
          </div>
          <div className="bg-white border-t border-gray-200 p-4 shadow-lg flex-shrink-0 mb-16">
            <Bill
              mode={mode}
              orderId={orderId}
              lockedTable={lockedTable}
              lockTableSelection={mode === "append"}
            />
          </div>
        </div>
      </main>

      {/* Drawer Carrito (móvil) */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed inset-y-0 right-0 w-full xs:w-80 sm:w-96 bg-white shadow-xl flex flex-col z-50 md:hidden"
          >
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

            <div className="flex-1 overflow-y-auto p-4">
              <CartInfo lockRemoval={lockRemoval} lockedTable={lockedTable} />
            </div>

            <div className="bg-white border-t border-gray-200 p-4 shadow-lg flex-shrink-0">
              <Bill
                mode={mode}
                orderId={orderId}
                lockedTable={lockedTable}
                lockTableSelection={mode === "append"}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
};

export default Menu;
