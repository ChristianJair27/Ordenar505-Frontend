import React, { useState } from "react";
import { axiosWrapper } from "../../https/axiosWrapper";

const AddTableModal = ({ setIsOpen, onTableAdded, onUserAdded }) => {
  const [formData, setFormData] = useState({
    table_no: "",
    seats: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // compat: si el padre envió onUserAdded, úsalo; si no, onTableAdded; si no, no-op
  const afterSave =
    typeof onTableAdded === "function"
      ? onTableAdded
      : typeof onUserAdded === "function"
      ? onUserAdded
      : () => {};

  const handleChange = (e) => {
    const { name, value } = e.target;
    // solo dígitos para campos numéricos
    const clean = ["table_no", "seats"].includes(name)
      ? value.replace(/[^\d]/g, "")
      : value;

    setFormData((prev) => ({ ...prev, [name]: clean }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    // Validación mínima
    const table_no = Number(formData.table_no);
    const seats = Number(formData.seats);
    if (!table_no || !seats) {
      alert("Por favor completa todos los campos con valores numéricos.");
      return;
    }

    setIsSaving(true);
    try {
      await axiosWrapper.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/table/add`,
        { table_no, seats },
        { withCredentials: true }
      );

      // refresca lista si hay callback
      afterSave();
      setIsOpen(false);
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Error al agregar mesa.";

      // Mensaje amigable para duplicados
      if (status === 400 || status === 409) {
        alert(msg); // p.ej. "Table already exists"
      } else {
        alert(`Error al agregar mesa: ${msg}`);
      }
      console.error("❌ Error al agregar mesa:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-black">Agregar Mesa</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            name="table_no"
            placeholder="Número de Mesa"
            value={formData.table_no}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded text-black"
            inputMode="numeric"
            pattern="\d*"
          />

          <input
            type="text"
            name="seats"
            placeholder="Asientos"
            value={formData.seats} 
            onChange={handleChange}
            required
            className="w-full p-2 border rounded text-black"
            inputMode="numeric"
            pattern="\d*"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-60"
              disabled={isSaving}
            >
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTableModal;
