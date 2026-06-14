import { useLang } from '../i18n/LangContext';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Receipt, 
  Settings,
  Package,
  Briefcase,
  Calendar
} from 'lucide-react';

// Define tabs with their configuration
const tabs = [
  { key: 'dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { key: 'clients',   icon: Users,           labelKey: 'nav.clients' },
  { key: 'quotes',    icon: FileText,        labelKey: 'nav.quotes' },
  { key: 'invoices',  icon: Receipt,         labelKey: 'invoice.title' },
  { key: 'projects',  icon: Briefcase,       labelKey: 'projects.title' },
  { key: 'inventory', icon: Package,         labelKey: 'inventory.title' },
  { key: 'workers',   icon: Users,           labelKey: 'workers.title' },
  { key: 'attendance', icon: Calendar, labelKey: 'attendance.title' },
  { key: 'materials', icon: Package,         labelKey: 'materials.title' },
  { key: 'settings',  icon: Settings,        labelKey: 'common.settings' }
];

// Fallback labels
const fallbackLabels = {
  'nav.dashboard': 'Dashboard',
  'nav.clients': 'Clients',
  'nav.quotes': 'Quotes',
  'invoice.title': 'Invoices',
  'projects.title': 'Projects',
  'inventory.title': 'Inventory',
  'workers.title': 'Workers',
  'attendance.title': 'Attendance',
  'materials.title': 'Materials',
  'common.settings': 'Settings'
};

export default function BottomNav({ current, navigate }) {
  const { t } = useLang();

  const getLabel = (key) => {
    if (!t || typeof t !== 'object') {
      return fallbackLabels[key] || key.split('.').pop();
    }
    
    const parts = key.split('.');
    let value = t;
    
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        value = undefined;
        break;
      }
    }
    
    return value || fallbackLabels[key] || key.split('.').pop();
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-30 bg-[#0a1810]/95 backdrop-blur-md border-t border-[#1e3a2a] safe-bottom"
      style={{ display: 'grid', gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
      role="navigation"
      aria-label="Main navigation"
    >
      {tabs.map(({ key, icon: Icon, labelKey }) => {
        const isActive = current === key;
        
        return (
          <button
            key={key}
            onClick={() => navigate(key)}
            className={`
              flex flex-col items-center justify-center gap-0.5 py-2 
              transition-colors duration-200 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1
              ${isActive ? 'text-green-400' : 'text-gray-600 hover:text-gray-400'}
            `}
            aria-label={getLabel(labelKey)}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon 
              size={20} 
              strokeWidth={isActive ? 2.5 : 1.8}
              className="transition-all duration-200"
            />
            <span className="text-[8px] font-medium leading-none truncate w-full text-center px-0.5">
              {getLabel(labelKey)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}