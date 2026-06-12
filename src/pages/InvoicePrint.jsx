import { useEffect, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { getInvoice, getClient, getSetting } from '../db';
import { formatCurrency, formatDate, calcSubtotal, calcVAT, calcPaid } from '../utils/format';
import { Button, TopBar } from '../components/UI';
import { ChevronLeft, Printer } from 'lucide-react';

export default function InvoicePrint({ navigate, params = {} }) {
  const { t } = useLang();
  const [invoice, setInvoice] = useState(null);
  const [client, setClient] = useState(null);
  const [company, setCompany] = useState(null);

  useEffect(() => {
    async function load() {
      const [inv, comp] = await Promise.all([
        getInvoice(params.invoiceId),
        getSetting('company'),
      ]);
      if (!inv) { navigate('invoices'); return; }
      setInvoice(inv);
      setCompany(comp);
      if (inv.clientId) getClient(inv.clientId).then(setClient);
    }
    load();
  }, [params.invoiceId]);

  if (!invoice) return null;

  const subtotal = calcSubtotal(invoice.items || []);
  const vat = invoice.includeVat ? calcVAT(subtotal) : 0;
  const total = invoice.grandTotal ?? (subtotal + vat);
  const paid = calcPaid(invoice.payments);
  const balance = Math.max(0, total - paid);

  function handlePrint() {
    window.print();
  }

  return (
    <>
      {/* Screen chrome — hidden on print */}
      <div className="print:hidden">
        <TopBar
          title={t.print.print}
          left={
            <button onClick={() => navigate('invoice-view', { invoiceId: invoice.id })} className="text-gray-400 hover:text-white mr-1">
              <ChevronLeft size={22} />
            </button>
          }
          right={
            <Button size="sm" onClick={handlePrint}>
              <Printer size={15} /> {t.print.print}
            </Button>
          }
        />
        <div className="p-4 pb-6">
          <p className="text-gray-500 text-sm text-center">Preview below. Tap "Print / Save PDF" to save or share.</p>
        </div>
      </div>

      {/* The printable invoice */}
      <div
        id="print-area"
        className="print-area mx-auto bg-white text-gray-900"
        style={{
          maxWidth: '210mm',
          minHeight: '297mm',
          padding: '16mm 14mm',
          fontFamily: "'Inter', sans-serif",
          fontSize: '10pt',
          lineHeight: '1.5',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8mm' }}>
          <div>
            <div style={{ fontSize: '22pt', fontWeight: '800', color: '#166534', letterSpacing: '-0.5px' }}>
              {company?.name || 'Your Company'}
            </div>
            {company?.address && <div style={{ color: '#555', marginTop: '2mm', fontSize: '9pt' }}>{company.address}</div>}
            {company?.phone && <div style={{ color: '#555', fontSize: '9pt' }}>{company.phone}</div>}
            {company?.email && <div style={{ color: '#555', fontSize: '9pt' }}>{company.email}</div>}
            {company?.regNumber && <div style={{ color: '#888', fontSize: '8pt' }}>Reg: {company.regNumber}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '18pt', fontWeight: '800', color: '#166534', letterSpacing: '2px' }}>
              {t.invoice.invoiceWord}
            </div>
            <div style={{ color: '#555', marginTop: '2mm', fontSize: '9pt' }}>
              <strong>{t.invoice.invoiceNumber}:</strong> {invoice.invoiceNumber}
            </div>
            <div style={{ color: '#555', fontSize: '9pt' }}>
              <strong>{t.invoice.date}:</strong> {formatDate(invoice.date)}
            </div>
            <div style={{ color: '#555', fontSize: '9pt' }}>
              <strong>{t.invoice.dueDate}:</strong> {formatDate(invoice.dueDate)}
            </div>
            {invoice.status === 'paid' && (
              <div style={{ display: 'inline-block', marginTop: '3mm', padding: '1.5mm 4mm', border: '2px solid #16a34a', color: '#16a34a', fontWeight: '800', fontSize: '12pt', letterSpacing: '2px', borderRadius: '2mm', transform: 'rotate(-3deg)' }}>
                {t.invoice.paidStamp}
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '2px solid #166534', marginBottom: '6mm' }} />

        {/* Client & Project */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8mm', marginBottom: '6mm' }}>
          <div>
            <div style={{ fontSize: '7pt', fontWeight: '700', color: '#166534', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2mm' }}>
              {t.invoice.billedTo}
            </div>
            <div style={{ fontWeight: '700', fontSize: '11pt' }}>{client?.name || '—'}</div>
            {client?.phone && <div style={{ color: '#555', fontSize: '9pt' }}>{client.phone}</div>}
            {client?.email && <div style={{ color: '#555', fontSize: '9pt' }}>{client.email}</div>}
            {client?.location && <div style={{ color: '#555', fontSize: '9pt' }}>{client.location}</div>}
          </div>
          <div>
            <div style={{ fontSize: '7pt', fontWeight: '700', color: '#166534', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2mm' }}>
              {t.print.projectDesc}
            </div>
            <div style={{ fontWeight: '700', fontSize: '11pt' }}>{invoice.projectName || '—'}</div>
            {invoice.quoteNumber && <div style={{ color: '#888', fontSize: '8pt', marginTop: '1mm' }}>{t.invoice.fromQuote} {invoice.quoteNumber}</div>}
          </div>
        </div>

        {/* Items table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6mm' }}>
          <thead>
            <tr style={{ background: '#166534', color: 'white' }}>
              <th style={{ padding: '3mm 4mm', textAlign: 'left', fontSize: '8pt', fontWeight: '700' }}>Description</th>
              <th style={{ padding: '3mm 2mm', textAlign: 'center', fontSize: '8pt', fontWeight: '700', width: '12mm' }}>Qty</th>
              <th style={{ padding: '3mm 2mm', textAlign: 'center', fontSize: '8pt', fontWeight: '700', width: '14mm' }}>Unit</th>
              <th style={{ padding: '3mm 2mm', textAlign: 'right', fontSize: '8pt', fontWeight: '700', width: '22mm' }}>Unit Price</th>
              <th style={{ padding: '3mm 4mm', textAlign: 'right', fontSize: '8pt', fontWeight: '700', width: '22mm' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).filter(i => i.name).map((item, idx) => {
              const lineTotal = (parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0);
              return (
                <tr key={idx} style={{ background: idx % 2 === 0 ? '#f0fdf4' : 'white', borderBottom: '1px solid #dcfce7' }}>
                  <td style={{ padding: '2.5mm 4mm', fontSize: '9pt' }}>{item.name}</td>
                  <td style={{ padding: '2.5mm 2mm', textAlign: 'center', fontSize: '9pt' }}>{item.qty}</td>
                  <td style={{ padding: '2.5mm 2mm', textAlign: 'center', fontSize: '9pt', color: '#666' }}>{item.unit}</td>
                  <td style={{ padding: '2.5mm 2mm', textAlign: 'right', fontSize: '9pt' }}>{formatCurrency(item.unitPrice)}</td>
                  <td style={{ padding: '2.5mm 4mm', textAlign: 'right', fontSize: '9pt', fontWeight: '600' }}>{formatCurrency(lineTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}>
          <div style={{ width: '75mm' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2mm 0', borderBottom: '1px solid #dcfce7', fontSize: '9pt' }}>
              <span style={{ color: '#555' }}>{t.quote.subtotal}</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {invoice.includeVat && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2mm 0', borderBottom: '1px solid #dcfce7', fontSize: '9pt' }}>
                <span style={{ color: '#555' }}>{t.quote.vat}</span>
                <span>{formatCurrency(vat)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3mm 4mm', background: '#166534', color: 'white', borderRadius: '3mm', marginTop: '2mm', fontWeight: '800', fontSize: '11pt' }}>
              <span>{t.invoice.total}</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2mm 0', marginTop: '2mm', fontSize: '9pt' }}>
              <span style={{ color: '#555' }}>{t.invoice.amountPaid}</span>
              <span>{formatCurrency(paid)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2mm 4mm', background: balance > 0 ? '#fef3c7' : '#dcfce7', borderRadius: '3mm', fontWeight: '800', fontSize: '10pt', color: balance > 0 ? '#92400e' : '#166534' }}>
              <span>{t.invoice.balance}</span>
              <span>{formatCurrency(balance)}</span>
            </div>
          </div>
        </div>

        {/* Payment history */}
        {(invoice.payments || []).length > 0 && (
          <div style={{ marginBottom: '6mm' }}>
            <div style={{ fontSize: '7pt', fontWeight: '700', color: '#166534', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2mm' }}>
              {t.invoice.payments}
            </div>
            {invoice.payments.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8pt', color: '#555', padding: '1mm 0', borderBottom: '1px solid #f0fdf4' }}>
                <span>{formatDate(p.date)}{p.method ? ` · ${p.method}` : ''}</span>
                <span>{formatCurrency(p.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div style={{ marginBottom: '5mm' }}>
            <div style={{ fontSize: '7pt', fontWeight: '700', color: '#166534', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.5mm' }}>
              {t.quote.notes}
            </div>
            <div style={{ fontSize: '8pt', color: '#555' }}>{invoice.notes}</div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '10mm', textAlign: 'center', color: '#888', fontSize: '8pt', borderTop: '1px solid #dcfce7', paddingTop: '4mm' }}>
          {t.print.thankYou}
        </div>
      </div>
    </>
  );
}
