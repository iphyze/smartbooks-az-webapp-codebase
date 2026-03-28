import React, { useEffect, useState, useMemo } from "react";
import NavBar from "../NavBar";
import Header from "../Header";
import useThemeStore from "../../stores/useThemeStore";
import { Link, NavLink } from "react-router-dom";
import { motion} from "framer-motion";
import { fadeIn, fadeInUp, fadeInDown } from "../../utils/animation";
import PageNav from "../../components/PageNav";
import CreateInvoiceForm from "./CreateInvoiceForm";


const CreateInvoice = () => {
  const [nav, setNav] = useState(false);
  const { theme } = useThemeStore();
  const [isLoading, setIsLoading] = useState(true);


  const links = [
    { label: "Home", to: "/", active: true },
    { label: "Invoice", to: "/invoice/home", active: true },
    { label: "Create Invoice", to: "/", active: false }
  ]

  useEffect(() => {
    document.title = "Smartbooks | Create Invoice";
  }, []);

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <PageNav pageTitle='Invoice' links={links} />

        <CreateInvoiceForm />
        
      </div>
    </div>
  );
};

export default CreateInvoice;