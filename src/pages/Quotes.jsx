import { useEffect, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { getAllQuotes, getAllClients, deleteQuote } from '../db';
import { formatCurrency, formatDate, calcSubtotal, calcGrandTotal } from '../utils/format';
import { Card, Button, StatusBadge, EmptyState, Confirm, TopBar } from '../components/UI';
import { Plus, Search, Trash2 } from 'lucide-react';

export default function Quotes({ navigate }) {
  const { t } = useLang();
  const [quotes, setQuotes] = useState([]);
  const [clients, setClients] = useState({});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [confirmId, setConfirmId] = useState(null);

  async function load() {
    const [qs, cls] = await Promise.all([getAllQuotes(), getAllClients()]);
    const clientMap = {};
    cls.forEach(c => { clientMap[c.id] = c; });
    setQuotes(qs);
    setClients(clientMap);
  }

  useEffect(() => { load(); }, []);

  const statuses = ['all', 'draft', 'sent', 'accepted', 'rejected'];

  const filtered = quotes.filter(q => {
    const client = clients[q.clientId];
    const matchSearch =
      q.projectName?.toLowerCase().includes(search.toLowerCase()) ||
      q.quoteNumber?.toLowerCase().includes(search.toLowerCase()) ||
      client?.name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || q.status === filter;
    return matchSearch && matchFilter;
  });

  async function handleDelete() {
    await deleteQuote(confirmId);
    setConfirmId(null);
    load();
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title={t.quote.title}
        right={
          <Button size="sm" onClick={() => navigate('quote-new')}>
            <Plus size={16} /> {t.nav.newQuote}
          </Button>
        }
      />
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
              {s === 'all' ? 'All' : t.quote.statuses[s]}
            </button>
          ))}
        </div>

        {/* Quote list */}
        {filtered.length === 0 ? (
          <EmptyState
            icon="📄"
            title={quotes.length === 0 ? t.dashboard.noQuotes : t.common.noResults}
            action={quotes.length === 0 && (
              <Button onClick={() => navigate('quote-new')}>
                <Plus size={16} /> {t.nav.newQuote}
              </Button>
            )}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(q => {
              const client = clients[q.clientId];
              const subtotal = calcSubtotal(q.items || []);
              const total = calcGrandTotal(subtotal, q.includeVat);
              return (
                <Card key={q.id} onClick={() => navigate('quote-view', { quoteId: q.id })}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm">{q.quoteNumber}</span>
                        <StatusBadge status={q.status} />
                      </div>
                      <div className="text-sm text-gray-300 mt-0.5 truncate">{q.projectName || '—'}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {client?.name || '—'} · {formatDate(q.createdAt)}
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      <div className="text-green-400 font-bold">{formatCurrency(total)}</div>
                      <button
                        onClick={e => { e.stopPropagation(); setConfirmId(q.id); }}
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
        message={t.quote.confirmDelete}
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
