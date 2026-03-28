import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import NavBar from "../NavBar";
import Header from "../Header";
import useThemeStore from "../../stores/useThemeStore";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import PageNav from "../../components/PageNav";
import useToastStore from "../../stores/useToastStore";
import api from "../../services/api";
import useAuthStore from "../../stores/useAuthStore";
import EditLoaderComponent from "../../components/EditLoaderComponent";
import ViewInvoiceContent from "./ViewInvoiceContent";

const ViewInvoice = () => {
  const { invoice_number } = useParams();
  const navigate = useNavigate();
  // const location = useLocation(); // Not strictly needed if we always fallback to home
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const [nav, setNav] = useState(false);

  // State for page status and data
  const [pageState, setPageState] = useState("checking");
  const [invoiceData, setinvoiceData] = useState(null);

  const links = [
    { label: "Home", to: "/", active: true },
    { label: "Invoice", to: "/invoice/home", active: true },
    { label: "Details", to: "/", active: false },
  ];

  useEffect(() => {
    document.title = "Smartbooks | View Invoice";
    validateAndFetchInvoice();
  }, [invoice_number]);

  const validateAndFetchInvoice = async () => {
    // 1. Basic format check
    const parsedId = parseInt(invoice_number, 10);
    if (!invoice_number || isNaN(parsedId) || parsedId <= 0) {
      showToast("Invalid invoice ID format. Redirecting…", "error");
      navigate("/invoice/home");
      return;
    }

    // 2. Fetch data (Validates existence + Gets data in one go)
    const token = useAuthStore.getState().token;
    try {
      const response = await api.get(
        `/invoice/fetch-single-invoice?invoice_number=${parsedId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Check if data actually exists in response
      if (response.data && response.data.data) {
        setinvoiceData(response.data.data);
        setPageState("valid");
      } else {
        throw new Error("No data returned");
      }

    } catch (err) {
      const msg =
        err.response?.data?.message ||
        `invoice #${parsedId} does not exist or could not be loaded.`;
      showToast(msg, "error");
      setPageState("invalid");
      navigate("/invoice/home");
    }
  };

  // If invalid, we already initiated navigation. Render nothing or a minimal placeholder.
  if (pageState === "invalid") {
    return null;
  }

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <PageNav pageTitle="Invoice" links={links} />

        {pageState === "checking" ? (
          <EditLoaderComponent text={'Loading Invoice...'} />
        ) : (
          // Pass the fetched data directly to the child
          <ViewInvoiceContent invoice={invoiceData} />
        )}
      </div>
    </div>
  );
};

export default ViewInvoice;