import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import NavBar from "../NavBar";
import Header from "../Header";
import { motion, AnimatePresence } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import useThemeStore from "../../stores/useThemeStore";
import useUsersStore from "../../stores/useUsersStore";
import PageNav from "../../components/PageNav";
import EditLoaderComponent from "../../components/EditLoaderComponent";
import ErrorModal from "../../components/modals/ErrorModal";
import ViewUserContent from "./ViewUserContent";

const ViewUser = () => {
  const [nav, setNav] = useState(false);
  const { theme } = useThemeStore();
  const { id } = useParams();
  const { singleUser, fetchingSingle, singleUserError, fetchSingleUser, clearSingleUser } = useUsersStore();

  const links = [
    { label: "Home", to: "/", active: true },
    { label: "Users", to: "/users/home", active: true },
    { label: "View User", to: `/users/view/${id}`, active: false },
  ];

  useEffect(() => {
    document.title = "Smartbooks | View User";
    fetchSingleUser(id);
    return () => clearSingleUser();
  }, [id, fetchSingleUser, clearSingleUser]);

  const user = singleUser;

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <div className={`db-root theme-${theme}`}>
          <div className="db-page">
            <PageNav pageTitle="View User" links={links} />

            {fetchingSingle ? (
              <EditLoaderComponent />
            ) : user ? (
              <motion.div variants={fadeInUp} initial="hidden" animate="show"
                transition={{ duration: 0.3, delay: 0.1, ease: "easeInOut" }}
                className={`invoice-section theme-${theme}`}
                style={{ padding: 0, background: "none", boxShadow: "none" }}
              >
                <ViewUserContent user={user} />
              </motion.div>
            ) : null}

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

export default ViewUser;
