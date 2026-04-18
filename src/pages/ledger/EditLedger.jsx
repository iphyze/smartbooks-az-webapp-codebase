import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar from "../NavBar";
import Header from "../Header";
import useThemeStore from "../../stores/useThemeStore";
import PageNav from "../../components/PageNav";
import EditLedgerForm from "./EditLedgerForm";
import useToastStore from "../../stores/useToastStore";
import useLedgerStore from "../../stores/useLedgerStore";
import EditLoaderComponent from "../../components/EditLoaderComponent";

const EditLedger = () => {
  const { id } = useParams(); // 'id' here represents the ledger_number from the route
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const [nav, setNav] = useState(false);

  // Consume states from useLedgerStore
  const { 
    singleLedger: ledgerData, 
    fetchingSingle: isLoading, 
    singleLedgerError: fetchError, 
    fetchSingleLedger 
  } = useLedgerStore();

  const links = [
    { label: "Home", to: "/", active: true },
    { label: "Ledgers", to: "/ledger/home", active: true },
    { label: "Edit Ledger", to: `/ledger/edit/${id}`, active: false },
  ];

  useEffect(() => {
    document.title = "Smartbooks | Edit Ledger";
    
    // 1. Basic format check
    const parsedId = parseInt(id, 10);
    if (!id || isNaN(parsedId) || parsedId <= 0) {
      showToast("Invalid ledger number. Redirecting…", "error");
      navigate("/ledger/home");
      return;
    }

    // 2. Fetch data using the store action (expects ledger_number)
    fetchSingleLedger(parsedId);
  }, [id]);

  // 3. Handle fetch error by redirecting (toast is already shown by the store)
  useEffect(() => {
    if (fetchError) {
      navigate("/ledger/home");
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
        <PageNav pageTitle="Ledgers" links={links} />

        {isLoading ? (
          <EditLoaderComponent text={'Loading Ledger...'} />
        ) : ledgerData ? (
          // Pass the fetched data directly to the child
          <EditLedgerForm
            ledgerNumber={ledgerData.ledger_number}
            ledger={ledgerData}
            onSaveSuccess={handleSaveSuccess}
          />
        ) : null}
      </div>
    </div>
  );
};

export default EditLedger;