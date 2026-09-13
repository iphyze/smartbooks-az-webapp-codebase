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
import useAuthStore from "../../stores/useAuthStore";
import { defaultRouteForRole, hasPermission } from "../../utils/permissions";

const EditRate = () => {
  const { id } = useParams(); // Updated parameter
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const [nav, setNav] = useState(false);
  const user = useAuthStore((state) => state.user);
  const canViewDashboard = hasPermission(user, "dashboard.view");
  const canViewRates = hasPermission(user, "exchange_rate.view");
  const fallbackRoute = canViewRates ? "/rate/home" : defaultRouteForRole(user);

  // Consume states from useRateStore instead of local state
  const {
    singleRate: rateData,
    fetchingSingle: isLoading,
    singleRateError: fetchError,
    fetchSingleRate
  } = useRateStore();

  const links = [
    ...(canViewDashboard ? [{ label: "Home", to: "/", active: true }] : []),
    ...(canViewRates ? [{ label: "Rates", to: "/rate/home", active: true }] : []),
    { label: "Edit Rate", to: `/rate/edit/${id}`, active: false },
  ];

  useEffect(() => {
    document.title = "Smartbooks | Edit Rate";

    // 1. Basic format check
    const parsedId = parseInt(id, 10);
    if (!id || isNaN(parsedId) || parsedId <= 0) {
      showToast("Invalid rate ID. Redirecting…", "error");
      navigate(fallbackRoute);
      return;
    }

    // 2. Fetch data using the store action
    fetchSingleRate(parsedId);
  }, [id, fetchSingleRate, navigate, showToast, fallbackRoute]);

  // 3. Handle fetch error by redirecting (toast is already shown by the store)
  useEffect(() => {
    if (fetchError) {
      navigate(fallbackRoute);
    }
  }, [fetchError, navigate, fallbackRoute]);

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
      </div>
    </div>
  );
};

export default EditRate;