import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar from "../NavBar";
import Header from "../Header";
import useThemeStore from "../../stores/useThemeStore";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import PageNav from "../../components/PageNav";
import useToastStore from "../../stores/useToastStore";
import useAuthStore from "../../stores/useAuthStore";
import api from "../../services/api";
import EditLoaderComponent from "../../components/EditLoaderComponent";
import ViewBankContent from "./ViewBankContent";

const ViewBank = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const [nav, setNav] = useState(false);

  // Local state for fetching single bank details (matches EditBank pattern)
  const [viewData, setViewData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const links = [
    { label: "Home", to: "/", active: true },
    { label: "Banks", to: "/banks/home", active: true },
    { label: "Details", to: "/", active: false },
  ];

  useEffect(() => {
    document.title = "Smartbooks | View Bank Account";
    
    // 1. Basic format check
    const parsedId = parseInt(id, 10);
    if (!id || isNaN(parsedId) || parsedId <= 0) {
      showToast("Invalid bank ID. Redirecting…", "error");
      navigate("/banks/home");
      return;
    }

    // 2. Fetch data directly via api
    const fetchSingleBank = async () => {
      setIsLoading(true);
      try {
        const token = useAuthStore.getState().token;
        const response = await api.get(`/bank/fetch-single-bank?bankId=${parsedId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Store the entire data object containing bank, invoices, and summary
        setViewData(response.data.data); 
      } catch (error) {
        const message = error.response?.data?.message || "Failed to fetch bank details";
        showToast(message, "error");
        setFetchError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSingleBank();
  }, [id, navigate, showToast]);

  // 3. Handle fetch error by redirecting
  useEffect(() => {
    if (fetchError) {
      navigate("/banks/home");
    }
  }, [fetchError, navigate]);

  if (fetchError) {
    return null; // Prevent flash of content while redirecting
  }

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <PageNav pageTitle="Banks" links={links} />

        {isLoading ? (
          <EditLoaderComponent text={'Loading Bank Account...'} />
        ) : viewData ? (
          // Pass the isolated data directly to the child
          <ViewBankContent 
            bank={viewData.bank} 
            invoices={viewData.invoices || []} 
            summary={viewData.summary || {}} 
          />
        ) : null}
      </div>
    </div>
  );
};

export default ViewBank;