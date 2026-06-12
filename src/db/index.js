// IndexedDB wrapper using native browser API (no external dependency)

const DB_NAME = 'quotepro_db';
const DB_VERSION = 2;

let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('clients')) {
        const cs = db.createObjectStore('clients', { keyPath: 'id' });
        cs.createIndex('name', 'name');
      }
      if (!db.objectStoreNames.contains('quotes')) {
        const qs = db.createObjectStore('quotes', { keyPath: 'id' });
        qs.createIndex('clientId', 'clientId');
        qs.createIndex('createdAt', 'createdAt');
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
      if (!db.objectStoreNames.contains('invoices')) {
        const inv = db.createObjectStore('invoices', { keyPath: 'id' });
        inv.createIndex('clientId', 'clientId');
        inv.createIndex('quoteId', 'quoteId');
        inv.createIndex('createdAt', 'createdAt');
      }
    };
  });
}

function tx(storeName, mode, fn) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const req = fn(store);
    if (req && req.onsuccess !== undefined) {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } else {
      transaction.oncomplete = () => resolve(req ? req.result : undefined);
      transaction.onerror = () => reject(transaction.error);
    }
  }));
}

function getAll(storeName) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const t = db.transaction(storeName, 'readonly');
    const req = t.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ─── CLIENTS ───────────────────────────────────────────────────────────────

export async function getAllClients() {
  return getAll('clients');
}

export async function getClient(id) {
  return tx('clients', 'readonly', store => store.get(id));
}

export async function saveClient(client) {
  const now = new Date().toISOString();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction('clients', 'readwrite');
    const store = t.objectStore('clients');
    if (client.id) {
      const getReq = store.get(client.id);
      getReq.onsuccess = () => {
        const updated = { ...getReq.result, ...client, updatedAt: now };
        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve(updated);
        putReq.onerror = () => reject(putReq.error);
      };
    } else {
      const newClient = { ...client, id: generateId(), createdAt: now, updatedAt: now };
      const putReq = store.put(newClient);
      putReq.onsuccess = () => resolve(newClient);
      putReq.onerror = () => reject(putReq.error);
    }
  });
}

export async function deleteClient(id) {
  return tx('clients', 'readwrite', store => store.delete(id));
}

// ─── QUOTES ────────────────────────────────────────────────────────────────

export async function getAllQuotes() {
  const quotes = await getAll('quotes');
  return quotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getQuote(id) {
  return tx('quotes', 'readonly', store => store.get(id));
}

export async function saveQuote(quote) {
  const now = new Date().toISOString();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction('quotes', 'readwrite');
    const store = t.objectStore('quotes');
    if (quote.id) {
      const getReq = store.get(quote.id);
      getReq.onsuccess = () => {
        const updated = { ...getReq.result, ...quote, updatedAt: now };
        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve(updated);
        putReq.onerror = () => reject(putReq.error);
      };
    } else {
      // Generate quote number — need count first
      const allReq = store.getAll();
      allReq.onsuccess = () => {
        const all = allReq.result;
        const year = new Date().getFullYear();
        const count = all.filter(q => q.quoteNumber?.startsWith(`QP-${year}`)).length + 1;
        const quoteNumber = `QP-${year}-${String(count).padStart(3, '0')}`;
        const newQuote = { ...quote, id: generateId(), quoteNumber, status: quote.status || 'draft', createdAt: now, updatedAt: now };
        const putReq = store.put(newQuote);
        putReq.onsuccess = () => resolve(newQuote);
        putReq.onerror = () => reject(putReq.error);
      };
    }
  });
}

export async function deleteQuote(id) {
  return tx('quotes', 'readwrite', store => store.delete(id));
}

export async function updateQuoteStatus(id, status) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction('quotes', 'readwrite');
    const store = t.objectStore('quotes');
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const quote = { ...getReq.result, status, updatedAt: new Date().toISOString() };
      const putReq = store.put(quote);
      putReq.onsuccess = () => resolve(quote);
      putReq.onerror = () => reject(putReq.error);
    };
  });
}

// ─── SETTINGS ──────────────────────────────────────────────────────────────

export async function getSetting(key) {
  return tx('settings', 'readonly', store => store.get(key));
}

export async function setSetting(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction('settings', 'readwrite');
    const req = t.objectStore('settings').put(value, key);
    req.onsuccess = () => resolve(value);
    req.onerror = () => reject(req.error);
  });
}

// ─── INVOICES ──────────────────────────────────────────────────────────────

export async function getAllInvoices() {
  const invoices = await getAll('invoices');
  return invoices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getInvoice(id) {
  return tx('invoices', 'readonly', store => store.get(id));
}

export async function getInvoiceByQuote(quoteId) {
  const all = await getAll('invoices');
  return all.find(inv => inv.quoteId === quoteId) || null;
}

function paymentsTotal(payments) {
  return (payments || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
}

function invoiceStatus(grandTotal, payments) {
  const paid = paymentsTotal(payments);
  if (paid <= 0) return 'unpaid';
  if (paid + 0.001 >= grandTotal) return 'paid';
  return 'partial';
}

export async function createInvoiceFromQuote(quote, grandTotal, dueDays = 30) {
  const existing = await getInvoiceByQuote(quote.id);
  if (existing) return existing;
  const now = new Date().toISOString();
  const db = await openDB();
  const invoice = await new Promise((resolve, reject) => {
    const t = db.transaction('invoices', 'readwrite');
    const store = t.objectStore('invoices');
    const allReq = store.getAll();
    allReq.onsuccess = () => {
      const all = allReq.result;
      const year = new Date().getFullYear();
      const count = all.filter(i => i.invoiceNumber?.startsWith(`INV-${year}`)).length + 1;
      const invoiceNumber = `INV-${year}-${String(count).padStart(3, '0')}`;
      const due = new Date();
      due.setDate(due.getDate() + dueDays);
      const newInvoice = {
        id: generateId(),
        invoiceNumber,
        quoteId: quote.id,
        quoteNumber: quote.quoteNumber,
        clientId: quote.clientId,
        projectName: quote.projectName,
        items: quote.items || [],
        includeVat: !!quote.includeVat,
        terms: quote.terms || '',
        notes: quote.notes || '',
        grandTotal: grandTotal,
        date: now.split('T')[0],
        dueDate: due.toISOString().split('T')[0],
        payments: [],
        status: 'unpaid',
        createdAt: now,
        updatedAt: now,
      };
      const putReq = store.put(newInvoice);
      putReq.onsuccess = () => resolve(newInvoice);
      putReq.onerror = () => reject(putReq.error);
    };
    allReq.onerror = () => reject(allReq.error);
  });
  return invoice;
}

export async function addPayment(invoiceId, payment) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction('invoices', 'readwrite');
    const store = t.objectStore('invoices');
    const getReq = store.get(invoiceId);
    getReq.onsuccess = () => {
      const invoice = getReq.result;
      if (!invoice) { reject(new Error('Invoice not found')); return; }
      const payments = [
        ...(invoice.payments || []),
        { id: generateId(), amount: parseFloat(payment.amount) || 0, date: payment.date, method: payment.method || '', note: payment.note || '' },
      ];
      const updated = { ...invoice, payments, status: invoiceStatus(invoice.grandTotal, payments), updatedAt: new Date().toISOString() };
      const putReq = store.put(updated);
      putReq.onsuccess = () => resolve(updated);
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function deletePayment(invoiceId, paymentId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction('invoices', 'readwrite');
    const store = t.objectStore('invoices');
    const getReq = store.get(invoiceId);
    getReq.onsuccess = () => {
      const invoice = getReq.result;
      if (!invoice) { reject(new Error('Invoice not found')); return; }
      const payments = (invoice.payments || []).filter(p => p.id !== paymentId);
      const updated = { ...invoice, payments, status: invoiceStatus(invoice.grandTotal, payments), updatedAt: new Date().toISOString() };
      const putReq = store.put(updated);
      putReq.onsuccess = () => resolve(updated);
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function deleteInvoice(id) {
  return tx('invoices', 'readwrite', store => store.delete(id));
}

export { paymentsTotal };
