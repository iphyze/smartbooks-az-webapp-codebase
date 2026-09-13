import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar from "../NavBar";
import Header from "../Header";
import useThemeStore from "../../stores/useThemeStore";
import PageNav from "../../components/PageNav";
import EditInvoiceForm from "./EditInvoiceForm";
import useToastStore from "../../stores/useToastStore";
import api from "../../services/api";
import useAuthStore from "../../stores/useAuthStore";
import { defaultRouteForRole, hasPermission } from "../../utils/permissions";
import EditLoaderComponent from "../../components/EditLoaderComponent";

const EditInvoice = () => {
  const { invoice_number } = useParams();
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const user = useAuthStore((state) => state.user);
  const canViewInvoices = hasPermission(user, "invoice.view");
  const homeRoute = defaultRouteForRole(user);
  const invoiceFallbackRoute = canViewInvoices ? "/invoice/home" : homeRoute;
  const { showToast } = useToastStore();
  const [nav, setNav] = useState(false);

  // State for page status and data
  const [pageState, setPageState] = useState("checking");
  const [invoiceData, setInvoiceData] = useState(null);

  const links = [
    { label: "Home", to: homeRoute, active: true },
    ...(canViewInvoices ? [{ label: "Invoice", to: "/invoice/home", active: true }] : []),
    { label: "Edit Invoice", to: homeRoute, active: false },
  ];

  useEffect(() => {
    document.title = "Smartbooks | Edit Invoice";
    validateAndFetchInvoice();
  }, [invoice_number]);

  const validateAndFetchInvoice = async () => {
    // 1. Basic format check
    const parsedId = parseInt(invoice_number, 10);
    if (!invoice_number || isNaN(parsedId) || parsedId <= 0) {
      showToast("Invalid invoice ID. Redirecting…", "error");
      navigate(invoiceFallbackRoute);
      return;
    }

    // 2. Fetch data (Validates existence + Gets data in one go)
    const token = useAuthStore.getState().token;
    try {
      const response = await api.get(
        `/invoice/fetch-single-invoice?invoice_number=${parsedId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data && response.data.data) {
        setInvoiceData(response.data.data);
        setPageState("valid");
      } else {
        throw new Error("No data returned");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        `Invoice #${parsedId} does not exist.`;
      showToast(msg, "error");
      setPageState("invalid");
      navigate(invoiceFallbackRoute);
    }
  };

  const handleSaveSuccess = () => {
    // Optional: Redirect or show success message
    // navigate("/journal/home");
  };

  if (pageState === "invalid") {
    return null;
  }

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <div className={`db-root theme-${theme}`}>
          <div className="db-page">
          <PageNav pageTitle="Invoice" links={links} />
        
          {pageState === "checking" ? (
            <EditLoaderComponent text={'Loading Invoice...'} />
          ) : (
            // Pass the fetched data directly to the child
            <EditInvoiceForm
              invoiceNumber={parseInt(invoice_number, 10)}
              invoice={invoiceData}
              onSaveSuccess={handleSaveSuccess}
            />
          )}
          
        </div>
        </div>
      </div>
    </div>
  );
};

export default EditInvoice;