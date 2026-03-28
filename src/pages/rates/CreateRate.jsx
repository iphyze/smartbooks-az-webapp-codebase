import React, { useEffect, useState } from "react";
import NavBar from "../NavBar";
import Header from "../Header";
import useThemeStore from "../../stores/useThemeStore";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import PageNav from "../../components/PageNav";
import CreateRateForm from "./CreateRateForm";

const CreateRate = () => {
  const [nav, setNav] = useState(false);
  const { theme } = useThemeStore();

  const links = [
    { label: "Home", to: "/", active: true },
    { label: "Rates", to: "/rate/home", active: true },
    { label: "Create Rate", to: "/rate/create", active: false }
  ];

  useEffect(() => {
    document.title = "Smartbooks | Create Rate";
  }, []);

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <PageNav pageTitle='Create Rate' links={links} />
        <CreateRateForm />
      </div>
    </div>
  );
};

export default CreateRate;