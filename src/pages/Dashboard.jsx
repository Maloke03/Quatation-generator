import { useEffect, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { getAllQuotes, getAllClients, getAllInvoices } from '../db';
import { formatCurrency, formatDate, calcPaid } from '../utils/format';
import { Card, EmptyState, StatusBadge, Button, TopBar } from '../components/UI';
import { FileText, Users, Clock, CheckCircle, Receipt, ChevronRight } from 'lucide-react';

export default function Dashboard({ navigate }) {
  const { t } = useLang();
  const [quotes, setQuotes] = useState([]);
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    getAllQuotes().then(setQuotes);
    getAllClients().then(setClients);
    getAllInvoices().then(setInvoices);
  }, []);

  const pending = quotes.filter(q => q.status === 'draft' || q.status === 'sent');
  const accepted = quotes.filter(q => q.status === 'accepted');
  const recent = quotes.slice(0, 5);

  const outstanding = invoices.reduce(
    (sum, inv) => sum + Math.max(0, (inv.grandTotal || 0) - calcPaid(inv.payments)),
    0
  );

  const stats = [
    { label: t.dashboard.totalQuotes, value: quotes.length, icon: FileText, color: '#4ade80' },
    { label: t.dashboard.totalClients, value: clients.length, icon: Users, color: '#60a5fa' },
    { label: t.dashboard.pendingQuotes, value: pending.length, icon: Clock, color: '#fbbf24' },
    { label: t.dashboard.acceptedQuotes, value: accepted.length, icon: CheckCircle, color: '#34d399' },
  ];

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
        {/* Tagline */}
        <p className="text-green-400/70 text-sm font-medium">{t.appTagline}</p>

        {/* Outstanding invoices */}
        {invoices.length > 0 && (
          <Card onClick={() => navigate('invoices')}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Receipt size={22} color="#fbbf24" className="opacity-80 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-gray-500">{t.invoice.outstanding}</div>
                  <div className="text-xl font-bold text-amber-400 truncate">{formatCurrency(outstanding)}</div>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-600 shrink-0" />
            </div>
          </Card>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{s.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                  </div>
                  <Icon size={20} color={s.color} className="opacity-70 mt-0.5" />
                </div>
              </Card>
            );
          })}
        </div>

        {/* Recent quotes */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {t.dashboard.recentQuotes}
          </h2>
          {recent.length === 0 ? (
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
              {recent.map(q => {
                const client = clients.find(c => c.id === q.clientId);
                const subtotal = (q.items || []).reduce((s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.unitPrice) || 0), 0);
                const total = q.includeVat ? subtotal * 1.14 : subtotal;
                return (
                  <Card key={q.id} onClick={() => navigate('quote-view', { quoteId: q.id })}>
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
      </div>
    </div>
  );
}
