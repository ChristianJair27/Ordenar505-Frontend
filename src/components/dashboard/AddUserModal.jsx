import React, { useState, useEffect } from "react";
import { axiosWrapper } from "../../https/axiosWrapper";
import { enqueueSnackbar } from "notistack"; // si usas notistack en el resto del proyecto

const AddUserModal = ({ setIsOpen, onUserAdded, initialData = null }) => {
  const isEditing = !!initialData?.id;

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    role: "waiter",
  });

  const [loading, setLoading] = useState(false);

  // Cargar datos iniciales cuando se edita
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        phone: initialData.phone || "",
        email: initialData.email || "",
        password: "", // ← nunca precargamos la contraseña real
        role: initialData.role || "waiter",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validaciones básicas
      if (!formData.name || !formData.email || !formData.role) {
        enqueueSnackbar?.("Faltan campos obligatorios", { variant: "warning" }) ||
          alert("Faltan campos obligatorios");
        return;
      }

      // Si es creación → password obligatorio
      if (!isEditing && !formData.password) {
        enqueueSnackbar?.("La contraseña es obligatoria al crear usuario", { variant: "warning" }) ||
          alert("La contraseña es obligatoria");
        return;
      }

      const url = import.meta.env.VITE_BACKEND_URL;
      const config = { withCredentials: true };

      if (isEditing) {
        // Editar → no enviamos password si está vacío
        const dataToSend = { ...formData };
        if (!dataToSend.password) delete dataToSend.password;

        await axiosWrapper.put(`${url}/api/user/${initialData.id}`, dataToSend, config);
        enqueueSnackbar?.("Usuario actualizado correctamente", { variant: "success" });
      } else {
        // Crear
        await axiosWrapper.post(`${url}/api/user/register`, formData, config);
        enqueueSnackbar?.("Usuario creado correctamente", { variant: "success" });
      }

      onUserAdded(); // refrescar lista
      setIsOpen(false);
    } catch (err) {
      console.error("Error al guardar usuario:", err);
      const msg =
        err.response?.data?.message ||
        (isEditing ? "No se pudo actualizar el usuario" : "No se pudo crear el usuario");
      enqueueSnackbar?.(msg, { variant: "error" }) || alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-50 to-blue-50 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            {isEditing ? "Editar Usuario" : "Nuevo Usuario"}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isEditing ? "Nueva contraseña (opcional)" : "Contraseña *"}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={!isEditing}
              placeholder={isEditing ? "Dejar en blanco para no cambiar" : ""}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white transition"
            >
              <option value="waiter">Mesero</option>
              <option value="admin">Administrador</option>
              <option value="cajero">Cajero</option>
              {/* puedes agregar más roles si los tienes */}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={loading}
              className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2.5 text-white font-medium rounded-lg transition flex items-center gap-2
                ${loading ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"}`}
            >
              {loading && (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
                  />
                </svg>
              )}
              {isEditing ? "Guardar cambios" : "Crear usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;