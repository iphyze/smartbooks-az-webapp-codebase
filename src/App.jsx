import { Routes, Route } from "react-router-dom";
import './App.css';
import './Responsive.css';
import './assets/fontawesome/css/all.css';
// import './Fonts.css';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import Toast from './services/Toast';
import Login from "./pages/auth/Login";
import PublicRoute from "./services/PublicRoute";
import Dashboard from "./pages/home/Dashboard";
import Reports from "./pages/reports/Reports";
import CreateInvoice from "./pages/invoice/CreateInvoice";
import CreateJournal from "./pages/journal/CreateJournal";
import JournalOverview from "./pages/journal/JournalOverview";
import useThemeStore from "./stores/useThemeStore";
import EditJournal from "./pages/journal/EditJournal";
import ViewJournal from "./pages/journal/ViewJournal";
import InvoiceOverview from "./pages/invoice/InvoiceOverview";
import EditInvoice from "./pages/invoice/EditInvoice";
import ViewInvoice from "./pages/invoice/ViewInvoice";
import RateOverview from "./pages/rates/rateOverview";
import CreateRate from "./pages/rates/CreateRate";
import EditRate from "./pages/rates/EditRate";
import ClientOverview from "./pages/clients/ClientOverview";
import CreateClient from "./pages/clients/CreateClient";
import EditClient from "./pages/clients/EditClient";
import ViewClient from "./pages/clients/ViewClient";
import ProjectOverview from "./pages/projects/ProjectOverview";
import CreateProject from "./pages/projects/CreateProject";
import EditProject from "./pages/projects/EditProject";
import ViewProject from "./pages/projects/ViewProject";
import AccountOverview from "./pages/account/AccountOverview";
import CreateAccount from "./pages/account/CreateAccount";
import EditAccount from "./pages/account/EditAccount";
import ViewAccount from "./pages/account/ViewAccount";
import BankOverview from "./pages/banks/BankOverview";
import CreateBank from "./pages/banks/CreateBank";
import EditBank from "./pages/banks/EditBank";
import ViewBank from "./pages/banks/ViewBank";
import LedgerOverview from "./pages/ledger/LegderOverview";
import CreateLedger from "./pages/ledger/CreateLedger";
import EditLedger from "./pages/ledger/EditLedger";
import ViewLedger from "./pages/ledger/ViewLedger";
import StaffOverview from "./pages/staff/StaffOverview";
import CreateStaff from "./pages/staff/CreateStaff";
import EditStaff from "./pages/staff/EditStaff";
import ViewStaff from "./pages/staff/ViewStaff";
import TimesheetOverview from "./pages/timesheet/TimesheetOverview";
import CreateTimesheet from "./pages/timesheet/CreateTimesheet";
import EditTimesheet from "./pages/timesheet/EditTimesheet";
import ViewTimesheet from "./pages/timesheet/ViewTimesheet";
import LedgerReports from "./pages/reports/LedgerReports";
import LedgerStatement from "./pages/reports/LedgerStatment";
import GeneralLedger from "./pages/reports/GeneralLedger";
import TrialBalance from "./pages/reports/TrialBalance";
import ProfitLoss from "./pages/reports/ProfitLoss";
import BalanceSheet from "./pages/reports/BalanceSheet";
import FXRevaluation from "./pages/reports/FXRevaluation";

const App = () => {
  
  useThemeStore.getState().init();

    return (
      <>
        <Toast />
        <Routes>

          
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}/>
          
          {/* Journal */}
          <Route path="/journal/create" element={<ProtectedRoute><CreateJournal /></ProtectedRoute>} />
          <Route path="/journal/home" element={<ProtectedRoute><JournalOverview /> </ProtectedRoute>} />
          <Route path="/journal/edit/:journal_id" element={<ProtectedRoute><EditJournal /> </ProtectedRoute>} />
          <Route path="/journal/view/:journal_id" element={<ProtectedRoute><ViewJournal /> </ProtectedRoute>} />
          
          {/* Invoice */}
          <Route path="/invoice/home" element={<ProtectedRoute><InvoiceOverview /> </ProtectedRoute>} />
          <Route path="/invoice/create" element={<ProtectedRoute><CreateInvoice /> </ProtectedRoute>} />
          <Route path="/invoice/edit/:invoice_number" element={<ProtectedRoute><EditInvoice /> </ProtectedRoute>} />
          <Route path="/invoice/view/:invoice_number" element={<ProtectedRoute><ViewInvoice /> </ProtectedRoute>} />

          {/* Rates */}
          <Route path="/rate/home" element={<ProtectedRoute><RateOverview /> </ProtectedRoute>} />
          <Route path="/rate/create" element={<ProtectedRoute><CreateRate /> </ProtectedRoute>} />
          <Route path="/rate/edit/:id" element={<ProtectedRoute><EditRate /> </ProtectedRoute>} />

          {/* Client */}
          <Route path="/client/home" element={<ProtectedRoute><ClientOverview /> </ProtectedRoute>} />
          <Route path="/client/create" element={<ProtectedRoute><CreateClient /> </ProtectedRoute>} />
          <Route path="/client/edit/:id" element={<ProtectedRoute><EditClient /> </ProtectedRoute>} />
          <Route path="/client/view/:clientId" element={<ProtectedRoute><ViewClient /> </ProtectedRoute>} />


          {/* Project */}
          <Route path="/project/home" element={<ProtectedRoute><ProjectOverview /> </ProtectedRoute>} />
          <Route path="/project/create" element={<ProtectedRoute><CreateProject /> </ProtectedRoute>} />
          <Route path="/project/edit/:id" element={<ProtectedRoute><EditProject /> </ProtectedRoute>} />
          <Route path="/project/view/:projectId" element={<ProtectedRoute><ViewProject /> </ProtectedRoute>} />


          {/* Bank */}
          <Route path="/banks/home" element={<ProtectedRoute><BankOverview /> </ProtectedRoute>} />
          <Route path="/banks/create" element={<ProtectedRoute><CreateBank /> </ProtectedRoute>} />
          <Route path="/banks/edit/:id" element={<ProtectedRoute><EditBank /> </ProtectedRoute>} />
          <Route path="/banks/view/:id" element={<ProtectedRoute><ViewBank /> </ProtectedRoute>} />


          {/* Account */}
          <Route path="/account/home" element={<ProtectedRoute><AccountOverview /> </ProtectedRoute>} />
          <Route path="/account/create" element={<ProtectedRoute><CreateAccount /> </ProtectedRoute>} />
          <Route path="/account/edit/:id" element={<ProtectedRoute><EditAccount /> </ProtectedRoute>} />
          <Route path="/account/view/:accountId" element={<ProtectedRoute><ViewAccount /> </ProtectedRoute>} />


          {/* Ledger */}
          <Route path="/ledger/home" element={<ProtectedRoute><LedgerOverview /> </ProtectedRoute>} />
          <Route path="/ledger/create" element={<ProtectedRoute><CreateLedger /> </ProtectedRoute>} />
          <Route path="/ledger/edit/:id" element={<ProtectedRoute><EditLedger /> </ProtectedRoute>} />
          <Route path="/ledger/view/:id" element={<ProtectedRoute><ViewLedger /> </ProtectedRoute>} />


          {/* Staff */}
          <Route path="/staff/home"         element={<ProtectedRoute><StaffOverview /></ProtectedRoute>} />
          <Route path="/staff/create-staff" element={<ProtectedRoute><CreateStaff /></ProtectedRoute>} />
          <Route path="/staff/edit/:id"     element={<ProtectedRoute><EditStaff /></ProtectedRoute>} />
          <Route path="/staff/view/:id"     element={<ProtectedRoute><ViewStaff /></ProtectedRoute>} />

          {/* Timesheet */}
          <Route path="/timesheet/home"             element={<ProtectedRoute><TimesheetOverview /></ProtectedRoute>} />
          <Route path="/timesheet/create-timesheet" element={<ProtectedRoute><CreateTimesheet /></ProtectedRoute>} />
          <Route path="/timesheet/edit/:id"         element={<ProtectedRoute><EditTimesheet /></ProtectedRoute>} />
          <Route path="/timesheet/view/:id"         element={<ProtectedRoute><ViewTimesheet /></ProtectedRoute>} />


          {/* Reports */}
          <Route path="/reports/ledger" element={<ProtectedRoute><LedgerReports /></ProtectedRoute>} />
          <Route path="/reports/ledger/ledger-statement" element={<ProtectedRoute><LedgerStatement /></ProtectedRoute>} />
          <Route path="/reports/ledger/general-ledger" element={<ProtectedRoute><GeneralLedger /></ProtectedRoute>} />
          <Route path="/reports/ledger/trial-balance" element={<ProtectedRoute><TrialBalance /></ProtectedRoute>} />
          <Route path="/reports/ledger/profit-and-loss" element={<ProtectedRoute><ProfitLoss /></ProtectedRoute>} />
          <Route path="/reports/ledger/balance-sheet" element={<ProtectedRoute><BalanceSheet /></ProtectedRoute>} />
          <Route path="/reports/fx-revaluation" element={<ProtectedRoute><FXRevaluation /></ProtectedRoute>} />
          

          <Route path="*" element={<NotFound />} />
        </Routes>
      </>
    );
};

export default App;