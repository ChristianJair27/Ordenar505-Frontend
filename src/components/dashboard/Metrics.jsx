
import { useEffect, useState } from "react";
import axios from "axios";
import AddCategoryModal from "./AddCategoryModal";
import AddDishModal from "./AddDishModal";
import { MdCategory } from "react-icons/md";
import { BiSolidDish } from "react-icons/bi";
import { useSelector } from "react-redux";
import { axiosWrapper } from "../../https/axiosWrapper";
import AddUserModal from "./AddUserModal";
import { enqueueSnackbar } from "notistack";
import { getCashMovements, updateOrderStatus } from "../../https/index";
import { formatDateAndTime } from "../../utils";
import AddTableModal from "./AddTableModal";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";



import CorteTicket from "../corte/CorteTicket";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";



const Metrics = () => {
  const [totalCash, setTotalCash] = useState(0);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("ingreso");
  const API_URL = import.meta.env.VITE_BACKEND_URL;
  const [categories, setCategories] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [editCategory, setEditCategory] = useState(null);
  const [editDish, setEditDish] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("cash");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
const [isDishModalOpen, setIsDishModalOpen] = useState(false);

const [tables, setTables] = useState([]);
const [isTableModalOpen, setIsTableModalOpen] = useState(false);
const [editTable, setEditTable] = useState(null);

const [cashMovements, setCashMovements] = useState([]);
  const user = useSelector((state) => state.user.user);
  const [turnos, setTurnos] = useState([]);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState("");
  
const [corteInfo, setCorteInfo] = useState(null);
const [showCorteModal, setShowCorteModal] = useState(false);
const corteRef = useRef();
const printCorte = useReactToPrint({
  content: () => corteRef.current || null,
  documentTitle: `Corte_Turno_${turnoSeleccionado}`,
  onAfterPrint: () =>
    enqueueSnackbar("Corte impreso correctamente", { variant: "success" }),
});

const handlePrintClick = () => {
  console.log("Ref actual:", corteRef.current);
  if (!corteRef.current) {
    enqueueSnackbar("El ticket aún no está listo para imprimir", { variant: "error" });
    return;
  }
  printCorte();
};



const handleCorte = async () => {
  if (!turnoSeleccionado) {
    enqueueSnackbar("Selecciona un turno válido", { variant: "error" });
    return;
  }

  try {
    // 1. Obtener el resumen del turno usando la ruta correcta
    const corteRes = await axiosWrapper.get(
      `${API_URL}/api/shifts/${turnoSeleccionado}/corte`
    );
    const corteData = corteRes.data;

    // 2. Obtener los movimientos detallados
    const movimientosRes = await axiosWrapper.get(
      `${API_URL}/api/cash-register?shift_id=${turnoSeleccionado}`
    );
    const movimientos = movimientosRes.data?.data || [];

    // 3. Preparar los datos para el componente
    setCorteInfo({
      turnoId: turnoSeleccionado,
      cajero: corteData.cajero || user?.name || "N/A",
      inicio: corteData.inicio, // Formato: "YYYY-MM-DD HH:mm:ss"
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
      movimientos: corteData.movimientos || movimientos.length
    });

    setShowCorteModal(true);
    enqueueSnackbar("Corte generado correctamente", { variant: "success" });
  } catch (err) {
    console.error("Error al generar corte:", err);
    enqueueSnackbar("Error al generar ticket de corte", { 
      variant: "error",
      message: err.response?.data?.message || err.message 
    });
  }
};

const fetchTurnos = async () => {
  try {
    const res = await axiosWrapper.get(`${API_URL}/api/shifts`);
    setTurnos(res.data || []);
  } catch (error) {
    console.error("Error al obtener turnos:", error);
    enqueueSnackbar("No se pudieron cargar los turnos", { variant: "error" });
  }
};






const [users, setUsers] = useState([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    phone: "", 
    role: "" 
  });
  
  const [searchTerm, setSearchTerm] = useState("");
  const token = localStorage.getItem("token");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosWrapper.get("/api/user");
      const userList = res.data?.data || res.data || [];
      setUsers(userList);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este usuario?")) return;
    
    try {
      await axiosWrapper.delete(`/api/user/${id}`);
      fetchUsers();
    } catch (err) {
      console.error("Error al eliminar usuario:", err);
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosWrapper.put(`/api/user/${editingUser.id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true
      });
      fetchUsers();
      setEditingUser(null);
    } catch (err) {
      console.error("Error al editar usuario:", err);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );










const fetchTables = async () => {
    const res = await axios.get(`${API_URL}/api/table`);
    setTables(res.data.data);
  };


const handleEditTable = (table) => setEditTable(table);

const handleDeleteTable = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta mesa?")) return;
    
    try {
      await axiosWrapper.delete(`/api/table/${id}`);
      fetchUsers();
    } catch (err) {
      console.error("Error al eliminar mesa:", err);
    }
  };



  
  const handleEditCategory = (cat) => {
    console.log("Editando categoría:", cat);
    setEditCategory(cat);
  } 
  
  const handleEditDish = (dish) => setEditDish(dish);

  const fetchCategories = async () => {
    const res = await axios.get(`${API_URL}/api/categories`);
    setCategories(res.data.data);
  };

  const fetchDishes = async () => {
    const res = await axios.get(`${API_URL}/api/dishes`);
    setDishes(res.data.data);
  };

  const fetchCashbox = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/cash-balance`);
      setTotalCash(res.data.total || 0);
    } catch (err) {
      console.error("Error al obtener el total de caja:", err);
    }
  };

 // 2. Modifica tu handleSubmit
 const handleSubmit = async () => {
   if (!amount || isNaN(amount)) {
     enqueueSnackbar("Ingresa un monto válido", { variant: "error" });
     return;
   }
 
   try {
     await axiosWrapper.post(`${API_URL}/api/admin/cash-movement`, {
       type,
       amount: parseFloat(amount),
       description: description || `Movimiento manual: ${type}`, // Usa la descripción del usuario o una por defecto
       user_id: user?.id // Asegúrate de enviar el user_id
     });
 
     queryClient.invalidateQueries(["cash-movements"]);
     setAmount("");
     setDescription(""); // Limpiar el campo después de enviar
     await Promise.all([fetchCashbox(), fetchCashMovements()]);
     enqueueSnackbar("Movimiento registrado correctamente", { variant: "success" });
   } catch (err) {
     console.error("Error al registrar movimiento:", err);
     enqueueSnackbar(`Error al registrar movimiento: ${err.response?.data?.message || err.message}`, { 
       variant: "error" 
     });
   }
 };


const fetchCashMovements = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/cash-register`); // o la ruta correcta
      setCashMovements(res.data || []);
    } catch (err) {
      console.error("Error al obtener movimientos de caja:", err);
    }
  };


 const [description, setDescription] = useState("");

const queryClient = useQueryClient();



const { data: resData, isError } = useQuery({
  queryKey: ["orders"],
  queryFn: getCashMovements,
  placeholderData: keepPreviousData,
});

if (isError) {
  enqueueSnackbar("Something went wrong!", { variant: "error" });
  return null;
}

const orders = resData?.data?.data || [];













  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchCashbox(), fetchCategories(), fetchDishes(), fetchTables()]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
const loadData = async () => {
    await fetchCashbox();
    await fetchCashMovements();
    await fetchTurnos(); 
    setLoading(false);
  };

  loadData();


    fetchUsers();
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
            <p className="text-gray-600 mt-1">Gestión completa de tu restaurante</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm px-4 py-2">
            <span className="text-gray-500 text-sm">Saldo actual</span>
            <div className="text-2xl font-bold text-green-600">${Number(totalCash || 0).toFixed(2)}</div>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 mb-8">
          <button
            className={`py-3 px-6 font-medium text-sm rounded-t-lg ${
              activeTab === "cash" 
                ? "bg-white text-blue-600 border-t border-l border-r border-gray-200" 
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("cash")}
          >
            Gestión de Caja
          </button>
          <button
            className={`py-3 px-6 font-medium text-sm rounded-t-lg ${
              activeTab === "menu" 
                ? "bg-white text-blue-600 border-t border-l border-r border-gray-200" 
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("menu")}
          >
            Gestión de Menú
          </button>

            <button
            className={`py-3 px-6 font-medium text-sm rounded-t-lg ${
              activeTab === "users" 
                ? "bg-white text-blue-600 border-t border-l border-r border-gray-200" 
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("users")}
          >
            Gestión de Usuarios
          </button>
          <button
            className={`py-3 px-6 font-medium text-sm rounded-t-lg ${
              activeTab === "tables" 
                ? "bg-white text-blue-600 border-t border-l border-r border-gray-200" 
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("tables")}
          >
            Gestión de Mesas
          </button>



        </div>
        
        {/* Cash Management Section */}
        {activeTab === "cash" && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Movimientos de Caja</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cash Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Resumen de Caja</h3>
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-gray-500">Saldo actual</div>
                    <div className="text-2xl font-bold text-gray-800">${Number(totalCash || 0).toFixed(2)}</div>
                  </div>
                  <div className="mt-6">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Ingresos hoy</span>
                      <span className="font-medium">$0.00</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Retiros hoy</span>
                      <span className="font-medium">$0.00</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Movimientos totales</span>
                      <span className="font-medium">{cashMovements.length}</span>
                    </div>
                  </div>
                </div>
                
                {/* Cash Form */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Registrar movimiento</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de movimiento</label>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setType("ingreso")}
                          className={`flex-1 py-2 px-4 rounded-lg text-center border transition-colors duration-200 ${
                            type === "ingreso"
                              ? "bg-green-50 text-green-800 border-green-200 shadow-inner"
                              : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
                          }`}
                        >
                          Ingreso
                        </button>
                        <button
                          onClick={() => setType("retiro")}
                          className={`flex-1 py-2 px-4 rounded-lg text-center border transition-colors duration-200 ${
                            type === "retiro"
                              ? "bg-red-50 text-red-800 border-red-200 shadow-inner"
                              : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
                          }`}
                        >
                          Retiro
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                        Monto
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                        <input
                          type="number"
                          id="amount"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                   <div>
  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
    Descripción (opcional)
  </label>
  <input
    type="text"
    id="description"
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    placeholder="Ej: Ingreso por ventas"
    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
  />
</div>
                    
                    <button
                      onClick={handleSubmit}
                      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 shadow-md hover:shadow-lg"
                    >
                      Registrar Movimiento
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 mt-8 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Corte de Caja por Turno</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label htmlFor="turno" className="block text-sm font-medium text-gray-700 mb-1">
                      Selecciona un turno
                    </label>
                    <select
                      id="turno"
                      value={turnoSeleccionado}
                      onChange={(e) => setTurnoSeleccionado(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Selecciona --</option>
                      {turnos.map((turno) => (
                        <option key={turno.id} value={turno.id}>
                          Turno #{turno.id} - {formatDateAndTime(turno.start_time)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <button
                      onClick={handleCorte}
                      className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition duration-200 shadow-md hover:shadow-lg"
                    >
                      Generar Corte
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Recent Transactions */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Últimos movimientos</h3>
                
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mesero
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Turno
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hora y Fecha
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descripción
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pago
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.length > 0 ? (
                        orders.map((order) => (
                          <tr
                            key={order.id}
                            className="hover:bg-gray-50 transition-colors duration-150" 
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">#{order.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.user_name || "N/A"}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Turno #{order.shift_id || "N/A"}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {order.date ? formatDateAndTime(order.date) : "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.description || "N/A"}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <span className={order.type === 'ingreso' ? 'text-green-600' : 'text-red-600'}>
                                ${Number(order.amount).toFixed(2) || "0.00"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {order.payment_method || "N/A"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                            No hay movimientos registrados
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Menu Management Section */}
        {activeTab === "menu" && (
          <div className="space-y-8">
            {/* Categories Section */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Categorías del Menú</h2>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center" onClick={() => setIsCategoryModalOpen(true)}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Nueva Categoría <MdCategory />
                </button>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((cat) => (
                    <div 
                      key={cat.id} 
                      className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
                    >
                      <div 
                        className="h-2 w-full" 
                        style={{ backgroundColor: cat.bg_color || '#4f46e5' }}
                      ></div>
                      <div className="p-4">
                        <div className="flex items-center">
                          <span className="text-xl mr-2">{cat.icon}</span>
                          <h3 className="font-bold text-lg text-gray-800">{cat.name}</h3>
                        </div>
                        <div className="mt-4 flex justify-between">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {dishes.filter(d => d.category_id === cat.id).length} platillos
                          </span>
                          <button
                            onClick={() => handleEditCategory(cat)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Editar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Dishes Section */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Platillos</h2>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center" onClick={() => setIsDishModalOpen(true)}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Nuevo Platillo <BiSolidDish />
                </button>
              </div>
              
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Platillo
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Precio
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Categoría
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dishes.map((dish) => (
                        <tr key={dish.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-gray-200 border-2 border-dashed rounded-xl" />
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{dish.name}</div>
                                <div className="text-sm text-gray-500">{dish.description || "Sin descripción"}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">${dish.price}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{dish.category_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Activo
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEditDish(dish)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              Editar
                            </button>
                            <button className="text-red-600 hover:text-red-900">
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
          </div>
        )}


{/* User Management Section */}
{activeTab === "users" && (

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="w-full sm:w-1/2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar usuarios..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <button 
              onClick={() => setIsAddUserOpen(true)}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nuevo Usuario
            </button>
          </div>
          
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Correo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.phone || "-"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditClick(user)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                        {searchTerm ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No hay usuarios registrados'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}



{/* Tables Management Section */}
        {activeTab === "tables" && (
          <div className="space-y-8">
            
            
            {/* Tables Section */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Mesas</h2>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center" onClick={() => setIsTableModalOpen(true)}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Nueva Mesa <BiSolidDish />
                </button>
              </div>
              
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mesa
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estatus
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Asientos
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                        
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tables.map((table) => (
                        <tr key={table.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                           
                              
                                <div className="text-sm font-medium text-gray-900">{table.table_no}</div>
                              
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">${table.status}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{table.seats}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap ">
                            <button
                              onClick={() => handleEditTable(table)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              Editar
                            </button>
                            <button 
                            onClick={() => handleDeleteTable(table.id)}
                            className="text-red-600 hover:text-red-900">
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
          </div>
        )}









      </div>
      
      {/* Modals */}
      {editCategory && (
        <AddCategoryModal
          setIsOpen={() => setEditCategory(null)}
          initialData={editCategory}
          isEditing
        />
      )}

      {editDish && (
        <AddDishModal
          setIsOpen={() => setEditDish(null)}
          initialData={editDish}
          isEditing
        />
      )}


        {isCategoryModalOpen && (
          <AddCategoryModal
            setIsOpen={setIsCategoryModalOpen}
            onClose={() => {
              setIsCategoryModalOpen(false);
              fetchCategories(); // Refresca categorías después
            }}
          />
        )}

        {isDishModalOpen && (
          <AddDishModal
            setIsOpen={setIsDishModalOpen}
            onClose={() => {
              setIsDishModalOpen(false);
              fetchDishes(); // Refresca platillos después
            }}
          />
        )}


        {isTableModalOpen && (
  <AddTableModal
    setIsOpen={setIsTableModalOpen}
    onTableAdded={() => {
      setIsTableModalOpen(false);
      fetchTables(); // refresca la lista
    }}
  />
)}

{editTable && (
        <AddTableModal
          setIsOpen={() => setEditTable(null)}
          initialData={editTable}
          isEditing
        />
      )}




      {/* Add User Modal */}
      {isAddUserOpen && (
        <AddUserModal setIsOpen={setIsAddUserOpen} onUserAdded={fetchUsers} />
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Editar Usuario</h3>
                <form onSubmit={handleEditSubmit}>
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                      Rol
                    </label>
                    <select
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Seleccionar rol</option>
                      <option value="admin">Administrador</option>
                      <option value="Waiter">Mesero</option>
                      
                    </select>
                  </div>
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
                    >
                      Guardar cambios
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

    {showCorteModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md text-black">
          <CorteTicket corte={corteInfo} onClose={() => setShowCorteModal(false)} />
        </div>
      </div>
    )}

    </div>
  );
};

export default Metrics;