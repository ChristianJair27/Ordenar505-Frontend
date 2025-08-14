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
    image_url: "",
    category_id: "",
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        name: initialData.name || "",
        price: initialData.price || "",
        image_url: initialData.image_url || "",
        category_id: initialData.category_id || "",
      });
    }
  }, [initialData, isEditing]);

  const { data } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const mutation = useMutation({
    mutationFn: (data) =>
      isEditing
        ? updateDish(initialData.id, data)
        : addDish(data),
    onSuccess: (res) => {
      enqueueSnackbar(res.data.message, { variant: "success" });
      queryClient.invalidateQueries(["dishes"]);
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
    if (!formData.name || !formData.price || !formData.category_id) {
      return enqueueSnackbar("Rellena todos los campos", { variant: "warning" });
    }
    mutation.mutate({ ...formData, price: parseFloat(formData.price) });
  };

  const categories = Array.isArray(data?.data) ? data.data : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#262626] p-6 rounded-lg shadow-lg w-96"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">
            {isEditing ? "Editar Platillo" : "Agregar Platillo"}
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
            name="price"
            type="number"
            placeholder="Precio"
            value={formData.price}
            onChange={handleChange}
            className="w-full p-3 rounded bg-[#1f1f1f] text-white"
          />
          <input
            name="image_url"
            placeholder="URL de imagen"
            value={formData.image_url}
            onChange={handleChange}
            className="w-full p-3 rounded bg-[#1f1f1f] text-white"
          />
          <select
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
            className="w-full p-3 rounded bg-[#1f1f1f] text-white"
          >
            <option value="">Seleccionar categoría</option>
            {Array.isArray(data?.data?.data) &&
  data.data.data.map((cat) => (
    <option key={cat.id} value={cat.id}>
      {cat.icon} {cat.name}
    </option>
  ))}
          </select>

          <button
            type="submit"
            className="w-full mt-4 py-3 bg-green-500 text-black font-bold rounded"
          >
            {isEditing ? "Actualizar" : "Guardar"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AddDishModal;