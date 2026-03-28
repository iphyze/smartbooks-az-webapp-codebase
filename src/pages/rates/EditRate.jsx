import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar from "../NavBar";
import Header from "../Header";
import useThemeStore from "../../stores/useThemeStore";
import PageNav from "../../components/PageNav";
import EditRateForm from "./EditRateForm"; // Updated import
import useToastStore from "../../stores/useToastStore";
import useRateStore from "../../stores/useRateStore"; // Updated import
import EditLoaderComponent from "../../components/EditLoaderComponent";

const EditRate = () => {
  const { id } = useParams(); // Updated parameter
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const [nav, setNav] = useState(false);

  // Consume states from useRateStore instead of local state
  const { 
    singleRate: rateData, 
    fetchingSingle: isLoading, 
    singleRateError: fetchError, 
    fetchSingleRate 
  } = useRateStore();

  const links = [
    { label: "Home", to: "/", active: true },
    { label: "Rates", to: "/rate/home", active: true }, // Updated link
    { label: "Edit Rate", to: "/rate/edit", active: false }, // Updated link
  ];

  useEffect(() => {
    document.title = "Smartbooks | Edit Rate";
    
    // 1. Basic format check
    const parsedId = parseInt(id, 10);
    if (!id || isNaN(parsedId) || parsedId <= 0) {
      showToast("Invalid rate ID. Redirecting…", "error");
      navigate("/rate/home");
      return;
    }

    // 2. Fetch data using the store action
    fetchSingleRate(parsedId);
  }, [id]);

  // 3. Handle fetch error by redirecting (toast is already shown by the store)
  useEffect(() => {
    if (fetchError) {
      navigate("/rate/home");
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
        <PageNav pageTitle="Rates" links={links} />

        {isLoading ? (
          <EditLoaderComponent text={'Loading Rate...'} />
        ) : rateData ? (
          // Pass the fetched data directly to the child
          <EditRateForm
            rateId={parseInt(id, 10)}
            rate={rateData}
            onSaveSuccess={handleSaveSuccess}
          />
        ) : null}
      </div>
    </div>
  );
};

export default EditRate;