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
      // V2: Invoices
      if (!db.objectStoreNames.contains('invoices')) {
        const inv = db.createObjectStore('invoices', { keyPath: 'id' });
        inv.createIndex('quoteId', 'quoteId');
        inv.createIndex('clientId', 'clientId');
        inv.createIndex('status', 'status');
        inv.createIndex('createdAt', 'createdAt');
      }
      // V2: Payments (linked to an invoice)
      if (!db.objectStoreNames.contains('payments')) {
        const pay = db.createObjectStore('payments', { keyPath: 'id' });
        pay.createIndex('invoiceId', 'invoiceId');
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

// ─── INVOICES ──────────────────────────────────────────────────────────────

export async function getAllInvoices() {
  const invoices = await getAll('invoices');
  return invoices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getInvoice(id) {
  return tx('invoices', 'readonly', store => store.get(id));
}

export async function getInvoiceByQuote(quoteId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction('invoices', 'readonly');
    const req = t.objectStore('invoices').index('quoteId').get(quoteId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function saveInvoice(invoice) {
  const now = new Date().toISOString();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction('invoices', 'readwrite');
    const store = t.objectStore('invoices');
    if (invoice.id) {
      const getReq = store.get(invoice.id);
      getReq.onsuccess = () => {
        const updated = { ...getReq.result, ...invoice, updatedAt: now };
        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve(updated);
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    } else {
      const allReq = store.getAll();
      allReq.onsuccess = () => {
        const all = allReq.result;
        const year = new Date().getFullYear();
        const count = all.filter(i => i.invoiceNumber?.startsWith(`INV-${year}`)).length + 1;
        const invoiceNumber = `INV-${year}-${String(count).padStart(3, '0')}`;
        const newInvoice = {
          ...invoice,
          id: generateId(),
          invoiceNumber,
          status: 'unpaid',
          amountPaid: 0,
          createdAt: now,
          updatedAt: now,
        };
        const putReq = store.put(newInvoice);
        putReq.onsuccess = () => resolve(newInvoice);
        putReq.onerror = () => reject(putReq.error);
      };
      allReq.onerror = () => reject(allReq.error);
    }
  });
}

export async function deleteInvoice(id) {
  return tx('invoices', 'readwrite', store => store.delete(id));
}

// ─── PAYMENTS ──────────────────────────────────────────────────────────────

export async function getPaymentsByInvoice(invoiceId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction('payments', 'readonly');
    const req = t.objectStore('payments').index('invoiceId').getAll(invoiceId);
    req.onsuccess = () => resolve(req.result.sort((a, b) => new Date(b.date) - new Date(a.date)));
    req.onerror = () => reject(req.error);
  });
}

export async function addPayment(invoiceId, payment) {
  const now = new Date().toISOString();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(['payments', 'invoices'], 'readwrite');
    const payStore = t.objectStore('payments');
    const invStore = t.objectStore('invoices');

    const newPayment = { ...payment, id: generateId(), invoiceId, createdAt: now };
    payStore.put(newPayment);

    // Update invoice amountPaid + status
    const getInv = invStore.get(invoiceId);
    getInv.onsuccess = () => {
      const inv = getInv.result;
      // Sum all existing payments + new
      const payReq = t.objectStore('payments').index('invoiceId').getAll(invoiceId);
      payReq.onsuccess = () => {
        const existingTotal = payReq.result.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
        const amountPaid = existingTotal + (parseFloat(payment.amount) || 0);
        const grandTotal = inv.grandTotal || 0;
        let status = 'unpaid';
        if (amountPaid >= grandTotal) status = 'paid';
        else if (amountPaid > 0) status = 'partial';
        invStore.put({ ...inv, amountPaid, status, updatedAt: now });
      };
    };

    t.oncomplete = () => resolve(newPayment);
    t.onerror = () => reject(t.error);
  });
}

export async function deletePayment(paymentId, invoiceId) {
  const now = new Date().toISOString();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(['payments', 'invoices'], 'readwrite');
    t.objectStore('payments').delete(paymentId);

    const invStore = t.objectStore('invoices');
    const getInv = invStore.get(invoiceId);
    getInv.onsuccess = () => {
      const inv = getInv.result;
      const payReq = t.objectStore('payments').index('invoiceId').getAll(invoiceId);
      payReq.onsuccess = () => {
        const amountPaid = payReq.result
          .filter(p => p.id !== paymentId)
          .reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
        const grandTotal = inv.grandTotal || 0;
        let status = 'unpaid';
        if (amountPaid >= grandTotal) status = 'paid';
        else if (amountPaid > 0) status = 'partial';
        invStore.put({ ...inv, amountPaid, status, updatedAt: now });
      };
    };

    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
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
