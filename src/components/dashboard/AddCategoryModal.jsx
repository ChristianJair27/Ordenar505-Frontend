import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { IoMdClose } from "react-icons/io";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addCategory, updateCategory } from "../../https";
import { enqueueSnackbar } from "notistack";

const AddCategoryModal = ({ setIsOpen, initialData = null, isEditing = false }) => {
  const [formData, setFormData] = useState({
    name: "",
    bg_color: "#000000",
    icon: "",
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        name: initialData.name || "",
        bg_color: initialData.bg_color || "#000000",
        icon: initialData.icon || "",
      });
    }
  }, [initialData, isEditing]);

  const mutation = useMutation({
    mutationFn: (data) =>
      isEditing
        ? updateCategory(initialData.id, data)
        : addCategory(data),
    onSuccess: (res) => {
      enqueueSnackbar(res.data.message, { variant: "success" });
      queryClient.invalidateQueries(["categories"]);
      setIsOpen(false);
    },
    onError: (err) => {
      enqueueSnackbar(err.response?.data?.message || "Error", { variant: "error" });
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.icon) {
      return enqueueSnackbar("Rellena todos los campos", { variant: "warning" });
    }
    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#262626] p-6 rounded-lg shadow-lg w-96"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">
            {isEditing ? "Editar Categoría" : "Agregar Categoría"}
          </h2>
          <button onClick={setIsOpen} className="text-white">
            <IoMdClose size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <input
            name="name"
            placeholder="Nombre"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-3 rounded bg-[#1f1f1f] text-white"
          />
          <input
            name="icon"
            placeholder="Emoji / Icono (🍕)"
            value={formData.icon}
            onChange={handleChange}
            className="w-full p-3 rounded bg-[#1f1f1f] text-white"
          />
          <input
            type="color"
            name="bg_color"
            value={formData.bg_color}
            onChange={handleChange}
            className="w-full h-12 cursor-pointer rounded"
          />

          <button
            type="submit"
            className="w-full mt-4 py-3 bg-yellow-400 text-black font-bold rounded"
          >
            {isEditing ? "Actualizar" : "Guardar"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AddCategoryModal;