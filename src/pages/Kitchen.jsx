import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { axiosWrapper } from "../https/axiosWrapper";
import KitchenOrderCard from "../components/kitchen/KitchenOrderCard";

const NEW_FLASH_MS = 4000;
const MAX_VISIBLE_ORDERS = 10;
const MAX_AGE_VISIBLE_MS = 25 * 60 * 1000;

function safeParseItems(order) {
  let items = order?.items || [];
  if (typeof items === "string") {
    try {
      items = JSON.parse(items);
    } catch {
      items = [];
    }
  }
  return Array.isArray(items) ? items : [];
}

function getOrderDate(order) {
  const raw = order?.order_date || order?.created_at || order?.createdAt;
  const d = raw ? new Date(raw) : new Date();
  return isNaN(d.getTime()) ? new Date() : d;
}

export default function Kitchen() {
  const [orders, setOrders] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [errorMsg, setErrorMsg] = useState("");
  const [newFlash, setNewFlash] = useState(false);
  
  // ✅ Controla si el sonido está desbloqueado
  const [soundEnabled, setSoundEnabled] = useState(false);

  const flashTimerRef = useRef(null);
  const seenIdsRef = useRef(new Set());

  const enableSound = () => {
    // Reproduce un sonido corto para desbloquear el audio
    const audio = new Audio("/sounds/new-order-chime.mp3");
    audio.volume = 0.8;
    audio.play().catch(() => {});
    
    setSoundEnabled(true);
  };

  const triggerNewFlash = useCallback(() => {
    setNewFlash(true);
    clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setNewFlash(false), NEW_FLASH_MS);

    // 🔊 Solo suena si ya se activó
    if (soundEnabled) {
      const audio = new Audio("/sounds/new-order-chime.mp3");
      audio.volume = 0.8;
      audio.play().catch(() => {});
    }
  }, [soundEnabled]);

  const loadKitchenOrders = useCallback(async () => {
    try {
      setErrorMsg("");
      const res = await axiosWrapper.get("/api/order/kitchen-public");

      const payload = res?.data;
      const arr = payload?.data || payload?.orders || (Array.isArray(payload) ? payload : []);
      const list = Array.isArray(arr) ? arr : [];

      const next = list.map((o) => ({
        ...o,
        __isNew: !seenIdsRef.current.has(o.id),
      }));

      const newOnes = next.filter((o) => o.__isNew);
      for (const o of next) seenIdsRef.current.add(o.id);

      if (newOnes.length > 0) triggerNewFlash();

      setOrders(next);
    } catch (err) {
      console.error("KITCHEN LOAD ERROR:", err);
      const msg = err?.message || "Error de conexión";
      const status = err?.status || err?.response?.status;
      setErrorMsg(status ? `${msg} (HTTP ${status})` : msg);
      setOrders([]);
    }
  }, [triggerNewFlash]);

  useEffect(() => {
    loadKitchenOrders();
    const interval = setInterval(loadKitchenOrders, 5000);
    return () => clearInterval(interval);
  }, [loadKitchenOrders]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => clearTimeout(flashTimerRef.current);
  }, []);

  const visibleOrders = useMemo(() => {
    const processed = orders
      .map((o) => {
        const created = getOrderDate(o);
        const ageMs = now - created.getTime();

        const status = String(o?.order_status || o?.status || "").toLowerCase();
        const isCompleted = status.includes("pagado") || status.includes("paid") || status.includes("complete");
        const isCanceled = status.includes("cancel");

        return {
          ...o,
          __created: created,
          __ageMs: ageMs,
          __items: safeParseItems(o),
          __isKitchenRelevant: !isCanceled && !isCompleted,
        };
      })
      .filter((o) => o.__isKitchenRelevant && o.__ageMs <= MAX_AGE_VISIBLE_MS)
      .sort((a, b) => a.__ageMs - b.__ageMs)
      .slice(0, MAX_VISIBLE_ORDERS);

    return processed;
  }, [orders, now]);

  const totalPending = useMemo(() => {
    return orders.filter((o) => {
      const status = String(o?.order_status || o?.status || "").toLowerCase();
      return !status.includes("pagado") && !status.includes("paid") && !status.includes("complete") && !status.includes("cancel");
    }).length;
  }, [orders]);

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden relative">
      {/* Pantalla de activación de sonido – solo al inicio */}
      {!soundEnabled && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="text-center px-8">
            <div className="text-5xl md:text-6xl font-black text-white mb-8">
              COCINA
            </div>
            <p className="text-xl md:text-2xl text-gray-300 mb-12">
              Toca el botón para activar las notificaciones sonoras
            </p>
            <button
              onClick={enableSound}
              className="px-12 py-8 text-3xl font-black tracking-wide rounded-3xl
                         bg-emerald-600 hover:bg-emerald-500 active:scale-95
                         transform transition-all duration-200 shadow-2xl
                         border-4 border-emerald-400"
            >
              ACTIVAR SONIDO
            </button>
            <p className="text-sm text-gray-500 mt-8">
              Solo es necesario una vez por turno
            </p>
          </div>
        </div>
      )}

      {/* Overlay NUEVA ORDEN */}
      {newFlash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-emerald-600/20 backdrop-blur-sm animate-pulse" />
          <div className="relative rounded-3xl bg-black/90 backdrop-blur-xl border-2 border-emerald-500/60 px-16 py-14 shadow-4xl animate-in fade-in zoom-in-90 duration-700">
            <div className="text-7xl md:text-8xl font-black tracking-tight text-emerald-400 text-center drop-shadow-2xl">
              NUEVA ORDEN
            </div>
            <div className="mt-6 text-2xl text-emerald-200/90 text-center font-medium">
              Revisa la pantalla
            </div>
          </div>
        </div>
      )}

      {/* Header y contenido (igual que antes) */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">COCINA</h1>
            <p className="text-sm text-gray-400 mt-1">
              Mostrando {visibleOrders.length} más recientes
              {totalPending > MAX_VISIBLE_ORDERS && ` • Total pendientes: ${totalPending}`}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold">{visibleOrders.length}</div>
            <div className="text-sm text-gray-400">órdenes activas</div>
          </div>
        </div>
        {errorMsg && (
          <div className="bg-red-900/50 border-y border-red-700/50 px-6 py-2 text-center text-sm text-red-200">
            {errorMsg}
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {visibleOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <div className="text-4xl font-medium text-gray-500">
              No hay órdenes pendientes
            </div>
            <div className="mt-4 text-xl text-gray-600">
              Todo al día ✨
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visibleOrders.map((order) => (
              <KitchenOrderCard key={order.id} order={order} now={now} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}