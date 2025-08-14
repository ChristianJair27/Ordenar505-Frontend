import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTotalPrice, removeAllItems } from "../../redux/slices/cartSlice";
import { addOrder, updateTable } from "../../https/index";
import { useMutation } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { removeCustomer } from "../../redux/slices/customerSlice";
import Invoice from "../invoice/Invoice";
import { useNavigate } from "react-router-dom";
import KitchenTicket from "../invoice/KitchenTicket";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";

const Bill = () => {
  const dispatch = useDispatch();
  const customerData = useSelector((state) => state.customer);
  const cartData = useSelector((state) => state.cart);
  const total = useSelector(getTotalPrice);
  const navigate = useNavigate();

  const taxRate = 5.25;
  const tax = (total * taxRate) / 100;
  const totalPriceWithTax = total + tax;

  const [paymentMethod, setPaymentMethod] = useState(""); // vacío por defecto
  const [showInvoice, setShowInvoice] = useState(false);
  const [orderInfo, setOrderInfo] = useState(null);

  const handlePlaceOrder = async () => {
    const orderData = {
  customerDetails: {
    name: customerData?.customerName || "N/A",
    phone: customerData?.customerPhone || "N/A",
    guests: customerData?.guests || 1,
  },
  orderStatus: "In Progress",
  bills: {
    total: total,
    tax: 0, // puedes dejarlo explícito o eliminarlo si el backend lo permite
    totalWithTax: total, // el total será el mismo
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
      setOrderInfo({
        ...data,
        paymentMethod: data.paymentMethod || "Pending",
      });

      const tableData = {
        status: "Booked",
        orderId: data._id,
        tableId: customerData?.table?.tableId, // ¡Este es el correcto!
      };

      console.log("Actualizando mesa con:", tableData);
      setTimeout(() => {
        printKitchen();
        tableUpdateMutation.mutate(tableData);
      }, 1000);

      enqueueSnackbar("¡Orden registrada correctamente!", {
        variant: "success",
        
      });
      navigate("/orders");
      setShowInvoice(true);
    },
    onError: (error) => {
      console.log(error);
      enqueueSnackbar("No se pudo registrar la orden", {
        variant: "error",
      });
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
        <p className="text-xs text-[#ababab] font-medium mt-2">
          Items({cartData.length})
        </p>
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
      <div style={{ display: "none" }}>
  <KitchenTicket ref={kitchenRef} order={orderInfo} />
</div>

      {showInvoice && (
        <Invoice orderInfo={orderInfo} setShowInvoice={setShowInvoice} />
      )}
    </>
  );
};

export default Bill;