import React, { useState, useEffect } from "react";
import NavBar from "../NavBar";
import Header from "../Header";
import useThemeStore from "../../stores/useThemeStore";
import { motion } from "framer-motion";
import { fadeIn, fadeInUp, fadeInDown } from "../../utils/animation";
import PageNav from "../../components/PageNav";
import api from "../../services/api";

const Reports = () => {
  const [nav, setNav] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false); // State for loading indicator
  const { theme } = useThemeStore();

  const links = [
    // { label: "Reports", to: "/Reports", active: true },
    { label: "Home", to: "/", active: false }
  ];

  useEffect(() => {
    document.title = "Smartbooks | Reports";
  }, []);

  /**
   * Handles the Excel file download.
   * Fetches the file as a Blob and creates a temporary download link.
   */
  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const response = await api.get(
        '/ledger/reports/bs-reports-excel?datefrom=2024-01-01&dateto=2024-12-31&zerobal=Yes&currency=NGN',
        { responseType: 'blob' }
      );

      const blob = response.data;
      
      // 4. Create a temporary URL and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_Aging_Report_NGN.xlsx`; // Set the file name
      document.body.appendChild(a); // Append to body
      a.click(); // Programmatically click the link
      
      // 5. Cleanup
      a.remove(); // Remove the element
      window.URL.revokeObjectURL(url); // Free up memory

    } catch (error) {
      console.error("Export Error:", error);
      alert(error.message); // Or use your toast store: useToastStore.getState().showToast(error.message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`main-container theme-${theme}`}>

      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <PageNav pageTitle='Reports' links={links} />

        {/* New Section for Testing Export */}
        <motion.div 
          className="Reports-card"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          style={{
            background: theme === 'dark' ? '#1f2937' : '#ffffff',
            padding: '2rem',
            borderRadius: '10px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            marginTop: '2rem'
          }}
        >
          <h3 style={{ marginBottom: '1rem', color: theme === 'dark' ? '#fff' : '#111' }}>
            Invoice Aging Report
          </h3>
          
          <p style={{ marginBottom: '1.5rem', color: theme === 'dark' ? '#9ca3af' : '#4b5563' }}>
            Download the aging analysis report for NGN currency.
          </p>

          <button 
            onClick={handleExport}
            disabled={isExporting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: isExporting ? '#9ca3af' : '#2563eb',
              color: '#fff',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: isExporting ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              transition: 'background-color 0.2s'
            }}
          >
            {isExporting ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Exporting...
              </>
            ) : (
              <>
                <i className="fas fa-file-excel"></i>
                Download Excel (NGN)
              </>
            )}
          </button>
        </motion.div>

      </div>

    </div>
  );
};

export default Reports;