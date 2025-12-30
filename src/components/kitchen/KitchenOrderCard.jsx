import PropTypes from "prop-types";

const MIN10 = 10 * 60 * 1000;
const MIN15 = 15 * 60 * 1000;

function formatAgo(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const totalMin = Math.floor(totalSec / 60);
  const sec = totalSec % 60;

  const hours = Math.floor(totalMin / 60);
  const min = totalMin % 60;

  if (hours <= 0) return `${min}m ${sec}s`;
  return `${hours}h ${String(min).padStart(2, "0")}m`;
}

function formatShortId(id) {
  return id ? String(id).slice(-6) : "N/A";
}

function getUrgency(ageMs) {
  // 🔴 15+ min
  if (ageMs >= MIN15) {
    return {
      label: "15+ min",
      badge: "bg-red-600 text-white",
      card:
        "bg-red-600/25 border border-red-500 " +
        "shadow-[0_0_40px_rgba(239,68,68,0.35)]",
    };
  }

  // 🟡 10–15 min
  if (ageMs >= MIN10) {
    return {
      label: "10+ min",
      badge: "bg-yellow-400 text-black",
      card:
        "bg-yellow-400/22 border border-yellow-300 " +
        "shadow-[0_0_28px_rgba(250,204,21,0.22)]",
    };
  }

  // 🟢 < 10 min
  return {
    label: "OK",
    badge: "bg-emerald-500 text-black",
    card:
      "bg-emerald-500/20 border border-emerald-400 " +
      "shadow-[0_0_25px_rgba(16,185,129,0.25)]",
  };
}

export default function KitchenOrderCard({ order, now }) {
  const created = order?.__created ? new Date(order.__created) : new Date();
  const ageMs = order?.__ageMs ?? (now - created.getTime());

  const tableNo = String(
    order?.table_no || order?.table?.table_no || order?.table_id || "N/A"
  );

  const urgency = getUrgency(ageMs);

  // Flash SOLO cuando acaba de llegar (lo marca Kitchen.jsx)
  const isNewFlash = !!order?.__isNew;

  // items pueden venir como order.__items o order.items
  const items = order?.__items || order?.items || [];

  return (
    <div
      className={[
        "rounded-2xl p-5 transition-all",
        urgency.card,
        isNewFlash ? "animate-pulse" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xl font-extrabold tracking-wide">
            Mesa <span className="text-white">{tableNo}</span>
            <span className="text-white/50 font-semibold"> • </span>
            <span className="text-white/90">#{formatShortId(order?.id)}</span>
          </div>

          <div className="text-sm text-white/80 mt-1">
            Hace <span className="font-bold text-white">{formatAgo(ageMs)}</span>
          </div>

          {order?.__isNew && (
            <div className="mt-2 inline-flex items-center gap-2 text-sm px-3 py-1 rounded-full bg-black/30 text-white">
              <span className="inline-block w-3 h-3 rounded-full bg-emerald-400" />
              NUEVA ORDEN
            </div>
          )}
        </div>

        <div
          className={[
            "text-sm font-bold px-3 py-1 rounded-full whitespace-nowrap",
            urgency.badge,
          ].join(" ")}
        >
          {urgency.label}
        </div>
      </div>

      {/* ✅ Items + notas por item */}
      <div className="mt-4 space-y-3">
        {items.map((it, idx) => {
          const name = it?.item_name || it?.name || "Platillo";
          const qty = Number(it?.quantity || 1);
          const notes = String(it?.notes || "").trim();

          return (
            <div
              key={it?.id ?? `${name}-${idx}`}
              className="rounded-xl bg-black/20 border border-white/10 p-3"
            >
              <div className="text-lg font-semibold">
                <span className="text-white/70 mr-2">x{qty}</span>
                <span className="text-white">{name}</span>
              </div>

              {notes && (
                <div className="mt-2 text-sm">
                  <span className="font-semibold text-emerald-200">Notas: </span>
                  <span className="text-white/85">{notes}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Nota a nivel orden (si algún día la usas) */}
      {(order?.notes || order?.observations) && (
        <div className="mt-4 text-base text-white/90 border-t border-white/30 pt-3">
          <span className="font-semibold">Nota general: </span>
          {order?.notes || order?.observations}
        </div>
      )}
    </div>
  );
}

KitchenOrderCard.propTypes = {
  order: PropTypes.object.isRequired,
  now: PropTypes.number.isRequired,
};