import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar from "../NavBar";
import Header from "../Header";
import useThemeStore from "../../stores/useThemeStore";
import PageNav from "../../components/PageNav";
import useToastStore from "../../stores/useToastStore";
import useAuthStore from "../../stores/useAuthStore";
import api from "../../services/api";
import EditLoaderComponent from "../../components/EditLoaderComponent";
import ViewLedgerContent from "./ViewLedgerContent";

const ViewLedger = () => {
  const { id } = useParams(); // 'id' here represents the ledger_number from the route
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const [nav, setNav] = useState(false);

  // Local state for fetching single ledger details (prevents React 18 batching issues)
  const [viewData, setViewData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const links = [
    { label: "Home", to: "/", active: true },
    { label: "Ledgers", to: "/ledger/home", active: true },
    { label: "Details", to: "/", active: false },
  ];

  useEffect(() => {
    document.title = "Smartbooks | View Ledger";
    
    // 1. Basic format check
    const parsedId = parseInt(id, 10);
    if (!id || isNaN(parsedId) || parsedId <= 0) {
      showToast("Invalid ledger number. Redirecting…", "error");
      navigate("/ledger/home");
      return;
    }

    // 2. Fetch data directly via api
    const fetchSingleLedger = async () => {
      setIsLoading(true);
      try {
        const token = useAuthStore.getState().token;
        const response = await api.get(`/ledger/fetch-single-ledger?ledger_number=${parsedId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Store the entire data object containing ledger, journal_entries, and summary
        setViewData(response.data.data); 
      } catch (error) {
        const message = error.response?.data?.message || "Failed to fetch ledger details";
        showToast(message, "error");
        setFetchError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSingleLedger();
  }, [id, navigate, showToast]);

  // 3. Handle fetch error by redirecting
  useEffect(() => {
    if (fetchError) {
      navigate("/ledger/home");
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
        <PageNav pageTitle="Ledgers" links={links} />

        {isLoading ? (
          <EditLoaderComponent text={'Loading Ledger...'} />
        ) : viewData ? (
          // Pass the isolated data directly to the child
          <ViewLedgerContent 
            ledger={viewData.ledger} 
            journalEntries={viewData.journal_entries || []} 
            summary={viewData.summary || {}} 
          />
        ) : null}
      </div>
    </div>
  );
};

export default ViewLedger;