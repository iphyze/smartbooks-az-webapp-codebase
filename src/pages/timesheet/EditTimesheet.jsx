import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar from "../NavBar";
import Header from "../Header";
import useThemeStore from "../../stores/useThemeStore";
import PageNav from "../../components/PageNav";
import EditTimesheetForm from "./EditTimesheetForm";
import useToastStore from "../../stores/useToastStore";
import useTimesheetStore from "../../stores/useTimesheetStore";
import EditLoaderComponent from "../../components/EditLoaderComponent";

const EditTimesheet = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const { fetchSingleTimesheet } = useTimesheetStore();
  const [nav, setNav] = useState(false);

  const [pageState, setPageState] = useState("checking");
  const [timesheetData, setTimesheetData] = useState(null);

  const links = [
    { label: "Home", to: "/", active: true },
    { label: "Timesheets", to: "/timesheet/home", active: true },
    { label: "Edit Entry", to: "/", active: false },
  ];

  useEffect(() => {
    document.title = "Smartbooks | Edit Timesheet";
    validateAndFetch();
  }, [id]);

  const validateAndFetch = async () => {
    const parsedId = parseInt(id, 10);
    if (!id || isNaN(parsedId) || parsedId <= 0) {
      showToast("Invalid timesheet ID. Redirecting…", "error");
      navigate("/timesheet/home");
      return;
    }

    const data = await fetchSingleTimesheet(parsedId);
    if (data) {
      setTimesheetData(data);
      setPageState("valid");
    } else {
      setPageState("invalid");
      navigate("/timesheet/home");
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