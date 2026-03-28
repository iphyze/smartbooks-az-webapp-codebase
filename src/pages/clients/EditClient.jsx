import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar from "../NavBar";
import Header from "../Header";
import useThemeStore from "../../stores/useThemeStore";
import PageNav from "../../components/PageNav";
import EditClientForm from "./EditClientForm";
import useToastStore from "../../stores/useToastStore";
import useClientStore from "../../stores/useClientStore";
import EditLoaderComponent from "../../components/EditLoaderComponent";

const EditClient = () => {
  const { id } = useParams();
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
    { label: "Edit Client", to: "/client/edit", active: false },
  ];

  useEffect(() => {
    document.title = "Smartbooks | Edit Client";
    
    // 1. Basic format check
    const parsedId = parseInt(id, 10);
    if (!id || isNaN(parsedId) || parsedId <= 0) {
      showToast("Invalid client ID. Redirecting…", "error");
      navigate("/client/home");
      return;
    }

    // 2. Fetch data using the store action
    fetchSingleClient(parsedId);
  }, [id]);

  // 3. Handle fetch error by redirecting (toast is already shown by the store)
  useEffect(() => {
    if (fetchError) {
      navigate("/client/home");
    }
  }, [fetchError]);

  const handleSaveSuccess = () => {
    // Optional: Redirect or show success message after save
  };

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
          <EditClientForm
            clientId={parseInt(id, 10)}
            client={clientData}
            onSaveSuccess={handleSaveSuccess}
          />
        ) : null}
      </div>
    </div>
  );
};

export default EditClient;