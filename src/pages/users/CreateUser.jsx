import React, { useEffect, useState } from "react";
import NavBar from "../NavBar";
import Header from "../Header";
import useThemeStore from "../../stores/useThemeStore";
import PageNav from "../../components/PageNav";
import CreateUserForm from "./CreateUserForm";

const CreateUser = () => {
  const [nav, setNav] = useState(false);
  const { theme } = useThemeStore();

  const links = [
    { label: "Home", to: "/", active: true },
    { label: "Users", to: "/users/home", active: true },
    { label: "Add User", to: "/users/create-user", active: false },
  ];

  useEffect(() => {
    document.title = "Smartbooks | Add User";
  }, []);

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <div className={`db-root theme-${theme}`}>
          <div className="db-page">
            <PageNav pageTitle="Add User" links={links} />
            <CreateUserForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateUser;
