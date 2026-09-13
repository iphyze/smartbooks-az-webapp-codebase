import React, { useEffect, useState } from "react";
import NavBar from "../NavBar";
import Header from "../Header";
import useThemeStore from "../../stores/useThemeStore";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import PageNav from "../../components/PageNav";
import CreateBankForm from "./CreateBankForm";
import useAuthStore from "../../stores/useAuthStore";
import { hasPermission } from "../../utils/permissions";

const CreateBank = () => {
  const [nav, setNav] = useState(false);
  const { theme } = useThemeStore();
  const user = useAuthStore((state) => state.user);
  const canView = hasPermission(user, "bank.view");

  const links = [
    { label: "Home", to: "/", active: true },
    ...(canView ? [{ label: "Bank Accounts", to: "/banks/home", active: true }] : []),
    { label: "Create Bank Account", to: "/banks/create", active: false }
  ];

  useEffect(() => {
    document.title = "Smartbooks | Create Bank Account";
  }, []);

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <div className={`db-root theme-${theme}`}>
          <div className="db-page">
            <PageNav pageTitle='Create Bank Account' links={links} />
            <CreateBankForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBank;