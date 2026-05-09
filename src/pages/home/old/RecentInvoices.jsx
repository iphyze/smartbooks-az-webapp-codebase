import React from "react";
import { Link } from "react-router-dom";
import useThemeStore from "../../stores/useThemeStore";


const dummyTx = [
    {id: 1, invoiceNo: 'INV-0001', amount: 5000, status: "Paid"},
    {id: 2, invoiceNo: 'INV-0002', amount: 10000, status: "Pending"},
    // {id: 3, invoiceNo: 'INV-0003', amount: 210000, status: "Pending"},
    {id: 3, invoiceNo: 'INV-0004', amount: 12500, status: "Paid"},
    {id: 4, invoiceNo: 'INV-0005', amount: 1150000, status: "Pending"},
];

const RecentInvoices = () => {
  const { theme } = useThemeStore();
  const transactions = dummyTx;

  const formatCurrency = (val) => `₦${val.toLocaleString()}`;

  return (
    <div className={`recent-transactions-box theme-${theme}`}>
      <p className="recent-transactions-header">Recent Invoices</p>

      {!transactions?.length ? (
        <div className="empty-recent-transaction-box">
          <span className="fas fa-folder-open empty-tx-icon" />
          <p className="empty-tx-text">
            You have no invoices generated yet, click the button below to create one immediately
          </p>
          <Link to="/create-invoice" className="create-invoice-btn">
            <span className="fas fa-circle-plus" /> Create Invoice
          </Link>
        </div>
      ) : (
          transactions.map((tx, index) => (
            <div key={index} className={`recent-invoice-card ${tx.status === "Paid" ? 'rici-paid-box' : 'rici-pending-box'}`}>
                <div className={`ric-icon-box ${tx.status === "Paid" ? 'rici-paid' : 'rici-pending'}`}>
                    <span className={`ric-icon ${tx.status === "Paid" ? 'fas fa-check' : 'fas fa-exclamation'}`} />
                </div>
                <div className={'ric-details-box'}>
                    <p className="ric-invoice-no">{tx.invoiceNo}</p>
                    <p className={`ric-invoice-amount ${tx.status === "Paid" ? 'ric-paid' : 'ric-pending'}`}>{formatCurrency(tx.amount)}</p>
                </div>
                <p className={`ric-status ${tx.status === "Paid" ? 'ric-paid' : 'ric-pending'} `}>{tx.status}</p>
            </div>
          ))
      )}

      {transactions.length > 0 && (
        <div className="recent-tx-btnbox">
            <Link to="/invoice/home" className="recent-tx-btn recent-tx-btn-full mg-top-10">
                View All
            </Link>

            {/* <Link to="/create-invoice" className="recent-tx-btn recent-tx-create-btn">
                Create New
            </Link> */}
        </div>
      )}

    </div>
  );
};

export default RecentInvoices;
