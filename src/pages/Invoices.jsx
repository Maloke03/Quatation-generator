import { useEffect, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { getAllInvoices, getAllClients, deleteInvoice } from '../db';
import { formatCurrency, formatDate, calcPaid } from '../utils/format';
import { Card, EmptyState, Confirm, TopBar, InvoiceStatusBadge } from '../components/UI';
import { Search, Trash2 } from 'lucide-react';

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
      inv.projectName?.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      client?.name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || inv.status === filter;
    return matchSearch && matchFilter;
  });

  async function handleDelete() {
    await deleteInvoice(confirmId);
    setConfirmId(null);
    load();
  }

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

        {/* Status filter tabs */}
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
              {s === 'all' ? t.common.all : t.invoice.statuses[s]}
            </button>
          ))}
        </div>

        {/* Invoice list */}
        {filtered.length === 0 ? (
          <EmptyState
            icon="🧾"
            title={invoices.length === 0 ? t.invoice.noInvoices : t.common.noResults}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(inv => {
              const client = clients[inv.clientId];
              const paid = calcPaid(inv.payments);
              const balance = Math.max(0, (inv.grandTotal || 0) - paid);
              return (
                <Card key={inv.id} onClick={() => navigate('invoice-view', { invoiceId: inv.id })}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm">{inv.invoiceNumber}</span>
                        <InvoiceStatusBadge status={inv.status} />
                      </div>
                      <div className="text-sm text-gray-300 mt-0.5 truncate">{inv.projectName || '—'}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {client?.name || '—'} · {formatDate(inv.createdAt)}
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      <div className="text-green-400 font-bold">{formatCurrency(inv.grandTotal)}</div>
                      {balance > 0 ? (
                        <div className="text-[11px] text-amber-400">{t.invoice.balance}: {formatCurrency(balance)}</div>
                      ) : (
                        <div className="text-[11px] text-green-500">{t.invoice.statuses.paid}</div>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); setConfirmId(inv.id); }}
                        className="text-gray-600 hover:text-red-400 p-1"
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
