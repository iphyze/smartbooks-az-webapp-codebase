import { Routes, Route } from "react-router-dom";
import './App.css';
import './Responsive.css';
import './assets/fontawesome/css/all.css';
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

const App = () => {
  
  useThemeStore.getState().init();

    return (
      <>
        <Toast />
        <Routes>

          
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}/>
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>}/>
          
          {/* Journal */}
          <Route path="/journal/create" element={<CreateJournal />} />
          <Route path="/journal/home" element={<JournalOverview />} />
          <Route path="/journal/edit/:journal_id" element={<EditJournal />} />
          <Route path="/journal/view/:journal_id" element={<ViewJournal />} />
          
          {/* Invoice */}
          <Route path="/invoice/home" element={<InvoiceOverview />} />
          <Route path="/invoice/create" element={<CreateInvoice />} />
          <Route path="/invoice/edit/:invoice_number" element={<EditInvoice />} />
          <Route path="/invoice/view/:invoice_number" element={<ViewInvoice />} />

          {/* Rates */}
          <Route path="/rate/home" element={<RateOverview />} />
          <Route path="/rate/create" element={<CreateRate />} />
          <Route path="/rate/edit/:id" element={<EditRate />} />

          {/* Client */}
          <Route path="/client/home" element={<ClientOverview />} />
          <Route path="/client/create" element={<CreateClient />} />
          <Route path="/client/edit/:id" element={<EditClient />} />
          <Route path="/client/view/:clientId" element={<ViewClient />} />


          {/* Client */}
          <Route path="/project/home" element={<ProjectOverview />} />
          <Route path="/project/create" element={<CreateProject />} />
          <Route path="/project/edit/:id" element={<EditProject />} />
          <Route path="/project/view/:projectId" element={<ViewProject />} />


          {/* Account */}
          <Route path="/account/home" element={<AccountOverview />} />
          <Route path="/account/create" element={<CreateAccount />} />
          <Route path="/account/edit/:id" element={<EditAccount />} />
          <Route path="/account/view/:accountId" element={<ViewAccount />} />
          

          <Route path="*" element={<NotFound />} />
        </Routes>
      </>
    );
};

export default App;