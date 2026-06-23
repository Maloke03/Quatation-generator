import { useState, useEffect } from 'react';
import { LangProvider } from './i18n/LangContext';
import { UserProvider } from './context/UserContext';
import SubscriptionGuard from './components/SubscriptionGuard';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Quotes from './pages/Quotes';
import QuoteBuilder from './pages/QuoteBuilder';
import QuoteView from './pages/QuoteView';
import QuotePrint from './pages/QuotePrint';
import Invoices from './pages/Invoices';
import InvoiceView from './pages/InvoiceView';
import InvoicePrint from './pages/InvoicePrint';
import Settings from './pages/Settings';
import BottomNav from './components/BottomNav';
import MaterialsDB from './pages/MaterialsDB';
import LabourCalculator from './pages/LabourCalculator';
import Projects from './pages/Projects';
import ProjectView from './pages/ProjectView';
import Inventory from './pages/Inventory';
import Workers from './pages/Workers';
import Attendance from './pages/Attendance';
import CreateReport from './pages/CreateReport';
import AdminDashboard from './pages/AdminDashboard';
import Subscribe from './pages/Subscribe';
import Login from './pages/Login';
import Landing from './pages/Landing';
import Help from './pages/Help';
import ResetPassword from './pages/ResetPassword';

const MAIN_TABS = ['dashboard', 'clients', 'quotes', 'invoices', 'projects', 'materials', 'inventory', 'workers', 'attendance', 'settings'];

export default function App() {
  const [route, setRoute] = useState({ page: 'landing', params: {} });

  // Handle initial URL on load (for deep linking)
  useEffect(() => {
    const path = window.location.pathname;
    if (path !== '/' && path !== '/Maloke03/Quatation-generator/') {
      const cleanPath = path.replace('/Maloke03/Quatation-generator', '').replace(/\/$/, '');
      if (cleanPath === '/projects') {
        setRoute({ page: 'projects', params: {} });
      } else if (cleanPath === '/materials') {
        setRoute({ page: 'materials', params: {} });
      } else if (cleanPath === '/invoices') {
        setRoute({ page: 'invoices', params: {} });
      } else if (cleanPath === '/clients') {
        setRoute({ page: 'clients', params: {} });
      } else if (cleanPath === '/quotes') {
        setRoute({ page: 'quotes', params: {} });
      } else if (cleanPath === '/settings') {
        setRoute({ page: 'settings', params: {} });
      } else if (cleanPath === '/attendance') {
        setRoute({ page: 'attendance', params: {} });
      } else if (cleanPath === '/admin') {
        setRoute({ page: 'admin', params: {} });
      } else if (cleanPath === '/subscribe') {
        setRoute({ page: 'subscribe', params: {} });
      } else if (cleanPath === '/login') {
        setRoute({ page: 'login', params: {} });
      } else if (cleanPath === '/landing' || cleanPath === '') {
        setRoute({ page: 'landing', params: {} });
      } else if (cleanPath === '/help') {
        setRoute({ page: 'help', params: {} });
      } else if (cleanPath === '/reset-password') {
        setRoute({ page: 'reset-password', params: {} });
      }
    } else {
      // Root path - show landing page
      setRoute({ page: 'landing', params: {} });
    }
  }, []);

  function navigate(page, params = {}) {
    setRoute({ page, params });
    window.scrollTo(0, 0);
  }

  const { page, params } = route;
  const currentTab = MAIN_TABS.includes(page) ? page : null;
  const isPrint = page === 'quote-print' || page === 'invoice-print';
  const isAdmin = page === 'admin';
  const isSubscribe = page === 'subscribe';
  const isLogin = page === 'login';
  const isLanding = page === 'landing';

  function renderPage() {
    switch (page) {
      case 'landing':      return <Landing navigate={navigate} />;
      case 'login':        return <Login navigate={navigate} />;
      case 'reset-password': return <ResetPassword navigate={navigate} />;
      case 'dashboard':    return <Dashboard navigate={navigate} />;
      case 'clients':      return <Clients navigate={navigate} />;
      case 'quotes':       return <Quotes navigate={navigate} />;
      case 'quote-new':    return <QuoteBuilder navigate={navigate} params={params} />;
      case 'quote-edit':   return <QuoteBuilder navigate={navigate} params={params} />;
      case 'quote-view':   return <QuoteView navigate={navigate} params={params} />;
      case 'quote-print':  return <QuotePrint navigate={navigate} params={params} />;
      case 'invoices':     return <Invoices navigate={navigate} />;
      case 'invoice-view': return <InvoiceView navigate={navigate} params={params} />;
      case 'invoice-print':return <InvoicePrint navigate={navigate} params={params} />;
      case 'materials':    return <MaterialsDB navigate={navigate} />;
      case 'labour':       return <LabourCalculator navigate={navigate} />;
      case 'projects':     return <Projects navigate={navigate} />;
      case 'project-view': return <ProjectView navigate={navigate} params={params} />;
      case 'inventory':    return <Inventory navigate={navigate} />;
      case 'workers':      return <Workers navigate={navigate} />;
      case 'attendance':   return <Attendance navigate={navigate} />;
      case 'create-report': return <CreateReport navigate={navigate} params={params} />;
      case 'admin':        return <AdminDashboard navigate={navigate} />;
      case 'subscribe':    return <Subscribe navigate={navigate} />;
      case 'settings':     return <Settings navigate={navigate} />;
      case 'help':         return <Help navigate={navigate} />;
      default:             return <Landing navigate={navigate} />;
    }
  }

  // Check if we should show subscription guard (not on subscribe, login, or landing page)
  const showGuard = page !== 'subscribe' && page !== 'login' && page !== 'landing';

  return (
    <LangProvider>
      <UserProvider navigate={navigate}>
        {showGuard ? (
          <SubscriptionGuard>
            <div className="min-h-screen bg-[#0a1810] text-white">
              <div className="max-w-lg mx-auto relative min-h-screen">
                {renderPage()}
                {!isPrint && !isAdmin && !isSubscribe && !isLogin && !isLanding && (
                  <BottomNav current={currentTab} navigate={navigate} />
                )}
                {isAdmin && (
                  <div className="text-center text-xs text-gray-600 py-4 border-t border-[#1e3a2a]">
                    Admin Mode - Bottom Nav Hidden
                  </div>
                )}
              </div>
            </div>
          </SubscriptionGuard>
        ) : (
          <div className="min-h-screen bg-[#0a1810] text-white">
            <div className="max-w-lg mx-auto relative min-h-screen">
              {renderPage()}
            </div>
          </div>
        )}
      </UserProvider>
    </LangProvider>
  );
}