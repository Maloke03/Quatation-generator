import { useLang } from '../i18n/LangContext';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Receipt, 
  Settings,
  Package,
  Briefcase,
  UserCheck,
  Calendar,
  MoreHorizontal
} from 'lucide-react';
import { useState } from 'react';

// Main tabs (most important - 5 tabs max for mobile)
const mainTabs = [
  { key: 'dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { key: 'clients',   icon: Users,           labelKey: 'nav.clients' },
  { key: 'quotes',    icon: FileText,        labelKey: 'nav.quotes' },
  { key: 'invoices',  icon: Receipt,         labelKey: 'invoice.title' },
  { key: 'more',      icon: MoreHorizontal,  labelKey: 'common.more' },
];

// Secondary tabs (in the "More" menu)
const moreTabs = [
  { key: 'projects',  icon: Briefcase,       labelKey: 'projects.title' },
  { key: 'inventory', icon: Package,         labelKey: 'inventory.title' },
  { key: 'workers',   icon: UserCheck,       labelKey: 'workers.title' },
  { key: 'attendance',icon: Calendar,        labelKey: 'attendance.title' },
  { key: 'materials', icon: Package,         labelKey: 'materials.title' },
  { key: 'settings',  icon: Settings,        labelKey: 'common.settings' },
];

const fallbackLabels = {
  'nav.dashboard': 'Home',
  'nav.clients': 'Clients',
  'nav.quotes': 'Quotes',
  'invoice.title': 'Invoices',
  'projects.title': 'Projects',
  'inventory.title': 'Stock',
  'workers.title': 'Workers',
  'attendance.title': 'Attendance',
  'materials.title': 'Prices',
  'common.settings': 'Settings',
  'common.more': 'More'
};

export default function BottomNav({ current, navigate }) {
  const { t } = useLang();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

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

  const handleNavigation = (key) => {
    if (key === 'more') {
      setShowMoreMenu(!showMoreMenu);
    } else {
      setShowMoreMenu(false);
      navigate(key);
    }
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-30 bg-[#0a1810]/95 backdrop-blur-md border-t border-[#1e3a2a] safe-bottom"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${mainTabs.length}, 1fr)` }}
        role="navigation"
        aria-label="Main navigation"
      >
        {mainTabs.map(({ key, icon: Icon, labelKey }) => {
          const isActive = current === key;
          
          return (
            <button
              key={key}
              onClick={() => handleNavigation(key)}
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
              <span className="text-[10px] font-medium leading-none truncate w-full text-center px-0.5">
                {getLabel(labelKey)}
              </span>
            </button>
          );
        })}
      </nav>

      {/* More Menu Modal */}
      {showMoreMenu && (
        <div 
          className="fixed inset-0 z-40 bg-black/70 flex items-end"
          onClick={() => setShowMoreMenu(false)}
        >
          <div 
            className="bg-[#0a1810] border-t border-[#1e3a2a] rounded-t-2xl w-full max-h-[70vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#0a1810] p-4 border-b border-[#1e3a2a] flex justify-between items-center">
              <h3 className="text-white font-semibold">More Options</h3>
              <button 
                onClick={() => setShowMoreMenu(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
              {moreTabs.map(({ key, icon: Icon, labelKey }) => {
                const isActive = current === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      navigate(key);
                      setShowMoreMenu(false);
                    }}
                    className={`
                      flex flex-col items-center justify-center gap-1 p-3 rounded-xl
                      transition-colors duration-200
                      ${isActive 
                        ? 'bg-green-900/50 text-green-400 border border-green-700' 
                        : 'bg-[#1e3a2a] text-gray-400 border border-[#2d5a3d] hover:border-green-700'
                      }
                    `}
                  >
                    <Icon size={22} />
                    <span className="text-xs font-medium">{getLabel(labelKey)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}