import React, { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import 'react-datepicker/dist/react-datepicker.css';
import NavBar from '../../NavBar';
import Header from '../../Header';
import PageNav from '../../../components/PageNav';
import useThemeStore from '../../../stores/useThemeStore';
import BankReconCreateForm from './BankReconCreateForm';
import BankReconHistoryGrid from './BankReconHistoryGrid';
import BankReconResultsPanel from './BankReconResultsPanel';
import './BankReconciliation.css';

const BankReconciliation = () => {
  const [nav, setNav] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const { theme } = useThemeStore();

  useEffect(() => { document.title = 'Smartbooks | Bank Reconciliation'; }, []);

  const links = [
    { label: 'Home', to: '/', active: true },
    { label: 'Reports', to: '/reports/ledger', active: true },
    { label: 'Bank Reconciliation', to: '/reports/bank-reconciliation', active: false },
  ];

  const handleCreated = (id) => {
    setActiveId(id);
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 300);
  };

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />
      <div className={`content-container theme-${theme}`}>
        <div className={`br-root theme-${theme}`}>
          <div className="br-page">
            <PageNav pageTitle="Bank Reconciliation" links={links} />
            <BankReconCreateForm onCreated={handleCreated} />
            <BankReconHistoryGrid onOpen={setActiveId} />
            <AnimatePresence mode="wait">
              {activeId && <BankReconResultsPanel key={activeId} id={activeId} />}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankReconciliation;
