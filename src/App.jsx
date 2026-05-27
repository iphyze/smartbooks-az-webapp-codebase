import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import './App.css';
import './Responsive.css';
import './assets/fontawesome/css/all.css';
// import './Fonts.css';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import NonSensitiveAutocomplete from './components/NonSensitiveAutocomplete';
import { ADMIN_ONLY_ROLES, OPERATIONAL_ROLES, TIMESHEET_ROLES } from './utils/permissions';
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
import InvoiceAging from "./pages/reports/InvoiceAging";
import TimesheetReport from "./pages/reports/TimesheetReport";
import UsersOverview from "./pages/users/UsersOverview";
import CreateUser from "./pages/users/CreateUser";
import EditUser from "./pages/users/EditUser";
import ViewUser from "./pages/users/ViewUser";
import MyProfile from "./pages/users/MyProfile";
import BankReconOverview from "./pages/reports/recon/BankReconOverview";
import EditBankRecon from "./pages/reports/recon/EditBankRecon";
import CreateBankRecon from "./pages/reports/recon/CreateBankRecon";
import BankReconWorkspace from "./pages/reports/recon/BankReconWorkspace";
import LockPeriodOverview from "./pages/accounting-period/LockPeriodOverview";

const AllowedRoute = ({ roles, children }) => (
  <ProtectedRoute>
    <RoleRoute allowedRoles={roles}>{children}</RoleRoute>
  </ProtectedRoute>
);

const App = () => {
  const initTheme = useThemeStore((state) => state.init);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

    return (
      <>
        <NonSensitiveAutocomplete />
        <Toast />
        <Routes>

          
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/" element={<AllowedRoute roles={OPERATIONAL_ROLES}><Dashboard /></AllowedRoute>} />
          
          {/* Journal */}
          <Route path="/journal/create" element={<AllowedRoute roles={OPERATIONAL_ROLES}><CreateJournal /></AllowedRoute>} />
          <Route path="/journal/home" element={<AllowedRoute roles={OPERATIONAL_ROLES}><JournalOverview /> </AllowedRoute>} />
          <Route path="/journal/edit/:journal_id" element={<AllowedRoute roles={OPERATIONAL_ROLES}><EditJournal /> </AllowedRoute>} />
          <Route path="/journal/view/:journal_id" element={<AllowedRoute roles={OPERATIONAL_ROLES}><ViewJournal /> </AllowedRoute>} />
          
          {/* Invoice */}
          <Route path="/invoice/home" element={<AllowedRoute roles={OPERATIONAL_ROLES}><InvoiceOverview /> </AllowedRoute>} />
          <Route path="/invoice/create" element={<AllowedRoute roles={OPERATIONAL_ROLES}><CreateInvoice /> </AllowedRoute>} />
          <Route path="/invoice/edit/:invoice_number" element={<AllowedRoute roles={OPERATIONAL_ROLES}><EditInvoice /> </AllowedRoute>} />
          <Route path="/invoice/view/:invoice_number" element={<AllowedRoute roles={OPERATIONAL_ROLES}><ViewInvoice /> </AllowedRoute>} />

          {/* Rates */}
          <Route path="/rate/home" element={<AllowedRoute roles={OPERATIONAL_ROLES}><RateOverview /> </AllowedRoute>} />
          <Route path="/rate/create" element={<AllowedRoute roles={OPERATIONAL_ROLES}><CreateRate /> </AllowedRoute>} />
          <Route path="/rate/edit/:id" element={<AllowedRoute roles={OPERATIONAL_ROLES}><EditRate /> </AllowedRoute>} />

          {/* Client */}
          <Route path="/client/home" element={<AllowedRoute roles={OPERATIONAL_ROLES}><ClientOverview /> </AllowedRoute>} />
          <Route path="/client/create" element={<AllowedRoute roles={OPERATIONAL_ROLES}><CreateClient /> </AllowedRoute>} />
          <Route path="/client/edit/:id" element={<AllowedRoute roles={OPERATIONAL_ROLES}><EditClient /> </AllowedRoute>} />
          <Route path="/client/view/:clientId" element={<AllowedRoute roles={OPERATIONAL_ROLES}><ViewClient /> </AllowedRoute>} />


          {/* Project */}
          <Route path="/project/home" element={<AllowedRoute roles={OPERATIONAL_ROLES}><ProjectOverview /> </AllowedRoute>} />
          <Route path="/project/create" element={<AllowedRoute roles={OPERATIONAL_ROLES}><CreateProject /> </AllowedRoute>} />
          <Route path="/project/edit/:id" element={<AllowedRoute roles={OPERATIONAL_ROLES}><EditProject /> </AllowedRoute>} />
          <Route path="/project/view/:projectId" element={<AllowedRoute roles={OPERATIONAL_ROLES}><ViewProject /> </AllowedRoute>} />


          {/* Bank */}
          <Route path="/banks/home" element={<AllowedRoute roles={OPERATIONAL_ROLES}><BankOverview /> </AllowedRoute>} />
          <Route path="/banks/create" element={<AllowedRoute roles={OPERATIONAL_ROLES}><CreateBank /> </AllowedRoute>} />
          <Route path="/banks/edit/:id" element={<AllowedRoute roles={OPERATIONAL_ROLES}><EditBank /> </AllowedRoute>} />
          <Route path="/banks/view/:id" element={<AllowedRoute roles={OPERATIONAL_ROLES}><ViewBank /> </AllowedRoute>} />


          {/* Account */}
          <Route path="/account/home" element={<AllowedRoute roles={OPERATIONAL_ROLES}><AccountOverview /> </AllowedRoute>} />
          <Route path="/account/create" element={<AllowedRoute roles={OPERATIONAL_ROLES}><CreateAccount /> </AllowedRoute>} />
          <Route path="/account/edit/:id" element={<AllowedRoute roles={OPERATIONAL_ROLES}><EditAccount /> </AllowedRoute>} />
          <Route path="/account/view/:accountId" element={<AllowedRoute roles={OPERATIONAL_ROLES}><ViewAccount /> </AllowedRoute>} />


          {/* Ledger */}
          <Route path="/ledger/home" element={<AllowedRoute roles={OPERATIONAL_ROLES}><LedgerOverview /> </AllowedRoute>} />
          <Route path="/ledger/create" element={<AllowedRoute roles={OPERATIONAL_ROLES}><CreateLedger /> </AllowedRoute>} />
          <Route path="/ledger/edit/:id" element={<AllowedRoute roles={OPERATIONAL_ROLES}><EditLedger /> </AllowedRoute>} />
          <Route path="/ledger/view/:id" element={<AllowedRoute roles={OPERATIONAL_ROLES}><ViewLedger /> </AllowedRoute>} />


          {/* Staff */}
          <Route path="/staff/home" element={<AllowedRoute roles={OPERATIONAL_ROLES}><StaffOverview /></AllowedRoute>} />
          <Route path="/staff/create-staff" element={<AllowedRoute roles={OPERATIONAL_ROLES}><CreateStaff /></AllowedRoute>} />
          <Route path="/staff/edit/:id" element={<AllowedRoute roles={OPERATIONAL_ROLES}><EditStaff /></AllowedRoute>} />
          <Route path="/staff/view/:id" element={<AllowedRoute roles={OPERATIONAL_ROLES}><ViewStaff /></AllowedRoute>} />

          {/* Timesheet */}
          <Route path="/timesheet/home" element={<AllowedRoute roles={TIMESHEET_ROLES}><TimesheetOverview /></AllowedRoute>} />
          <Route path="/timesheet/create-timesheet" element={<AllowedRoute roles={TIMESHEET_ROLES}><CreateTimesheet /></AllowedRoute>} />
          <Route path="/timesheet/edit/:id" element={<AllowedRoute roles={TIMESHEET_ROLES}><EditTimesheet /></AllowedRoute>} />
          <Route path="/timesheet/view/:id" element={<AllowedRoute roles={TIMESHEET_ROLES}><ViewTimesheet /></AllowedRoute>} />


          {/* Reports */}
          <Route path="/reports/ledger" element={<AllowedRoute roles={OPERATIONAL_ROLES}><LedgerReports /></AllowedRoute>} />
          <Route path="/reports/ledger/ledger-statement" element={<AllowedRoute roles={OPERATIONAL_ROLES}><LedgerStatement /></AllowedRoute>} />
          <Route path="/reports/ledger/general-ledger" element={<AllowedRoute roles={OPERATIONAL_ROLES}><GeneralLedger /></AllowedRoute>} />
          <Route path="/reports/ledger/trial-balance" element={<AllowedRoute roles={OPERATIONAL_ROLES}><TrialBalance /></AllowedRoute>} />
          <Route path="/reports/ledger/profit-and-loss" element={<AllowedRoute roles={OPERATIONAL_ROLES}><ProfitLoss /></AllowedRoute>} />
          <Route path="/reports/ledger/balance-sheet" element={<AllowedRoute roles={OPERATIONAL_ROLES}><BalanceSheet /></AllowedRoute>} />
          <Route path="/reports/fx-revaluation" element={<AllowedRoute roles={OPERATIONAL_ROLES}><FXRevaluation /></AllowedRoute>} />
          <Route path="/reports/invoice-aging" element={<AllowedRoute roles={OPERATIONAL_ROLES}><InvoiceAging /></AllowedRoute>} />
          <Route path="/reports/timesheet" element={<AllowedRoute roles={TIMESHEET_ROLES}><TimesheetReport /></AllowedRoute>} />
          
          
          {/* Reports */}
          <Route path="/reports/bank-recon" element={<AllowedRoute roles={OPERATIONAL_ROLES}><BankReconOverview /></AllowedRoute>} />
          <Route path="/reports/bank-recon/create" element={<AllowedRoute roles={OPERATIONAL_ROLES}><CreateBankRecon /></AllowedRoute>} />
          <Route path="/reports/bank-recon/edit/:id" element={<AllowedRoute roles={OPERATIONAL_ROLES}><EditBankRecon /></AllowedRoute>} />
          <Route path="/reports/bank-recon/workspace/:id" element={<AllowedRoute roles={OPERATIONAL_ROLES}><BankReconWorkspace /></AllowedRoute>} />

          {/* Accounting Controls */}
          <Route path="/lock-period/home" element={<AllowedRoute roles={OPERATIONAL_ROLES}><LockPeriodOverview /></AllowedRoute>} />

          {/* Users */}
          <Route path="/users/home" element={<AllowedRoute roles={ADMIN_ONLY_ROLES}><UsersOverview /></AllowedRoute>} />
          <Route path="/users/create-user" element={<AllowedRoute roles={ADMIN_ONLY_ROLES}><CreateUser /></AllowedRoute>} />
          <Route path="/users/edit/:id" element={<AllowedRoute roles={ADMIN_ONLY_ROLES}><EditUser /></AllowedRoute>} />
          <Route path="/users/view/:id" element={<AllowedRoute roles={ADMIN_ONLY_ROLES}><ViewUser /></AllowedRoute>} />
          <Route path="/users/my-profile"   element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
          

          <Route path="*" element={<NotFound />} />
        </Routes>
      </>
    );
};

export default App;