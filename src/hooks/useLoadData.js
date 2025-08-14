import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setUser, removeUser } from "../redux/slices/userSlice";
import { axiosWrapper } from "../https/axiosWrapper";

const useLoadData = () => {
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();

 useEffect(() => {
  // ⛔ Evita loop en la ruta de login
  if (window.location.pathname === "/auth") {
    setIsLoading(false);
    return;
  }

  const fetchData = async () => {
    try {
      // const res = await axiosWrapper.get(`${import.meta.env.VITE_BACKEND_URL}/api/user/me`, {
      //   withCredentials: true,
      // });

      const res = await axiosWrapper.get("/api/user/me")

      const user = res?.data?.data;

      if (!user) {
        throw new Error("User data is undefined");
      }

      const { id, name, email, phone, role } = user;
      dispatch(setUser({ id, name, email, phone, role }));
    } catch (error) {
      console.error("❌ Error loading user:", error.message);
      dispatch(removeUser());
      
    } finally {
      setIsLoading(false);
    }
  };

  fetchData();
}, [dispatch]);

  return isLoading;
};

export default useLoadData;