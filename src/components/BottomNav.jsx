import { useLang } from '../i18n/LangContext';
import { LayoutDashboard, Users, FileText, Settings } from 'lucide-react';

const tabs = [
  { key: 'dashboard', icon: LayoutDashboard },
  { key: 'clients', icon: Users },
  { key: 'quotes', icon: FileText },
  { key: 'settings', icon: Settings },
];

export default function BottomNav({ current, navigate }) {
  const { t } = useLang();

  const labels = {
    dashboard: t.nav.dashboard,
    clients: t.nav.clients,
    quotes: t.nav.quotes,
    settings: t.common.settings,
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#0a1810]/95 backdrop-blur-md border-t border-[#1e3a2a] flex safe-bottom">
      {tabs.map(({ key, icon: Icon }) => {
        const active = current === key;
        return (
          <button
            key={key}
            onClick={() => navigate(key)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
              active ? 'text-green-400' : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            <span className="text-[10px] font-medium">{labels[key]}</span>
          </button>
        );
      })}
    </div>
  );
}
