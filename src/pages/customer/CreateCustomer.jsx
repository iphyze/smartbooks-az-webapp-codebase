import React, { useEffect, useState, useMemo } from "react";
import NavBar from "../NavBar";
import Header from "../Header";
import useThemeStore from "../../stores/useThemeStore";
import { Link, NavLink } from "react-router-dom";
import PageNav from "../../components/PageNav";
import CreateCustomerForm from "./CreateCustomerForm";

const CreateCustomer = () => {
  const [nav, setNav] = useState(false);
  const { theme } = useThemeStore();
  const [isLoading, setIsLoading] = useState(true);


  const links = [
    { label: "Home", to: "/dashboard", active: true },
    { label: "Customer", to: "/customer/home", active: true },
    { label: "Create Customer", to: "/", active: false }
  ]

  useEffect(() => {
    document.title = "Digital Invoice Naija | Create Customers";
  }, []);

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <PageNav pageTitle='Create Customer' links={links} />

        <CreateCustomerForm />
      </div>
    </div>
  );
};

export default CreateCustomer;