import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import NavBar from "../NavBar";
import Header from "../Header";
import { AnimatePresence } from "framer-motion";
import useThemeStore from "../../stores/useThemeStore";
import useUsersStore from "../../stores/useUsersStore";
import PageNav from "../../components/PageNav";
import EditLoaderComponent from "../../components/EditLoaderComponent";
import ErrorModal from "../../components/modals/ErrorModal";
import EditUserForm from "./EditUserForm";

const EditUser = () => {
  const [nav, setNav] = useState(false);
  const { theme } = useThemeStore();
  const { id } = useParams();
  const location = useLocation();

  const { singleUser, fetchingSingle, singleUserError, fetchSingleUser, clearSingleUser } = useUsersStore();

  const links = [
    { label: "Home", to: "/", active: true },
    { label: "Users", to: "/users/home", active: true },
    { label: "Edit User", to: `/users/edit/${id}`, active: false },
  ];

  useEffect(() => {
    document.title = "Smartbooks | Edit User";
    const passedUser = location.state?.user;
    if (passedUser) {
      useUsersStore.setState({ singleUser: passedUser });
    } else {
      fetchSingleUser(id);
    }
    return () => clearSingleUser();
  }, [id]);

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <div className={`db-root theme-${theme}`}>
          <div className="db-page">
            <PageNav pageTitle="Edit User" links={links} />

            {fetchingSingle ? (
              <EditLoaderComponent />
            ) : (
              <EditUserForm userId={id} user={singleUser} />
            )}

            <AnimatePresence>
              {singleUserError && (
                <ErrorModal
                  isOpen={!!singleUserError}
                  onClose={() => useUsersStore.setState({ singleUserError: null })}
                  onRetry={() => fetchSingleUser(id)}
                  message={singleUserError}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditUser;
