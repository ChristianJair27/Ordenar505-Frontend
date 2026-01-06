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

import {
  Chart as ChartJS,
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
} from "chart.js";

import { Bar, Pie, Line } from 'react-chartjs-2';
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
  const [totalCash, setTotalCash] = useState(0);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("ingreso");
  const [description, setDescription] = useState("");
  const API_URL = import.meta.env.VITE_BACKEND_URL;
  const user = useSelector((state) => state.user.user);

  const [categories, setCategories] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [editCategory, setEditCategory] = useState(null);
  const [editDish, setEditDish] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);

  const [tables, setTables] = useState([]);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [editTable, setEditTable] = useState(null);

  const [users, setUsers] = useState([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", role: "" });
  const [searchTerm, setSearchTerm] = useState("");

  const [turnos, setTurnos] = useState([]);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState("");
  const [corteInfo, setCorteInfo] = useState(null);
  const [showCorteModal, setShowCorteModal] = useState(false);
  const corteRef = useRef();

  const [activeTab, setActiveTab] = useState("cash");

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

  const [aiAnalysis, setAiAnalysis] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);

  const generateAIAnalysis = async () => {
    if (!salesSummary) {
      enqueueSnackbar("Genera los reportes primero", { variant: "warning" });
      return;
    }

    setLoadingAI(true);
    setAiAnalysis("");

    try {
      const payload = {
        salesSummary,
        topDishes: topDishes || [],
        topWaiters: topWaiters || [],
        topKitchenTips: topKitchenTips || [],
        totalKitchenTips: totalKitchenTips || 0,
        paymentMethods: paymentMethods || { cash: 0, card: 0, other: 0 },
        salesByHour: salesByHour || [],
        comparison: comparison || null,
        start: reportStartDate,
        end: reportEndDate,
      };

      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await axios.post(`${API_URL}/api/reports/ai-analysis`, payload, { headers, timeout: 600000 });

      const analysisText = res.data?.analysis || "Análisis generado pero sin contenido.";
      setAiAnalysis(analysisText);
      enqueueSnackbar("¡Análisis IA generado con éxito!", { variant: "success" });
    } catch (err) {
      console.error("Error IA:", err);
      const msg = err.response?.data?.message || err.message || "Error al generar análisis";
      enqueueSnackbar(msg, { variant: "error" });
    } finally {
      setLoadingAI(false);
    }
  };

  const generateReports = async () => {
    if (!reportStartDate || !reportEndDate) {
      enqueueSnackbar("Selecciona fechas válidas", { variant: "warning" });
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
        kitchenTipsRes
      ] = await Promise.all([
        axiosWrapper.get(`${API_URL}/api/reports/sales-summary${params}`),
        axiosWrapper.get(`${API_URL}/api/reports/top-dishes${params}`),
        axiosWrapper.get(`${API_URL}/api/reports/payment-methods${params}`),
        axiosWrapper.get(`${API_URL}/api/reports/top-waiters${params}`),
        axiosWrapper.get(`${API_URL}/api/reports/sales-by-hour${params}`),
        axiosWrapper.get(`${API_URL}/api/reports/comparison${params}`),
        axiosWrapper.get(`${API_URL}/api/reports/top-kitchen-tips${params}`)
      ]);

      setSalesSummary(summaryRes.data);
      setTopDishes(topDishesRes.data.top10 || []);
      setPaymentMethods(paymentRes.data);
      setTopWaiters(topWaitersRes.data.top10 || []);
      setSalesByHour(salesHourRes.data.hours || []);
      setComparison(comparisonRes.data);

      setTopKitchenTips(kitchenTipsRes.data.top10 || []);
      const totalTips = kitchenTipsRes.data.top10?.reduce((sum, w) => sum + parseFloat(w.kitchen_tips || 0), 0) || 0;
      setTotalKitchenTips(totalTips);

      enqueueSnackbar("Reportes generados", { variant: "success" });
    } catch (err) {
      console.error(err);
      enqueueSnackbar("Error al cargar reportes", { variant: "error" });
    } finally {
      setLoadingReports(false);
    }
  };

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

  const { data: resData } = useQuery({
    queryKey: ["orders"],
    queryFn: () => axiosWrapper.get(`${API_URL}/api/cash-register`).then(res => res.data),
    placeholderData: keepPreviousData,
  });

  const orders = resData?.data || [];

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

  const tabs = [
    { key: "cash", label: "Caja" },
    { key: "menu", label: "Menú" },
    { key: "users", label: "Usuarios" },
    { key: "tables", label: "Mesas" },
    { key: "reports", label: "Reportes & IA" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Panel de Administración</h1>
              <p className="text-xl text-gray-600 mt-2">La Peña de Santiago</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-sm">Saldo actual de caja</p>
              <p className="text-5xl font-bold text-green-600">${Number(totalCash || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-md p-2 mb-12">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all ${
                  activeTab === tab.key
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* === CAJA === */}
        {activeTab === "cash" && (
          <div className="space-y-12">
            {/* Registrar movimiento y corte */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="bg-white rounded-2xl shadow-lg p-10">
                <h3 className="text-2xl font-bold text-gray-900 mb-8">Registrar Movimiento</h3>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <button
                      onClick={() => setType("ingreso")}
                      className={`flex-1 py-4 rounded-xl font-semibold transition ${
                        type === "ingreso" 
                          ? "bg-green-600 text-white shadow-md" 
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Ingreso
                    </button>
                    <button
                      onClick={() => setType("retiro")}
                      className={`flex-1 py-4 rounded-xl font-semibold transition ${
                        type === "retiro" 
                          ? "bg-red-600 text-white shadow-md" 
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Retiro
                    </button>
                  </div>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Monto"
                    className="w-full px-6 py-5 border border-gray-300 rounded-xl text-xl focus:ring-4 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descripción (opcional)"
                    className="w-full px-6 py-5 border border-gray-300 rounded-xl text-xl focus:ring-4 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    onClick={handleSubmit}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-5 rounded-xl shadow-lg transition transform hover:scale-105"
                  >
                    Registrar Movimiento
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-10">
                <h3 className="text-2xl font-bold text-gray-900 mb-8">Corte de Caja por Turno</h3>
                <div className="space-y-6">
                  <select
                    value={turnoSeleccionado}
                    onChange={(e) => setTurnoSeleccionado(e.target.value)}
                    className="w-full px-6 py-5 border border-gray-300 rounded-xl text-xl focus:ring-4 focus:ring-indigo-500"
                  >
                    <option value="">-- Selecciona turno --</option>
                    {turnos.map((turno) => (
                      <option key={turno.id} value={turno.id}>
                        Turno #{turno.id} - {formatDateAndTime(turno.start_time)}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleCorte}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-5 rounded-xl shadow-lg transition transform hover:scale-105"
                  >
                    Generar Corte
                  </button>
                </div>
              </div>
            </div>

            {/* Últimos movimientos */}
            <div className="bg-white rounded-2xl shadow-lg p-10">
              <h3 className="text-2xl font-bold text-gray-900 mb-8">Últimos Movimientos</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b-2 border-gray-200">
                    <tr>
                      <th className="text-left py-4 text-gray-600 font-medium">Order ID</th>
                      <th className="text-left py-4 text-gray-600 font-medium">Mesero</th>
                      <th className="text-left py-4 text-gray-600 font-medium">Fecha</th>
                      <th className="text-left py-4 text-gray-600 font-medium">Descripción</th>
                      <th className="text-right py-4 text-gray-600 font-medium">Total</th>
                      <th className="text-left py-4 text-gray-600 font-medium">Pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-100">
                        <td className="py-6">#{order.id}</td>
                        <td className="py-6">{order.waiter_name || "N/A"}</td>
                        <td className="py-6">{order.date ? formatDateAndTime(order.date) : "N/A"}</td>
                        <td className="py-6">{order.description || "N/A"}</td>
                        <td className={`py-6 text-right font-bold ${order.type === "ingreso" ? "text-green-600" : "text-red-600"}`}>
                          ${Number(order.amount || 0).toFixed(2)}
                        </td>
                        <td className="py-6">
                          <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                            order.payment_method === "efectivo" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                          }`}>
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
        )}

        {/* === MENÚ === */}
        {activeTab === "menu" && (
          <div className="space-y-12">
            <div className="bg-white rounded-2xl shadow-lg p-10">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-bold text-gray-900">Categorías del Menú</h2>
                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition transform hover:scale-105 flex items-center gap-4"
                >
                  Nueva Categoría <MdCategory className="text-2xl" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {categories.map((cat) => (
                  <div key={cat.id} className="bg-gray-50 rounded-2xl overflow-hidden hover:shadow-xl transition">
                    <div className="h-3" style={{ backgroundColor: cat.bg_color || "#6366f1" }}></div>
                    <div className="p-8">
                      <div className="flex items-center gap-4 mb-6">
                        <span className="text-5xl">{cat.icon}</span>
                        <h3 className="text-2xl font-bold text-gray-900">{cat.name}</h3>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-gray-600">
                          {dishes.filter((d) => d.category_id === cat.id).length} platillos
                        </p>
                        <button
                          onClick={() => setEditCategory(cat)}
                          className="text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-10">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-bold text-gray-900">Platillos</h2>
                <button
                  onClick={() => setIsDishModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition transform hover:scale-105 flex items-center gap-4"
                >
                  Nuevo Platillo <BiSolidDish className="text-2xl" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b-2 border-gray-200">
                    <tr>
                      <th className="text-left py-6 text-gray-600 font-medium">Platillo</th>
                      <th className="text-left py-6 text-gray-600 font-medium">Precio</th>
                      <th className="text-left py-6 text-gray-600 font-medium">Categoría</th>
                      <th className="text-left py-6 text-gray-600 font-medium">Estado</th>
                      <th className="text-right py-6 text-gray-600 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dishes.map((dish) => (
                      <tr key={dish.id} className="border-b border-gray-100">
                        <td className="py-8">
                          <div className="flex items-center gap-6">
                            <div className="h-20 w-20 bg-gray-200 border-2 border-dashed rounded-xl" />
                            <div>
                              <p className="text-xl font-semibold text-gray-900">{dish.name}</p>
                              <p className="text-gray-600">{dish.description || "Sin descripción"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-8 text-xl font-semibold">${dish.price}</td>
                        <td className="py-8">{dish.category_name}</td>
                        <td className="py-8">
                          <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-medium">Activo</span>
                        </td>
                        <td className="py-8 text-right">
                          <button
                            onClick={() => setEditDish(dish)}
                            className="text-indigo-600 hover:text-indigo-700 font-medium mr-6"
                          >
                            Editar
                          </button>
                          <button className="text-red-600 hover:text-red-700 font-medium">
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* === USUARIOS === */}
        {activeTab === "users" && (
          <div className="bg-white rounded-2xl shadow-lg p-10">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900">Usuarios</h2>
              <button
                onClick={() => setIsAddUserOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition transform hover:scale-105"
              >
                Nuevo Usuario
              </button>
            </div>
            <div className="mb-8">
              <input
                type="text"
                placeholder="Buscar por nombre, email o rol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full max-w-lg px-6 py-4 border border-gray-300 rounded-xl text-lg focus:ring-4 focus:ring-indigo-500"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b-2 border-gray-200">
                  <tr>
                    <th className="text-left py-6 text-gray-600 font-medium">Nombre</th>
                    <th className="text-left py-6 text-gray-600 font-medium">Correo</th>
                    <th className="text-left py-6 text-gray-600 font-medium">Teléfono</th>
                    <th className="text-left py-6 text-gray-600 font-medium">Rol</th>
                    <th className="text-right py-6 text-gray-600 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100">
                      <td className="py-8 text-lg">{user.name}</td>
                      <td className="py-8">{user.email}</td>
                      <td className="py-8">{user.phone || "-"}</td>
                      <td className="py-8">
                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                          user.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-green-100 text-green-800"
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-8 text-right">
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setFormData({ name: user.name, email: user.email, phone: user.phone || "", role: user.role });
                          }}
                          className="text-indigo-600 hover:text-indigo-700 font-medium mr-6"
                        >
                          Editar
                        </button>
                        <button className="text-red-600 hover:text-red-700 font-medium">
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* === MESAS === */}
        {activeTab === "tables" && (
          <div className="bg-white rounded-2xl shadow-lg p-10">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900">Mesas</h2>
              <button
                onClick={() => setIsTableModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition transform hover:scale-105"
              >
                Nueva Mesa
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b-2 border-gray-200">
                  <tr>
                    <th className="text-left py-6 text-gray-600 font-medium">Mesa</th>
                    <th className="text-left py-6 text-gray-600 font-medium">Estatus</th>
                    <th className="text-left py-6 text-gray-600 font-medium">Asientos</th>
                    <th className="text-right py-6 text-gray-600 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tables.map((table) => (
                    <tr key={table.id} className="border-b border-gray-100">
                      <td className="py-8 text-xl font-semibold">Mesa {table.table_no}</td>
                      <td className="py-8">
                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                          table.status === "ocupada" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                        }`}>
                          {table.status}
                        </span>
                      </td>
                      <td className="py-8">{table.seats} personas</td>
                      <td className="py-8 text-right">
                        <button
                          onClick={() => setEditTable(table)}
                          className="text-indigo-600 hover:text-indigo-700 font-medium mr-6"
                        >
                          Editar
                        </button>
                        <button className="text-red-600 hover:text-red-700 font-medium">
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* === REPORTES & IA === */}
        {activeTab === "reports" && (
          <div className="space-y-16">
            {/* Filtros */}
            <div className="bg-white rounded-2xl shadow-lg p-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Filtros de Reporte</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">Desde</label>
                  <input
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                    className="w-full px-6 py-4 border border-gray-300 rounded-xl text-lg focus:ring-4 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">Hasta</label>
                  <input
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                    className="w-full px-6 py-4 border border-gray-300 rounded-xl text-lg focus:ring-4 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={generateReports}
                    disabled={loadingReports}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-4 px-10 rounded-xl shadow-lg transition"
                  >
                    {loadingReports ? "Generando..." : "Generar Reportes"}
                  </button>
                </div>
              </div>
            </div>

            {/* Resumen clave */}
            {salesSummary && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-10 rounded-2xl shadow-xl text-white">
                  <p className="text-blue-200 text-lg mb-4">Ventas Totales</p>
                  <p className="text-5xl font-extrabold">${salesSummary.totalSales.toFixed(0)}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-700 p-10 rounded-2xl shadow-xl text-white">
                  <p className="text-green-200 text-lg mb-4">Órdenes</p>
                  <p className="text-5xl font-extrabold">{salesSummary.totalOrders}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-700 p-10 rounded-2xl shadow-xl text-white">
                  <p className="text-purple-200 text-lg mb-4">Ticket Promedio</p>
                  <p className="text-5xl font-extrabold">${salesSummary.avgTicket.toFixed(0)}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-10 rounded-2xl shadow-xl text-white">
                  <p className="text-orange-200 text-lg mb-4">Clientes</p>
                  <p className="text-5xl font-extrabold">{salesSummary.totalCustomers}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-amber-700 p-10 rounded-2xl shadow-xl text-white">
                  <p className="text-amber-200 text-lg mb-4">Propinas Cocina</p>
                  <p className="text-5xl font-extrabold">${totalKitchenTips.toFixed(0)}</p>
                </div>
              </div>
            )}

            {/* Análisis IA - Hero */}
            {salesSummary && (
              <div>
                <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl overflow-hidden">
                  <div className="p-12 lg:p-20">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-10">
                      <div>
                        <h2 className="text-5xl font-bold text-white mb-6">
                          Análisis Inteligente con IA
                        </h2>
                        <p className="text-2xl text-indigo-100 max-w-4xl">
                          Tu asesor personal: insights profundos, alertas y recomendaciones accionables para hacer crecer tu restaurante.
                        </p>
                      </div>
                      <button
                        onClick={generateAIAnalysis}
                        disabled={loadingAI}
                        className="bg-white text-purple-700 hover:bg-gray-100 font-bold py-6 px-16 rounded-2xl shadow-2xl transition transform hover:scale-105 disabled:opacity-60 flex items-center gap-6 text-2xl"
                      >
                        {loadingAI ? (
                          <>
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-700 border-t-transparent"></div>
                            Analizando...
                          </>
                        ) : (
                          "Generar Análisis IA"
                        )}
                      </button>
                    </div>

                    {loadingAI && !aiAnalysis && (
                      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-20 text-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-8 border-white border-t-transparent mx-auto mb-10"></div>
                        <p className="text-4xl text-white font-bold">Procesando tus datos con IA...</p>
                        <p className="text-2xl text-indigo-100 mt-6">Esto puede tomar 1-4 minutos. ¡El resultado será increíble!</p>
                      </div>
                    )}

                    {aiAnalysis && (
                      <div className="bg-white rounded-3xl p-12 lg:p-20 shadow-3xl">
                        <div className="prose prose-2xl max-w-none text-gray-800">
                          <div className="whitespace-pre-line leading-relaxed text-xl font-medium">
                            {aiAnalysis}
                          </div>
                        </div>
                        <div className="mt-12 pt-10 border-t-2 border-gray-200 flex justify-end">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(aiAnalysis);
                              enqueueSnackbar("Análisis copiado al portapapeles", { variant: "success" });
                            }}
                            className="px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-bold text-xl shadow-xl transition"
                          >
                            Copiar Análisis Completo
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {topDishes.length > 0 && (
                <div className="bg-white rounded-3xl shadow-lg p-12">
                  <h3 className="text-3xl font-bold text-gray-900 mb-10">Top Platillos Más Vendidos</h3>
                  <Bar
                    data={{
                      labels: topDishes.map(d => d.name.length > 20 ? d.name.substring(0, 20) + "..." : d.name),
                      datasets: [{
                        data: topDishes.map(d => d.total_sales),
                        backgroundColor: "#6366f1",
                        borderRadius: 12,
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

              {topWaiters.length > 0 && (
                <div className="bg-white rounded-3xl shadow-lg p-12">
                  <h3 className="text-3xl font-bold text-gray-900 mb-10">Top Meseros por Ventas</h3>
                  <Bar
                    data={{
                      labels: topWaiters.map(w => w.name.length > 20 ? w.name.substring(0, 20) + "..." : w.name),
                      datasets: [{
                        data: topWaiters.map(w => w.total_sales),
                        backgroundColor: "#10b981",
                        borderRadius: 12,
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

              {salesByHour.length > 0 && (
                <div className="bg-white rounded-3xl shadow-lg p-12">
                  <h3 className="text-3xl font-bold text-gray-900 mb-10">Ventas por Hora</h3>
                  <Line
                    data={{
                      labels: salesByHour.map(h => `${h.hour}:00`),
                      datasets: [{
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

              {paymentMethods && (
                <div className="bg-white rounded-3xl shadow-lg p-12">
                  <h3 className="text-3xl font-bold text-gray-900 mb-10">Métodos de Pago</h3>
                  <div className="max-w-md mx-auto">
                    <Pie
                      data={{
                        labels: ["Efectivo", "Tarjeta", "Otros"],
                        datasets: [{
                          data: [paymentMethods.cash, paymentMethods.card, paymentMethods.other],
                          backgroundColor: ["#10b981", "#3b82f6", "#f59e0b"],
                        }]
                      }}
                      options={{ responsive: true }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modales */}
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
      </div>
    </div>
  );
};

export default Metrics;