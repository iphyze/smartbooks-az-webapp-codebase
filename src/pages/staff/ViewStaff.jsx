import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar from "../NavBar";
import Header from "../Header";
import useThemeStore from "../../stores/useThemeStore";
import PageNav from "../../components/PageNav";
import useToastStore from "../../stores/useToastStore";
import useStaffStore from "../../stores/useStaffStore";
import EditLoaderComponent from "../../components/EditLoaderComponent";
import ViewStaffContent from "./ViewStaffContent";

const ViewStaff = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const [nav, setNav] = useState(false);

  // Consume states from useStaffStore (Same pattern as EditStaff)
  const {
    singleStaff: staffData,
    fetchingSingle: isLoading,
    singleStaffError: fetchError,
    fetchSingleStaff
  } = useStaffStore();

  const links = [
    { label: "Home", to: "/", active: true },
    { label: "Staff", to: "/staff/home", active: true },
    { label: "Details", to: "/", active: false },
  ];

  useEffect(() => {
    document.title = "Smartbooks | View Staff";

    // 1. Basic format check
    if (!id) {
      showToast("Invalid staff ID. Redirecting…", "error");
      navigate("/staff/home");
      return;
    }

    // 2. Fetch data using the store action
    fetchSingleStaff(id);
  }, [id]);

  // 3. Handle fetch error by redirecting
  useEffect(() => {
    if (fetchError) {
      navigate("/staff/home");
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
        <div className={`db-root theme-${theme}`}>
          <div className="db-page">
            <PageNav pageTitle="Staff" links={links} />

            {isLoading ? (
              <EditLoaderComponent text={'Loading Staff Record...'} />
            ) : staffData ? (
              <ViewStaffContent staff={staffData} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewStaff;