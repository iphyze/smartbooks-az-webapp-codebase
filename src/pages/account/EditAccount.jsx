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
import useAuthStore from "../../stores/useAuthStore";
import { hasPermission } from "../../utils/permissions";

const EditAccount = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const [nav, setNav] = useState(false);
  const user = useAuthStore((state) => state.user);
  const canView = hasPermission(user, "account.view");

  // Consume states from useAccountStore
  const {
    singleAccount: accountData,
    fetchingSingle: isLoading,
    singleAccountError: fetchError,
    fetchSingleAccount
  } = useAccountStore();

  const links = [
    { label: "Home", to: "/", active: true },
    ...(canView ? [{ label: "Accounts", to: "/account/home", active: true }] : []),
    { label: "Edit Account", to: "/account/edit", active: false },
  ];

  useEffect(() => {
    document.title = "Smartbooks | Edit Account";

    // 1. Basic format check
    const parsedId = parseInt(id, 10);
    if (!id || isNaN(parsedId) || parsedId <= 0) {
      showToast("Invalid account ID. Redirecting…", "error");
      navigate(canView ? "/account/home" : "/users/my-profile");
      return;
    }

    // 2. Fetch data using the store action
    fetchSingleAccount(parsedId);
  }, [id, navigate, showToast, fetchSingleAccount, canView]);

  // 3. Handle fetch error by redirecting (toast is already shown by the store)
  useEffect(() => {
    if (fetchError) {
      navigate(canView ? "/account/home" : "/users/my-profile");
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
      </div>
    </div>
  );
};

export default EditAccount;