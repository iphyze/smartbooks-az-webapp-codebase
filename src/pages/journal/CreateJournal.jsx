import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import NavBar from "../NavBar";
import Header from "../Header";
import useThemeStore from "../../stores/useThemeStore";
import PageNav from "../../components/PageNav";
import CreateJournalForm from "./CreateJournalForm";

const CreateJournal = () => {
  const [nav, setNav] = useState(false);
  const { theme } = useThemeStore();
  const [searchParams] = useSearchParams();
  const duplicateSourceId = searchParams.get("duplicate");
  const isDuplicate = Boolean(duplicateSourceId);

  const links = [
    { label: "Home", to: "/", active: true },
    { label: "Journal", to: "/journal/home", active: true },
    { label: isDuplicate ? "Duplicate Journal" : "Create Journal", to: "/", active: false },
  ];

  useEffect(() => {
    document.title = isDuplicate
      ? "Smartbooks | Duplicate Journal"
      : "Smartbooks | Create Journal";
  }, [isDuplicate]);

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <div className={`db-root theme-${theme}`}>
          <div className="db-page">
            <PageNav pageTitle="Journal" links={links} />
            <CreateJournalForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateJournal;
