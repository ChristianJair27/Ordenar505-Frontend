import React, { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTotalPrice, removeAllItems } from "../../redux/slices/cartSlice";
import { addOrder, updateTable } from "../../https/index";
import { useMutation } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { removeCustomer } from "../../redux/slices/customerSlice";
import Invoice from "../invoice/Invoice";
import { useNavigate } from "react-router-dom";
import KitchenTicket from "../invoice/KitchenTicket";
import { useReactToPrint } from "react-to-print";

const Bill = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.user);
  const customerData = useSelector((state) => state.customer);
  const cartData = useSelector((state) => state.cart);
  const total = useSelector(getTotalPrice);

  const [paymentMethod, setPaymentMethod] = useState("");
  const [showInvoice, setShowInvoice] = useState(false);
  const [orderInfo, setOrderInfo] = useState(null);

  const handlePlaceOrder = async () => {
    // ⚠️ Si el backend aún requiere customerDetails, lo mandamos "dummy".
    // El nombre mostrado y trazabilidad vendrán de createdBy.
    const orderData = {
      createdBy: {                                           // 👈 NUEVO: quién generó la orden
        id: user?.id ?? user?._id ?? null,
        name: user?.name ?? user?.full_name ?? user?.username ?? "Usuario",
        role: user?.role ?? "user",
      },
      customerDetails: {
        name: user?.name ?? "Usuario",                       // 👈 ya no customerName del formulario
        phone: "N/A",
        guests: customerData?.guests || 1,
      },
      orderStatus: "In Progress",
      bills: {
        total: total,
        tax: 0,
        totalWithTax: total,
      },
      items: cartData,
      table: customerData?.table?.tableId || null,
      paymentMethod: paymentMethod || "Pending",
    };

    if (!orderData.table) {
      enqueueSnackbar("No se ha seleccionado una mesa.", { variant: "error" });
      return;
    }

    orderMutation.mutate(orderData);
  };

  const orderMutation = useMutation({
    mutationFn: (reqData) => addOrder(reqData),
    onSuccess: (resData) => {
      const { data } = resData.data;

      // Normaliza para que Ticket/Invoice puedan leer createdBy siempre
      const normalized = {
        ...data,
        createdBy: data.createdBy ?? {
          id: user?.id ?? user?._id ?? null,
          name: user?.name ?? user?.full_name ?? user?.username ?? "Usuario",
          role: user?.role ?? "user",
        },
        paymentMethod: data.paymentMethod || "Pending",
      };

      setOrderInfo(normalized);

      const tableData = {
        status: "Ocupado",
        orderId: data._id,
        tableId: customerData?.table?.tableId,
      };

      setTimeout(() => {
        printKitchen();
        tableUpdateMutation.mutate(tableData);
      }, 1000);

      enqueueSnackbar("¡Orden registrada correctamente!", { variant: "success" });
      navigate("/orders");
      setShowInvoice(true);
    },
    onError: (error) => {
      console.log(error);
      enqueueSnackbar("No se pudo registrar la orden", { variant: "error" });
    },
  });

  const tableUpdateMutation = useMutation({
    mutationFn: (reqData) => updateTable(reqData),
    onSuccess: () => {
      dispatch(removeCustomer());
      dispatch(removeAllItems());
      window.location.reload();
    },
    onError: (error) => console.error("Error actualizando mesa:", error),
  });

  const kitchenRef = useRef();
  const printKitchen = useReactToPrint({
    content: () => kitchenRef.current,
    documentTitle: `Orden_Mesa_${customerData?.table?.tableId || "N/A"}`,
  });

  return (
    <>
      <div className="flex items-center justify-between px-5 mt-2">
        <p className="text-xs text-[#ababab] font-medium mt-2">Items({cartData.length})</p>
        <h1 className="text-[#f5f5f5] text-md font-bold">${total.toFixed(2)}</h1>
      </div>

      <div className="flex items-center gap-3 px-5 mt-4">
        <button
          onClick={handlePlaceOrder}
          className="bg-[#f6b100] px-4 py-3 w-full rounded-lg text-[#1f1f1f] font-semibold text-lg"
        >
          Tomar Orden
        </button>
      </div>

      {/* Ticket de cocina recibe orderInfo con createdBy */}
      <div style={{ display: "none" }}>
        <KitchenTicket ref={kitchenRef} order={orderInfo} />
      </div>

      {showInvoice && <Invoice orderInfo={orderInfo} setShowInvoice={setShowInvoice} />}
    </>
  );
};

export default Bill;
