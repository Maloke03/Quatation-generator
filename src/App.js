import { useState } from 'react';
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

const MAIN_TABS = ['dashboard', 'clients', 'quotes', 'invoices', 'settings'];

export default function App() {
  const [route, setRoute] = useState({ page: 'dashboard', params: {} });

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
