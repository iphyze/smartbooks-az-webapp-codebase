import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import useThemeStore from "../../stores/useThemeStore";
import InvoiceCharts from "./InvoiceCharts";
import RecentTransactions from "./RecentTransactions";
import RecentInvoices from "./RecentInvoices";
import DashboardNavigatorBox from "./DashboardNavigatorBox";

const DashboardCharts = () => {
  const { theme } = useThemeStore();


  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="show"
      transition={{ duration: 0.3, delay: 0.2, ease: "easeInOut" }}
      className={`dashboard-home-charts theme-${theme}`}
    >
    
    <div className={`dhcharts-col-chart theme-${theme}`}>
        <InvoiceCharts />
        <DashboardNavigatorBox />
    </div>

    <div className={`dhcharts-col-customers theme-${theme}`}>
        <RecentTransactions />
        <RecentInvoices />
    </div>

    </motion.div>
  );
};

export default DashboardCharts;
