import React, { useEffect, useState } from "react";
import NavBar from "../NavBar";
import Header from "../Header";
import useThemeStore from "../../stores/useThemeStore";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import PageNav from "../../components/PageNav";
import CreateStaffForm from "./CreateStaffForm";
import useAuthStore from "../../stores/useAuthStore";
import { hasPermission } from "../../utils/permissions";

const CreateStaff = () => {
  const [nav, setNav] = useState(false);
  const { theme } = useThemeStore();
  const user = useAuthStore((state) => state.user);
  const canViewDashboard = hasPermission(user, "dashboard.view");
  const canViewStaff = hasPermission(user, "staff.view");

  const links = [
    ...(canViewDashboard ? [{ label: "Home", to: "/", active: true }] : []),
    ...(canViewStaff ? [{ label: "Staff", to: "/staff/home", active: true }] : []),
    { label: "Add Staff", to: "/staff/create-staff", active: false }
  ];

  useEffect(() => {
    document.title = "Smartbooks | Add Staff";
  }, []);

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <div className={`db-root theme-${theme}`}>
          <div className="db-page">
            <PageNav pageTitle='Add Staff' links={links} />
            <CreateStaffForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateStaff;