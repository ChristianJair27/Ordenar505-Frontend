import React, { useState, useEffect } from "react";
import { MdTableBar, MdCategory } from "react-icons/md";
import { BiSolidDish } from "react-icons/bi";
import Metrics from "../components/dashboard/Metrics";
import RecentOrders from "../components/dashboard/RecentOrders";
import Modal from "../components/dashboard/Modal";
import AddCategoryModal from "../components/dashboard/AddCategoryModal";
import AddDishModal from "../components/dashboard/AddDishModal";
import Usuarios from "../components/dashboard/Usuarios";

const buttons = [
  { label: "Agregar Mesa", icon: <MdTableBar />, action: "table" },
  
];

const tabs = ["Caja", "Ordenes", "Usuarios"];

const Dashboard = () => {
  useEffect(() => {
    document.title = "La Peña de Santiago";
  }, []);

  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Caja");

  const handleOpenModal = (action) => {
    if (action === "table") setIsTableModalOpen(true);
    if (action === "category") setIsCategoryModalOpen(true);
    if (action === "dishes") setIsDishModalOpen(true);
  };

  return (
    <div className="bg-[#1f1f1f] h-[calc(100vh-5rem)]">
     

      {activeTab === "Caja" && <Metrics />}
      

      {isTableModalOpen && <Modal setIsTableModalOpen={setIsTableModalOpen} />}
      
    </div>
  );
};

export default Dashboard;