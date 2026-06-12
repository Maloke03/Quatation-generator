export function formatCurrency(amount, symbol = 'M') {
  if (isNaN(amount) || amount === null || amount === undefined) return `${symbol}0.00`;
  return `${symbol}${Number(amount).toLocaleString('en-LS', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export function futureDate(days = 30) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function calcLineTotal(qty, unitPrice) {
  const q = parseFloat(qty) || 0;
  const p = parseFloat(unitPrice) || 0;
  return q * p;
}

export function calcSubtotal(items) {
  return items.reduce((sum, item) => sum + calcLineTotal(item.qty, item.unitPrice), 0);
}

export function calcVAT(subtotal, rate = 0.14) {
  return subtotal * rate;
}

export function calcGrandTotal(subtotal, includeVat, vatRate = 0.14) {
  return includeVat ? subtotal + calcVAT(subtotal, vatRate) : subtotal;
}

export function statusColor(status) {
  const map = {
    draft: { bg: '#1e3a2a', text: '#6ee7a0', border: '#2d5a3d' },
    sent: { bg: '#1a2e4a', text: '#60a5fa', border: '#1e3f6e' },
    accepted: { bg: '#1a3a1a', text: '#4ade80', border: '#2d5a2d' },
    rejected: { bg: '#3a1a1a', text: '#f87171', border: '#5a2d2d' },
  };
  return map[status] || map.draft;
}
