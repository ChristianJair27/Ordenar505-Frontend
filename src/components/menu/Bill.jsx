import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTotalPrice, removeAllItems, importItems } from "../../redux/slices/cartSlice";
import { addOrder } from "../../https/index";
import { useMutation } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { removeCustomer } from "../../redux/slices/customerSlice";
import Invoice from "../invoice/Invoice";
import { useNavigate } from "react-router-dom";
import axios from "axios";
// intenta usar tu cliente centralizado si existe
import * as http from "../../https/index";

const Bill = ({ mode, orderId, lockedTable = null, lockTableSelection = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.user);
  const customerData = useSelector((state) => state.customer);
  const cartData = useSelector((state) => state.cart);
  const total = useSelector(getTotalPrice);

  const [paymentMethod, setPaymentMethod] = useState("");
  const [showInvoice, setShowInvoice] = useState(false);
  const [orderInfo, setOrderInfo] = useState(null);

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  // cliente http: prioriza el que exportas en ../../https/index
  const httpClient =
    http.api || http.client || http.axiosInstance || http.default || axios;

  // --------- helpers (rehidratación & rutas plural/singular) ---------
  const fetchOrderById = async (id) => {
    try {
      const r = await httpClient.get(`${API_URL}/api/orders/${id}`);
      return r?.data?.data ?? r?.data;
    } catch (e) {
      if (e?.response?.status !== 404) throw e;
    }
    const r2 = await httpClient.get(`${API_URL}/api/order/${id}`);
    return r2?.data?.data ?? r2?.data;
  };

  const normalizeItemsFromOrder = (order) => {
    let items = order?.items || [];
    if (typeof items === "string") {
      try { items = JSON.parse(items); } catch { items = []; }
    }
    return (Array.isArray(items) ? items : []).map((it) => ({
      id: it.item_id ?? it.id ?? it._id ?? `${it.name}-${Number(it.price ?? it.total ?? 0)}`,
      name: it.item_name ?? it.name ?? "Artículo",
      quantity: Number(it.quantity ?? 1),
      price: Number(it.price ?? it.total ?? 0), // total por renglón desde DB
      notes: it.notes ?? "",
      __existing: true, // <- marca que viene de la orden
    }));
  };

  const appendItems = async ({ orderId, items }) => {
    // intenta PUT plural y luego singular
    try {
      return await httpClient.put(`${API_URL}/api/orders/${orderId}`, { op: "appendItems", items });
    } catch (e) {
      if (!(e?.response && e.response.status === 404)) throw e;
    }
    return httpClient.put(`${API_URL}/api/order/${orderId}`, { op: "appendItems", items });
  };

  // ========= MUTACIÓN: CREAR ORDEN (POST /api/order) =========
  const createOrderMutation = useMutation({
    mutationFn: (reqData) => addOrder(reqData), // ya usa tu cliente
    onSuccess: (res) => {
      const newOrderId = res?.data?.data?.orderId;

      const normalized = {
        orderId: newOrderId,
        createdBy: {
          id: user?.id ?? user?._id ?? null,
          name: user?.name ?? user?.full_name ?? user?.username ?? "Usuario",
          role: user?.role ?? "user",
        },
        paymentMethod: paymentMethod || "Pending",
        total,
        items: cartData,
        tableId:
          customerData?.table?.tableId ??
          customerData?.table?.id ??
          null,
      };

      setOrderInfo(normalized);
      enqueueSnackbar("¡Orden registrada correctamente!", { variant: "success" });

      // limpieza local
      dispatch(removeCustomer());
      dispatch(removeAllItems());

      navigate("/orders", { replace: true });
      setShowInvoice(true);
    },
    onError: (error) => {
      console.error(error);
      enqueueSnackbar("No se pudo registrar la orden", { variant: "error" });
    },
  });

  // ========= MUTACIÓN: APENDIZAR ARTÍCULOS =========
  const appendItemsMutation = useMutation({
    mutationFn: ({ orderId, items }) => appendItems({ orderId, items }),
    onSuccess: async () => {
      enqueueSnackbar("¡Artículos agregados a la orden!", { variant: "success" });

      try {
        // rehidrata para tener el carrito sincronizado (opcional)
        const fullOrder = await fetchOrderById(orderId);
        const normalized = normalizeItemsFromOrder(fullOrder);
        dispatch(removeAllItems());
        dispatch(importItems(normalized));
      } catch (e) {
        console.error("No se pudo rehidratar la orden después de agregar:", e);
      }

      // 👉 ahora SÍ navegamos a /orders para ver la lista actualizada
      navigate("/orders", { replace: true });
    },
    onError: (error) => {
      console.error(error);
      enqueueSnackbar(
        error?.response?.data?.message ||
          error?.message ||
          "No se pudieron agregar los artículos a la orden",
        { variant: "error" }
      );
    },
  });

  // ========= HANDLER =========
  const handlePlaceOrder = async () => {
    // --- APPEND: enviar SOLO los nuevos ---
    if (mode === "append" && orderId) {
      const newItems = cartData.filter((it) => !it.__existing);
      if (newItems.length === 0) {
        enqueueSnackbar("No hay artículos nuevos para agregar.", { variant: "info" });
        return;
      }
      const itemsPayload = newItems.map((it) => ({
        id: it.id,
        name: it.name,
        quantity: Number(it.quantity ?? 1),
        price: Number(it.price ?? 0), // total por renglón
        notes: it.notes ?? "",
      }));

      appendItemsMutation.mutate({ orderId, items: itemsPayload });
      return;
    }

    // --- CREAR ORDEN ---
    const raw = customerData?.table;
    const tableIdFromStore =
      typeof raw === "object" ? (raw?.tableId ?? raw?.id) : raw;

    const tableId = parseInt(
      (lockTableSelection && lockedTable != null) ? lockedTable : tableIdFromStore,
      10
    );

    if (!tableId || Number.isNaN(tableId)) {
      enqueueSnackbar("No se ha seleccionado una mesa.", { variant: "error" });
      return;
    }

    const orderData = {
      createdBy: {
        id: user?.id ?? user?._id ?? null,
        name: user?.name ?? user?.full_name ?? user?.username ?? "Usuario",
        role: user?.role ?? "user",
      },
      customerDetails: {
        name: user?.name ?? "Usuario",
        phone: "N/A",
        guests: customerData?.guests || 1,
      },
      orderStatus: "In Progress",
      bills: {
        total: total,
        tax: 0,
        totalWithTax: total,
      },
      items: cartData,       // cada item.price es total del renglón
      table: tableId,
      paymentMethod: paymentMethod || "Pending",
    };

    createOrderMutation.mutate(orderData);
  };

  const isAppending = mode === "append" && !!orderId;

  return (
    <>
      <div className="flex items-center justify-between px-5 mt-2">
        <p className="text-xs text-[#ababab] font-medium mt-2">
          Artículos ({cartData.length})
        </p>
        <h1 className="text-[#f5f5f5] text-md font-bold">
          ${total.toFixed(2)}
        </h1>
      </div>

      <div className="flex items-center gap-3 px-5 mt-4">
        <button
          onClick={handlePlaceOrder}
          className="bg-[#f6b100] px-4 py-3 w-full rounded-lg text-[#1f1f1f] font-semibold text-lg"
        >
          {isAppending ? "Agregar a la orden" : "Tomar Orden"}
        </button>
      </div>

      {showInvoice && !isAppending && (
        <Invoice orderInfo={orderInfo} setShowInvoice={setShowInvoice} />
      )}
    </>
  );
};

export default Bill;
