import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar from "../NavBar";
import Header from "../Header";
import useThemeStore from "../../stores/useThemeStore";
import PageNav from "../../components/PageNav";
import EditAccountForm from "./EditAccountForm";
import useToastStore from "../../stores/useToastStore";
import useAccountStore from "../../stores/useAccountStore";
import EditLoaderComponent from "../../components/EditLoaderComponent";

const EditAccount = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const [nav, setNav] = useState(false);

  // Consume states from useAccountStore
  const { 
    singleAccount: accountData, 
    fetchingSingle: isLoading, 
    singleAccountError: fetchError, 
    fetchSingleAccount 
  } = useAccountStore();

  const links = [
    { label: "Home", to: "/", active: true },
    { label: "Accounts", to: "/account/home", active: true },
    { label: "Edit Account", to: "/account/edit", active: false },
  ];

  useEffect(() => {
    document.title = "Smartbooks | Edit Account";
    
    // 1. Basic format check
    const parsedId = parseInt(id, 10);
    if (!id || isNaN(parsedId) || parsedId <= 0) {
      showToast("Invalid account ID. Redirecting…", "error");
      navigate("/account/home");
      return;
    }

    // 2. Fetch data using the store action
    fetchSingleAccount(parsedId);
  }, [id]);

  // 3. Handle fetch error by redirecting (toast is already shown by the store)
  useEffect(() => {
    if (fetchError) {
      navigate("/account/home");
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
        <PageNav pageTitle="Accounts" links={links} />

        {isLoading ? (
          <EditLoaderComponent text={'Loading Account...'} />
        ) : accountData ? (
          // Pass the fetched data directly to the child
          <EditAccountForm
            accountId={accountData.id}
            account={accountData}
            onSaveSuccess={handleSaveSuccess}
          />
        ) : null}
      </div>
    </div>
  );
};

export default EditAccount;