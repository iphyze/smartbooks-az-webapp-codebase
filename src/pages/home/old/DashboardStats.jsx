import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import useThemeStore from "../../stores/useThemeStore";

const DashboardStats = () => {
  const { theme } = useThemeStore();
  const data = [
  {id: 1, icon: "fas fa-file-invoice", title: "Total Invoices", number: 162},
  {id: 2, icon: "fas fa-file-invoice-dollar", title: "Paid Invoices", number: 100},
  {id: 3, icon: "fas fa-file-invoice", title: "Unpaid", number: 62},
  {id: 4, icon: "fas fa-calculator", title: "VAT Remitted", number: '₦650,000.00'}
];


  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="show"
      transition={{ duration: 0.3, delay: 0.2, ease: "easeInOut" }}
      className={`dashboard-home-stats theme-${theme}`}
    >
    
          {data.map(({id, icon, title, number}) => {

            return(
                <div className={`dhs-card theme-${theme}`} key={id}>
                        <div className="dhs-iconbox">
                            <span className={`${icon} dhs-icon`}/>
                        </div>
                        <div className="dhs-figurebox">
                            <div className="dhs-title">{title}</div>
                            <div className="dhs-figure">{number}</div>
                        </div>
                </div>
            )

          })}

    </motion.div>
  );
};

export default DashboardStats;
