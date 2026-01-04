import { useEffect, useState, useRef } from "react";
import axios from "axios";
import AddCategoryModal from "./AddCategoryModal";
import AddDishModal from "./AddDishModal";
import { MdCategory } from "react-icons/md";
import { BiSolidDish } from "react-icons/bi";
import { useSelector } from "react-redux";
import { axiosWrapper } from "../../https/axiosWrapper";
import AddUserModal from "./AddUserModal";
import { enqueueSnackbar } from "notistack";
import { formatDateAndTime } from "../../utils";
import AddTableModal from "./AddTableModal";






import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import CorteTicket from "../corte/CorteTicket";
import { useReactToPrint } from "react-to-print";

// IMPORTS PARA REPORTES Y GRÁFICOS
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,     // ← para el gráfico de líneas
  LineElement,      // ← para el gráfico de líneas
  Title,
  Tooltip,
  Legend,
  Filler            // ← opcional pero recomendado para áreas rellenas
} from "chart.js";

import { Bar, Pie, Line } from 'react-chartjs-2'; // ← también puedes juntar esto aquí
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";



ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);  

const Metrics = () => {
  // ESTADOS GENERALES
  const [totalCash, setTotalCash] = useState(0);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("ingreso");
  const [description, setDescription] = useState("");
  const API_URL = import.meta.env.VITE_BACKEND_URL;
  const user = useSelector((state) => state.user.user);
  const queryClient = useQueryClient();

  // MENÚ
  const [categories, setCategories] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [editCategory, setEditCategory] = useState(null);
  const [editDish, setEditDish] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);

  // MESAS
  const [tables, setTables] = useState([]);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [editTable, setEditTable] = useState(null);

  // USUARIOS
  const [users, setUsers] = useState([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", role: "" });
  const [searchTerm, setSearchTerm] = useState("");

  // CAJA Y CORTE
  const [turnos, setTurnos] = useState([]);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState("");
  const [corteInfo, setCorteInfo] = useState(null);
  const [showCorteModal, setShowCorteModal] = useState(false);
  const corteRef = useRef();

  // TABS
  const [activeTab, setActiveTab] = useState("cash");

  // REPORTES
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [salesSummary, setSalesSummary] = useState(null);
  const [topDishes, setTopDishes] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState(null);
  const [loadingReports, setLoadingReports] = useState(false);

const [topWaiters, setTopWaiters] = useState([]);
const [salesByHour, setSalesByHour] = useState([]);
const [comparison, setComparison] = useState(null);


const [topKitchenTips, setTopKitchenTips] = useState([]);
const [totalKitchenTips, setTotalKitchenTips] = useState(0);




  // IMPRESIÓN DE CORTE
  const printCorte = useReactToPrint({
    content: () => corteRef.current || null,
    documentTitle: `Corte_Turno_${turnoSeleccionado}`,
    onAfterPrint: () => enqueueSnackbar("Corte impreso correctamente", { variant: "success" }),
  });

  const handlePrintClick = () => {
    if (!corteRef.current) {
      enqueueSnackbar("El ticket aún no está listo para imprimir", { variant: "error" });
      return;
    }
    printCorte();
  };

  // FUNCIÓN CORTE
  const handleCorte = async () => {
    if (!turnoSeleccionado) {
      enqueueSnackbar("Selecciona un turno válido", { variant: "error" });
      return;
    }

    try {
      const corteRes = await axiosWrapper.get(`${API_URL}/api/shifts/${turnoSeleccionado}/corte`);
      const corteData = corteRes.data;

      const movimientosRes = await axiosWrapper.get(`${API_URL}/api/cash-register?shift_id=${turnoSeleccionado}`);
      const movimientos = movimientosRes.data?.data || [];

      setCorteInfo({
        turnoId: turnoSeleccionado,
        cajero: corteData.cajero || user?.name || "N/A",
        inicio: corteData.inicio,
        cierre: corteData.cierre || "En curso",
        totalOrdenes: corteData.totalOrdenes || 0,
        totalEfectivo: corteData.totalEfectivo || 0,
        totalTarjeta: corteData.totalTarjeta || 0,
        countEfectivo: corteData.countEfectivo || 0,
        countTarjeta: corteData.countTarjeta || 0,
        ordenesPagadas: corteData.ordenes || 0,
        ingresos: corteData.ingresos || 0,
        egresos: corteData.egresos || 0,
        total: corteData.total || 0,
        movimientos: movimientos.length,
      });

      setShowCorteModal(true);
      enqueueSnackbar("Corte generado correctamente", { variant: "success" });
    } catch (err) {
      console.error(err);
      enqueueSnackbar("Error al generar corte", { variant: "error" });
    }
  };

  // FETCHERS
  const fetchCashbox = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/cash-balance`);
      setTotalCash(res.data.total || 0);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategories = async () => {
    const res = await axios.get(`${API_URL}/api/categories`);
    setCategories(res.data.data || []);
  };

  const fetchDishes = async () => {
    const res = await axios.get(`${API_URL}/api/dishes`);
    setDishes(res.data.data || []);
  };

  const fetchTables = async () => {
    const res = await axios.get(`${API_URL}/api/table`);
    setTables(res.data.data || []);
  };

  const fetchUsers = async () => {
    try {
      const res = await axiosWrapper.get("/api/user");
      setUsers(res.data?.data || res.data || []);
    } catch (err) {
      setUsers([]);
    }
  };

  const fetchTurnos = async () => {
    try {
      const res = await axiosWrapper.get(`${API_URL}/api/shifts`);
      setTurnos(res.data || []);
    } catch (error) {
      enqueueSnackbar("No se pudieron cargar los turnos", { variant: "error" });
    }
  };

  // MOVIMIENTO DE CAJA
  const handleSubmit = async () => {
    if (!amount || isNaN(amount)) {
      enqueueSnackbar("Ingresa un monto válido", { variant: "error" });
      return;
    }

    try {
      await axiosWrapper.post(`${API_URL}/api/admin/cash-movement`, {
        type,
        amount: parseFloat(amount),
        description: description || `Movimiento manual: ${type}`,
        user_id: user?.id,
      });

      setAmount("");
      setDescription("");
      await Promise.all([fetchCashbox()]);
      enqueueSnackbar("Movimiento registrado correctamente", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(`Error: ${err.response?.data?.message || err.message}`, { variant: "error" });
    }
  };

  // REPORTES
const generateReports = async () => {
  if (!reportStartDate || !reportEndDate) {
    enqueueSnackbar("Selecciona un rango de fechas válido", { variant: "warning" });
    return;
  }

  setLoadingReports(true);
  try {
    const params = `?start=${reportStartDate}&end=${reportEndDate}`;

    const [
      summaryRes, 
      topDishesRes, 
      paymentRes, 
      topWaitersRes, 
      salesHourRes, 
      comparisonRes,
      kitchenTipsRes  // ← NUEVO
    ] = await Promise.all([
      axiosWrapper.get(`${API_URL}/api/reports/sales-summary${params}`),
      axiosWrapper.get(`${API_URL}/api/reports/top-dishes${params}`),
      axiosWrapper.get(`${API_URL}/api/reports/payment-methods${params}`),
      axiosWrapper.get(`${API_URL}/api/reports/top-waiters${params}`),
      axiosWrapper.get(`${API_URL}/api/reports/sales-by-hour${params}`),
      axiosWrapper.get(`${API_URL}/api/reports/comparison${params}`),
      axiosWrapper.get(`${API_URL}/api/reports/top-kitchen-tips${params}`) // ← NUEVO
    ]);

    setSalesSummary(summaryRes.data);
    setTopDishes(topDishesRes.data.top10 || []);
    setPaymentMethods(paymentRes.data);
    setTopWaiters(topWaitersRes.data.top10 || []);
    setSalesByHour(salesHourRes.data.hours || []);
    setComparison(comparisonRes.data);

    // Propinas cocina
    setTopKitchenTips(kitchenTipsRes.data.top10 || []);
    const totalTips = kitchenTipsRes.data.top10?.reduce((sum, w) => sum + parseFloat(w.kitchen_tips || 0), 0) || 0;
    setTotalKitchenTips(totalTips);

  } catch (err) {
    console.error(err);
    enqueueSnackbar("Error al cargar los reportes", { variant: "error" });
  } finally {
    setLoadingReports(false);
  }
};

  const exportToExcel = (data, filename) => {
    if (!data || data.length === 0) {
      enqueueSnackbar("No hay datos para exportar", { variant: "info" });
      return;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `${filename}_${reportStartDate}_al_${reportEndDate}.xlsx`);
  };

  // QUERY DE ÓRDENES
  const { data: resData } = useQuery({
    queryKey: ["orders"],
    queryFn: () => axiosWrapper.get(`${API_URL}/api/cash-register`).then(res => res.data),
    placeholderData: keepPreviousData,
  });

  const orders = resData?.data || [];

  // USE EFFECT INICIAL
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setReportStartDate(today);
    setReportEndDate(today);

    Promise.all([
      fetchCashbox(),
      fetchCategories(),
      fetchDishes(),
      fetchTables(),
      fetchUsers(),
      fetchTurnos(),
    ]);
  }, []);

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
            <p className="text-gray-600 mt-1">Gestión completa y analítica de tu restaurante</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm px-6 py-4 text-center">
            <span className="text-gray-500 text-sm block">Saldo actual de caja</span>
            <div className="text-3xl font-bold text-green-600">
              ${Number(totalCash || 0).toFixed(2)}
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 mb-8">
          {[
            { key: "cash", label: "Gestión de Caja" },
            { key: "menu", label: "Gestión de Menú" },
            { key: "users", label: "Usuarios" },
            { key: "tables", label: "Mesas" },
            { key: "reports", label: "Reportes y Analítica" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-3 px-6 font-medium text-sm rounded-t-lg transition-colors ${
                activeTab === tab.key
                  ? "bg-white text-blue-600 border-t-2 border-l border-r border-blue-600 -mb-px shadow-sm"
                  : "text-gray-500 hover:text-gray-700 bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* === GESTIÓN DE CAJA === */}
        {activeTab === "cash" && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Movimientos de Caja</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Resumen de Caja</h3>
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-gray-500">Saldo actual</div>
                    <div className="text-2xl font-bold text-gray-800">${Number(totalCash || 0).toFixed(2)}</div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Registrar movimiento</h3>
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <button onClick={() => setType("ingreso")} className={`flex-1 py-2 px-4 rounded-lg ${type === "ingreso" ? "bg-green-50 text-green-800 border-green-200" : "bg-gray-50"} border`}>
                        Ingreso
                      </button>
                      <button onClick={() => setType("retiro")} className={`flex-1 py-2 px-4 rounded-lg ${type === "retiro" ? "bg-red-50 text-red-800 border-red-200" : "bg-gray-50"} border`}>
                        Retiro
                      </button>
                    </div>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full px-4 py-2 border rounded-lg" />
                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción (opcional)" className="w-full px-4 py-2 border rounded-lg" />
                    <button onClick={handleSubmit} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium">
                      Registrar Movimiento
                    </button>
                  </div>
                </div>
              </div>

              {/* CORTE POR TURNO */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 mt-8">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Corte de Caja por Turno</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <select value={turnoSeleccionado} onChange={e => setTurnoSeleccionado(e.target.value)} className="px-4 py-2 border rounded-lg">
                    <option value="">-- Selecciona turno --</option>
                    {turnos.map(turno => (
                      <option key={turno.id} value={turno.id}>
                        Turno #{turno.id} - {formatDateAndTime(turno.start_time)}
                      </option>
                    ))}
                  </select>
                  <button onClick={handleCorte} className="bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg">
                    Generar Corte
                  </button>
                </div>
              </div>

              {/* TABLA DE MOVIMIENTOS */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Últimos movimientos</h3>
                <div className="overflow-x-auto">
                  <table className="w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mesero</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pago</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map(order => (
                        <tr key={order.id}>
                          <td className="px-6 py-4 text-sm">#{order.id}</td>
                          <td className="px-6 py-4 text-sm">{order.waiter_name || "N/A"}</td>
                          <td className="px-6 py-4 text-sm">{order.date ? formatDateAndTime(order.date) : "N/A"}</td>
                          <td className="px-6 py-4 text-sm">{order.description || "N/A"}</td>
                          <td className={`px-6 py-4 text-sm text-right font-medium ${order.type === "ingreso" ? "text-green-600" : "text-red-600"}`}>
                            ${Number(order.amount || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${order.payment_method === "efectivo" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>
                              {order.payment_method || "N/D"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === GESTIÓN DE MENÚ === */}
        {activeTab === "menu" && (
          <div className="space-y-8">
            {/* CATEGORÍAS */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Categorías del Menú</h2>
                <button onClick={() => setIsCategoryModalOpen(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center">
                  Nueva Categoría <MdCategory className="ml-2" />
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {categories.map(cat => (
                    <div key={cat.id} className="border rounded-lg overflow-hidden hover:shadow-md">
                      <div className="h-2" style={{ backgroundColor: cat.bg_color || "#4f46e5" }}></div>
                      <div className="p-4">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{cat.icon}</span>
                          <h3 className="font-bold text-lg">{cat.name}</h3>
                        </div>
                        <div className="mt-4 flex justify-between">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {dishes.filter(d => d.category_id === cat.id).length} platillos
                          </span>
                          <button onClick={() => setEditCategory(cat)} className="text-blue-600 text-sm">
                            Editar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* PLATILLOS */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Platillos</h2>
                <button onClick={() => setIsDishModalOpen(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center">
                  Nuevo Platillo <BiSolidDish className="ml-2" />
                </button>
              </div>
              <div className="p-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platillo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dishes.map(dish => (
                      <tr key={dish.id}>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-gray-200 border-2 border-dashed rounded mr-4" />
                            <div>
                              <div className="text-sm font-medium">{dish.name}</div>
                              <div className="text-sm text-gray-500">{dish.description || "Sin descripción"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">${dish.price}</td>
                        <td className="px-6 py-4 text-sm">{dish.category_name}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Activo</span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm">
                          <button onClick={() => setEditDish(dish)} className="text-blue-600 mr-4">Editar</button>
                          <button className="text-red-600">Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* === GESTIÓN DE USUARIOS === */}
        {activeTab === "users" && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <div className="w-full max-w-md">
                <input
                  type="text"
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <button onClick={() => setIsAddUserOpen(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                Nuevo Usuario
              </button>
            </div>
            <div className="p-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Correo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 text-sm">{user.name}</td>
                      <td className="px-6 py-4 text-sm">{user.email}</td>
                      <td className="px-6 py-4 text-sm">{user.phone || "-"}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${user.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-green-100 text-green-800"}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <button onClick={() => {
                          setEditingUser(user);
                          setFormData({ name: user.name, email: user.email, phone: user.phone || "", role: user.role });
                        }} className="text-blue-600 mr-4">Editar</button>
                        <button className="text-red-600">Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* === GESTIÓN DE MESAS === */}
        {activeTab === "tables" && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Mesas</h2>
              <button onClick={() => setIsTableModalOpen(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                Nueva Mesa
              </button>
            </div>
            <div className="p-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mesa</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estatus</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asientos</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tables.map(table => (
                    <tr key={table.id}>
                      <td className="px-6 py-4 text-sm font-medium">{table.table_no}</td>
                      <td className="px-6 py-4 text-sm">{table.status}</td>
                      <td className="px-6 py-4 text-sm">{table.seats}</td>
                      <td className="px-6 py-4 text-right text-sm">
                        <button onClick={() => setEditTable(table)} className="text-blue-600 mr-4">Editar</button>
                        <button className="text-red-600">Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* === REPORTES Y ANALÍTICA === */}
        {activeTab === "reports" && (
  <div className="space-y-8">
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-8 text-white">
        <h2 className="text-3xl font-bold">Reportes y Analítica</h2>
        <p className="mt-2 text-indigo-100 text-lg">Datos clave para hacer crecer tu negocio</p>
      </div>

      <div className="p-8">
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Desde</label>
            <input
              type="date"
              value={reportStartDate}
              onChange={(e) => setReportStartDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
            <input
              type="date"
              value={reportEndDate}
              onChange={(e) => setReportEndDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={generateReports}
              disabled={loadingReports}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-3 rounded-lg transition shadow-md"
            >
              {loadingReports ? "Cargando..." : "Generar Reportes"}
            </button>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => exportToExcel(topDishes, "top_platillos")}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition shadow-md"
            >
              Exportar Excel
            </button>
          </div>
        </div>

        {/* Resumen Principal */}
        {salesSummary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg">
              <p className="text-blue-100 font-medium">Ventas Totales</p>
              <p className="text-4xl font-bold mt-2">${salesSummary.totalSales.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
              <p className="text-green-100 font-medium">Órdenes</p>
              <p className="text-4xl font-bold mt-2">{salesSummary.totalOrders}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
              <p className="text-purple-100 font-medium">Ticket Promedio</p>
              <p className="text-4xl font-bold mt-2">${salesSummary.avgTicket.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl text-white shadow-lg">
              <p className="text-orange-100 font-medium">Clientes</p>
              <p className="text-4xl font-bold mt-2">{salesSummary.totalCustomers}</p>
            </div>
<div className="bg-gradient-to-br from-amber-500 to-amber-600 p-6 rounded-xl text-white shadow-lg">
      <p className="text-amber-100 font-medium">Propinas Cocina (3%)</p>
      <p className="text-4xl font-bold mt-2">${totalKitchenTips.toFixed(2)}</p>
      <p className="text-sm opacity-90 mt-1">A repartir</p>
    </div>

            
          </div>
        )}

        {/* Comparativa */}
        {comparison && (
          <div className="bg-gray-50 rounded-xl p-8 mb-10 shadow-md">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Comparativa con Período Anterior</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-gray-600">Período Actual</p>
                <p className="text-2xl font-bold text-indigo-600">${comparison.current.sales.toFixed(2)}</p>
                <p className="text-sm text-gray-500">{comparison.current.period}</p>
              </div>
              <div className="flex items-center justify-center">
                <div className={`text-5xl font-bold ${comparison.percentage >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {comparison.percentage >= 0 ? "↑" : "↓"} {Math.abs(comparison.percentage)}%
                </div>
              </div>
              <div>
                <p className="text-gray-600">Período Anterior</p>
                <p className="text-2xl font-bold text-gray-700">${comparison.previous.sales.toFixed(2)}</p>
                <p className="text-sm text-gray-500">{comparison.previous.period}</p>
              </div>
            </div>
          </div>
        )}

        {/* Gráficos Principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
          {/* Top Platillos */}
          {topDishes.length > 0 && (
            <div className="bg-gray-50 p-8 rounded-xl shadow-md">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Top 10 Platillos Más Vendidos</h3>
              <Bar
                data={{
                  labels: topDishes.map(d => d.name.length > 18 ? d.name.substring(0, 18) + "..." : d.name),
                  datasets: [{
                    label: "Ventas ($)",
                    
                    data: topDishes.map(d => d.total_sales),
                    backgroundColor: "#6366f1",
                    borderRadius: 8,
                  }]
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true } }
                }}
              />
            </div>
          )}

          {/* Top Meseros */}
          {topWaiters.length > 0 && (
            <div className="bg-gray-50 p-8 rounded-xl shadow-md">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Top 10 Meseros</h3>
              <Bar
                data={{
                  labels: topWaiters.map(w => w.name.length > 18 ? w.name.substring(0, 18) + "..." : w.name),
                  datasets: [{
                    label: "Ventas ($)",
                    data: topWaiters.map(w => w.total_sales),
                    backgroundColor: "#10b981",
                    borderRadius: 8,
                  }]
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true } }
                }}
              />
            </div>
          )}

          {/* Top Propinas Cocina */}
{topKitchenTips.length > 0 && (
  <div className="bg-gray-50 p-8 rounded-xl shadow-md">
    <h3 className="text-2xl font-bold text-gray-800 mb-6">
      Top 10 Meseros - Propinas para Cocina (3%)
    </h3>
    <Bar
      key={`bar-kitchen-tips-${reportStartDate}-${reportEndDate}`}
      data={{
        labels: topKitchenTips.map(w => w.name.length > 18 ? w.name.substring(0, 18) + "..." : w.name),
        datasets: [{
          label: "Propinas Cocina ($)",
          data: topKitchenTips.map(w => w.kitchen_tips),
          backgroundColor: "#f59e0b",
          borderRadius: 8,
        }]
      }}
      options={{
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }}
    />
  </div>
)}  
          
        </div>

        {/* Gráficos Secundarios */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Ventas por Hora */}
          {salesByHour.length > 0 && (
            <div className="bg-gray-50 p-8 rounded-xl shadow-md">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Ventas por Hora del Día</h3>
              <Line
                data={{
                  labels: salesByHour.map(h => `${h.hour}:00`),
                  datasets: [{
                    label: "Ventas ($)",
                    data: salesByHour.map(h => h.total_sales),
                    borderColor: "#f59e0b",
                    backgroundColor: "rgba(245, 158, 11, 0.1)",
                    tension: 0.4,
                    fill: true,
                  }]
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true } }
                }}
              />
            </div>
          )}

          {/* Métodos de Pago */}
          {paymentMethods && (
            <div className="bg-gray-50 p-8 rounded-xl shadow-md">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Ventas por Método de Pago</h3>
              <div className="max-w-md mx-auto">
                <Pie
                  data={{
                    labels: ["Efectivo", "Tarjeta", "Otros"],
                    datasets: [{
                      data: [paymentMethods.cash, paymentMethods.card, paymentMethods.other],
                      backgroundColor: ["#10b981", "#3b82f6", "#f59e0b"],
                      borderWidth: 0,
                    }]
                  }}
                  options={{ responsive: true }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
)}

        {/* MODALES */}
        {isCategoryModalOpen && <AddCategoryModal setIsOpen={setIsCategoryModalOpen} onClose={() => fetchCategories()} />}
        {editCategory && <AddCategoryModal setIsOpen={() => setEditCategory(null)} initialData={editCategory} isEditing />}
        {isDishModalOpen && <AddDishModal setIsOpen={setIsDishModalOpen} onClose={() => fetchDishes()} />}
        {editDish && <AddDishModal setIsOpen={() => setEditDish(null)} initialData={editDish} isEditing />}
        {isTableModalOpen && <AddTableModal setIsOpen={setIsTableModalOpen} onTableAdded={() => fetchTables()} />}
        {editTable && <AddTableModal setIsOpen={() => setEditTable(null)} initialData={editTable} isEditing />}
        {isAddUserOpen && <AddUserModal setIsOpen={setIsAddUserOpen} onUserAdded={fetchUsers} />}
        {showCorteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl">
              <CorteTicket corte={corteInfo} onClose={() => setShowCorteModal(false)} ref={corteRef} />
            </div>
          </div>
        )}

        {/* MODAL EDITAR USUARIO (si lo usas así) */}
        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Editar Usuario</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const token = localStorage.getItem("token");
                  await axiosWrapper.put(`/api/user/${editingUser.id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  fetchUsers();
                  setEditingUser(null);
                } catch (err) {
                  enqueueSnackbar("Error al editar", { variant: "error" });
                }
              }}>
                <input className="w-full mb-3 px-4 py-2 border rounded" placeholder="Nombre" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                <input className="w-full mb-3 px-4 py-2 border rounded" type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                <input className="w-full mb-3 px-4 py-2 border rounded" placeholder="Teléfono" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                <select className="w-full mb-6 px-4 py-2 border rounded" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} required>
                  <option value="">Seleccionar rol</option>
                  <option value="admin">Administrador</option>
                  <option value="Waiter">Mesero</option>
                </select>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 border rounded">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Metrics;