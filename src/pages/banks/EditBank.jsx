import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar from "../NavBar";
import Header from "../Header";
import useThemeStore from "../../stores/useThemeStore";
import PageNav from "../../components/PageNav";
import EditBankForm from "./EditBankForm";
import useToastStore from "../../stores/useToastStore";
import useAuthStore from "../../stores/useAuthStore";
import api from "../../services/api";
import EditLoaderComponent from "../../components/EditLoaderComponent";

const EditBank = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const [nav, setNav] = useState(false);

  // Local state for fetching single bank
  const [bankData, setBankData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const links = [
    { label: "Home", to: "/", active: true },
    { label: "Banks", to: "/banks/home", active: true },
    { label: "Edit Bank", to: `/banks/edit/${id}`, active: false },
  ];

  useEffect(() => {
    document.title = "Smartbooks | Edit Bank";
    
    // 1. Basic format check
    const parsedId = parseInt(id, 10);
    if (!id || isNaN(parsedId) || parsedId <= 0) {
      showToast("Invalid bank ID. Redirecting…", "error");
      navigate("/banks/home");
      return;
    }

    // 2. Fetch data directly via api
    const fetchSingleBank = async () => {
      setIsLoading(true);
      try {
        const token = useAuthStore.getState().token;
        const response = await api.get(`/bank/fetch-single-bank?bankId=${parsedId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Correctly extract the bank object from the nested response
        setBankData(response.data.data.bank); 
      } catch (error) {
        const message = error.response?.data?.message || "Failed to fetch bank details";
        showToast(message, "error");
        setFetchError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSingleBank();
  }, [id, navigate, showToast]);

  // 3. Handle fetch error by redirecting
  useEffect(() => {
    if (fetchError) {
      navigate("/banks/home");
    }
  }, [fetchError, navigate]);

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
        <PageNav pageTitle="Edit Bank" links={links} />

        {isLoading ? (
          <EditLoaderComponent text={'Loading bank details...'} />
        ) : bankData ? (
          <EditBankForm
            bankId={bankData.id}
            bank={bankData}
            onSaveSuccess={handleSaveSuccess}
          />
        ) : null}
      </div>
    </div>
  );
};

export default EditBank;