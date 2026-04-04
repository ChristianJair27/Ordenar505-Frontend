import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { IoMdClose } from "react-icons/io";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDish, updateDish, getCategories } from "../../https";
import { enqueueSnackbar } from "notistack";

const AddDishModal = ({ setIsOpen, initialData = null, isEditing = false }) => {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category_id: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        name: initialData.name || "",
        price: initialData.price?.toString() || "",
        category_id: initialData.category_id || "",
      });
      if (initialData.image_url) {
        setPreview(initialData.image_url); // URL existente desde BD
      }
    }
  }, [initialData, isEditing]);

  const { data: catResponse, isLoading: catLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  // ──────────────────────────────────────────────
  //   Normalizamos las categorías (ajusta según tu API)
  // ──────────────────────────────────────────────
  const categories = Array.isArray(catResponse?.data)
    ? catResponse.data
    : Array.isArray(catResponse?.data?.data)
    ? catResponse.data.data
    : [];

  const mutation = useMutation({
    mutationFn: (formDataToSend) =>
      isEditing ? updateDish(initialData.id, formDataToSend) : addDish(formDataToSend),
    onSuccess: () => {
      enqueueSnackbar(isEditing ? "Platillo actualizado" : "Platillo agregado", {
        variant: "success",
      });
      queryClient.invalidateQueries(["dishes"]);
      setIsOpen(false);
    },
    onError: (err) => {
      enqueueSnackbar(err.response?.data?.message || "Error al guardar", {
        variant: "error",
      });
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      enqueueSnackbar("Solo imágenes (jpg, png, webp)", { variant: "warning" });
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.price || !formData.category_id) {
      enqueueSnackbar("Completa los campos obligatorios", { variant: "warning" });
      return;
    }

    const sendData = new FormData();
    sendData.append("name", formData.name.trim());
    sendData.append("price", formData.price);
    sendData.append("category_id", formData.category_id);

    if (selectedFile) {
      sendData.append("image", selectedFile);
    }

    mutation.mutate(sendData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#262626] rounded-xl shadow-2xl w-full max-w-md border border-gray-800/50 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#2c2c2c] border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">
            {isEditing ? "Editar Platillo" : "Agregar Platillo"}
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <IoMdClose size={26} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Nombre */}
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">
              Nombre del platillo *
            </label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Torta de milanesa"
              className="w-full px-4 py-3 bg-[#1f1f1f] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-600/70 transition"
              required
            />
          </div>

          {/* Precio */}
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">
              Precio *
            </label>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-[#1f1f1f] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-600/70 transition"
              required
            />
          </div>

          {/* Imagen */}
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">
              Imagen del platillo
            </label>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-400
                file:mr-4 file:py-2.5 file:px-5
                file:rounded file:border-0
                file:text-sm file:font-medium
                file:bg-green-700/20 file:text-green-400
                hover:file:bg-green-700/40
                file:cursor-pointer cursor-pointer"
            />

            {/* Previsualización */}
            {preview && (
              <div className="mt-4 rounded-lg overflow-hidden border border-gray-700 bg-[#1f1f1f]">
                <img
                  src={preview}
                  alt="Vista previa del platillo"
                  className="w-full h-44 object-cover"
                />
              </div>
            )}

            {isEditing && initialData?.image_url && !selectedFile && (
              <p className="mt-2 text-xs text-gray-500">
                Imagen actual se mantendrá si no subes una nueva
              </p>
            )}
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">
              Categoría *
            </label>

            {catLoading ? (
              <div className="text-gray-500 text-sm py-3">Cargando categorías...</div>
            ) : categories.length === 0 ? (
              <div className="text-red-400 text-sm py-3">
                No hay categorías disponibles
              </div>
            ) : (
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#1f1f1f] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-600/70 transition appearance-none"
                required
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon ? `${cat.icon} ` : ""}
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={mutation.isPending}
            className={`w-full py-3.5 mt-3 rounded-lg font-semibold transition-all
              ${
                mutation.isPending
                  ? "bg-green-800/50 cursor-not-allowed text-gray-300"
                  : "bg-green-600 hover:bg-green-500 active:bg-green-700 text-black shadow-md"
              }`}
          >
            {mutation.isPending
              ? "Guardando..."
              : isEditing
              ? "Actualizar Platillo"
              : "Guardar Platillo"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AddDishModal;