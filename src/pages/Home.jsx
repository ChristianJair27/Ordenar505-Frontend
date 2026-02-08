import { useEffect, useMemo } from "react";
import BottomNav from "../components/shared/BottomNav";
import { motion } from "framer-motion";
import { FiDollarSign, FiUser, FiCheckSquare } from "react-icons/fi";
import { GiCookingPot } from "react-icons/gi";
import { FaArrowRight, FaSignInAlt, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useMutation, useQuery } from "@tanstack/react-query";
import { axiosWrapper } from "../https/axiosWrapper";
import { enqueueSnackbar } from "notistack";
import { getTables } from "../https";

const TIPS_PCT = 0.03;

// Animations
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } } };
const buttonVariants = { hover: { scale: 1.03, boxShadow: "0px 10px 20px rgba(0,0,0,.1)" }, tap: { scale: 0.98 } };
const itemVariants = { hidden: { y: 30, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 120, damping: 12 } } };

const normalizeStatus = (raw) => {
  const s = String(raw ?? "").trim().toLowerCase();
  if (new Set(["ocupado","ocupada","occupied","busy","en uso","en-uso","booked"]).has(s)) return "ocupado";
  if (new Set(["libre","disponible","free","available","vacant"]).has(s)) return "libre";
  if (new Set(["reservado","reservada","reserved","apartado"]).has(s)) return "reservado";
  return "otro";
};

const Home = () => {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_BACKEND_URL;
  const userData = useSelector((state) => state.user);

  // Normaliza rol y da poder total al admin
  const role = String(userData?.role || userData?.user?.role || "").toLowerCase();
  const isWaiter  = ["mesero", "waiter"].includes(role) || role === "admin"; // admin ve vista mesero
  const isCashier = ["cajero", "cashier"].includes(role) || role === "admin"; // admin ve vista cajero
  const isAdmin   = role === "admin";

  // Nombre del mesero actual (lo usaremos para filtrar)
  const currentWaiterName = useMemo(() => {
    const name = userData?.name || userData?.full_name || userData?.username || "";
    const normalized = name.trim().toLowerCase();
    console.log("Nombre del mesero logueado (para filtrar):", normalized || "(no encontrado)");
    return normalized;
  }, [userData]);

  // Usa la misma ruta que OrderCard
  const ORDER_DETAIL_ROUTE = (id) => `/orden/${id}`;

  // Intenta extraer el id de orden desde la mesa (tolerante a varios nombres)
  const extractOrderIdFromTable = (t = {}) =>
    t.current_order_id ??
    t.order_id ??
    t.active_order_id ??
    t.order?.id ??
    t.order?._id ??
    t.currentOrderId ??
    t.activeOrderId ??
    null;

  // Si no viene el id en la mesa, intenta pedirlo al backend
  const fetchActiveOrderIdForTable = async (table) => {
    const tableId = table?.table_id ?? table?.tableId ?? table?.id ?? table?.table_no ?? null;
    if (!tableId) return null;

    try {
      // 1) endpoint directo si lo tienes (ajústalo a tu API real)
      const r1 = await axiosWrapper.get(`${API_URL}/api/orders/active-by-table/${tableId}`);
      const id1 = r1?.data?.data?.id ?? r1?.data?.id ?? null;
      if (id1) return id1;
    } catch (_) {}

    try {
      // 2) fallback genérico: buscar por query (ajusta los params al backend)
      const r2 = await axiosWrapper.get(`${API_URL}/api/orders`, {
        params: { table_id: tableId, status: 'inprogress', limit: 1, sort: 'desc' }
      });
      const arr = r2?.data?.data ?? r2?.data ?? [];
      const first = Array.isArray(arr) ? arr[0] : null;
      const id2 = first?.id ?? first?._id ?? null;
      if (id2) return id2;
    } catch (_) {}

    return null;
  };

  const openTableLikeOrdersCard = async (table) => {
    // 1) intentar leerlo del objeto mesa
    let orderId = extractOrderIdFromTable(table);

    // 2) si no viene, intentar pedirlo al backend por mesa
    if (!orderId) {
      orderId = await fetchActiveOrderIdForTable(table);
    }

    if (orderId) {
      navigate(ORDER_DETAIL_ROUTE(orderId));
    } else {
      enqueueSnackbar("No se encontró una orden activa para esta mesa.", { variant: "warning" });
    }
  };

  const openTable = (table) => {
    const orderId = extractOrderIdFromTable(table);

    if (orderId) {
      navigate(ORDER_DETAIL_ROUTE(orderId));
      return;
    }

    // Fallback opcional: si la mesa está ocupada pero no trae id,
    // intenta navegar a Orders o muestra un aviso.
    enqueueSnackbar("No se encontró una orden activa para esta mesa.", { variant: "warning" });
    navigate('/orders');
  };

  // Mesas
  const {
    data: tablesDataRaw = [],
    isLoading: tablesLoading,
    isError: tablesError,
  } = useQuery({
    queryKey: ["tablesHome"],
    queryFn: async () => {
      const res = await getTables();
      const rows =
        Array.isArray(res) ? res :
        Array.isArray(res?.data) ? res.data :
        Array.isArray(res?.data?.data) ? res.data.data : [];
      return rows;
    },
    refetchInterval: 15000, // más frecuente para ver cambios rápido
  });

  // Debug importante: vemos qué llega y cómo se filtra
  useEffect(() => {
    if (tablesDataRaw?.length > 0) {
      console.log("=== DEBUG FILTRADO MESAS POR NOMBRE ===");
      console.log("Mesero actual (nombre normalizado):", currentWaiterName || "(no encontrado)");
      console.log("Total mesas recibidas del backend:", tablesDataRaw.length);

      tablesDataRaw.forEach((t, index) => {
        const mesaName = (t.waiter_name || t.name || "").trim().toLowerCase();
        console.log(
          `Mesa ${index + 1} (${t.table_no || "?"}) → mesero: "${mesaName}" | coincide con "${currentWaiterName}"? → ${mesaName === currentWaiterName}`
        );
      });
    }
  }, [tablesDataRaw, currentWaiterName]);

  // Filtrado REAL por nombre del mesero
  const tablesData = useMemo(() => {
    if (!tablesDataRaw?.length) return [];

    // Admin ve TODO
    if (isAdmin) {
      console.log("Usuario es ADMIN → muestra TODAS las mesas");
      return tablesDataRaw;
    }

    // Mesero normal → solo sus mesas
    if (!currentWaiterName) {
      console.warn("¡No se encontró el nombre del mesero actual! No se filtrará.");
      return [];
    }

    return tablesDataRaw.filter((table) => {
      const tableWaiter = (table.waiter_name || table.name || "").trim().toLowerCase();
      return tableWaiter === currentWaiterName;
    });
  }, [tablesDataRaw, isAdmin, currentWaiterName]);

  const OcupadoTables = useMemo(
    () => tablesData.filter((t) => normalizeStatus(t?.status) === "ocupado"),
    [tablesData]
  );

  // Stats del mesero (admin también)
  const {
    data: waiterStats,
    isLoading: waiterStatsLoading,
  } = useQuery({
    queryKey: ["waiterTodayStats", userData?.id],
    queryFn: async () => {
      const res = await axiosWrapper.get(`${API_URL}/api/waiter/today-stats?waiter_id=${userData.id}`);
      return res?.data?.data ?? { orders_count: 0, revenue: 0 };
    },
    enabled: (isWaiter || isAdmin) && !!userData?.id,
    refetchInterval: 30000,
  });

  useEffect(() => { document.title = "La Peña De Santiago | Panel"; }, []);

  const formatValue = (value) => (typeof value === "number" ? `$${value.toFixed(2)}` : value);

  // Turno (cajero + admin) — lee res.data.data y normaliza
  const {
    data: turnoData = { turno_abierto: false, total_ventas: 0, total_ordenes: 0, hora_inicio: null },
    refetch,
    isError: turnoError,
    error,
    isLoading,
    isFetching
  } = useQuery({
    queryKey: ['turnoActual'],
    queryFn: async () => {
      const res = await axiosWrapper.get(`${API_URL}/api/turno-actual`);
      const d = res?.data?.data ?? {};
      return {
        turno_abierto: !!d.turno_abierto,
        total_ventas: Number(d.total_ventas ?? 0) || 0,
        total_ordenes: Number(d.total_ordenes ?? 0) || 0,
        hora_inicio: d.hora_inicio ?? null,
        shift_id: d.shift_id ?? null,
      };
    },
    enabled: isCashier || isAdmin || isWaiter,
    retry: 1,
    refetchInterval: 60000
  });

  const iniciarTurnoMutation = useMutation({
    mutationFn: () => axiosWrapper.post(`${API_URL}/api/start`, {}, { withCredentials: true }),
    onSuccess: () => { refetch(); enqueueSnackbar("Turno iniciado con éxito.", { variant: "success" }); },
    onError: (err) => enqueueSnackbar(`Error al iniciar turno: ${err.response?.data?.message || err.message}`, { variant: "error" })
  });

  const cerrarTurnoMutation = useMutation({
    mutationFn: () => axiosWrapper.post(`${API_URL}/api/end`, {}, { withCredentials: true }),
    onSuccess: () => { refetch(); enqueueSnackbar("Turno cerrado con éxito.", { variant: "success" }); },
    onError: (err) => enqueueSnackbar(`Error al cerrar turno: ${err.response?.data?.message || err.message}`, { variant: "error" })
  });

  const {
    data: waiterShiftStats,
    isLoading: waiterShiftLoading,
  } = useQuery({
    queryKey: ["waiterShiftStats", userData?.id, turnoData?.shift_id],
    queryFn: async () => {
      if (!(isWaiter || isAdmin) || !userData?.id || !turnoData?.shift_id) {
        return { orders_count: 0, revenue: 0, kitchen_tips: 0 };
      }
      const r = await axiosWrapper.get(`${API_URL}/api/waiter/shift-stats`, {
        params: { waiter_id: userData.id, shift_id: turnoData.shift_id }
      });
      return r?.data?.data ?? { orders_count: 0, revenue: 0, kitchen_tips: 0 };
    },
    enabled: (isWaiter || isAdmin) && !!userData?.id && !!turnoData?.shift_id,
    refetchInterval: 30000,
  });

  // Métricas (cajero/admin ven caja; mesero/admin ven personales)
  const getMetrics = () => {
    if (isCashier || isAdmin) {
      const isShiftOpen = turnoData?.turno_abierto;
      const totalVentas  = turnoData?.total_ventas || 0;
      const totalOrdenes = turnoData?.total_ordenes || 0;
      const horaInicio   = turnoData?.hora_inicio ? new Date(turnoData.hora_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A";
      return [
        {
          title: "Estado del Turno",
          value: isLoading ? "Cargando..." : (isShiftOpen ? "Abierto" : "Cerrado"),
          icon: <FiUser className={isShiftOpen ? "text-blue-600" : "text-gray-500"} />,
          color: isShiftOpen ? "bg-blue-50" : "bg-gray-50",
          textColor: isShiftOpen ? "text-blue-800" : "text-gray-600",
          action: () => {},
          secondaryValue: isShiftOpen ? `Desde ${horaInicio}` : null,
          isHighlight: true
        },
        {
          title: "Ventas del Turno",
          value: isLoading ? "..." : formatValue(totalVentas),
          icon: <FiDollarSign className="text-green-600" />,
          color: "bg-green-50",
          textColor: "text-green-800",
          action: () => navigate('/cashier-dashboard'),
          isHighlight: false
        },
        {
          title: "Órdenes del Turno",
          value: isLoading ? "..." : totalOrdenes,
          icon: <FiCheckSquare className="text-purple-600" />,
          color: "bg-purple-50",
          textColor: "text-purple-800",
          action: () => navigate('/orders'),
          isHighlight: false
        }
      ];
    } else {
      const revenueShift = isWaiter ? (waiterShiftStats?.revenue ?? 0) : 0;
      const ordersCountShift = isWaiter ? (waiterShiftStats?.orders_count ?? 0) : 0;
      const revenue = isWaiter ? (waiterStats?.revenue ?? 0) : 0;
      const ordersCount = isWaiter ? (waiterStats?.orders_count ?? 0) : 0;
      const kitchenTipsValue = isWaiter
        ? (waiterShiftLoading ? "..." : formatValue((Number(revenueShift) || 0) * TIPS_PCT))
        : formatValue(0);
      return [
        {
          title: "Órdenes Hoy (yo)",
          value: isWaiter ? (waiterStatsLoading ? "..." : ordersCount) : 0,
          icon: <FiCheckSquare className="text-purple-600" />,
          color: "bg-purple-50",
          textColor: "text-purple-800",
          action: () => navigate('/orders'),
          isHighlight: false
        },
        {
          title: "Ganancias Hoy (yo)",
          value: isWaiter ? (waiterStatsLoading ? "..." : formatValue(revenue)) : formatValue(0),
          icon: <FiDollarSign className="text-green-600" />,
          color: "bg-green-50",
          textColor: "text-green-800",
          action: () => {},
          isHighlight: false
        },
        {
          title: "Propinas Cocina (3%)",
          value: kitchenTipsValue,
          icon: <GiCookingPot className="text-amber-600" />,
          color: "bg-amber-50",
          textColor: "text-amber-800",
          action: () => {},
          isHighlight: false
        }
      ];
    }
  };

  const metrics = getMetrics();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20">
      <main className="flex-1 overflow-auto p-6 md:p-8 lg:p-10">
        <motion.div className="mb-8 text-center md:text-left" variants={itemVariants} initial="hidden" animate="visible">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">¡Hola, {userData.name || userData.role}!</h1>
          <p className="text-gray-600 text-lg">Panel de control rápido para tu jornada.</p>
        </motion.div>

        {/* Alerta turno */}
        {(turnoError || ((!turnoData?.turno_abierto) && (isCashier || isAdmin) && !isLoading && !isFetching)) && (
          <motion.div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg shadow-md" role="alert" variants={itemVariants}>
            <p className="font-bold">Estado del Turno</p>
            <p>{error?.message || "No hay turno activo. Por favor, inicia tu turno."}</p>
            {(isCashier || isAdmin) && (
              <button
                onClick={() => iniciarTurnoMutation.mutate()}
                className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-700 transition-colors font-medium text-sm flex items-center"
                disabled={iniciarTurnoMutation.isLoading}
              >
                <FaSignInAlt className="mr-2" />
                {iniciarTurnoMutation.isLoading ? "Iniciando..." : "Iniciar Turno"}
              </button>
            )}
          </motion.div>
        )}

        {/* Botón cerrar turno */}
        {(isCashier || isAdmin) && turnoData?.turno_abierto && (
          <motion.div className="mb-8 flex justify-center" variants={itemVariants}>
            <motion.button
              onClick={() => cerrarTurnoMutation.mutate()}
              className="bg-red-600 text-white px-8 py-4 rounded-xl shadow-lg hover:bg-red-700 transition-all duration-300 font-bold text-lg flex items-center justify-center"
              disabled={cerrarTurnoMutation.isLoading}
              whileHover="hover" whileTap="tap" variants={buttonVariants}
            >
              <FaSignOutAlt className="mr-3 text-2xl" />
              {cerrarTurnoMutation.isLoading ? "Cerrando Turno..." : "Cerrar Turno"}
            </motion.button>
          </motion.div>
        )}

        <h2 className="text-2xl font-bold text-gray-800 mb-5">Resumen de Hoy</h2>
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10" variants={containerVariants} initial="hidden" animate="visible">
          {isLoading && (isCashier || isAdmin) ? (
            <>
              {[1,2,3].map(i => (
                <div key={i} className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4 animate-pulse border border-gray-100">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            metrics.map((metric, index) => (
              <motion.div
                key={index}
                className={`p-6 rounded-2xl shadow-lg border border-gray-200 cursor-pointer transition-transform duration-300 ease-in-out flex flex-col items-center text-center justify-center
                  ${metric.color} ${metric.textColor} ${metric.isHighlight ? "ring-2 ring-blue-500 transform scale-105" : ""}`}
                onClick={metric.action}
                variants={itemVariants} whileHover="hover" whileTap="tap" initial="hidden" animate="visible"
              >
                <div className={`p-4 rounded-full mb-3 text-4xl`}>{metric.icon}</div>
                <h3 className="text-lg font-semibold mb-1">{metric.title}</h3>
                <p className="text-4xl font-extrabold mb-1">{metric.value}</p>
                {metric.secondaryValue && <p className="text-sm opacity-80">{metric.secondaryValue}</p>}
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Mesas Activas */}
        {(!isCashier || turnoData?.turno_abierto) ? (
          <motion.div 
            className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100/80 backdrop-blur-sm"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                Mesas Activas
                {!isAdmin && (
                  <span className="text-base font-normal text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                    Solo mis mesas
                  </span>
                )}
              </h2>
              <motion.button
                onClick={() => navigate('/orders')}
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
                whileHover={{ x: 4 }}
              >
                Ver todas <FaArrowRight size={16} />
              </motion.button>
            </div>

            {tablesLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-gray-50/80 border border-gray-200 animate-pulse">
                    <div className="w-16 h-16 rounded-xl bg-gray-200 mx-auto mb-4" />
                    <div className="h-7 bg-gray-200 rounded w-3/4 mx-auto mb-3" />
                    <div className="h-5 bg-gray-200 rounded w-1/2 mx-auto mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto" />
                  </div>
                ))}
              </div>
            ) : tablesError ? (
              <div className="text-center py-10 text-red-600 font-medium">
                Error al cargar mesas. Intenta refrescar.
              </div>
            ) : OcupadoTables.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <p className="text-xl font-medium">
                  {isAdmin 
                    ? "No hay mesas ocupadas en este momento" 
                    : "No tienes mesas activas asignadas ahora mismo"}
                </p>
                <p className="mt-2 text-sm">Pronto aparecerán aquí cuando abras órdenes.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                {OcupadoTables.map((table) => {
                  const total = table.total_with_tax || table.total || 0;
                  const waiter = table.waiter_name || table.name || "Mesero no asignado";
                  const minutes = table.minutes_occupied || 0;

                  return (
                    <motion.div
                      key={table.id}
                      onClick={() => openTableLikeOrdersCard(table)}
                      className="group relative p-5 rounded-2xl bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 border border-orange-200 hover:border-orange-400 hover:shadow-xl cursor-pointer transition-all duration-300 overflow-hidden"
                      whileHover={{ scale: 1.04, y: -6, transition: { duration: 0.2 } }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Badge de número de mesa */}
                      <div className="absolute -top-3 -right-3 w-12 h-12 rounded-full bg-gradient-to-br from-orange-600 to-amber-600 text-white font-bold text-xl flex items-center justify-center shadow-lg ring-2 ring-orange-300/50 group-hover:ring-orange-400 transition">
                        {table.table_no}
                      </div>

                      {/* Total grande */}
                      <div className="text-center mt-2 mb-4">
                        <p className="text-3xl font-extrabold text-orange-800 tracking-tight">
                          ${Number(total).toFixed(2)}
                        </p>
                        <p className="text-xs text-orange-700 mt-1 font-medium">Total acumulado</p>
                      </div>

                      {/* Mesero */}
                      <p className="text-center font-semibold text-gray-800 mb-1">
                        {waiter}
                      </p>

                      {/* Info secundaria */}
                      <div className="flex justify-center items-center gap-3 text-xs text-gray-600 mt-2">
                        <span>Mesa {table.table_no}</span>
                        {minutes > 0 && (
                          <>
                            <span>•</span>
                            <span className="font-medium">{minutes} min</span>
                          </>
                        )}
                      </div>

                      {/* Efecto hover sutil */}
                      <div className="absolute inset-0 bg-gradient-to-t from-orange-100/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-indigo-500 text-indigo-800 p-5 rounded-xl shadow-md"
            variants={itemVariants}
          >
            <p className="font-bold text-lg">Turno requerido</p>
            <p className="mt-1">Inicia tu turno para ver las mesas activas y comenzar a tomar órdenes.</p>
          </motion.div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Home;