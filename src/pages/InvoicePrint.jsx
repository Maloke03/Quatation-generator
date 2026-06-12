import { useEffect, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { getInvoice, getClient, getPaymentsByInvoice, getSetting } from '../db';
import { formatCurrency, formatDate } from '../utils/format';
import { Button, TopBar } from '../components/UI';
import { ChevronLeft, Printer } from 'lucide-react';

export default function InvoicePrint({ navigate, params = {} }) {
  const { t } = useLang();
  const [invoice, setInvoice] = useState(null);
  const [client, setClient] = useState(null);
  const [payments, setPayments] = useState([]);
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
      getPaymentsByInvoice(inv.id).then(setPayments);
    }
    load();
  }, [params.invoiceId]);

  if (!invoice) return null;

  const grandTotal = invoice.grandTotal || 0;
  const amountPaid = invoice.amountPaid || 0;
  const balance = grandTotal - amountPaid;
  const isPaid = invoice.status === 'paid';

  return (
    <>
      {/* Screen chrome */}
      <div className="print:hidden">
        <TopBar
          title={`${t.invoice.invoice} ${invoice.invoiceNumber}`}
          left={
            <button onClick={() => navigate('invoice-view', { invoiceId: invoice.id })} className="text-gray-400 hover:text-white mr-1">
              <ChevronLeft size={22} />
            </button>
          }
          right={
            <Button size="sm" onClick={() => window.print()}>
              <Printer size={15} /> {t.print.print}
            </Button>
          }
        />
        <div className="p-4 pb-6">
          <p className="text-gray-500 text-sm text-center">Preview below. Tap "Print / Save PDF" to save or share.</p>
        </div>
      </div>

      {/* Printable invoice */}
      <div
        className="print-area mx-auto bg-white text-gray-900"
        style={{
          maxWidth: '210mm',
          minHeight: '297mm',
          padding: '16mm 14mm',
          fontFamily: "'Inter', sans-serif",
          fontSize: '10pt',
          lineHeight: '1.5',
          position: 'relative',
        }}
      >
        {/* PAID watermark stamp */}
        {isPaid && (
          <div style={{
            position: 'absolute',
            top: '55mm',
            right: '20mm',
            fontSize: '40pt',
            fontWeight: '900',
            color: 'rgba(22,101,52,0.12)',
            border: '6px solid rgba(22,101,52,0.12)',
            padding: '4mm 8mm',
            borderRadius: '4mm',
            transform: 'rotate(-20deg)',
            letterSpacing: '4px',
            pointerEvents: 'none',
            userSelect: 'none',
          }}>
            PAID
          </div>
        )}

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
              INVOICE
            </div>
            <div style={{ color: '#555', marginTop: '2mm', fontSize: '9pt' }}>
              <strong>{t.invoice.invoiceNumber}:</strong> {invoice.invoiceNumber}
            </div>
            {invoice.quoteId && (
              <div style={{ color: '#888', fontSize: '8pt' }}>
                Ref: {invoice.quoteNumber || ''}
              </div>
            )}
            <div style={{ color: '#555', fontSize: '9pt' }}>
              <strong>{t.print.date}:</strong> {formatDate(invoice.date)}
            </div>
            {invoice.dueDate && (
              <div style={{ color: '#c00', fontSize: '9pt', fontWeight: '700' }}>
                <strong>{t.invoice.dueDate}:</strong> {formatDate(invoice.dueDate)}
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '2px solid #166534', marginBottom: '6mm' }} />

        {/* Client + Project */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8mm', marginBottom: '6mm' }}>
          <div>
            <div style={{ fontSize: '7pt', fontWeight: '700', color: '#166534', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2mm' }}>
              {t.print.preparedFor}
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
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6mm' }}>
          <div style={{ width: '75mm' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2mm 0', borderBottom: '1px solid #dcfce7', fontSize: '9pt' }}>
              <span style={{ color: '#555' }}>{t.quote.subtotal}</span>
              <span>{formatCurrency(invoice.subtotal || 0)}</span>
            </div>
            {invoice.includeVat && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2mm 0', borderBottom: '1px solid #dcfce7', fontSize: '9pt' }}>
                <span style={{ color: '#555' }}>{t.quote.vat}</span>
                <span>{formatCurrency((invoice.subtotal || 0) * 0.14)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3mm 4mm', background: '#166534', color: 'white', borderRadius: '3mm', marginTop: '2mm', fontWeight: '800', fontSize: '11pt' }}>
              <span>{t.quote.grandTotal}</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
            {/* Payment summary */}
            {amountPaid > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2mm 0', marginTop: '2mm', fontSize: '9pt', color: '#166534' }}>
                  <span>{t.invoice.amountPaid}</span>
                  <span style={{ fontWeight: '700' }}>({formatCurrency(amountPaid)})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2mm 4mm', background: isPaid ? '#f0fdf4' : '#fff3e0', borderRadius: '3mm', fontWeight: '800', fontSize: '10pt', color: isPaid ? '#166534' : '#c00' }}>
                  <span>{t.invoice.balance}</span>
                  <span>{isPaid ? 'PAID' : formatCurrency(balance)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Payment history */}
        {payments.length > 0 && (
          <div style={{ marginBottom: '6mm' }}>
            <div style={{ fontSize: '7pt', fontWeight: '700', color: '#166534', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2mm' }}>
              {t.invoice.payments}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
              <thead>
                <tr style={{ background: '#f0fdf4' }}>
                  <th style={{ padding: '1.5mm 3mm', textAlign: 'left', fontWeight: '600', color: '#555' }}>Date</th>
                  <th style={{ padding: '1.5mm 3mm', textAlign: 'left', fontWeight: '600', color: '#555' }}>Method</th>
                  <th style={{ padding: '1.5mm 3mm', textAlign: 'left', fontWeight: '600', color: '#555' }}>Note</th>
                  <th style={{ padding: '1.5mm 3mm', textAlign: 'right', fontWeight: '600', color: '#555' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, idx) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #dcfce7' }}>
                    <td style={{ padding: '1.5mm 3mm', color: '#555' }}>{formatDate(p.date)}</td>
                    <td style={{ padding: '1.5mm 3mm', color: '#555' }}>{p.method}</td>
                    <td style={{ padding: '1.5mm 3mm', color: '#888' }}>{p.note || '—'}</td>
                    <td style={{ padding: '1.5mm 3mm', textAlign: 'right', fontWeight: '600', color: '#166534' }}>{formatCurrency(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Terms */}
        {invoice.terms && (
          <div style={{ marginBottom: '5mm' }}>
            <div style={{ fontSize: '7pt', fontWeight: '700', color: '#166534', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.5mm' }}>
              {t.quote.terms}
            </div>
            <div style={{ fontSize: '8pt', color: '#555', lineHeight: '1.6' }}>{invoice.terms}</div>
          </div>
        )}

        {/* Signatures */}
        <div style={{ marginTop: '10mm', borderTop: '1px solid #dcfce7', paddingTop: '5mm', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10mm' }}>
          <div>
            <div style={{ borderBottom: '1px solid #999', marginBottom: '1.5mm', height: '8mm' }} />
            <div style={{ fontSize: '8pt', color: '#666' }}>{t.print.signature}</div>
            <div style={{ fontSize: '8pt', color: '#888', marginTop: '1mm' }}>Date: ___________________</div>
          </div>
          <div>
            <div style={{ borderBottom: '1px solid #999', marginBottom: '1.5mm', height: '8mm' }} />
            <div style={{ fontSize: '8pt', color: '#666' }}>{t.print.acceptance}</div>
            <div style={{ fontSize: '8pt', color: '#888', marginTop: '1mm' }}>Date: ___________________</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '6mm', textAlign: 'center', color: '#888', fontSize: '8pt', borderTop: '1px solid #dcfce7', paddingTop: '3mm' }}>
          {t.print.thankYou}
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .print-area { box-shadow: none !important; margin: 0 !important; max-width: 100% !important; }
          @page { margin: 0; size: A4; }
        }
      `}</style>
    </>
  );
}
