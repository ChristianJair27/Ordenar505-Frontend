import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { axiosWrapper } from "../https/axiosWrapper";
import KitchenOrderCard from "../components/kitchen/KitchenOrderCard";

const TEN_MIN_MS = 10 * 60 * 1000;

// ✅ Para debug: true = no auto-hide, false = auto-hide 10 min
const SHOW_OLD_ORDERS = true;

// ✅ Overlay cuando llegan nuevas órdenes
const NEW_FLASH_MS = 4000;

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

  // ✅ overlay visual de “nueva orden”
  const [newFlash, setNewFlash] = useState(false);
  const flashTimerRef = useRef(null);

  // ✅ para detectar órdenes nuevas entre refresh
  const seenIdsRef = useRef(new Set());

  const triggerNewFlash = useCallback(() => {
    setNewFlash(true);
    clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setNewFlash(false), NEW_FLASH_MS);
  }, []);

  const loadKitchenOrders = useCallback(async () => {
    try {
      setErrorMsg("");

      // ✅ Tu endpoint final
      const res = await axiosWrapper.get("/api/order/kitchen-public");

      const payload = res?.data;
      const arr =
        payload?.data ||
        payload?.orders ||
        (Array.isArray(payload) ? payload : []);

      const list = Array.isArray(arr) ? arr : [];

      // ✅ Marca nuevas por ID
      const next = list.map((o) => {
        const isNew = !seenIdsRef.current.has(o.id);
        return { ...o, __isNew: isNew };
      });

      const newOnes = next.filter((o) => o.__isNew);

      // ✅ Actualiza set de vistos
      for (const o of next) seenIdsRef.current.add(o.id);

      // ✅ Dispara overlay si llegaron nuevas
      if (newOnes.length > 0) triggerNewFlash();

      setOrders(next);
    } catch (err) {
      console.log("KITCHEN LOAD ERROR:", err);

      const msg = err?.message || "Error de conexión";
      const status = err?.status || err?.response?.status;

      setErrorMsg(status ? `${msg} (HTTP ${status})` : msg);
      setOrders([]);
    }
  }, [triggerNewFlash]);

  // polling: refresca cada 5s
  useEffect(() => {
    loadKitchenOrders();
    const t = setInterval(loadKitchenOrders, 5000);
    return () => clearInterval(t);
  }, [loadKitchenOrders]);

  // reloj local para actualizar "hace X"
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // limpia timer overlay al desmontar
  useEffect(() => {
    return () => clearTimeout(flashTimerRef.current);
  }, []);

  const visibleOrders = useMemo(() => {
    return orders
      .map((o) => {
        const created = getOrderDate(o);
        const ageMs = now - created.getTime();

        const status = String(
          o?.order_status || o?.status || o?.orderStatus || ""
        ).toLowerCase();

        // ✅ en tu DB: pagado = completado
        const isCompleted = status.includes("pagado") || status.includes("paid") || status.includes("complete");
        const isCanceled = status.includes("cancel");

        const isKitchenRelevant = !isCanceled && !isCompleted;

        return {
          ...o,
          __created: created,
          __ageMs: ageMs,
          __items: safeParseItems(o),
          __isKitchenRelevant: isKitchenRelevant,
        };
      })
      .filter((o) => o.__isKitchenRelevant)
      .filter((o) => (SHOW_OLD_ORDERS ? true : o.__ageMs <= TEN_MIN_MS))

      // ✅ Orden recomendado: MÁS VIEJAS ARRIBA (prioridad cocina)
      //.sort((a, b) => b.__ageMs - a.__ageMs);

      // Si prefieres más nuevas arriba, usa:
      .sort((a, b) => a.__ageMs - b.__ageMs);
  }, [orders, now]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* ✅ Overlay grande cuando llega una orden nueva */}
      {newFlash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-500/15 backdrop-blur-sm">
          <div className="rounded-3xl border border-emerald-300/30 bg-black/70 px-10 py-8 shadow-2xl animate-pulse">
            <div className="text-4xl md:text-6xl font-black tracking-wide text-emerald-200 text-center">
              NUEVA ORDEN
            </div>
            <div className="mt-3 text-center text-white/70">
              Revisa la pantalla
            </div>
          </div>
        </div>
      )}

      <div className="sticky top-0 z-10 bg-black/70 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">COCINA</h1>
            <p className="text-xs text-white/60">
              Vista simple •{" "}
              {SHOW_OLD_ORDERS ? "Sin auto-hide (debug)" : "Auto-hide 10 min"} •{" "}
              Refresca cada 5s
            </p>
            {errorMsg && <p className="text-xs text-red-300 mt-1">{errorMsg}</p>}
          </div>

          <div className="text-sm text-white/70">
            Órdenes:{" "}
            <span className="text-white font-semibold">
              {visibleOrders.length}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {visibleOrders.length === 0 ? (
          <div className="mt-10 text-center text-white/60">
            No hay órdenes pendientes.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleOrders.map((order) => (
              <KitchenOrderCard key={order.id} order={order} now={now} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
