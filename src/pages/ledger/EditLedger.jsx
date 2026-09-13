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
import useAuthStore from "../../stores/useAuthStore";
import { hasPermission } from "../../utils/permissions";

const EditLedger = () => {
  const { id } = useParams(); // 'id' here represents the ledger_number from the route
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const [nav, setNav] = useState(false);
  const user = useAuthStore((state) => state.user);
  const canView = hasPermission(user, "ledger.view");

  // Consume states from useLedgerStore
  const {
    singleLedger: ledgerData,
    fetchingSingle: isLoading,
    singleLedgerError: fetchError,
    fetchSingleLedger
  } = useLedgerStore();

  const links = [
    { label: "Home", to: "/", active: true },
    ...(canView ? [{ label: "Ledgers", to: "/ledger/home", active: true }] : []),
    { label: "Edit Ledger", to: `/ledger/edit/${id}`, active: false },
  ];

  useEffect(() => {
    document.title = "Smartbooks | Edit Ledger";

    // 1. Basic format check
    const parsedId = parseInt(id, 10);
    if (!id || isNaN(parsedId) || parsedId <= 0) {
      showToast("Invalid ledger number. Redirecting…", "error");
      navigate(canView ? "/ledger/home" : "/users/my-profile");
      return;
    }

    // 2. Fetch data using the store action (expects ledger_number)
    fetchSingleLedger(parsedId);
  }, [id, navigate, showToast, fetchSingleLedger, canView]);

  // 3. Handle fetch error by redirecting (toast is already shown by the store)
  useEffect(() => {
    if (fetchError) {
      navigate(canView ? "/ledger/home" : "/users/my-profile");
    }
  }, [fetchError, navigate, canView]);

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

        <div className={`db-root theme-${theme}`}>
          <div className="db-page">
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
      </div>
    </div>
  );
};

export default EditLedger;