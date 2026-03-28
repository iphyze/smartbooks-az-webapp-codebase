import React, { useEffect, useState } from "react";
import NavBar from "../NavBar";
import Header from "../Header";
import useThemeStore from "../../stores/useThemeStore";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import PageNav from "../../components/PageNav";
import CreateClientForm from "./CreateClientForm";

const CreateClient = () => {
  const [nav, setNav] = useState(false);
  const { theme } = useThemeStore();

  const links = [
    { label: "Home", to: "/", active: true },
    { label: "Clients", to: "/client/home", active: true },
    { label: "Create Client", to: "/client/create", active: false }
  ];

  useEffect(() => {
    document.title = "Smartbooks | Create Client";
  }, []);

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <PageNav pageTitle='Create Client' links={links} />
        <CreateClientForm />
      </div>
    </div>
  );
};

export default CreateClient;