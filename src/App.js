import { useState, useEffect } from 'react';
import { LangProvider } from './i18n/LangContext';
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

const MAIN_TABS = ['dashboard', 'clients', 'quotes', 'invoices', 'projects', 'materials', 'settings'];

export default function App() {
  const [route, setRoute] = useState({ page: 'dashboard', params: {} });

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
      }
    }
  }, []);

  function navigate(page, params = {}) {
    setRoute({ page, params });
    window.scrollTo(0, 0);
  }

  const { page, params } = route;
  const currentTab = MAIN_TABS.includes(page) ? page : null;
  const isPrint = page === 'quote-print' || page === 'invoice-print';

  function renderPage() {
    switch (page) {
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
      case 'settings':     return <Settings navigate={navigate} />;
      default:             return <Dashboard navigate={navigate} />;
    }
  }

  return (
    <LangProvider>
      <div className="min-h-screen bg-[#0a1810] text-white">
        <div className="max-w-lg mx-auto relative min-h-screen">
          {renderPage()}
          {!isPrint && (
            <BottomNav current={currentTab} navigate={navigate} />
          )}
        </div>
      </div>
    </LangProvider>
  );
}