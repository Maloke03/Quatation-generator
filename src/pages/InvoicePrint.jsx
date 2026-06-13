import { useEffect, useState, useCallback } from 'react';
import { useLang } from '../i18n/LangContext';
import { getInvoice, getClient, getSetting } from '../db';
import { formatCurrency, formatDate } from '../utils/format';
import { TopBar, Button } from '../components/UI';
import { ChevronLeft, Printer } from 'lucide-react';

export default function InvoicePrint({ navigate, params }) {
  const { t } = useLang();
  const [invoice, setInvoice] = useState(null);
  const [client, setClient] = useState(null);
  const [company, setCompany] = useState({});

  const loadData = useCallback(async () => {
    const inv = await getInvoice(params.invoiceId);
    if (!inv) {
      navigate('invoices');
      return;
    }
    setInvoice(inv);
    
    const cl = await getClient(inv.clientId);
    setClient(cl);
    
    const comp = await getSetting('company');
    setCompany(comp || {});
  }, [params.invoiceId, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePrint = () => {
    window.print();
  };

  if (!invoice) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 py-20">
        {t.common.loading}
      </div>
    );
  }

  const subtotal = invoice.subtotal || 0;
  const vat = invoice.includeVat ? subtotal * 0.14 : 0;
  const grandTotal = invoice.grandTotal || subtotal + vat;

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title={t.invoice.invoice}
        left={
          <button onClick={() => navigate('invoices')} className="text-gray-400 hover:text-white mr-1">
            <ChevronLeft size={22} />
          </button>
        }
        right={
          <Button size="sm" onClick={handlePrint}>
            <Printer size={15} /> {t.print.print}
          </Button>
        }
      />

      <div className="p-4 print:p-0">
        <div className="bg-white text-gray-800 rounded-xl print:rounded-none p-6 print:p-4">
          {/* Header */}
          <div className="border-b pb-4 mb-4">
            <h1 className="text-2xl font-bold text-green-600">{t.invoice.invoice}</h1>
            <p className="text-gray-500">{invoice.invoiceNumber}</p>
          </div>

          {/* Company & Client */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs text-gray-500 uppercase">{t.print.preparedBy}</p>
              <p className="font-semibold">{company?.name || 'Your Company'}</p>
              {company?.phone && <p className="text-sm">{company.phone}</p>}
              {company?.email && <p className="text-sm">{company.email}</p>}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">{t.print.preparedFor}</p>
              <p className="font-semibold">{client?.name || 'N/A'}</p>
              {client?.phone && <p className="text-sm">{client.phone}</p>}
              {client?.location && <p className="text-sm">{client.location}</p>}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs text-gray-500">{t.print.date}</p>
              <p>{formatDate(invoice.date)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t.invoice.dueDate}</p>
              <p>{formatDate(invoice.dueDate)}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Description</th>
                  <th className="text-center py-2">Qty</th>
                  <th className="text-center py-2">Unit</th>
                  <th className="text-right py-2">Unit Price</th>
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2">{item.name}</td>
                    <td className="text-center">{item.qty}</td>
                    <td className="text-center">{item.unit || '-'}</td>
                    <td className="text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="text-right">{formatCurrency((item.qty || 0) * (item.unitPrice || 0))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="4" className="text-right py-2">Subtotal</td>
                  <td className="text-right">{formatCurrency(subtotal)}</td>
                </tr>
                {invoice.includeVat && (
                  <tr>
                    <td colSpan="4" className="text-right py-1">VAT (14%)</td>
                    <td className="text-right">{formatCurrency(vat)}</td>
                  </tr>
                )}
                <tr className="border-t">
                  <td colSpan="4" className="text-right py-2 font-bold">Grand Total</td>
                  <td className="text-right font-bold text-green-600">{formatCurrency(grandTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Status */}
          <div className="mb-4">
            <span className={`inline-block px-3 py-1 rounded-full text-sm ${
              invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
              invoice.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {t.invoice.statuses[invoice.status]}
            </span>
          </div>

          {/* Terms */}
          {invoice.terms && (
            <div className="text-sm text-gray-600 mt-4 pt-4 border-t">
              <p className="font-semibold mb-1">{t.invoice.paymentTerms}</p>
              <p>{invoice.terms}</p>
            </div>
          )}

          {/* Thank you */}
          <div className="text-center text-gray-500 text-sm mt-6 pt-4 border-t">
            {t.print.thankYou}
          </div>
        </div>
      </div>
    </div>
  );
}