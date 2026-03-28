import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import NavBar from "../NavBar";
import Header from "../Header";
import useThemeStore from "../../stores/useThemeStore";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import PageNav from "../../components/PageNav";
import useToastStore from "../../stores/useToastStore";
import api from "../../services/api";
import useAuthStore from "../../stores/useAuthStore";
import EditLoaderComponent from "../../components/EditLoaderComponent";
import ViewJournalContent from "./ViewJournalContent";

const ViewJournal = () => {
  const { journal_id } = useParams();
  const navigate = useNavigate();
  // const location = useLocation(); // Not strictly needed if we always fallback to home
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const [nav, setNav] = useState(false);

  // State for page status and data
  const [pageState, setPageState] = useState("checking");
  const [journalData, setJournalData] = useState(null);

  const links = [
    { label: "Home", to: "/", active: true },
    { label: "Journal", to: "/journal/home", active: true },
    { label: "Details", to: "/", active: false },
  ];

  useEffect(() => {
    document.title = "Smartbooks | View Journal";
    validateAndFetchJournal();
  }, [journal_id]);

  const validateAndFetchJournal = async () => {
    // 1. Basic format check
    const parsedId = parseInt(journal_id, 10);
    if (!journal_id || isNaN(parsedId) || parsedId <= 0) {
      showToast("Invalid journal ID format. Redirecting…", "error");
      navigate("/journal/home");
      return;
    }

    // 2. Fetch data (Validates existence + Gets data in one go)
    const token = useAuthStore.getState().token;
    try {
      const response = await api.get(
        `/journal/fetch-single-journal?journal_id=${parsedId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Check if data actually exists in response
      if (response.data && response.data.data) {
        setJournalData(response.data.data);
        setPageState("valid");
      } else {
        throw new Error("No data returned");
      }

    } catch (err) {
      const msg =
        err.response?.data?.message ||
        `Journal #${parsedId} does not exist or could not be loaded.`;
      showToast(msg, "error");
      setPageState("invalid");
      navigate("/journal/home");
    }
  };

  // If invalid, we already initiated navigation. Render nothing or a minimal placeholder.
  if (pageState === "invalid") {
    return null;
  }

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <PageNav pageTitle="Journal" links={links} />

        {pageState === "checking" ? (
          <EditLoaderComponent text={'Loading Journal...'} />
        ) : (
          // Pass the fetched data directly to the child
          <ViewJournalContent journal={journalData} />
        )}
      </div>
    </div>
  );
};

export default ViewJournal;