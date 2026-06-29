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
import useAuthStore from './stores/useAuthStore';
import routeLoaders, { preloadRoute, preloadRoutes } from './utils/routePreloader';

const NotFound = lazy(routeLoaders.NotFound);
const Login = lazy(routeLoaders.Login);
const ChangePassword = lazy(routeLoaders.ChangePassword);
const Dashboard = lazy(routeLoaders.Dashboard);
const CreateInvoice = lazy(routeLoaders.CreateInvoice);
const InvoiceOverview = lazy(routeLoaders.InvoiceOverview);
const EditInvoice = lazy(routeLoaders.EditInvoice);
const ViewInvoice = lazy(routeLoaders.ViewInvoice);
const CreateJournal = lazy(routeLoaders.CreateJournal);
const JournalOverview = lazy(routeLoaders.JournalOverview);
const EditJournal = lazy(routeLoaders.EditJournal);
const ViewJournal = lazy(routeLoaders.ViewJournal);
const RateOverview = lazy(routeLoaders.RateOverview);
const CreateRate = lazy(routeLoaders.CreateRate);
const EditRate = lazy(routeLoaders.EditRate);
const ClientOverview = lazy(routeLoaders.ClientOverview);
const CreateClient = lazy(routeLoaders.CreateClient);
const EditClient = lazy(routeLoaders.EditClient);
const ViewClient = lazy(routeLoaders.ViewClient);
const ProjectOverview = lazy(routeLoaders.ProjectOverview);
const CreateProject = lazy(routeLoaders.CreateProject);
const EditProject = lazy(routeLoaders.EditProject);
const ViewProject = lazy(routeLoaders.ViewProject);
const AccountOverview = lazy(routeLoaders.AccountOverview);
const CreateAccount = lazy(routeLoaders.CreateAccount);
const EditAccount = lazy(routeLoaders.EditAccount);
const ViewAccount = lazy(routeLoaders.ViewAccount);
const BankOverview = lazy(routeLoaders.BankOverview);
const CreateBank = lazy(routeLoaders.CreateBank);
const EditBank = lazy(routeLoaders.EditBank);
const ViewBank = lazy(routeLoaders.ViewBank);
const LedgerOverview = lazy(routeLoaders.LedgerOverview);
const CreateLedger = lazy(routeLoaders.CreateLedger);
const EditLedger = lazy(routeLoaders.EditLedger);
const ViewLedger = lazy(routeLoaders.ViewLedger);
const StaffOverview = lazy(routeLoaders.StaffOverview);
const CreateStaff = lazy(routeLoaders.CreateStaff);
const EditStaff = lazy(routeLoaders.EditStaff);
const ViewStaff = lazy(routeLoaders.ViewStaff);
const TimesheetOverview = lazy(routeLoaders.TimesheetOverview);
const CreateTimesheet = lazy(routeLoaders.CreateTimesheet);
const EditTimesheet = lazy(routeLoaders.EditTimesheet);
const ViewTimesheet = lazy(routeLoaders.ViewTimesheet);
const LedgerReports = lazy(routeLoaders.LedgerReports);
const LedgerStatement = lazy(routeLoaders.LedgerStatement);
const GeneralLedger = lazy(routeLoaders.GeneralLedger);
const TrialBalance = lazy(routeLoaders.TrialBalance);
const ProfitLoss = lazy(routeLoaders.ProfitLoss);
const BalanceSheet = lazy(routeLoaders.BalanceSheet);
const FXRevaluation = lazy(routeLoaders.FXRevaluation);
const InvoiceAging = lazy(routeLoaders.InvoiceAging);
const TimesheetReport = lazy(routeLoaders.TimesheetReport);
const BankReconOverview = lazy(routeLoaders.BankReconOverview);
const EditBankRecon = lazy(routeLoaders.EditBankRecon);
const CreateBankRecon = lazy(routeLoaders.CreateBankRecon);
const BankReconWorkspace = lazy(routeLoaders.BankReconWorkspace);
const LockPeriodOverview = lazy(routeLoaders.LockPeriodOverview);
const UsersOverview = lazy(routeLoaders.UsersOverview);
const CreateUser = lazy(routeLoaders.CreateUser);
const EditUser = lazy(routeLoaders.EditUser);
const ViewUser = lazy(routeLoaders.ViewUser);
const MyProfile = lazy(routeLoaders.MyProfile);
const NotificationsPage = lazy(routeLoaders.NotificationsPage);
const ActivityLogsPage = lazy(routeLoaders.ActivityLogsPage);

const AllowedRoute = ({ roles, children }) => (
  <ProtectedRoute>
    <RoleRoute allowedRoles={roles}>{children}</RoleRoute>
  </ProtectedRoute>
);

const App = () => {
  const initTheme = useThemeStore((state) => state.init);
  const initializeAuth = useAuthStore((state) => state.initialize);
  const authReady = useAuthStore((state) => state.authReady);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    initTheme();
    initializeAuth();
    preloadRoute(window.location.pathname);
  }, [initTheme, initializeAuth]);

  useEffect(() => {
    const preloadLinkedRoute = (event) => {
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!link) return;

      const url = new URL(link.href, window.location.origin);
      if (url.origin === window.location.origin) preloadRoute(url.pathname);
    };

    document.addEventListener('pointerover', preloadLinkedRoute, { passive: true });
    document.addEventListener('focusin', preloadLinkedRoute);
    document.addEventListener('touchstart', preloadLinkedRoute, { passive: true });

    return () => {
      document.removeEventListener('pointerover', preloadLinkedRoute);
      document.removeEventListener('focusin', preloadLinkedRoute);
      document.removeEventListener('touchstart', preloadLinkedRoute);
    };
  }, []);

  useEffect(() => {
    if (!authReady || !isAuthenticated) return undefined;

    const routeBatches = [
      ['/', '/invoice/home', '/journal/home', '/client/home'],
      ['/invoice/create', '/invoice/view/preload', '/invoice/edit/preload', '/journal/create', '/journal/view/preload', '/journal/edit/preload'],
      ['/account/home', '/ledger/home', '/banks/home', '/rate/home'],
      ['/project/home', '/staff/home', '/timesheet/home', '/reports/ledger'],
      ['/notifications', '/activity-logs', '/users/my-profile'],
    ];
    const timers = routeBatches.map((paths, index) => window.setTimeout(() => {
      const run = () => preloadRoutes(paths);
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(run, { timeout: 1400 });
      } else {
        run();
      }
    }, 180 + (index * 420)));

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [authReady, isAuthenticated]);

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

          {/* Activity Logs */}
          <Route path="/activity-logs" element={<AllowedRoute roles={OPERATIONAL_ROLES}><ActivityLogsPage /></AllowedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
};

export default App;
