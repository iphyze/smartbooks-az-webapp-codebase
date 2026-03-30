import React, { useEffect, useState } from "react";
import NavBar from "../NavBar";
import Header from "../Header";
import useThemeStore from "../../stores/useThemeStore";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import PageNav from "../../components/PageNav";
import CreateProjectForm from "./CreateProjectForm";

const CreateProject = () => {
  const [nav, setNav] = useState(false);
  const { theme } = useThemeStore();

  const links = [
    { label: "Home", to: "/", active: true },
    { label: "Projects", to: "/project/home", active: true },
    { label: "Create Project", to: "/project/create", active: false }
  ];

  useEffect(() => {
    document.title = "Smartbooks | Create Project";
  }, []);

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <PageNav pageTitle='Create Project' links={links} />
        <CreateProjectForm />
      </div>
    </div>
  );
};

export default CreateProject;