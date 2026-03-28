import React from "react";
import { Link, NavLink } from "react-router-dom";
import useThemeStore from "../../stores/useThemeStore";
import BillOne from "../../assets/images/digitInvoice/bill-one.png";
import BillTwo from "../../assets/images/digitInvoice/bill-two.png";
const DashboardNavigatorBox = () => {
  const { theme } = useThemeStore();

  return (
    <div className={`dashboard-nav-box theme-${theme}`}>
        <div className="dash-nav-col dash-nav-col-1">
            <div className="recent-tx-card-overlay"/>
            <p className="customer-ht">Customers</p>
            <p className="customer-brief-text">
                Manage all your registered customers efficiently or 
                click the button below to add new customers
            </p>
            <p className="customer-count-text">Total Customers</p>
            <p className="customer-count">1,258</p>
            <NavLink className={'client-add-btn'}><span className="fas fa-user-plus"></span></NavLink>
        </div>
        <div className="dash-nav-col dash-nav-col-2">
            <div className="dash-nav-header">
                <img src={BillOne} alt="Bill One" className="dash-nav-icon" />
                <p className="dash-nav-title-text">Create New Invoice</p>
            </div>
            <p className="dash-nav-body-text">Generate a new FIRS-compliant invoice in minutes.</p>
            <div className="recent-tx-btnbox">
            <Link to="/invoice/create-invoice" className="recent-tx-btn recent-tx-create-btn recent-tx-btn-full">
                Create Invoice
            </Link>
            </div>
        </div>
        <div className="dash-nav-col dash-nav-col-2">
            <div className="dash-nav-header">
                <img src={BillTwo} alt="Bill Two" className="dash-nav-icon" />
                <p className="dash-nav-title-text">View All Invoices</p>
            </div>
            <p className="dash-nav-body-text">Access, filter and manage all your invoices in one place.</p>
            <div className="recent-tx-btnbox">
            <Link to="/invoice/home" className="recent-tx-btn recent-tx-btn-full">
                View Invoices
            </Link>
            </div>
        </div>
    </div>
  );
};

export default DashboardNavigatorBox;
