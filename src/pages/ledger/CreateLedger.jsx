import React, { useEffect, useState } from "react";
import NavBar from "../NavBar";
import Header from "../Header";
import useThemeStore from "../../stores/useThemeStore";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import PageNav from "../../components/PageNav";
import CreateLedgerForm from "./CreateLedgerForm";

const CreateLedger = () => {
  const [nav, setNav] = useState(false);
  const { theme } = useThemeStore();

  const links = [
    { label: "Home", to: "/", active: true },
    { label: "Ledgers", to: "/ledger/home", active: true },
    { label: "Create Ledger", to: "/ledger/create", active: false }
  ];

  useEffect(() => {
    document.title = "Smartbooks | Create Ledger";
  }, []);

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <PageNav pageTitle='Create Ledger' links={links} />
        <CreateLedgerForm />
      </div>
    </div>
  );
};

export default CreateLedger;