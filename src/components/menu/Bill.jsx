import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTotalPrice, removeAllItems } from "../../redux/slices/cartSlice";
import { addOrder } from "../../https/index";
import { useMutation } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { removeCustomer } from "../../redux/slices/customerSlice";
import Invoice from "../invoice/Invoice";
import { useNavigate } from "react-router-dom";

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

  const orderMutation = useMutation({
    mutationFn: (reqData) => addOrder(reqData),
    onSuccess: (res) => {
      const orderId = res?.data?.data?.orderId;

      // Normaliza datos para Invoice
      const normalized = {
        orderId,
        createdBy: {
          id: user?.id ?? user?._id ?? null,
          name: user?.name ?? user?.full_name ?? user?.username ?? "Usuario",
          role: user?.role ?? "user",
        },
        paymentMethod: "Pending",
        total,
        items: cartData,
        tableId:
          customerData?.table?.tableId ??
          customerData?.table?.id ??
          null,
      };

      setOrderInfo(normalized);

      enqueueSnackbar("¡Orden registrada correctamente!", {
        variant: "success",
      });

      // Limpieza local (el backend ya marcó la mesa como Ocupada)
      dispatch(removeCustomer());
      dispatch(removeAllItems());

      navigate("/orders");
      setShowInvoice(true);
    },
    onError: (error) => {
      console.error(error);
      enqueueSnackbar("No se pudo registrar la orden", { variant: "error" });
    },
  });

  const handlePlaceOrder = async () => {
    // Normaliza tableId a número
    const raw = customerData?.table;
    const tableId =
      typeof raw === "object"
        ? parseInt(raw?.tableId ?? raw?.id, 10)
        : parseInt(raw, 10);

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
      items: cartData,
      table: tableId, // número garantizado
      paymentMethod: paymentMethod || "Pending",
    };

    orderMutation.mutate(orderData);
  };

  return (
    <>
      <div className="flex items-center justify-between px-5 mt-2">
        <p className="text-xs text-[#ababab] font-medium mt-2">
          Articulos({cartData.length})
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
          Tomar Orden
        </button>
      </div>

      {showInvoice && (
        <Invoice orderInfo={orderInfo} setShowInvoice={setShowInvoice} />
      )}
    </>
  );
};

export default Bill;
