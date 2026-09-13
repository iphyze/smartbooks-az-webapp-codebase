import { lazy, Suspense, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import './App.css';
import './Responsive.css';
import './assets/fontawesome/css/all.css';
import ProtectedRoute from './components/ProtectedRoute';
import PermissionRoute from './components/PermissionRoute';
import NonSensitiveAutocomplete from './components/NonSensitiveAutocomplete';
import ScrollToTop from './components/ScrollToTop';
import AppLoader from './components/AppLoader';
import AllCostCentreRoute from './components/AllCostCentreRoute';
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
const CostCentresOverview = lazy(routeLoaders.CostCentresOverview);

const PermissionAllowedRoute = ({ permission, anyOf, allOf, children }) => (
  <ProtectedRoute>
    <PermissionRoute permission={permission} anyOf={anyOf} allOf={allOf}>{children}</PermissionRoute>
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
          <Route path="/" element={<PermissionAllowedRoute permission="dashboard.view"><Dashboard /></PermissionAllowedRoute>} />

          {/* Journal */}
          <Route path="/journal/create" element={<PermissionAllowedRoute permission="journal.create"><CreateJournal /></PermissionAllowedRoute>} />
          <Route path="/journal/home" element={<PermissionAllowedRoute permission="journal.view"><JournalOverview /></PermissionAllowedRoute>} />
          <Route path="/journal/edit/:journal_id" element={<PermissionAllowedRoute permission="journal.edit"><EditJournal /></PermissionAllowedRoute>} />
          <Route path="/journal/view/:journal_id" element={<PermissionAllowedRoute permission="journal.view"><ViewJournal /></PermissionAllowedRoute>} />

          {/* Invoice */}
          <Route path="/invoice/home" element={<PermissionAllowedRoute permission="invoice.view"><InvoiceOverview /></PermissionAllowedRoute>} />
          <Route path="/invoice/create" element={<PermissionAllowedRoute permission="invoice.create"><CreateInvoice /></PermissionAllowedRoute>} />
          <Route path="/invoice/edit/:invoice_number" element={<PermissionAllowedRoute permission="invoice.edit"><EditInvoice /></PermissionAllowedRoute>} />
          <Route path="/invoice/view/:invoice_number" element={<PermissionAllowedRoute permission="invoice.view"><ViewInvoice /></PermissionAllowedRoute>} />

          {/* Rates */}
          <Route path="/rate/home" element={<PermissionAllowedRoute permission="exchange_rate.view"><RateOverview /></PermissionAllowedRoute>} />
          <Route path="/rate/create" element={<PermissionAllowedRoute permission="exchange_rate.create"><CreateRate /></PermissionAllowedRoute>} />
          <Route path="/rate/edit/:id" element={<PermissionAllowedRoute permission="exchange_rate.edit"><EditRate /></PermissionAllowedRoute>} />

          {/* Client */}
          <Route path="/client/home" element={<PermissionAllowedRoute permission="client.view"><ClientOverview /></PermissionAllowedRoute>} />
          <Route path="/client/create" element={<PermissionAllowedRoute permission="client.create"><CreateClient /></PermissionAllowedRoute>} />
          <Route path="/client/edit/:id" element={<PermissionAllowedRoute permission="client.edit"><EditClient /></PermissionAllowedRoute>} />
          <Route path="/client/view/:clientId" element={<PermissionAllowedRoute permission="client.view"><ViewClient /></PermissionAllowedRoute>} />

          {/* Project */}
          <Route path="/project/home" element={<PermissionAllowedRoute permission="project.view"><ProjectOverview /></PermissionAllowedRoute>} />
          <Route path="/project/create" element={<PermissionAllowedRoute permission="project.create"><CreateProject /></PermissionAllowedRoute>} />
          <Route path="/project/edit/:id" element={<PermissionAllowedRoute permission="project.edit"><EditProject /></PermissionAllowedRoute>} />
          <Route path="/project/view/:projectId" element={<PermissionAllowedRoute permission="project.view"><ViewProject /></PermissionAllowedRoute>} />

          {/* Bank */}
          <Route path="/banks/home" element={<PermissionAllowedRoute permission="bank.view"><BankOverview /></PermissionAllowedRoute>} />
          <Route path="/banks/create" element={<PermissionAllowedRoute permission="bank.create"><CreateBank /></PermissionAllowedRoute>} />
          <Route path="/banks/edit/:id" element={<PermissionAllowedRoute permission="bank.edit"><EditBank /></PermissionAllowedRoute>} />
          <Route path="/banks/view/:id" element={<PermissionAllowedRoute permission="bank.view"><ViewBank /></PermissionAllowedRoute>} />

          {/* Account */}
          <Route path="/account/home" element={<PermissionAllowedRoute permission="account.view"><AccountOverview /></PermissionAllowedRoute>} />
          <Route path="/account/create" element={<PermissionAllowedRoute permission="account.create"><CreateAccount /></PermissionAllowedRoute>} />
          <Route path="/account/edit/:id" element={<PermissionAllowedRoute permission="account.edit"><EditAccount /></PermissionAllowedRoute>} />
          <Route path="/account/view/:accountId" element={<PermissionAllowedRoute permission="account.view"><ViewAccount /></PermissionAllowedRoute>} />

          {/* Ledger */}
          <Route path="/ledger/home" element={<PermissionAllowedRoute permission="ledger.view"><LedgerOverview /></PermissionAllowedRoute>} />
          <Route path="/ledger/create" element={<PermissionAllowedRoute permission="ledger.create"><CreateLedger /></PermissionAllowedRoute>} />
          <Route path="/ledger/edit/:id" element={<PermissionAllowedRoute permission="ledger.edit"><EditLedger /></PermissionAllowedRoute>} />
          <Route path="/ledger/view/:id" element={<PermissionAllowedRoute permission="ledger.view"><ViewLedger /></PermissionAllowedRoute>} />

          {/* Staff */}
          <Route path="/staff/home" element={<PermissionAllowedRoute permission="staff.view"><StaffOverview /></PermissionAllowedRoute>} />
          <Route path="/staff/create-staff" element={<PermissionAllowedRoute permission="staff.create"><CreateStaff /></PermissionAllowedRoute>} />
          <Route path="/staff/edit/:id" element={<PermissionAllowedRoute permission="staff.edit"><EditStaff /></PermissionAllowedRoute>} />
          <Route path="/staff/view/:id" element={<PermissionAllowedRoute permission="staff.view"><ViewStaff /></PermissionAllowedRoute>} />

          {/* Timesheet */}
          <Route path="/timesheet/home" element={<PermissionAllowedRoute permission="timesheet.view"><AllCostCentreRoute><TimesheetOverview /></AllCostCentreRoute></PermissionAllowedRoute>} />
          <Route path="/timesheet/create-timesheet" element={<PermissionAllowedRoute permission="timesheet.create"><AllCostCentreRoute><CreateTimesheet /></AllCostCentreRoute></PermissionAllowedRoute>} />
          <Route path="/timesheet/edit/:id" element={<PermissionAllowedRoute permission="timesheet.edit"><AllCostCentreRoute><EditTimesheet /></AllCostCentreRoute></PermissionAllowedRoute>} />
          <Route path="/timesheet/view/:id" element={<PermissionAllowedRoute permission="timesheet.view"><AllCostCentreRoute><ViewTimesheet /></AllCostCentreRoute></PermissionAllowedRoute>} />

          {/* Reports */}
          <Route path="/reports/ledger" element={<PermissionAllowedRoute permission="report.view"><LedgerReports /></PermissionAllowedRoute>} />
          <Route path="/reports/ledger/ledger-statement" element={<PermissionAllowedRoute permission="ledger_statement.view"><LedgerStatement /></PermissionAllowedRoute>} />
          <Route path="/reports/ledger/general-ledger" element={<PermissionAllowedRoute permission="general_ledger.view"><GeneralLedger /></PermissionAllowedRoute>} />
          <Route path="/reports/ledger/trial-balance" element={<PermissionAllowedRoute permission="trial_balance.view"><TrialBalance /></PermissionAllowedRoute>} />
          <Route path="/reports/ledger/profit-and-loss" element={<PermissionAllowedRoute permission="profit_loss.view"><ProfitLoss /></PermissionAllowedRoute>} />
          <Route path="/reports/ledger/balance-sheet" element={<PermissionAllowedRoute permission="balance_sheet.view"><BalanceSheet /></PermissionAllowedRoute>} />
          <Route path="/reports/fx-revaluation" element={<PermissionAllowedRoute permission="fx.view"><AllCostCentreRoute><FXRevaluation /></AllCostCentreRoute></PermissionAllowedRoute>} />
          <Route path="/reports/invoice-aging" element={<PermissionAllowedRoute permission="invoice_aging.view"><InvoiceAging /></PermissionAllowedRoute>} />
          <Route path="/reports/timesheet" element={<PermissionAllowedRoute permission="timesheet.view"><AllCostCentreRoute><TimesheetReport /></AllCostCentreRoute></PermissionAllowedRoute>} />
          <Route path="/reports/bank-recon" element={<PermissionAllowedRoute permission="bank_reconciliation.view"><BankReconOverview /></PermissionAllowedRoute>} />
          <Route path="/reports/bank-recon/create" element={<PermissionAllowedRoute permission="bank_reconciliation.create"><CreateBankRecon /></PermissionAllowedRoute>} />
          <Route path="/reports/bank-recon/edit/:id" element={<PermissionAllowedRoute permission="bank_reconciliation.edit"><EditBankRecon /></PermissionAllowedRoute>} />
          <Route path="/reports/bank-recon/workspace/:id" element={<PermissionAllowedRoute permission="bank_reconciliation.view"><BankReconWorkspace /></PermissionAllowedRoute>} />

          {/* Accounting Controls */}
          <Route path="/lock-period/home" element={<PermissionAllowedRoute anyOf={["accounting_period.view", "accounting_period.create", "accounting_period.edit", "accounting_period.lock", "accounting_period.close", "accounting_period.reverse"]}><AllCostCentreRoute><LockPeriodOverview /></AllCostCentreRoute></PermissionAllowedRoute>} />

          {/* Cost Centres */}
          <Route path="/cost-centres/home" element={<PermissionAllowedRoute anyOf={["cost_centre.view", "cost_centre.create", "cost_centre.edit", "cost_centre.delete"]}><AllCostCentreRoute><CostCentresOverview /></AllCostCentreRoute></PermissionAllowedRoute>} />

          {/* Users — RBAC Batch 2 */}
          <Route path="/users/home" element={<PermissionAllowedRoute permission="user.view"><UsersOverview /></PermissionAllowedRoute>} />
          <Route path="/users/create-user" element={<PermissionAllowedRoute permission="user.create"><CreateUser /></PermissionAllowedRoute>} />
          <Route path="/users/edit/:id" element={<PermissionAllowedRoute permission="user.edit"><EditUser /></PermissionAllowedRoute>} />
          <Route path="/users/view/:id" element={<PermissionAllowedRoute permission="user.view"><ViewUser /></PermissionAllowedRoute>} />
          <Route path="/users/my-profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />

          {/* Notifications */}
          <Route path="/notifications" element={<PermissionAllowedRoute permission="notification.view"><NotificationsPage /></PermissionAllowedRoute>} />

          {/* Activity Logs */}
          <Route path="/activity-logs" element={<PermissionAllowedRoute permission="activity_log.view"><AllCostCentreRoute><ActivityLogsPage /></AllCostCentreRoute></PermissionAllowedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
};

export default App;
