import { useEffect, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { getInvoice, getClient, addPayment, deletePayment } from '../db';
import { formatCurrency, formatDate, calcSubtotal, calcVAT, calcPaid, todayISO } from '../utils/format';
import { Button, TopBar, Card, Modal, Confirm, Input, InvoiceStatusBadge } from '../components/UI';
import { ChevronLeft, Printer, Plus, Trash2, FileText } from 'lucide-react';

function PaymentForm({ balance, onSave, onClose }) {
  const { t } = useLang();
  const [form, setForm] = useState({ amount: balance > 0 ? String(balance) : '', date: todayISO(), method: '', note: '' });
  const [error, setError] = useState('');

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function submit() {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) { setError(t.common.required); return; }
    onSave(form);
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        label={t.invoice.paymentAmount}
        type="number"
        min="0"
        step="any"
        value={form.amount}
        onChange={e => set('amount', e.target.value)}
        error={error}
      />
      <Input label={t.invoice.paymentDate} type="date" value={form.date} onChange={e => set('date', e.target.value)} />
      <Input
        label={t.invoice.paymentMethod}
        value={form.method}
        onChange={e => set('method', e.target.value)}
        placeholder={t.invoice.paymentMethodPlaceholder}
      />
      <Input
        label={t.invoice.paymentNote}
        value={form.note}
        onChange={e => set('note', e.target.value)}
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
  const [payOpen, setPayOpen] = useState(false);
  const [confirmPaymentId, setConfirmPaymentId] = useState(null);

  async function load() {
    const inv = await getInvoice(params.invoiceId);
    if (!inv) { navigate('invoices'); return; }
    setInvoice(inv);
    if (inv.clientId) getClient(inv.clientId).then(setClient);
  }

  useEffect(() => { load(); }, [params.invoiceId]);

  if (!invoice) {
    return <div className="flex items-center justify-center h-full text-gray-500 py-20">{t.common.loading}</div>;
  }

  const subtotal = calcSubtotal(invoice.items || []);
  const vat = invoice.includeVat ? calcVAT(subtotal) : 0;
  const total = invoice.grandTotal ?? (subtotal + vat);
  const paid = calcPaid(invoice.payments);
  const balance = Math.max(0, total - paid);

  async function handleAddPayment(form) {
    await addPayment(invoice.id, form);
    setPayOpen(false);
    load();
  }

  async function handleDeletePayment() {
    await deletePayment(invoice.id, confirmPaymentId);
    setConfirmPaymentId(null);
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
        {/* Status */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <InvoiceStatusBadge status={invoice.status} />
          {invoice.quoteId && (
            <button
              onClick={() => navigate('quote-view', { quoteId: invoice.quoteId })}
              className="text-xs text-gray-400 hover:text-green-400 flex items-center gap-1"
            >
              <FileText size={13} /> {t.invoice.fromQuote} {invoice.quoteNumber}
            </button>
          )}
        </div>

        {/* Client + project */}
        <Card>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t.invoice.billedTo}</span>
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
              <span className="text-gray-500">{t.invoice.date}</span>
              <span className="text-gray-300">{formatDate(invoice.date)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t.invoice.dueDate}</span>
              <span className="text-gray-300">{formatDate(invoice.dueDate)}</span>
            </div>
          </div>
        </Card>

        {/* Payment summary */}
        <Card>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{t.invoice.total}</span>
              <span className="text-white font-medium">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{t.invoice.amountPaid}</span>
              <span className="text-green-400 font-medium">{formatCurrency(paid)}</span>
            </div>
            <div className="border-t border-[#2d5a3d] pt-2 flex justify-between items-center">
              <span className="text-amber-400 font-bold">{t.invoice.balance}</span>
              <span className="text-amber-400 font-bold text-xl">{formatCurrency(balance)}</span>
            </div>
          </div>
        </Card>

        {/* Payments */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">{t.invoice.payments}</label>
            <Button size="sm" onClick={() => setPayOpen(true)}>
              <Plus size={14} /> {t.invoice.recordPayment}
            </Button>
          </div>
          {(invoice.payments || []).length === 0 ? (
            <p className="text-gray-600 text-sm py-2">{t.invoice.noPayments}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {invoice.payments.map(p => (
                <Card key={p.id}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-white text-sm font-semibold">{formatCurrency(p.amount)}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {formatDate(p.date)}{p.method ? ` · ${p.method}` : ''}{p.note ? ` · ${p.note}` : ''}
                      </div>
                    </div>
                    <button
                      onClick={() => setConfirmPaymentId(p.id)}
                      className="text-gray-600 hover:text-red-400 p-1 shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Print button */}
        <Button
          onClick={() => navigate('invoice-print', { invoiceId: invoice.id })}
          variant="secondary"
          size="lg"
          className="w-full"
        >
          <Printer size={18} /> {t.print.print}
        </Button>
      </div>

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title={t.invoice.recordPayment}>
        <PaymentForm balance={balance} onSave={handleAddPayment} onClose={() => setPayOpen(false)} />
      </Modal>

      <Confirm
        open={!!confirmPaymentId}
        message={t.invoice.deletePayment}
        onConfirm={handleDeletePayment}
        onCancel={() => setConfirmPaymentId(null)}
      />
    </div>
  );
}
