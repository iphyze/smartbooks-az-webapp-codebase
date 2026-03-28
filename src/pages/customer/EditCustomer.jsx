import React, { useEffect, useState, useMemo } from "react";
import NavBar from "../NavBar";
import Header from "../Header";
import useThemeStore from "../../stores/useThemeStore";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion} from "framer-motion";
import { fadeIn, fadeInUp, fadeInDown } from "../../utils/animation";
import PageNav from "../../components/PageNav";
import EditCustomerForm from "./EditCustomerForm";

const EditCustomer = () => {
  const [nav, setNav] = useState(false);
  const { theme } = useThemeStore();
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const customerToEdit = location.state?.customer;

  const links = [
    { label: "Home", to: "/dashboard", active: true },
    { label: "Customer", to: "/customer/home", active: true },
    { label: "Edit Customer", to: "/", active: false }
  ]

  useEffect(() => {
    document.title = "Digital Invoice Naija | Edit Customer";
  }, []);

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <PageNav pageTitle='Edit Customer' links={links} />

        <EditCustomerForm customerToEdit={customerToEdit}/>
        
      </div>
    </div>
  );
};

export default EditCustomer;