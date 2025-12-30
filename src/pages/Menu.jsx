<<<<<<< HEAD
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
=======
import React, { useEffect, useState, useRef, useMemo } from "react";
import BackButton from "../components/shared/BackButton";
import { MdRestaurantMenu, MdTableRestaurant, MdShoppingCart } from "react-icons/md";
import { FiUser } from "react-icons/fi";
import { FaPlus, FaMinus, FaCheck, FaShoppingCart as FaCart } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

import CartInfo from "../components/menu/CartInfo";
import Bill from "../components/menu/Bill";

import { useSelector, useDispatch } from "react-redux";
import { setCustomer } from "../redux/slices/customerSlice";
import { removeAllItems, importItems, addItems } from "../redux/slices/cartSlice";
>>>>>>> b6fdd57 (Update Menu Page + notes)

const Menu = () => {
  const dispatch = useDispatch();
  const location = useLocation();
<<<<<<< HEAD
=======
  const navigate = useNavigate();
>>>>>>> b6fdd57 (Update Menu Page + notes)
  const [searchParams] = useSearchParams();

  useEffect(() => {
    document.title = "La Peña De Santiago | Menú";
  }, []);

<<<<<<< HEAD
  // ---- Params/State de navegación
  const mode = location.state?.mode || searchParams.get("mode");       // "append" | null
  const orderId = location.state?.orderId || searchParams.get("orderId");
  const lockRemoval =
    location.state?.lockRemoval === true ||
    searchParams.get("lockRemoval") === "true";

  // ---- Store
=======
  // =================== Notes modal ===================
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteTarget, setNoteTarget] = useState(null);

  const openNotesForItem = (item) => {
    const count = itemCounts[item.id] || 0;
    if (!count) return;
    setNoteTarget({ item, count });
    setNoteText("");
    setNoteOpen(true);
  };

  const uid = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const confirmAddWithNotes = () => {
    if (!noteTarget) return;
    const { item, count } = noteTarget;

    const newItem = {
      id: uid(),
      name: item.name,
      quantity: count,
      pricePerQuantity: Number(item.price),
      price: Number(item.price) * count,
      dishId: item.id,
      categoryId: item.category_id ?? null,
      notes: noteText.trim(),
    };

    dispatch(addItems(newItem));
    setItemCounts((prev) => ({ ...prev, [item.id]: 0 }));
    setNoteTarget(null);
    setNoteText("");
    setNoteOpen(false);
  };

  // Navigation params
  const mode = location.state?.mode || searchParams.get("mode");
  const orderId = location.state?.orderId || searchParams.get("orderId");
  const lockRemoval = location.state?.lockRemoval === true || searchParams.get("lockRemoval") === "true";

  // Redux
>>>>>>> b6fdd57 (Update Menu Page + notes)
  const user = useSelector((state) => state.user);
  const customerData = useSelector((state) => state.customer);
  const cartItems = useSelector((state) => state.cart.items) || [];

<<<<<<< HEAD
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
=======
  const [lockedTable, setLockedTable] = useState(null);

  const creatorName = user?.name ?? user?.full_name ?? user?.username ?? "Usuario";

  const tableShown =
    (mode === "append" && lockedTable != null)
      ? lockedTable
      : customerData?.table?.tableNo ?? customerData?.table?.tableNumber ?? customerData?.table?.tableId ?? "N/A";

  const [isCartOpen, setIsCartOpen] = useState(false);

  const totalCartItems = useMemo(() => cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0), [cartItems]);
  const cartTotal = useMemo(() => cartItems.reduce((sum, item) => sum + Number(item.price || 0), 0), [cartItems]);

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  // Menu data
  const [categories, setCategories] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [itemCounts, setItemCounts] = useState({});
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [query, setQuery] = useState("");

  // =================== FUNCIÓN MEJORADA PARA IMÁGENES ===================
  const getDishImageUrl = (dishName, categoryId) => {
    const dishNameLower = dishName.toLowerCase();
    
    // Base URL para imágenes de comida mexicana
    const baseUrl = "https://source.unsplash.com/featured/400x300/?";
    
    // Mapeo más específico para platillos mexicanos/desayunos
    const imageMap = {
      // Huevos / Desayunos
      'huevos divorciados': 'mexican+breakfast+eggs+salsa',
      'huevos rancheros': 'huevos+rancheros+mexican+food',
      'huevos chimichanga': 'chimichanga+mexican+food',
      'huevos aporreados': 'mexican+scrambled+eggs',
      'huevos messi': 'eggs+breakfast+mexican',
      'huevos al gusto': 'fried+eggs+breakfast',
      'huevos con machaca': 'mexican+dried+beef+eggs',
      'huevos veracruzanos': 'veracruz+style+eggs',
      
      // Omelettes
      'omelette': 'omelette+breakfast+eggs',
      'omelet': 'omelette+breakfast+eggs',
      
      // Chilaquiles
      'chilaquiles': 'chilaquiles+mexican+breakfast',
      
      // Enchiladas
      'enchiladas': 'enchiladas+mexican+food',
      
      // Especiales de desayuno
      'machaca': 'mexican+dried+beef',
      'chilaquiles verdes': 'green+chilaquiles',
      'chilaquiles rojos': 'red+chilaquiles',
      
      // Bebidas
      'café': 'coffee+cup',
      'té': 'tea+cup',
      'jugo': 'fresh+juice+glass',
      'agua': 'water+glass',
      'refresco': 'soda+can',
      
      // Postres
      'postre': 'mexican+dessert',
      'flan': 'flan+dessert',
      'tres leches': 'tres+leches+cake',
      'churros': 'churros+dessert',
    };

    // Buscar coincidencia exacta primero
    for (const [key, searchTerms] of Object.entries(imageMap)) {
      if (dishNameLower.includes(key)) {
        return `${baseUrl}${searchTerms}`;
      }
    }

    // Buscar por palabras clave
    const keywords = {
      'huevo': 'eggs+breakfast',
      'huevos': 'eggs+breakfast',
      'omelette': 'omelette+breakfast',
      'chilaquil': 'chilaquiles+mexican',
      'enchilada': 'enchiladas+mexican',
      'taco': 'taco+mexican',
      'burrito': 'burrito+mexican',
      'quesadilla': 'quesadilla+mexican',
      'tamal': 'tamale+mexican',
      'mole': 'mole+mexican',
      'pozole': 'pozole+mexican',
      'tostada': 'tostada+mexican',
      'sopa': 'soup+bowl',
      'ensalada': 'salad+bowl',
      'pollo': 'chicken+dish',
      'carne': 'beef+steak',
      'pescado': 'fish+dish',
      'marisco': 'seafood',
      'pasta': 'pasta+dish',
      'pizza': 'pizza+slice',
      'hamburguesa': 'burger',
      'papas': 'french+fries',
      'arroz': 'rice+dish',
      'frijol': 'beans+mexican',
    };

    for (const [keyword, searchTerm] of Object.entries(keywords)) {
      if (dishNameLower.includes(keyword)) {
        return `${baseUrl}${searchTerm}`;
      }
    }

    // Si no encuentra nada, usar categoría general
    const categoryKeywords = {
      'desayuno': 'mexican+breakfast',
      'almuerzo': 'mexican+lunch',
      'comida': 'mexican+food',
      'cena': 'dinner+meal',
      'bebida': 'drink+glass',
      'postre': 'dessert+sweet',
    };

    const categoryName = categories.find(c => c.id === categoryId)?.name?.toLowerCase() || '';
    for (const [catKey, catSearch] of Object.entries(categoryKeywords)) {
      if (categoryName.includes(catKey) || dishNameLower.includes(catKey)) {
        return `${baseUrl}${catSearch}`;
      }
    }

    // Último recurso: comida mexicana genérica
    return `${baseUrl}mexican+food`;
  };

  const fetchMenuData = async () => {
    setLoadingMenu(true);
    try {
      const [catRes, dishRes] = await Promise.all([
        axios.get(`${API_URL}/api/categories`),
        axios.get(`${API_URL}/api/dishes`),
      ]);
      const cats = catRes?.data?.data ?? [];
      const ds = dishRes?.data?.data ?? [];
      setCategories(cats);
      setDishes(ds);
      if (cats.length > 0) setSelectedCategory(cats[0]);

      const initialCounts = {};
      ds.forEach((dish) => { initialCounts[dish.id] = 0; });
      setItemCounts(initialCounts);
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setLoadingMenu(false);
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, []);

  const increment = (id) => {
    setItemCounts((prev) => ({
      ...prev,
      [id]: Math.min((prev[id] || 0) + 1, 99),
    }));
  };

  const decrement = (id) => {
    setItemCounts((prev) => ({
      ...prev,
      [id]: Math.max((prev[id] || 0) - 1, 0),
    }));
  };

  const dishesForView = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) {
      return dishes.filter((d) =>
        d.name?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q)
      );
    }
    if (selectedCategory?.id) {
      return dishes.filter((d) => d.category_id === selectedCategory.id);
    }
    return dishes;
  }, [dishes, selectedCategory, query]);

  const categoryNameById = useMemo(() => {
    const map = new Map();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const leftPadBottom = totalCartItems > 0 ? "pb-32" : "pb-8";

  return (
    <div className="flex flex-col min-h-dvh bg-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white shadow-md border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Menú</h1>
              <p className="text-sm text-gray-600">Toma el pedido rápidamente</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* User & Table Info */}
            <div className="hidden sm:flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl px-4 py-3 border border-blue-200">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl">
                <MdRestaurantMenu className="text-xl" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm">
                  <FiUser className="text-gray-600" />
                  <span className="font-semibold text-gray-800">{creatorName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MdTableRestaurant className="text-gray-600" />
                  <span className="font-medium text-gray-700">Mesa {tableShown}</span>
                </div>
              </div>
            </div>

            {/* Mobile Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow md:hidden"
            >
              <MdShoppingCart className="text-2xl" />
              {totalCartItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
                  {totalCartItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Menu */}
        <section className={`flex-1 overflow-y-auto ${leftPadBottom} bg-gray-100`}>
          {/* Search Bar */}
          <div className="sticky top-0 z-20 bg-gray-100 pt-4 px-4 pb-3">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar platillo..."
                className="w-full pl-12 pr-5 py-4 bg-white rounded-2xl shadow-md focus:outline-none focus:ring-4 focus:ring-blue-300 text-lg"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Categories */}
          <div className="px-4 pb-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category)}
                  className={`
                    flex-shrink-0 px-6 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-md
                    ${selectedCategory?.id === category.id
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white scale-105"
                      : "bg-white text-gray-800 hover:bg-gray-50"
                    }
                  `}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>{category.name}</span>
                    <span className="text-xs opacity-80">
                      {dishes.filter((d) => d.category_id === category.id).length} ítems
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Dishes Grid - CORREGIDO */}
          <div className="px-4 pb-8">
            {loadingMenu ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
              </div>
            ) : dishesForView.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-gray-500">No se encontraron platillos</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {dishesForView.map((item) => {
                  const count = itemCounts[item.id] || 0;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col h-[420px]"
                    >
                      {/* Imagen dinámica */}
                      <div className="h-40 bg-gradient-to-br from-gray-200 to-gray-300 relative overflow-hidden">
                        <img 
                          src={getDishImageUrl(item.name, item.category_id)} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://source.unsplash.com/featured/400x300/?mexican+food`;
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      </div>

                      {/* Contenido del card - ALTURA FIJA */}
                      <div className="p-4 flex flex-col flex-1 min-h-0">
                        {query.trim() && (
                          <span className="text-xs text-blue-600 font-medium mb-1">
                            {categoryNameById.get(item.category_id)}
                          </span>
                        )}

                        <h3 className="text-lg font-bold text-gray-900 line-clamp-2 h-14 mb-2">
                          {item.name}
                        </h3>

                        {item.description && (
                          <div className="mb-3 flex-1 overflow-hidden">
                            <p className="text-sm text-gray-600 line-clamp-2 h-10">
                              {item.description}
                            </p>
                          </div>
                        )}

                        {/* Precio y controles - DISEÑO CORREGIDO */}
                        <div className="mt-auto pt-3 border-t border-gray-100">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            {/* Precio */}
                            <div className="flex items-center justify-center sm:justify-start">
                              <span className="text-2xl font-bold text-blue-700 whitespace-nowrap">
                                ${Number(item.price || 0).toFixed(2)}
                              </span>
                            </div>

                            {/* Controles - DISEÑO RESPONSIVE */}
                            <div className="flex items-center justify-between sm:justify-end gap-2">
                              {/* Contador */}
                              <div className="flex items-center bg-gray-100 rounded-full overflow-hidden">
                                <button
                                  onClick={() => decrement(item.id)}
                                  disabled={count === 0}
                                  className="p-2 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                >
                                  <FaMinus className="text-sm" />
                                </button>
                                <span className="px-3 py-1 font-bold text-lg text-gray-900 min-w-[50px] text-center">
                                  {count}
                                </span>
                                <button
                                  onClick={() => increment(item.id)}
                                  className="p-2 text-gray-700 hover:bg-gray-200 transition"
                                >
                                  <FaPlus className="text-sm" />
                                </button>
                              </div>

                              {/* Botón Agregar - TAMAÑO CORREGIDO */}
                              <button
                                onClick={() => openNotesForItem(item)}
                                disabled={count === 0}
                                className={`
                                  p-3 rounded-xl font-bold text-white shadow-lg transition-all flex-shrink-0
                                  ${count > 0
                                    ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                    : "bg-gray-300 cursor-not-allowed"
                                  }
                                `}
                              >
                                <FaCart className="text-lg" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-96 border-l border-gray-300 bg-white shadow-xl">
          <div className="flex-1 overflow-y-auto p-6">
            <CartInfo lockRemoval={lockRemoval} lockedTable={lockedTable} />
          </div>
          <div className="border-t border-gray-300 p-6 bg-gray-50">
            <Bill mode={mode} orderId={orderId} lockedTable={lockedTable} lockTableSelection={mode === "append"} />
          </div>
        </aside>
      </div>

      {/* Mobile Bottom Cart Bar */}
      {totalCartItems > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-gray-300 shadow-2xl">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full px-6 py-5 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl shadow-lg">
                <MdShoppingCart className="text-2xl" />
              </div>
              <div className="text-left">
                <div className="text-lg font-bold text-gray-900">
                  {totalCartItems} {totalCartItems === 1 ? "artículo" : "artículos"}
                </div>
                <div className="text-xl font-bold text-blue-700">${cartTotal.toFixed(2)}</div>
              </div>
            </div>
            <span className="text-lg font-bold text-green-600">Ver carrito →</span>
          </button>
        </div>
      )}

      {/* Notes Modal */}
      <AnimatePresence>
        {noteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setNoteOpen(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Notas para {noteTarget?.item?.name}
                    </h3>
                    <p className="text-lg text-gray-600 mt-1">
                      Cantidad: <span className="font-bold">{noteTarget?.count}</span>
                    </p>
                  </div>
                  <button onClick={() => setNoteOpen(false)} className="text-3xl text-gray-500">&times;</button>
                </div>

                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder='Ej: "Sin cebolla", "Bien cocido", "Salsa aparte"...'
                  className="w-full h-32 p-4 border-2 border-gray-300 rounded-2xl focus:border-blue-500 focus:outline-none text-lg"
                />

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setNoteOpen(false)}
                    className="flex-1 py-4 rounded-2xl border-2 border-gray-300 font-bold text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmAddWithNotes}
                    className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold shadow-lg hover:shadow-xl transition"
                  >
                    Agregar al carrito
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Cart Drawer */}
>>>>>>> b6fdd57 (Update Menu Page + notes)
      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
<<<<<<< HEAD
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
=======
            className="fixed inset-0 z-50 lg:hidden bg-white flex flex-col"
          >
            <div className="p-5 border-b border-gray-300 flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <MdShoppingCart className="text-green-600" /> Carrito
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="text-3xl text-gray-600">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <CartInfo lockRemoval={lockRemoval} lockedTable={lockedTable} />
            </div>
            <div className="border-t-2 border-gray-300 p-6 bg-gray-50">
              <Bill mode={mode} orderId={orderId} lockedTable={lockedTable} lockTableSelection={mode === "append"} />
>>>>>>> b6fdd57 (Update Menu Page + notes)
            </div>
          </motion.div>
        )}
      </AnimatePresence>
<<<<<<< HEAD

      <BottomNav />
=======
>>>>>>> b6fdd57 (Update Menu Page + notes)
    </div>
  );
};

<<<<<<< HEAD
export default Menu;
=======
export default Menu;
>>>>>>> b6fdd57 (Update Menu Page + notes)
