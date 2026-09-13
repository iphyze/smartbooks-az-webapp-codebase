import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar from "../NavBar";
import Header from "../Header";
import useThemeStore from "../../stores/useThemeStore";
import PageNav from "../../components/PageNav";
import EditTimesheetForm from "./EditTimesheetForm";
import useToastStore from "../../stores/useToastStore";
import useTimesheetStore from "../../stores/useTimesheetStore";
import useAuthStore from "../../stores/useAuthStore";
import { defaultRouteForRole, hasPermission } from "../../utils/permissions";
import EditLoaderComponent from "../../components/EditLoaderComponent";

const EditTimesheet = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const { fetchSingleTimesheet } = useTimesheetStore();
  const user = useAuthStore((state) => state.user);
  const canViewTimesheets = hasPermission(user, "timesheet.view");
  const fallbackRoute = canViewTimesheets ? "/timesheet/home" : defaultRouteForRole(user);
  const [nav, setNav] = useState(false);

  const [pageState, setPageState] = useState("checking");
  const [timesheetData, setTimesheetData] = useState(null);

  const links = [
    { label: "Home", to: defaultRouteForRole(user), active: true },
    ...(canViewTimesheets ? [{ label: "Timesheets", to: "/timesheet/home", active: true }] : []),
    { label: "Edit Entry", to: `/timesheet/edit/${id}`, active: false },
  ];

  useEffect(() => {
    document.title = "Smartbooks | Edit Timesheet";
    validateAndFetch();
  }, [id]);

  const validateAndFetch = async () => {
    const parsedId = parseInt(id, 10);
    if (!id || isNaN(parsedId) || parsedId <= 0) {
      showToast("Invalid timesheet ID. Redirecting…", "error");
      navigate(fallbackRoute);
      return;
    }

    const data = await fetchSingleTimesheet(parsedId);
    if (data) {
      setTimesheetData(data);
      setPageState("valid");
    } else {
      setPageState("invalid");
      navigate(fallbackRoute);
    }
  };

  if (pageState === "invalid") return null;

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />
      <div className={`content-container theme-${theme}`}>
        <div className={`db-root theme-${theme}`}>
          <div className="db-page">
            <PageNav pageTitle="Timesheets" links={links} />
            {pageState === "checking" ? (
              <EditLoaderComponent text="Loading Timesheet Entry..." />
            ) : (
              <EditTimesheetForm
                timesheetId={parseInt(id, 10)}
                timesheet={timesheetData}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTimesheet;