import { useEffect, useState, useCallback } from 'react';
import { useLang } from '../i18n/LangContext';
import { getQuote, getClient, updateQuoteStatus, getInvoiceByQuote, saveInvoice, getProjectByQuote, saveProject } from '../db';
import { formatCurrency, formatDate, futureDate } from '../utils/format';
import { Button, StatusBadge, TopBar, Card, Confirm } from '../components/UI';
import { ChevronLeft, Pencil, Printer, CheckCircle, XCircle, Send, FileCheck, Briefcase } from 'lucide-react';

export default function QuoteView({ navigate, params = {} }) {
  const { t } = useLang();
  const [quote, setQuote] = useState(null);
  const [client, setClient] = useState(null);
  const [existingInvoice, setExistingInvoice] = useState(null);
  const [existingProject, setExistingProject] = useState(null);
  const [convertConfirmOpen, setConvertConfirmOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);

  const load = useCallback(async () => {
    const q = await getQuote(params.quoteId);
    if (!q) { navigate('quotes'); return; }
    setQuote(q);
    if (q.clientId) {
      const c = await getClient(q.clientId);
      setClient(c);
    }
    // Check if an invoice already exists for this quote
    const inv = await getInvoiceByQuote(q.id);
    setExistingInvoice(inv);
    
    // Check if a project already exists for this quote
    const proj = await getProjectByQuote(q.id);
    setExistingProject(proj);
  }, [params.quoteId, navigate]);

  useEffect(() => { 
    load(); 
  }, [load]);

  async function handleConvertToInvoice() {
    setConverting(true);
    try {
      // Calculate totals from items
      const subtotal = (quote.items || []).reduce((sum, item) => {
        return sum + ((parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0));
      }, 0);
      const grandTotal = quote.includeVat ? subtotal * 1.14 : subtotal;
      
      const invoice = await saveInvoice({
        quoteId: quote.id,
        quoteNumber: quote.quoteNumber,
        clientId: quote.clientId,
        projectName: quote.projectName,
        items: quote.items,
        subtotal: subtotal,
        grandTotal: grandTotal,
        includeVat: quote.includeVat,
        date: new Date().toISOString().split('T')[0],
        dueDate: futureDate(30),
        terms: quote.terms,
        notes: quote.notes,
      });
      navigate('invoice-view', { invoiceId: invoice.id });
    } catch (error) {
      console.error('Conversion error:', error);
      alert('Error converting to invoice: ' + error.message);
    } finally {
      setConverting(false);
      setConvertConfirmOpen(false);
    }
  }

  async function handleCreateProject() {
    if (existingProject) {
      navigate('project-view', { projectId: existingProject.id });
      return;
    }
    
    setCreatingProject(true);
    try {
      // Calculate totals from items
      const subtotal = (quote.items || []).reduce((sum, item) => {
        return sum + ((parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0));
      }, 0);
      const grandTotal = quote.includeVat ? subtotal * 1.14 : subtotal;
      
      const project = await saveProject({
        quoteId: quote.id,
        clientId: quote.clientId,
        projectName: quote.projectName || 'Untitled Project',
        quoteNumber: quote.quoteNumber,
        grandTotal: grandTotal,
        status: 'not_started',
        startDate: new Date().toISOString().split('T')[0],
      });
      navigate('project-view', { projectId: project.id });
    } catch (error) {
      console.error('Project creation error:', error);
      alert('Error creating project: ' + error.message);
    } finally {
      setCreatingProject(false);
    }
  }

  if (!quote) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 py-20">
        {t.common.loading}
      </div>
    );
  }

  // Calculate totals from items
  const subtotal = (quote.items || []).reduce((sum, item) => {
    return sum + ((parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0));
  }, 0);
  const vat = quote.includeVat ? subtotal * 0.14 : 0;
  const grandTotal = quote.includeVat ? subtotal * 1.14 : subtotal;

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
    <div className="flex flex-col min-h-full pb-28">
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

      <div className="p-4 flex flex-col gap-4">
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

        {/* Project creation - NEW for V4 */}
        {quote.status === 'accepted' && (
          <div className="bg-[#1a2e4a] border border-[#2d5a8d] rounded-2xl p-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-blue-300">
                {existingProject ? 'View Project' : 'Create Project'}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {existingProject ? 'Track progress and expenses' : 'Track progress and expenses'}
              </div>
              {existingProject && (
                <div className="text-xs text-gray-500 mt-0.5">
                  Status: {existingProject.status === 'not_started' && 'Not Started'}
                  {existingProject.status === 'in_progress' && 'In Progress'}
                  {existingProject.status === 'completed' && 'Completed'}
                </div>
              )}
            </div>
            <Button 
              size="sm" 
              onClick={handleCreateProject} 
              disabled={creatingProject}
            >
              <Briefcase size={14} /> 
              {creatingProject ? 'Creating...' : (existingProject ? 'View Project' : 'Create Project')}
            </Button>
          </div>
        )}

        {/* Invoice conversion */}
        {quote.status === 'accepted' && (
          <div className="bg-[#1a2e1a] border border-[#2d5a2d] rounded-2xl p-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-green-300">
                {existingInvoice ? t.invoice.alreadyInvoiced : t.invoice.convertFromQuote}
              </div>
              {existingInvoice && (
                <div className="text-xs text-gray-500 mt-0.5">{existingInvoice.invoiceNumber}</div>
              )}
            </div>
            {existingInvoice ? (
              <Button size="sm" onClick={() => navigate('invoice-view', { invoiceId: existingInvoice.id })}>
                <FileCheck size={14} /> {t.invoice.viewInvoice}
              </Button>
            ) : (
              <Button size="sm" onClick={() => setConvertConfirmOpen(true)} disabled={converting}>
                <FileCheck size={14} /> {t.invoice.convertFromQuote}
              </Button>
            )}
          </div>
        )}

        {/* Company & Client Information - FULL DETAILS */}
        <Card>
          <div className="border-b border-[#2d5a3d] pb-3 mb-3">
            <h3 className="text-green-400 font-bold text-lg">{t.print.quotation}</h3>
            <p className="text-gray-400 text-sm">{quote.quoteNumber}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">{t.print.preparedFor}</p>
              <p className="text-white font-semibold mt-1">{client?.name || 'N/A'}</p>
              {client?.phone && <p className="text-gray-400 text-sm mt-1">📞 {client.phone}</p>}
              {client?.email && <p className="text-gray-400 text-sm">✉️ {client.email}</p>}
              {client?.location && <p className="text-gray-400 text-sm">📍 {client.location}</p>}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">{t.print.preparedBy}</p>
              <p className="text-white font-semibold mt-1">{quote.companyName || 'Your Company'}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#2d5a3d]">
            <div>
              <p className="text-xs text-gray-500">{t.quote.date}</p>
              <p className="text-white text-sm">{formatDate(quote.date) || formatDate(quote.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t.quote.validUntil}</p>
              <p className="text-white text-sm">{quote.validUntil ? formatDate(quote.validUntil) : 'N/A'}</p>
            </div>
          </div>
        </Card>

        {/* Project Name */}
        {quote.projectName && (
          <Card>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{t.print.projectDesc}</p>
            <p className="text-white font-medium mt-1 text-lg">{quote.projectName}</p>
          </Card>
        )}

        {/* Items Table - FULL DETAILS with all columns */}
        <div>
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-2">
            {t.quote.items}
          </label>
          <div className="bg-[#0a1810] border border-[#1e3a2a] rounded-xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 p-3 bg-[#0d2014] border-b border-[#1e3a2a] text-xs font-semibold text-gray-400">
              <div className="col-span-5">Description</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-2 text-center">Unit</div>
              <div className="col-span-3 text-right">Unit Price</div>
            </div>
            
            {/* Table Body */}
            <div className="divide-y divide-[#1e3a2a]">
              {(quote.items || []).filter(i => i.name && i.name.trim()).map((item, idx) => {
                return (
                  <div key={idx} className="grid grid-cols-12 gap-2 p-3 items-center">
                    <div className="col-span-5">
                      <div className="text-white text-sm font-medium">{item.name}</div>
                    </div>
                    <div className="col-span-2 text-center text-gray-300">
                      {parseFloat(item.qty) || 0}
                    </div>
                    <div className="col-span-2 text-center text-gray-300">
                      {item.unit || '-'}
                    </div>
                    <div className="col-span-3 text-right text-gray-300">
                      {formatCurrency(parseFloat(item.unitPrice) || 0)}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Totals Section */}
            <div className="border-t border-[#2d5a3d] bg-[#0d2014]">
              {/* Individual item totals */}
              {(quote.items || []).filter(i => i.name && i.name.trim()).map((item, idx) => {
                const lineTotal = (parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0);
                if (lineTotal === 0) return null;
                return (
                  <div key={`total-${idx}`} className="grid grid-cols-12 gap-2 p-3 border-b border-[#1e3a2a]">
                    <div className="col-span-9 text-right text-gray-400 text-sm">Total for {item.name}:</div>
                    <div className="col-span-3 text-right text-green-400 font-medium">
                      {formatCurrency(lineTotal)}
                    </div>
                  </div>
                );
              })}
              
              {/* Summary totals */}
              <div className="p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{t.quote.subtotal}</span>
                  <span className="text-white font-medium">{formatCurrency(subtotal)}</span>
                </div>
                {quote.includeVat && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{t.quote.vat} (14%)</span>
                    <span className="text-white font-medium">{formatCurrency(vat)}</span>
                  </div>
                )}
                <div className="border-t border-[#2d5a3d] pt-2 flex justify-between items-center">
                  <span className="text-green-400 font-bold text-lg">{t.quote.grandTotal}</span>
                  <span className="text-green-400 font-bold text-2xl">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        {quote.terms && (
          <Card>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{t.print.terms}</p>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{quote.terms}</p>
          </Card>
        )}

        {/* Notes */}
        {quote.notes && (
          <Card>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{t.print.notes}</p>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{quote.notes}</p>
          </Card>
        )}

        {/* Print button */}
        <Button
          onClick={() => navigate('quote-print', { quoteId: quote.id })}
          variant="secondary"
          size="lg"
          className="w-full mt-2"
        >
          <Printer size={18} /> {t.print.print}
        </Button>
      </div>

      {/* Convert to Invoice confirm */}
      <Confirm
        open={convertConfirmOpen}
        message={t.invoice.convertConfirm}
        onConfirm={handleConvertToInvoice}
        onCancel={() => setConvertConfirmOpen(false)}
      />
    </div>
  );
}