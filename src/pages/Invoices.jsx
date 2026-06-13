import { useEffect, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { getAllInvoices, getAllClients, deleteInvoice } from '../db';
import { formatCurrency, formatDate } from '../utils/format';
// eslint-disable-next-line 
import { Card, Button, EmptyState, Confirm, TopBar } from '../components/UI';
import { Search, Trash2 } from 'lucide-react';

function InvoiceStatusBadge({ status, label }) {
  const map = {
    unpaid:  { bg: '#3a1a1a', text: '#f87171', border: '#5a2d2d' },
    partial: { bg: '#2a1f0a', text: '#fbbf24', border: '#5a3a0a' },
    paid:    { bg: '#1a3a1a', text: '#4ade80', border: '#2d5a2d' },
  };
  const c = map[status] || map.unpaid;
  return (
    <span
      className="text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {label}
    </span>
  );
}

export default function Invoices({ navigate }) {
  const { t } = useLang();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState({});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [confirmId, setConfirmId] = useState(null);

  async function load() {
    const [invs, cls] = await Promise.all([getAllInvoices(), getAllClients()]);
    const clientMap = {};
    cls.forEach(c => { clientMap[c.id] = c; });
    setInvoices(invs);
    setClients(clientMap);
  }

  useEffect(() => { load(); }, []);

  const statuses = ['all', 'unpaid', 'partial', 'paid'];

  const filtered = invoices.filter(inv => {
    const client = clients[inv.clientId];
    const matchSearch =
      inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      inv.projectName?.toLowerCase().includes(search.toLowerCase()) ||
      client?.name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || inv.status === filter;
    return matchSearch && matchFilter;
  });

  async function handleDelete() {
    await deleteInvoice(confirmId);
    setConfirmId(null);
    load();
  }

  const statusLabels = {
    all: 'All',
    unpaid: t.invoice.statuses.unpaid,
    partial: t.invoice.statuses.partial,
    paid: t.invoice.statuses.paid,
  };

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title={t.invoice.title} />

      <div className="p-4 flex flex-col gap-4 pb-24">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.common.search}
            className="w-full bg-[#0f2318] border border-[#2d5a3d] rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 text-sm"
          />
        </div>

        {/* Status filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filter === s
                  ? 'bg-green-600 text-white'
                  : 'bg-[#1e3a2a] text-gray-400 border border-[#2d5a3d]'
              }`}
            >
              {statusLabels[s]}
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <EmptyState
            icon="🧾"
            title={invoices.length === 0 ? t.invoice.noInvoices : t.common.noResults}
            description={invoices.length === 0 ? t.invoice.convertHint : ''}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(inv => {
              const client = clients[inv.clientId];
              const grandTotal = inv.grandTotal || 0;
              const amountPaid = inv.amountPaid || 0;
              const balance = grandTotal - amountPaid;
              const pct = grandTotal > 0 ? Math.min(100, (amountPaid / grandTotal) * 100) : 0;

              return (
                <Card key={inv.id} onClick={() => navigate('invoice-view', { invoiceId: inv.id })}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm">{inv.invoiceNumber}</span>
                        <InvoiceStatusBadge status={inv.status} label={t.invoice.statuses[inv.status]} />
                      </div>
                      <div className="text-sm text-gray-300 mt-0.5 truncate">{inv.projectName || '—'}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {client?.name || '—'} · {formatDate(inv.createdAt)}
                      </div>
                      {/* Mini progress bar */}
                      <div className="mt-2 h-1.5 bg-[#0a1810] rounded-full overflow-hidden w-full">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: inv.status === 'paid' ? '#4ade80' : '#fbbf24',
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      <div className="text-white font-bold text-sm">{formatCurrency(grandTotal)}</div>
                      {inv.status !== 'paid' && (
                        <div className="text-red-400 text-xs">{t.invoice.balance}: {formatCurrency(balance)}</div>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); setConfirmId(inv.id); }}
                        className="text-gray-600 hover:text-red-400 p-1 mt-1 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Confirm
        open={!!confirmId}
        message={t.invoice.confirmDelete}
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
