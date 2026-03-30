import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar from "../NavBar";
import Header from "../Header";
import useThemeStore from "../../stores/useThemeStore";
import PageNav from "../../components/PageNav";
import useToastStore from "../../stores/useToastStore";
import useAccountStore from "../../stores/useAccountStore";
import EditLoaderComponent from "../../components/EditLoaderComponent";
import ViewAccountContent from "./ViewAccountContent";

const ViewAccount = () => {
  const { accountId } = useParams();
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
    { label: "Details", to: "/", active: false },
  ];

  useEffect(() => {
    document.title = "Smartbooks | View Account";
    
    // 1. Basic format check
    const parsedId = parseInt(accountId, 10);
    if (!accountId || isNaN(parsedId) || parsedId <= 0) {
      showToast("Invalid account ID. Redirecting…", "error");
      navigate("/account/home");
      return;
    }

    // 2. Fetch data using the store action
    fetchSingleAccount(parsedId);
  }, [accountId]);

  // 3. Handle fetch error by redirecting (toast is already shown by the store)
  useEffect(() => {
    if (fetchError) {
      navigate("/account/home");
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
        <PageNav pageTitle="Accounts" links={links} />

        {isLoading ? (
          <EditLoaderComponent text={'Loading Account...'} />
        ) : accountData ? (
          // Pass the fetched data directly to the child
          <ViewAccountContent account={accountData} />
        ) : null}
      </div>
    </div>
  );
};

export default ViewAccount;