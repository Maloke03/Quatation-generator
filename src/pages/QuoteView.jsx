import { useEffect, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { getQuote, getClient, updateQuoteStatus } from '../db';
import { formatCurrency, formatDate, calcSubtotal, calcVAT, calcGrandTotal } from '../utils/format';
import { Button, StatusBadge, TopBar, Card } from '../components/UI';
import { ChevronLeft, Pencil, Printer, CheckCircle, XCircle, Send } from 'lucide-react';

export default function QuoteView({ navigate, params = {} }) {
  const { t } = useLang();
  const [quote, setQuote] = useState(null);
  const [client, setClient] = useState(null);

  async function load() {
    const q = await getQuote(params.quoteId);
    if (!q) { navigate('quotes'); return; }
    setQuote(q);
    if (q.clientId) getClient(q.clientId).then(setClient);
  }

  useEffect(() => { load(); }, [params.quoteId]);

  if (!quote) {
    return <div className="flex items-center justify-center h-full text-gray-500 py-20">{t.common.loading}</div>;
  }

  const subtotal = calcSubtotal(quote.items || []);
  const vat = quote.includeVat ? calcVAT(subtotal) : 0;
  const grandTotal = calcGrandTotal(subtotal, quote.includeVat);

  async function changeStatus(status) {
    await updateQuoteStatus(quote.id, status);
    load();
  }

  const statusActions = {
    draft: [
      { label: t.quote.statuses.sent, status: 'sent', icon: Send, variant: 'secondary' },
    ],
    sent: [
      { label: t.quote.statuses.accepted, status: 'accepted', icon: CheckCircle, variant: 'primary' },
      { label: t.quote.statuses.rejected, status: 'rejected', icon: XCircle, variant: 'danger' },
    ],
    accepted: [],
    rejected: [
      { label: t.quote.statuses.draft, status: 'draft', icon: Pencil, variant: 'secondary' },
    ],
  };

  const actions = statusActions[quote.status] || [];

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title={quote.quoteNumber}
        left={
          <button onClick={() => navigate('quotes')} className="text-gray-400 hover:text-white mr-1">
            <ChevronLeft size={22} />
          </button>
        }
        right={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => navigate('quote-print', { quoteId: quote.id })}>
              <Printer size={15} />
            </Button>
            <Button size="sm" variant="secondary" onClick={() => navigate('quote-edit', { quoteId: quote.id })}>
              <Pencil size={15} />
            </Button>
          </div>
        }
      />

      <div className="p-4 flex flex-col gap-4 pb-28">
        {/* Status + actions */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <StatusBadge status={quote.status} />
          <div className="flex gap-2">
            {actions.map(a => {
              const Icon = a.icon;
              return (
                <Button key={a.status} size="sm" variant={a.variant} onClick={() => changeStatus(a.status)}>
                  <Icon size={14} /> {a.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Client + project */}
        <Card>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t.print.preparedFor}</span>
              <span className="text-white font-semibold">{client?.name || '—'}</span>
            </div>
            {client?.phone && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t.clients.phone}</span>
                <span className="text-gray-300">{client.phone}</span>
              </div>
            )}
            {client?.location && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t.clients.location}</span>
                <span className="text-gray-300">{client.location}</span>
              </div>
            )}
            <div className="border-t border-[#2d5a3d] pt-2 mt-1 flex justify-between text-sm">
              <span className="text-gray-500">{t.print.projectDesc}</span>
              <span className="text-white font-medium">{quote.projectName || '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t.print.date}</span>
              <span className="text-gray-300">{formatDate(quote.date)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t.quote.validUntil}</span>
              <span className="text-gray-300">{formatDate(quote.validUntil)}</span>
            </div>
          </div>
        </Card>

        {/* Items */}
        <div>
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-2">{t.quote.items}</label>
          <div className="flex flex-col gap-1">
            {(quote.items || []).filter(i => i.name).map((item, idx) => {
              const lineTotal = (parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0);
              return (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-[#1e3a2a] last:border-0 gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">{item.name}</div>
                    <div className="text-xs text-gray-500">
                      {item.qty} {item.unit} × {formatCurrency(item.unitPrice)}
                    </div>
                  </div>
                  <div className="text-green-400 font-semibold text-sm shrink-0">{formatCurrency(lineTotal)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Totals */}
        <Card>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{t.quote.subtotal}</span>
              <span className="text-white">{formatCurrency(subtotal)}</span>
            </div>
            {quote.includeVat && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t.quote.vat}</span>
                <span className="text-white">{formatCurrency(vat)}</span>
              </div>
            )}
            <div className="border-t border-[#2d5a3d] pt-2 flex justify-between">
              <span className="text-green-400 font-bold">{t.quote.grandTotal}</span>
              <span className="text-green-400 font-bold text-xl">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </Card>

        {/* Terms */}
        {quote.terms && (
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-1">{t.quote.terms}</label>
            <p className="text-gray-400 text-sm leading-relaxed">{quote.terms}</p>
          </div>
        )}
        {quote.notes && (
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-1">{t.quote.notes}</label>
            <p className="text-gray-400 text-sm leading-relaxed">{quote.notes}</p>
          </div>
        )}

        {/* Print button */}
        <Button
          onClick={() => navigate('quote-print', { quoteId: quote.id })}
          variant="secondary"
          size="lg"
          className="w-full"
        >
          <Printer size={18} /> {t.print.print}
        </Button>
      </div>
    </div>
  );
}
