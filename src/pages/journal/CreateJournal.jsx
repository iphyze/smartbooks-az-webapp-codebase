import React, { useEffect, useState, useMemo } from "react";
import NavBar from "../NavBar";
import Header from "../Header";
import useThemeStore from "../../stores/useThemeStore";
import { Link, NavLink } from "react-router-dom";
import { motion} from "framer-motion";
import { fadeIn, fadeInUp, fadeInDown } from "../../utils/animation";
import PageNav from "../../components/PageNav";
import CreateJournalForm from "./CreateJournalForm";


const CreateJournal = () => {
  const [nav, setNav] = useState(false);
  const { theme } = useThemeStore();
  const [isLoading, setIsLoading] = useState(true);


  const links = [
    { label: "Home", to: "/", active: true },
    { label: "Journal", to: "/journal/home", active: true },
    { label: "Create Journal", to: "/", active: false }
  ]

  useEffect(() => {
    document.title = "Smartbooks | Create Journal";
  }, []);

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <PageNav pageTitle='Journal' links={links} />

        <CreateJournalForm />
        
      </div>
    </div>
  );
};

export default CreateJournal;