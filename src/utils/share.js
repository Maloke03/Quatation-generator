// WhatsApp sharing utilities

/** 
 * Share text via WhatsApp
 * @param {string} text - The text to share
 * @param {string} phoneNumber - Optional phone number (international format without +)
 */
export function shareViaWhatsApp(text, phoneNumber = null) {
  let url = 'https://wa.me/';
  
  if (phoneNumber) {
    // Remove any non-digit characters and ensure no + at start
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    url += cleanNumber;
  }
  
  url += `?text=${encodeURIComponent(text)}`;
  
  // Open in new window
  window.open(url, '_blank');
}

/**
 * Share a quote as WhatsApp message
 * @param {object} quote - Quote object
 * @param {object} client - Client object
 * @param {object} company - Company settings
 * @param {string} phoneNumber - Optional client phone number
 */
export function shareQuote(quote, client, company, phoneNumber = null) {
  const itemsList = (quote.items || [])
    .filter(item => item.name)
    .map(item => {
      const qty = parseFloat(item.qty) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const total = qty * price;
      return `• ${item.name}: ${qty} ${item.unit || 'units'} × ${formatCurrencyShort(price)} = ${formatCurrencyShort(total)}`;
    })
    .join('\n');
  
  const subtotal = (quote.items || []).reduce((sum, item) => {
    return sum + ((parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0));
  }, 0);
  const grandTotal = quote.includeVat ? subtotal * 1.14 : subtotal;
  
  const message = `🏗️ *QUOTATION* 🏗️\n\n` +
    `*${company?.name || 'Our Company'}*\n` +
    `Quote #: ${quote.quoteNumber}\n` +
    `Date: ${new Date(quote.date || quote.createdAt).toLocaleDateString()}\n\n` +
    `*Client:* ${client?.name || 'N/A'}\n` +
    `*Project:* ${quote.projectName || 'N/A'}\n\n` +
    `*Items:*\n${itemsList}\n\n` +
    `*Subtotal:* ${formatCurrencyShort(subtotal)}\n` +
    (quote.includeVat ? `*VAT (14%):* ${formatCurrencyShort(subtotal * 0.14)}\n` : '') +
    `*GRAND TOTAL:* ${formatCurrencyShort(grandTotal)}\n\n` +
    `*Valid Until:* ${quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : 'N/A'}\n\n` +
    `_This is an official quotation from ${company?.name || 'our company'}. For questions, please contact us._`;
  
  shareViaWhatsApp(message, phoneNumber || client?.phone);
}

/**
 * Share an invoice via WhatsApp
 * @param {object} invoice - Invoice object
 * @param {object} client - Client object
 * @param {object} company - Company settings
 * @param {string} phoneNumber - Optional client phone number
 */
export function shareInvoice(invoice, client, company, phoneNumber = null) {
  const itemsList = (invoice.items || [])
    .filter(item => item.name)
    .map(item => {
      const qty = parseFloat(item.qty) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const total = qty * price;
      return `• ${item.name}: ${qty} ${item.unit || 'units'} × ${formatCurrencyShort(price)} = ${formatCurrencyShort(total)}`;
    })
    .join('\n');
  
  const amountPaid = invoice.amountPaid || 0;
  const balanceDue = (invoice.grandTotal || 0) - amountPaid;
  const status = invoice.status === 'paid' ? '✅ PAID' : invoice.status === 'partial' ? '⚠️ PARTIALLY PAID' : '❌ UNPAID';
  
  const message = `💰 *INVOICE* 💰\n\n` +
    `*${company?.name || 'Our Company'}*\n` +
    `Invoice #: ${invoice.invoiceNumber}\n` +
    `Date: ${new Date(invoice.createdAt).toLocaleDateString()}\n` +
    `Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}\n\n` +
    `*Client:* ${client?.name || 'N/A'}\n` +
    `*Project:* ${invoice.projectName || 'N/A'}\n\n` +
    `*Items:*\n${itemsList}\n\n` +
    `*Total Amount:* ${formatCurrencyShort(invoice.grandTotal || 0)}\n` +
    `*Amount Paid:* ${formatCurrencyShort(amountPaid)}\n` +
    `*Balance Due:* ${formatCurrencyShort(balanceDue)}\n` +
    `*Status:* ${status}\n\n` +
    `_Payment is due within 30 days. Please quote invoice number when making payment._`;
  
  shareViaWhatsApp(message, phoneNumber || client?.phone);
}

/**
 * Share a project update via WhatsApp
 * @param {object} project - Project object
 * @param {object} client - Client object
 * @param {string} update - Update message
 * @param {string} phoneNumber - Optional client phone number
 */
export function shareProjectUpdate(project, client, update, phoneNumber = null) {
  const message = `🏗️ *PROJECT UPDATE* 🏗️\n\n` +
    `*Project:* ${project.projectName}\n` +
    `*Client:* ${client?.name || 'N/A'}\n` +
    `*Status:* ${project.status === 'in_progress' ? '🟡 In Progress' : project.status === 'completed' ? '✅ Completed' : '⚪ Not Started'}\n\n` +
    `*Update:*\n${update}\n\n` +
    `_Thank you for choosing ${project.companyName || 'us'} for your construction needs._`;
  
  shareViaWhatsApp(message, phoneNumber || client?.phone);
}

/**
 * Share a site report via WhatsApp
 * @param {object} report - Site report object
 * @param {object} project - Project object
 * @param {object} client - Client object
 * @param {string} phoneNumber - Optional client phone number
 */
export function shareSiteReport(report, project, client, phoneNumber = null) {
  const message = `📋 *DAILY SITE REPORT* 📋\n\n` +
    `*Project:* ${project?.projectName || 'N/A'}\n` +
    `*Client:* ${client?.name || 'N/A'}\n` +
    `*Date:* ${new Date(report.date).toLocaleDateString()}\n\n` +
    `*Work Completed:*\n${report.workCompleted || 'N/A'}\n\n` +
    `*Materials Used:*\n${(report.materialsUsed || []).map(m => `• ${m.name}: ${m.quantity} ${m.unit}`).join('\n') || 'None'}\n\n` +
    `*Workers Present:* ${report.workersPresent?.length || 0} workers\n\n` +
    `*Issues Encountered:*\n${report.issues || 'None'}\n\n` +
    `*Plan for Tomorrow:*\n${report.tomorrowPlan || 'Not specified'}\n\n` +
    `_Report generated on ${new Date().toLocaleDateString()}_`;
  
  shareViaWhatsApp(message, phoneNumber || client?.phone);
}

// Helper function for short currency format (no M symbol duplication)
function formatCurrencyShort(amount) {
  return `M${(amount || 0).toLocaleString('en-LS', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}