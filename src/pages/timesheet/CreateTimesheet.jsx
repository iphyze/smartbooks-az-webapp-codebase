import React, { useEffect, useState } from "react";
import NavBar from "../NavBar";
import Header from "../Header";
import useThemeStore from "../../stores/useThemeStore";
import PageNav from "../../components/PageNav";
import CreateTimesheetForm from "./CreateTimesheetForm";

const CreateTimesheet = () => {
  const [nav, setNav] = useState(false);
  const { theme } = useThemeStore();

  const links = [
    { label: "Home", to: "/", active: true },
    { label: "Timesheets", to: "/timesheet/home", active: true },
    { label: "Log Time", to: "/", active: false },
  ];

  useEffect(() => {
    document.title = "Smartbooks | Log Time";
  }, []);

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <div className={`db-root theme-${theme}`}>
          <div className="db-page">
            <PageNav pageTitle="Timesheets" links={links} />
            <CreateTimesheetForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTimesheet;