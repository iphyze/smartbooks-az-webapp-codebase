import { lazy, Suspense, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import './App.css';
import './Responsive.css';
import './assets/fontawesome/css/all.css';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import NonSensitiveAutocomplete from './components/NonSensitiveAutocomplete';
import ScrollToTop from './components/ScrollToTop';
import AppLoader from './components/AppLoader';
import { ADMIN_ONLY_ROLES, OPERATIONAL_ROLES, TIMESHEET_ROLES } from './utils/permissions';
import Toast from './services/Toast';
import PublicRoute from './services/PublicRoute';
import useThemeStore from './stores/useThemeStore';

const NotFound = lazy(() => import('./pages/NotFound'));
const Login = lazy(() => import('./pages/auth/Login'));
const ChangePassword = lazy(() => import('./pages/auth/ChangePassword'));
const Dashboard = lazy(() => import('./pages/home/Dashboard'));
const CreateInvoice = lazy(() => import('./pages/invoice/CreateInvoice'));
const InvoiceOverview = lazy(() => import('./pages/invoice/InvoiceOverview'));
const EditInvoice = lazy(() => import('./pages/invoice/EditInvoice'));
const ViewInvoice = lazy(() => import('./pages/invoice/ViewInvoice'));
const CreateJournal = lazy(() => import('./pages/journal/CreateJournal'));
const JournalOverview = lazy(() => import('./pages/journal/JournalOverview'));
const EditJournal = lazy(() => import('./pages/journal/EditJournal'));
const ViewJournal = lazy(() => import('./pages/journal/ViewJournal'));
const RateOverview = lazy(() => import('./pages/rates/RateOverview'));
const CreateRate = lazy(() => import('./pages/rates/CreateRate'));
const EditRate = lazy(() => import('./pages/rates/EditRate'));
const ClientOverview = lazy(() => import('./pages/clients/ClientOverview'));
const CreateClient = lazy(() => import('./pages/clients/CreateClient'));
const EditClient = lazy(() => import('./pages/clients/EditClient'));
const ViewClient = lazy(() => import('./pages/clients/ViewClient'));
const ProjectOverview = lazy(() => import('./pages/projects/ProjectOverview'));
const CreateProject = lazy(() => import('./pages/projects/CreateProject'));
const EditProject = lazy(() => import('./pages/projects/EditProject'));
const ViewProject = lazy(() => import('./pages/projects/ViewProject'));
const AccountOverview = lazy(() => import('./pages/account/AccountOverview'));
const CreateAccount = lazy(() => import('./pages/account/CreateAccount'));
const EditAccount = lazy(() => import('./pages/account/EditAccount'));
const ViewAccount = lazy(() => import('./pages/account/ViewAccount'));
const BankOverview = lazy(() => import('./pages/banks/BankOverview'));
const CreateBank = lazy(() => import('./pages/banks/CreateBank'));
const EditBank = lazy(() => import('./pages/banks/EditBank'));
const ViewBank = lazy(() => import('./pages/banks/ViewBank'));
const LedgerOverview = lazy(() => import('./pages/ledger/LegderOverview'));
const CreateLedger = lazy(() => import('./pages/ledger/CreateLedger'));
const EditLedger = lazy(() => import('./pages/ledger/EditLedger'));
const ViewLedger = lazy(() => import('./pages/ledger/ViewLedger'));
const StaffOverview = lazy(() => import('./pages/staff/StaffOverview'));
const CreateStaff = lazy(() => import('./pages/staff/CreateStaff'));
const EditStaff = lazy(() => import('./pages/staff/EditStaff'));
const ViewStaff = lazy(() => import('./pages/staff/ViewStaff'));
const TimesheetOverview = lazy(() => import('./pages/timesheet/TimesheetOverview'));
const CreateTimesheet = lazy(() => import('./pages/timesheet/CreateTimesheet'));
const EditTimesheet = lazy(() => import('./pages/timesheet/EditTimesheet'));
const ViewTimesheet = lazy(() => import('./pages/timesheet/ViewTimesheet'));
const LedgerReports = lazy(() => import('./pages/reports/LedgerReports'));
const LedgerStatement = lazy(() => import('./pages/reports/LedgerStatment'));
const GeneralLedger = lazy(() => import('./pages/reports/GeneralLedger'));
const TrialBalance = lazy(() => import('./pages/reports/TrialBalance'));
const ProfitLoss = lazy(() => import('./pages/reports/ProfitLoss'));
const BalanceSheet = lazy(() => import('./pages/reports/BalanceSheet'));
const FXRevaluation = lazy(() => import('./pages/reports/FXRevaluation'));
const InvoiceAging = lazy(() => import('./pages/reports/InvoiceAging'));
const TimesheetReport = lazy(() => import('./pages/reports/TimesheetReport'));
const BankReconOverview = lazy(() => import('./pages/reports/recon/BankReconOverview'));
const EditBankRecon = lazy(() => import('./pages/reports/recon/EditBankRecon'));
const CreateBankRecon = lazy(() => import('./pages/reports/recon/CreateBankRecon'));
const BankReconWorkspace = lazy(() => import('./pages/reports/recon/BankReconWorkspace'));
const LockPeriodOverview = lazy(() => import('./pages/accounting-period/LockPeriodOverview'));
const UsersOverview = lazy(() => import('./pages/users/UsersOverview'));
const CreateUser = lazy(() => import('./pages/users/CreateUser'));
const EditUser = lazy(() => import('./pages/users/EditUser'));
const ViewUser = lazy(() => import('./pages/users/ViewUser'));
const MyProfile = lazy(() => import('./pages/users/MyProfile'));
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage'));

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
      <ScrollToTop />
      <NonSensitiveAutocomplete />
      <Toast />
      <Suspense fallback={<AppLoader />}>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/change-password" element={<ProtectedRoute passwordChangeOnly><ChangePassword /></ProtectedRoute>} />
          <Route path="/" element={<AllowedRoute roles={OPERATIONAL_ROLES}><Dashboard /></AllowedRoute>} />

          {/* Journal */}
          <Route path="/journal/create" element={<AllowedRoute roles={OPERATIONAL_ROLES}><CreateJournal /></AllowedRoute>} />
          <Route path="/journal/home" element={<AllowedRoute roles={OPERATIONAL_ROLES}><JournalOverview /></AllowedRoute>} />
          <Route path="/journal/edit/:journal_id" element={<AllowedRoute roles={OPERATIONAL_ROLES}><EditJournal /></AllowedRoute>} />
          <Route path="/journal/view/:journal_id" element={<AllowedRoute roles={OPERATIONAL_ROLES}><ViewJournal /></AllowedRoute>} />

          {/* Invoice */}
          <Route path="/invoice/home" element={<AllowedRoute roles={OPERATIONAL_ROLES}><InvoiceOverview /></AllowedRoute>} />
          <Route path="/invoice/create" element={<AllowedRoute roles={OPERATIONAL_ROLES}><CreateInvoice /></AllowedRoute>} />
          <Route path="/invoice/edit/:invoice_number" element={<AllowedRoute roles={OPERATIONAL_ROLES}><EditInvoice /></AllowedRoute>} />
          <Route path="/invoice/view/:invoice_number" element={<AllowedRoute roles={OPERATIONAL_ROLES}><ViewInvoice /></AllowedRoute>} />

          {/* Rates */}
          <Route path="/rate/home" element={<AllowedRoute roles={OPERATIONAL_ROLES}><RateOverview /></AllowedRoute>} />
          <Route path="/rate/create" element={<AllowedRoute roles={OPERATIONAL_ROLES}><CreateRate /></AllowedRoute>} />
          <Route path="/rate/edit/:id" element={<AllowedRoute roles={OPERATIONAL_ROLES}><EditRate /></AllowedRoute>} />

          {/* Client */}
          <Route path="/client/home" element={<AllowedRoute roles={OPERATIONAL_ROLES}><ClientOverview /></AllowedRoute>} />
          <Route path="/client/create" element={<AllowedRoute roles={OPERATIONAL_ROLES}><CreateClient /></AllowedRoute>} />
          <Route path="/client/edit/:id" element={<AllowedRoute roles={OPERATIONAL_ROLES}><EditClient /></AllowedRoute>} />
          <Route path="/client/view/:clientId" element={<AllowedRoute roles={OPERATIONAL_ROLES}><ViewClient /></AllowedRoute>} />

          {/* Project */}
          <Route path="/project/home" element={<AllowedRoute roles={OPERATIONAL_ROLES}><ProjectOverview /></AllowedRoute>} />
          <Route path="/project/create" element={<AllowedRoute roles={OPERATIONAL_ROLES}><CreateProject /></AllowedRoute>} />
          <Route path="/project/edit/:id" element={<AllowedRoute roles={OPERATIONAL_ROLES}><EditProject /></AllowedRoute>} />
          <Route path="/project/view/:projectId" element={<AllowedRoute roles={OPERATIONAL_ROLES}><ViewProject /></AllowedRoute>} />

          {/* Bank */}
          <Route path="/banks/home" element={<AllowedRoute roles={OPERATIONAL_ROLES}><BankOverview /></AllowedRoute>} />
          <Route path="/banks/create" element={<AllowedRoute roles={OPERATIONAL_ROLES}><CreateBank /></AllowedRoute>} />
          <Route path="/banks/edit/:id" element={<AllowedRoute roles={OPERATIONAL_ROLES}><EditBank /></AllowedRoute>} />
          <Route path="/banks/view/:id" element={<AllowedRoute roles={OPERATIONAL_ROLES}><ViewBank /></AllowedRoute>} />

          {/* Account */}
          <Route path="/account/home" element={<AllowedRoute roles={OPERATIONAL_ROLES}><AccountOverview /></AllowedRoute>} />
          <Route path="/account/create" element={<AllowedRoute roles={OPERATIONAL_ROLES}><CreateAccount /></AllowedRoute>} />
          <Route path="/account/edit/:id" element={<AllowedRoute roles={OPERATIONAL_ROLES}><EditAccount /></AllowedRoute>} />
          <Route path="/account/view/:accountId" element={<AllowedRoute roles={OPERATIONAL_ROLES}><ViewAccount /></AllowedRoute>} />

          {/* Ledger */}
          <Route path="/ledger/home" element={<AllowedRoute roles={OPERATIONAL_ROLES}><LedgerOverview /></AllowedRoute>} />
          <Route path="/ledger/create" element={<AllowedRoute roles={OPERATIONAL_ROLES}><CreateLedger /></AllowedRoute>} />
          <Route path="/ledger/edit/:id" element={<AllowedRoute roles={OPERATIONAL_ROLES}><EditLedger /></AllowedRoute>} />
          <Route path="/ledger/view/:id" element={<AllowedRoute roles={OPERATIONAL_ROLES}><ViewLedger /></AllowedRoute>} />

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
          <Route path="/users/my-profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />

          {/* Notifications */}
          <Route path="/notifications" element={<AllowedRoute roles={TIMESHEET_ROLES}><NotificationsPage /></AllowedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
};

export default App;
