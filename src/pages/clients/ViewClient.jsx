import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar from "../NavBar";
import Header from "../Header";
import useThemeStore from "../../stores/useThemeStore";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import PageNav from "../../components/PageNav";
import useToastStore from "../../stores/useToastStore";
import useClientStore from "../../stores/useClientStore";
import EditLoaderComponent from "../../components/EditLoaderComponent";
import ViewClientContent from "./ViewClientContent";

const ViewClient = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const [nav, setNav] = useState(false);

  // Consume states from useClientStore
  const { 
    singleClient: clientData, 
    fetchingSingle: isLoading, 
    singleClientError: fetchError, 
    fetchSingleClient 
  } = useClientStore();

  const links = [
    { label: "Home", to: "/", active: true },
    { label: "Clients", to: "/client/home", active: true },
    { label: "Details", to: "/", active: false },
  ];

  useEffect(() => {
    document.title = "Smartbooks | View Client";
    
    // 1. Basic format check
    const parsedId = parseInt(clientId, 10);
    if (!clientId || isNaN(parsedId) || parsedId <= 0) {
      showToast("Invalid client ID. Redirecting…", "error");
      navigate("/client/home");
      return;
    }

    // 2. Fetch data using the store action
    fetchSingleClient(parsedId);
  }, [clientId]);

  // 3. Handle fetch error by redirecting (toast is already shown by the store)
  useEffect(() => {
    if (fetchError) {
      navigate("/client/home");
    }
  }, [fetchError]);

  if (fetchError) {
    return null; // Prevent flash of content while redirecting
  }

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <PageNav pageTitle="Clients" links={links} />

        {isLoading ? (
          <EditLoaderComponent text={'Loading Client...'} />
        ) : clientData ? (
          // Pass the fetched data directly to the child
          <ViewClientContent client={clientData} />
        ) : null}
      </div>
    </div>
  );
};

export default ViewClient;