import React, { useState, useEffect } from "react";
import NavBar from "../../NavBar";
import Header from "../../Header";
import { NavLink } from "react-router-dom";
import 'aos/dist/aos.css';
import AOS from 'aos';
import useThemeStore from "../../../stores/useThemeStore";
import Icon from "../../../assets/images/ico.png";
import AdvanceIcon from "../../../assets/images/advance-icon.png";
import SuppliersIcon from "../../../assets/images/suppliers-icon.png";
import ExpenseIcon from "../../../assets/images/expense-icon.png";
import FundIcon from "../../../assets/images/fund-request-icon.png";
import PaymentReportChart from "../report/PaymentReportChart"
import SupplierPaymentScheduleReport from "../report/SupplierPaymentScheduleReport"
import ExpensePaymentScheduleReport from "../report/ExpensePaymentScheduleReport"


const GapsSchedule = () => {
  const [nav, setNav] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useThemeStore();

  useEffect(() => {
    AOS.init({
      duration: 1000,
      offset: 100,
      easing: 'ease-in-out',
      once: true,
    });

    document.title = "Acctlab | Gaps Schedule";

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className={`loader-container theme-${theme}`}>
        <div className="loader-content">
          {/* <div className="loader-spinner"></div> */}
          <img src={Icon} alt="Loading" className="loader-icon" />
          <p className="loader-text">Loading...</p>
        </div>
      </div>
    );
  }

  return(
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav}/>
      <NavBar setNav={setNav} nav={nav}/>
      
      <div className={`content-container theme-${theme}`}>
        
        <div className="content-container-h-flexbox" data-aos='fade-down'>
          <div className="cch-flexbox">
            <p className="content-header">Gaps Schedule</p>
          </div>
          <div className="cch-title-box">
            <NavLink to='/' className="ccht-titlelink">Home</NavLink>
            <span className="ccht-arrow fas fa-chevron-right"></span>
            <p className="ccht-titletext">Gaps</p>
          </div>
        </div>


        <div className="four-col-flexbox" data-aos='fade-down'>
            <div className="four-col-box">
                <div className={`four-col-text theme-${theme}`}>Advance</div>
                <div className={`four-col-subtext theme-${theme}`}>Track Pending Staff Advances</div>
                <NavLink to='advance' className={`four-col-btn theme-${theme}`}>
                    <span className="fas fa-compass four-col-explore"></span> Explore
                </NavLink>
                <img src={AdvanceIcon} alt="Advance" className="four-col-image" />
            </div>
            
            <div className="four-col-box">
                <div className={`four-col-text theme-${theme}`}>Suppliers</div>
                <div className={`four-col-subtext theme-${theme}`}>Monitor Supplier Payment Gaps</div>
                <NavLink to='suppliers' className={`four-col-btn theme-${theme}`}>
                    <span className="fas fa-compass four-col-explore"></span> Explore
                </NavLink>
                <img src={ExpenseIcon} alt="Advance" className="four-col-image" />
            </div>

            <div className="four-col-box">
                <div className={`four-col-text theme-${theme}`}>Expenses</div>
                <div className={`four-col-subtext theme-${theme}`}>Analyze Outstanding Expense Claims</div>
                <NavLink to='expense' className={`four-col-btn theme-${theme}`}>
                    <span className="fas fa-compass four-col-explore"></span> Explore
                </NavLink>
                <img src={SuppliersIcon} alt="Advance" className="four-col-image" />
            </div>

            <div className="four-col-box">
                <div className={`four-col-text theme-${theme}`}>Fund Request</div>
                <div className={`four-col-subtext theme-${theme}`}>Request Funds for Needs</div>
                <NavLink to='/payments/fund-request' className={`four-col-btn theme-${theme}`}>
                    <span className="fas fa-compass four-col-explore"></span> Explore
                </NavLink>
                <img src={FundIcon} alt="Advance" className="four-col-image" />
            </div>

        </div>


        <div className="reports-wrapper">
          <PaymentReportChart />
          <SupplierPaymentScheduleReport />
          <ExpensePaymentScheduleReport />
        </div>

      </div>


    </div>
  );
};

export default GapsSchedule;