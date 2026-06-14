import { useEffect, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { getAllQuotes, getAllClients, getAllInvoices, getAllProjects, getAllInventory, getAllWorkers, getAllExpenses } from '../db';
import { formatCurrency, formatDate } from '../utils/format';
import { Card, EmptyState, StatusBadge, Button, TopBar } from '../components/UI';
import { 
  FileText, 
  Users, 
  Clock, 
  AlertCircle, 
  Briefcase, 
  Package, 
  UserCheck, 
  TrendingUp, 
  CheckCircle 
} from 'lucide-react';

export default function Dashboard({ navigate }) {
  const { t } = useLang();
  const [quotes, setQuotes] = useState([]);
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [quotesData, clientsData, invoicesData, projectsData, inventoryData, workersData, expensesData] = await Promise.all([
        getAllQuotes(),
        getAllClients(),
        getAllInvoices(),
        getAllProjects(),
        getAllInventory(),
        getAllWorkers(),
        getAllExpenses()
      ]);
      setQuotes(quotesData);
      setClients(clientsData);
      setInvoices(invoicesData);
      setProjects(projectsData);
      setInventory(inventoryData);
      setWorkers(workersData);
      setExpenses(expensesData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const pendingQuotes = quotes.filter(q => q.status === 'draft' || q.status === 'sent');
  const acceptedQuotes = quotes.filter(q => q.status === 'accepted');
  const activeProjects = projects.filter(p => p.status === 'in_progress');
  const completedProjects = projects.filter(p => p.status === 'completed');
  const lowStockItems = inventory.filter(item => (item.stock || 0) <= (item.reorderLevel || 10));
  const activeWorkers = workers.filter(w => w.isActive !== false);
  const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  
  const outstanding = invoices
    .filter(i => i.status !== 'paid')
    .reduce((sum, i) => sum + ((i.grandTotal || 0) - (i.amountPaid || 0)), 0);

  // Stats row 1 - Core Business Metrics
  const primaryStats = [
    { label: t.dashboard.totalQuotes, value: quotes.length, icon: FileText, color: '#4ade80', onClick: () => navigate('quotes') },
    { label: t.dashboard.totalClients, value: clients.length, icon: Users, color: '#60a5fa', onClick: () => navigate('clients') },
    { label: t.dashboard.pendingQuotes, value: pendingQuotes.length, icon: Clock, color: '#fbbf24', onClick: () => navigate('quotes') },
    { label: 'Accepted Quotes', value: acceptedQuotes.length, icon: TrendingUp, color: '#34d399', onClick: () => navigate('quotes') },
  ];

  // Stats row 2 - Projects & Financial
  const secondaryStats = [
    { label: 'Active Projects', value: activeProjects.length, icon: Briefcase, color: '#f59e0b', onClick: () => navigate('projects') },
    { label: 'Completed Projects', value: completedProjects.length, icon: CheckCircle, color: '#10b981', onClick: () => navigate('projects') },
    { label: 'Total Expenses', value: formatCurrency(totalExpenses), icon: AlertCircle, color: '#ef4444', onClick: () => navigate('projects') },
    { label: t.dashboard.outstanding || 'Outstanding', value: formatCurrency(outstanding), icon: AlertCircle, color: '#f87171', onClick: () => navigate('invoices') },
  ];

  // Stats row 3 - Resources
  const tertiaryStats = [
    { label: 'Inventory Items', value: inventory.length, icon: Package, color: '#8b5cf6', onClick: () => navigate('inventory') },
    { label: 'Low Stock Alert', value: lowStockItems.length, icon: AlertCircle, color: '#ef4444', onClick: () => navigate('inventory') },
    { label: 'Total Workers', value: workers.length, icon: UserCheck, color: '#06b6d4', onClick: () => navigate('workers') },
    { label: 'Active Workers', value: activeWorkers.length, icon: Users, color: '#10b981', onClick: () => navigate('workers') },
  ];

  // Recent items for quick view
  const recentQuotes = quotes.slice(0, 3);
  const recentProjects = projects.slice(0, 3);

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <TopBar title={t.appName} />
        <div className="p-8 text-center text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title={t.appName}
        right={
          <Button size="sm" onClick={() => navigate('quote-new')}>
            + {t.nav.newQuote}
          </Button>
        }
      />
      <div className="p-4 flex flex-col gap-5 pb-24">
        <p className="text-green-400/70 text-sm font-medium">{t.appTagline}</p>

        {/* Low Stock Warning */}
        {lowStockItems.length > 0 && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400" />
              <span className="text-red-400 text-sm font-medium">Low Stock Alert: {lowStockItems.length} item(s) need reorder</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {lowStockItems.slice(0, 3).map(item => (
                <span key={item.id} className="text-xs text-red-300 bg-red-900/50 px-2 py-1 rounded">
                  {item.materialName}: {item.stock} {item.unit} left
                </span>
              ))}
              {lowStockItems.length > 3 && (
                <span className="text-xs text-gray-400">+{lowStockItems.length - 3} more</span>
              )}
            </div>
          </div>
        )}

        {/* Stats Row 1 - Core Metrics */}
        <div className="grid grid-cols-2 gap-3">
          {primaryStats.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} onClick={s.onClick} className="cursor-pointer hover:border-green-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white truncate">{s.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                  </div>
                  <Icon size={20} color={s.color} className="opacity-70 mt-0.5 shrink-0" />
                </div>
              </Card>
            );
          })}
        </div>

        {/* Stats Row 2 - Projects & Financial */}
        <div className="grid grid-cols-2 gap-3">
          {secondaryStats.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} onClick={s.onClick} className="cursor-pointer hover:border-green-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xl font-bold text-white truncate">{s.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                  </div>
                  <Icon size={18} color={s.color} className="opacity-70 mt-0.5 shrink-0" />
                </div>
              </Card>
            );
          })}
        </div>

        {/* Stats Row 3 - Resources */}
        <div className="grid grid-cols-2 gap-3">
          {tertiaryStats.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} onClick={s.onClick} className="cursor-pointer hover:border-green-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xl font-bold text-white truncate">{s.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                  </div>
                  <Icon size={18} color={s.color} className="opacity-70 mt-0.5 shrink-0" />
                </div>
              </Card>
            );
          })}
        </div>

        {/* Recent Quotes Section */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {t.dashboard.recentQuotes}
          </h2>
          {recentQuotes.length === 0 ? (
            <EmptyState
              icon="📋"
              title={t.dashboard.noQuotes}
              action={
                <Button onClick={() => navigate('quote-new')}>
                  {t.dashboard.createFirst}
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-2">
              {recentQuotes.map(q => {
                const client = clients.find(c => c.id === q.clientId);
                const subtotal = (q.items || []).reduce((s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.unitPrice) || 0), 0);
                const total = q.includeVat ? subtotal * 1.14 : subtotal;
                return (
                  <Card key={q.id} onClick={() => navigate('quote-view', { quoteId: q.id })} className="cursor-pointer">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-white text-sm truncate">
                          {q.projectName || q.quoteNumber}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {client?.name || '—'} · {formatDate(q.createdAt)}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-green-400 font-bold text-sm">{formatCurrency(total)}</div>
                        <div className="mt-1"><StatusBadge status={q.status} /></div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Projects Section */}
        {recentProjects.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Recent Projects
            </h2>
            <div className="flex flex-col gap-2">
              {recentProjects.map(p => {
                const client = clients.find(c => c.id === p.clientId);
                return (
                  <Card key={p.id} onClick={() => navigate('project-view', { projectId: p.id })} className="cursor-pointer">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-white text-sm truncate">
                          {p.projectName}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {client?.name || '—'} · {p.status === 'in_progress' ? '🟡 In Progress' : p.status === 'completed' ? '✅ Completed' : '⚪ Not Started'}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-green-400 font-bold text-sm">{formatCurrency(p.grandTotal || 0)}</div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button onClick={() => navigate('quote-new')} variant="secondary" size="sm">
            + New Quote
          </Button>
          <Button onClick={() => navigate('inventory')} variant="secondary" size="sm">
            📦 Manage Inventory
          </Button>
          <Button onClick={() => navigate('attendance')} variant="secondary" size="sm">
            📋 Take Attendance
          </Button>
          <Button onClick={() => navigate('projects')} variant="secondary" size="sm">
            🏗️ View Projects
          </Button>
        </div>
      </div>
    </div>
  );
}