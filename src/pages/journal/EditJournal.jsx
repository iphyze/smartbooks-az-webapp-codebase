import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar from "../NavBar";
import Header from "../Header";
import useThemeStore from "../../stores/useThemeStore";
import PageNav from "../../components/PageNav";
import EditJournalForm from "./EditJournalForm";
import useToastStore from "../../stores/useToastStore";
import api from "../../services/api";
import useAuthStore from "../../stores/useAuthStore";
import EditLoaderComponent from "../../components/EditLoaderComponent";

const EditJournal = () => {
  const { journal_id } = useParams();
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const [nav, setNav] = useState(false);

  // State for page status and data
  const [pageState, setPageState] = useState("checking");
  const [journalData, setJournalData] = useState(null);

  const links = [
    { label: "Home", to: "/", active: true },
    { label: "Journal", to: "/journal/home", active: true },
    { label: "Edit Journal", to: "/", active: false },
  ];

  useEffect(() => {
    document.title = "Smartbooks | Edit Journal";
    validateAndFetchJournal();
  }, [journal_id]);

  const validateAndFetchJournal = async () => {
    // 1. Basic format check
    const parsedId = parseInt(journal_id, 10);
    if (!journal_id || isNaN(parsedId) || parsedId <= 0) {
      showToast("Invalid journal ID. Redirecting…", "error");
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

      if (response.data && response.data.data) {
        setJournalData(response.data.data);
        setPageState("valid");
      } else {
        throw new Error("No data returned");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        `Journal #${parsedId} does not exist.`;
      showToast(msg, "error");
      setPageState("invalid");
      navigate("/journal/home");
    }
  };

  const handleSaveSuccess = () => {
    // Optional: Redirect or show success message
    // navigate("/journal/home");
  };

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
          <EditJournalForm
            journalId={parseInt(journal_id, 10)}
            journal={journalData}
            onSaveSuccess={handleSaveSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default EditJournal;