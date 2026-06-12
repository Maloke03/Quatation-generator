import { useEffect, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { getInvoice, getClient, getPaymentsByInvoice, addPayment, deletePayment } from '../db';
import { formatCurrency, formatDate, todayISO } from '../utils/format';
import { Button, Card, TopBar, Modal, Confirm, Input, Select } from '../components/UI';
import { ChevronLeft, Printer, Plus, Trash2, CheckCircle } from 'lucide-react';

function invoiceStatusColor(status) {
  const map = {
    unpaid:  { bg: '#3a1a1a', text: '#f87171', border: '#5a2d2d' },
    partial: { bg: '#2a1f0a', text: '#fbbf24', border: '#5a3a0a' },
    paid:    { bg: '#1a3a1a', text: '#4ade80', border: '#2d5a2d' },
    overdue: { bg: '#3a1a2a', text: '#e879f9', border: '#5a2d4a' },
  };
  return map[status] || map.unpaid;
}

function InvoiceStatusBadge({ status, label }) {
  const colors = invoiceStatusColor(status);
  return (
    <span
      className="text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
    >
      {label}
    </span>
  );
}

function PaymentForm({ invoice, onSave, onClose, t }) {
  const [form, setForm] = useState({
    amount: '',
    date: todayISO(),
    method: t.invoice.paymentMethods[0],
    note: '',
  });
  const [error, setError] = useState('');

  const balance = (invoice.grandTotal || 0) - (invoice.amountPaid || 0);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function submit() {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) { setError(t.common.required); return; }
    if (amt > balance + 0.01) { setError(`Max: ${formatCurrency(balance)}`); return; }
    onSave(form);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Balance reminder */}
      <div className="bg-[#0a1810] border border-[#2d5a3d] rounded-xl p-3 flex justify-between items-center">
        <span className="text-gray-400 text-sm">{t.invoice.balance}</span>
        <span className="text-green-400 font-bold text-lg">{formatCurrency(balance)}</span>
      </div>

      <Input
        label={t.invoice.paymentAmount}
        type="number"
        value={form.amount}
        onChange={e => { set('amount', e.target.value); setError(''); }}
        placeholder="0.00"
        error={error}
      />
      <Input
        label={t.invoice.paymentDate}
        type="date"
        value={form.date}
        onChange={e => set('date', e.target.value)}
      />
      <Select
        label={t.invoice.paymentMethod}
        value={form.method}
        onChange={e => set('method', e.target.value)}
      >
        {t.invoice.paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
      </Select>
      <Input
        label={t.invoice.paymentNote}
        value={form.note}
        onChange={e => set('note', e.target.value)}
        placeholder="e.g. WhatsApp receipt #123"
      />

      <div className="flex gap-3 pt-1">
        <Button variant="secondary" onClick={onClose} className="flex-1">{t.common.cancel}</Button>
        <Button onClick={submit} className="flex-1">{t.invoice.savePayment}</Button>
      </div>
    </div>
  );
}

export default function InvoiceView({ navigate, params = {} }) {
  const { t } = useLang();
  const [invoice, setInvoice] = useState(null);
  const [client, setClient] = useState(null);
  const [payments, setPayments] = useState([]);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [confirmPayId, setConfirmPayId] = useState(null);

  async function load() {
    const inv = await getInvoice(params.invoiceId);
    if (!inv) { navigate('invoices'); return; }
    setInvoice(inv);
    if (inv.clientId) getClient(inv.clientId).then(setClient);
    getPaymentsByInvoice(inv.id).then(setPayments);
  }

  useEffect(() => { load(); }, [params.invoiceId]);

  if (!invoice) {
    return <div className="flex items-center justify-center h-full text-gray-500 py-20">{t.common.loading}</div>;
  }

  const grandTotal = invoice.grandTotal || 0;
  const amountPaid = invoice.amountPaid || 0;
  const balance = grandTotal - amountPaid;
  const isPaid = invoice.status === 'paid';
  const colors = invoiceStatusColor(invoice.status);

  async function handleAddPayment(data) {
    await addPayment(invoice.id, data);
    setPayModalOpen(false);
    load();
  }

  async function handleDeletePayment() {
    await deletePayment(confirmPayId, invoice.id);
    setConfirmPayId(null);
    load();
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title={invoice.invoiceNumber}
        left={
          <button onClick={() => navigate('invoices')} className="text-gray-400 hover:text-white mr-1">
            <ChevronLeft size={22} />
          </button>
        }
        right={
          <Button size="sm" variant="secondary" onClick={() => navigate('invoice-print', { invoiceId: invoice.id })}>
            <Printer size={15} />
          </Button>
        }
      />

      <div className="p-4 flex flex-col gap-4 pb-28">
        {/* Status bar */}
        <div className="rounded-2xl p-4 border" style={{ background: colors.bg, borderColor: colors.border }}>
          <div className="flex items-center justify-between mb-3">
            <InvoiceStatusBadge status={invoice.status} label={t.invoice.statuses[invoice.status]} />
            {invoice.quoteId && (
              <button
                onClick={() => navigate('quote-view', { quoteId: invoice.quoteId })}
                className="text-xs text-gray-500 hover:text-green-400 transition-colors"
              >
                ← {t.invoice.fromQuote}
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">{t.invoice.amountDue}</div>
              <div className="text-white font-bold text-base">{formatCurrency(grandTotal)}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">{t.invoice.amountPaid}</div>
              <div className="text-green-400 font-bold text-base">{formatCurrency(amountPaid)}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">{t.invoice.balance}</div>
              <div style={{ color: colors.text }} className="font-bold text-base">{formatCurrency(balance)}</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-2 bg-black/30 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, grandTotal > 0 ? (amountPaid / grandTotal) * 100 : 0)}%`,
                background: isPaid ? '#4ade80' : '#fbbf24',
              }}
            />
          </div>
          {isPaid && (
            <div className="flex items-center justify-center gap-2 mt-2 text-green-400 text-sm font-semibold">
              <CheckCircle size={16} /> {t.invoice.paidInFull}
            </div>
          )}
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
            <div className="border-t border-[#2d5a3d] pt-2 mt-1 flex justify-between text-sm">
              <span className="text-gray-500">{t.print.projectDesc}</span>
              <span className="text-white font-medium">{invoice.projectName || '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t.invoice.invoiceNumber}</span>
              <span className="text-gray-300">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t.print.date}</span>
              <span className="text-gray-300">{formatDate(invoice.date)}</span>
            </div>
            {invoice.dueDate && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t.invoice.dueDate}</span>
                <span className="text-gray-300">{formatDate(invoice.dueDate)}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Line items */}
        <div>
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-2">{t.quote.items}</label>
          <div className="flex flex-col gap-1">
            {(invoice.items || []).filter(i => i.name).map((item, idx) => {
              const lineTotal = (parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0);
              return (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-[#1e3a2a] last:border-0 gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.qty} {item.unit} × {formatCurrency(item.unitPrice)}</div>
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
              <span className="text-white">{formatCurrency(invoice.subtotal || 0)}</span>
            </div>
            {invoice.includeVat && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t.quote.vat}</span>
                <span className="text-white">{formatCurrency((invoice.subtotal || 0) * 0.14)}</span>
              </div>
            )}
            <div className="border-t border-[#2d5a3d] pt-2 flex justify-between">
              <span className="text-green-400 font-bold">{t.quote.grandTotal}</span>
              <span className="text-green-400 font-bold text-xl">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </Card>

        {/* Payments section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">{t.invoice.payments}</label>
            {!isPaid && (
              <Button size="sm" onClick={() => setPayModalOpen(true)}>
                <Plus size={14} /> {t.invoice.recordPayment}
              </Button>
            )}
          </div>

          {payments.length === 0 ? (
            <div className="text-gray-600 text-sm text-center py-6 border border-dashed border-[#2d5a3d] rounded-xl">
              {t.invoice.noPayments}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {payments.map(p => (
                <div key={p.id} className="bg-[#0f2318] border border-[#1e3a2a] rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 font-bold">{formatCurrency(p.amount)}</span>
                      <span className="text-xs bg-[#1e3a2a] text-gray-400 px-2 py-0.5 rounded-full">{p.method}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {formatDate(p.date)}{p.note ? ` · ${p.note}` : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => setConfirmPayId(p.id)}
                    className="text-gray-600 hover:text-red-400 p-1 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Print */}
        <Button
          onClick={() => navigate('invoice-print', { invoiceId: invoice.id })}
          variant="secondary"
          size="lg"
          className="w-full"
        >
          <Printer size={18} /> {t.print.print}
        </Button>
      </div>

      {/* Payment modal */}
      <Modal open={payModalOpen} onClose={() => setPayModalOpen(false)} title={t.invoice.recordPayment}>
        <PaymentForm invoice={invoice} onSave={handleAddPayment} onClose={() => setPayModalOpen(false)} t={t} />
      </Modal>

      {/* Confirm delete payment */}
      <Confirm
        open={!!confirmPayId}
        message={t.invoice.confirmDeletePayment}
        onConfirm={handleDeletePayment}
        onCancel={() => setConfirmPayId(null)}
      />
    </div>
  );
}
