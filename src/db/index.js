// IndexedDB wrapper using native browser API (no external dependency)

const DB_NAME = 'quotepro_db';
const DB_VERSION = 8;  // Upgraded to V8

let _db = null;
let _dbInitPromise = null;

// Default materials for V3 (Lesotho construction)
const DEFAULT_MATERIALS = [
  { name: 'Cement (50kg)', category: 'Building', pricePerUnit: 120, unit: 'bag' },
  { name: 'Brick (common)', category: 'Building', pricePerUnit: 3.50, unit: 'each' },
  { name: 'Sand (river)', category: 'Aggregates', pricePerUnit: 350, unit: 'cubic meter' },
  { name: 'Stone (19mm)', category: 'Aggregates', pricePerUnit: 400, unit: 'cubic meter' },
  { name: 'Roofing Sheet (iron)', category: 'Roofing', pricePerUnit: 85, unit: 'sheet' },
  { name: 'Timber (pine 3x2)', category: 'Timber', pricePerUnit: 28, unit: 'meter' },
  { name: 'Paint (20L)', category: 'Finishing', pricePerUnit: 850, unit: 'bucket' },
  { name: 'Window (aluminium)', category: 'Fittings', pricePerUnit: 1200, unit: 'each' },
  { name: 'Door (timber)', category: 'Fittings', pricePerUnit: 1800, unit: 'each' },
  { name: 'Nails (kg)', category: 'Hardware', pricePerUnit: 25, unit: 'kg' },
  { name: 'Rebar (12mm)', category: 'Steel', pricePerUnit: 95, unit: 'length' },
  { name: 'Plumbing Pipe (4m)', category: 'Plumbing', pricePerUnit: 180, unit: 'piece' }
];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Initialize database - singleton pattern with safe version handling
function initDB() {
  if (_db) return Promise.resolve(_db);
  if (_dbInitPromise) return _dbInitPromise;
  
  _dbInitPromise = new Promise((resolve, reject) => {
    // First, check what version exists
    const checkRequest = indexedDB.open(DB_NAME);
    let existingVersion = 0;
    
    checkRequest.onupgradeneeded = (event) => {
      existingVersion = event.oldVersion;
      checkRequest.transaction.abort();
    };
    
    checkRequest.onsuccess = () => {
      existingVersion = checkRequest.result.version;
      checkRequest.result.close();
      
      // Determine which version to use (never downgrade)
      const targetVersion = Math.max(DB_VERSION, existingVersion);
      
      const request = indexedDB.open(DB_NAME, targetVersion);
      
      request.onerror = (event) => {
        console.error('Database error:', event.target.error);
        _dbInitPromise = null;
        reject(event.target.error);
      };
      
      request.onsuccess = (event) => {
        _db = event.target.result;
        _dbInitPromise = null;
        
        // Handle connection close
        _db.onversionchange = () => {
          if (_db) {
            _db.close();
            _db = null;
          }
        };
        
        resolve(_db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const oldVersion = event.oldVersion;
        
        console.log(`Upgrading database from version ${oldVersion} to ${targetVersion}`);
        
        // Version 1: Clients, Quotes, Settings
        if (oldVersion < 1) {
          if (!db.objectStoreNames.contains('clients')) {
            const cs = db.createObjectStore('clients', { keyPath: 'id' });
            cs.createIndex('name', 'name');
            cs.createIndex('createdAt', 'createdAt');
          }
          
          if (!db.objectStoreNames.contains('quotes')) {
            const qs = db.createObjectStore('quotes', { keyPath: 'id' });
            qs.createIndex('clientId', 'clientId');
            qs.createIndex('status', 'status');
            qs.createIndex('createdAt', 'createdAt');
          }
          
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings');
          }
        }
        
        // Version 2: Invoices, Payments
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('invoices')) {
            const inv = db.createObjectStore('invoices', { keyPath: 'id' });
            inv.createIndex('quoteId', 'quoteId');
            inv.createIndex('clientId', 'clientId');
            inv.createIndex('status', 'status');
            inv.createIndex('createdAt', 'createdAt');
          }
          
          if (!db.objectStoreNames.contains('payments')) {
            const pay = db.createObjectStore('payments', { keyPath: 'id' });
            pay.createIndex('invoiceId', 'invoiceId');
            pay.createIndex('date', 'date');
          }
        }
        
        // Version 3: Materials
        if (oldVersion < 3) {
          if (!db.objectStoreNames.contains('materials')) {
            const mat = db.createObjectStore('materials', { keyPath: 'id' });
            mat.createIndex('name', 'name');
            mat.createIndex('category', 'category');
            mat.createIndex('pricePerUnit', 'pricePerUnit');
            
            if (oldVersion === 0) {
              const transaction = event.target.transaction;
              const materialStore = transaction.objectStore('materials');
              DEFAULT_MATERIALS.forEach(material => {
                materialStore.add({ ...material, id: generateId(), createdAt: new Date().toISOString() });
              });
            }
          }
        }
        
        // Version 4: Projects, Expenses
        if (oldVersion < 4) {
          if (!db.objectStoreNames.contains('projects')) {
            const proj = db.createObjectStore('projects', { keyPath: 'id' });
            proj.createIndex('quoteId', 'quoteId', { unique: true });
            proj.createIndex('clientId', 'clientId');
            proj.createIndex('status', 'status');
            proj.createIndex('createdAt', 'createdAt');
            proj.createIndex('startDate', 'startDate');
          }
          
          if (!db.objectStoreNames.contains('expenses')) {
            const exp = db.createObjectStore('expenses', { keyPath: 'id' });
            exp.createIndex('projectId', 'projectId');
            exp.createIndex('category', 'category');
            exp.createIndex('date', 'date');
            exp.createIndex('createdAt', 'createdAt');
          }
        }
        
        // Version 5: Inventory, Workers, Attendance
        if (oldVersion < 5) {
          if (!db.objectStoreNames.contains('inventory')) {
            const inv = db.createObjectStore('inventory', { keyPath: 'id' });
            inv.createIndex('materialId', 'materialId');
            inv.createIndex('materialName', 'materialName');
            inv.createIndex('category', 'category');
            inv.createIndex('updatedAt', 'updatedAt');
          }
          
          if (!db.objectStoreNames.contains('inventoryTransactions')) {
            const trans = db.createObjectStore('inventoryTransactions', { keyPath: 'id' });
            trans.createIndex('materialId', 'materialId');
            trans.createIndex('type', 'type');
            trans.createIndex('date', 'date');
            trans.createIndex('projectId', 'projectId');
          }
          
          if (!db.objectStoreNames.contains('workers')) {
            const worker = db.createObjectStore('workers', { keyPath: 'id' });
            worker.createIndex('name', 'name');
            worker.createIndex('role', 'role');
            worker.createIndex('isActive', 'isActive');
            worker.createIndex('createdAt', 'createdAt');
          }
          
          if (!db.objectStoreNames.contains('attendance')) {
            const attend = db.createObjectStore('attendance', { keyPath: 'id' });
            attend.createIndex('workerId', 'workerId');
            attend.createIndex('date', 'date');
            attend.createIndex('projectId', 'projectId');
            attend.createIndex('month', 'month');
          }
        }
        
        // Version 7: Site Reports (V6 was skipped)
        if (oldVersion < 7) {
          if (!db.objectStoreNames.contains('siteReports')) {
            const report = db.createObjectStore('siteReports', { keyPath: 'id' });
            report.createIndex('projectId', 'projectId');
            report.createIndex('date', 'date');
            report.createIndex('createdAt', 'createdAt');
          }
        }
        
        // Version 8: Users & Subscriptions
        if (oldVersion < 8) {
          if (!db.objectStoreNames.contains('users')) {
            const userStore = db.createObjectStore('users', { keyPath: 'id' });
            userStore.createIndex('deviceId', 'deviceId', { unique: true });
            userStore.createIndex('firstSeen', 'firstSeen');
            userStore.createIndex('trialEnds', 'trialEnds');
            userStore.createIndex('isActive', 'isActive');
            userStore.createIndex('hasPaid', 'hasPaid');
          }
          
          if (!db.objectStoreNames.contains('subscriptionPayments')) {
            const payStore = db.createObjectStore('subscriptionPayments', { keyPath: 'id' });
            payStore.createIndex('userId', 'userId');
            payStore.createIndex('date', 'date');
            payStore.createIndex('status', 'status');
          }
        }
      };
    };
    
    checkRequest.onerror = () => {
      // Fallback: open with current version
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = (event) => {
        _dbInitPromise = null;
        reject(event.target.error);
      };
      
      request.onsuccess = (event) => {
        _db = event.target.result;
        _dbInitPromise = null;
        resolve(_db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create all stores if this is a fresh database
        if (!db.objectStoreNames.contains('clients')) {
          const cs = db.createObjectStore('clients', { keyPath: 'id' });
          cs.createIndex('name', 'name');
          cs.createIndex('createdAt', 'createdAt');
        }
        
        if (!db.objectStoreNames.contains('quotes')) {
          const qs = db.createObjectStore('quotes', { keyPath: 'id' });
          qs.createIndex('clientId', 'clientId');
          qs.createIndex('status', 'status');
          qs.createIndex('createdAt', 'createdAt');
        }
        
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
        
        if (!db.objectStoreNames.contains('invoices')) {
          const inv = db.createObjectStore('invoices', { keyPath: 'id' });
          inv.createIndex('quoteId', 'quoteId');
          inv.createIndex('clientId', 'clientId');
          inv.createIndex('status', 'status');
          inv.createIndex('createdAt', 'createdAt');
        }
        
        if (!db.objectStoreNames.contains('payments')) {
          const pay = db.createObjectStore('payments', { keyPath: 'id' });
          pay.createIndex('invoiceId', 'invoiceId');
          pay.createIndex('date', 'date');
        }
        
        if (!db.objectStoreNames.contains('materials')) {
          const mat = db.createObjectStore('materials', { keyPath: 'id' });
          mat.createIndex('name', 'name');
          mat.createIndex('category', 'category');
          mat.createIndex('pricePerUnit', 'pricePerUnit');
        }
        
        if (!db.objectStoreNames.contains('projects')) {
          const proj = db.createObjectStore('projects', { keyPath: 'id' });
          proj.createIndex('quoteId', 'quoteId', { unique: true });
          proj.createIndex('clientId', 'clientId');
          proj.createIndex('status', 'status');
          proj.createIndex('createdAt', 'createdAt');
          proj.createIndex('startDate', 'startDate');
        }
        
        if (!db.objectStoreNames.contains('expenses')) {
          const exp = db.createObjectStore('expenses', { keyPath: 'id' });
          exp.createIndex('projectId', 'projectId');
          exp.createIndex('category', 'category');
          exp.createIndex('date', 'date');
          exp.createIndex('createdAt', 'createdAt');
        }
        
        if (!db.objectStoreNames.contains('inventory')) {
          const inv = db.createObjectStore('inventory', { keyPath: 'id' });
          inv.createIndex('materialId', 'materialId');
          inv.createIndex('materialName', 'materialName');
          inv.createIndex('category', 'category');
          inv.createIndex('updatedAt', 'updatedAt');
        }
        
        if (!db.objectStoreNames.contains('inventoryTransactions')) {
          const trans = db.createObjectStore('inventoryTransactions', { keyPath: 'id' });
          trans.createIndex('materialId', 'materialId');
          trans.createIndex('type', 'type');
          trans.createIndex('date', 'date');
          trans.createIndex('projectId', 'projectId');
        }
        
        if (!db.objectStoreNames.contains('workers')) {
          const worker = db.createObjectStore('workers', { keyPath: 'id' });
          worker.createIndex('name', 'name');
          worker.createIndex('role', 'role');
          worker.createIndex('isActive', 'isActive');
          worker.createIndex('createdAt', 'createdAt');
        }
        
        if (!db.objectStoreNames.contains('attendance')) {
          const attend = db.createObjectStore('attendance', { keyPath: 'id' });
          attend.createIndex('workerId', 'workerId');
          attend.createIndex('date', 'date');
          attend.createIndex('projectId', 'projectId');
          attend.createIndex('month', 'month');
        }
        
        if (!db.objectStoreNames.contains('siteReports')) {
          const report = db.createObjectStore('siteReports', { keyPath: 'id' });
          report.createIndex('projectId', 'projectId');
          report.createIndex('date', 'date');
          report.createIndex('createdAt', 'createdAt');
        }
        
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id' });
          userStore.createIndex('deviceId', 'deviceId', { unique: true });
          userStore.createIndex('firstSeen', 'firstSeen');
          userStore.createIndex('trialEnds', 'trialEnds');
          userStore.createIndex('isActive', 'isActive');
          userStore.createIndex('hasPaid', 'hasPaid');
        }
        
        if (!db.objectStoreNames.contains('subscriptionPayments')) {
          const payStore = db.createObjectStore('subscriptionPayments', { keyPath: 'id' });
          payStore.createIndex('userId', 'userId');
          payStore.createIndex('date', 'date');
          payStore.createIndex('status', 'status');
        }
      };
    };
  });
  
  return _dbInitPromise;
}

// Get database instance
async function getDB() {
  return await initDB();
}

// Cache for frequent access
const _cache = new Map();
const CACHE_TTL = 5000;

async function getAll(storeName, skipCache = false) {
  if (!skipCache && _cache.has(storeName)) {
    const { data, timestamp } = _cache.get(storeName);
    if (Date.now() - timestamp < CACHE_TTL) {
      return data;
    }
    _cache.delete(storeName);
  }
  
  try {
    const db = await getDB();
    
    if (!db.objectStoreNames.contains(storeName)) {
      return [];
    }
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        
        request.onsuccess = () => {
          _cache.set(storeName, { data: request.result, timestamp: Date.now() });
          resolve(request.result);
        };
        
        request.onerror = () => reject(request.error);
      } catch (error) {
        if (error.name === 'NotFoundError' || error.name === 'InvalidStateError') {
          resolve([]);
        } else {
          reject(error);
        }
      }
    });
  } catch (error) {
    console.error(`Error getting ${storeName}:`, error);
    return [];
  }
}

function clearCache(storeName) {
  _cache.delete(storeName);
}

// ─── CLIENTS ───────────────────────────────────────────────────────────────

export async function getAllClients() {
  return getAll('clients');
}

export async function getClient(id) {
  if (!id) return null;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('clients', 'readonly');
    const store = transaction.objectStore('clients');
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveClient(client) {
  if (!client || !client.name) throw new Error('Client name is required');
  
  const now = new Date().toISOString();
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('clients', 'readwrite');
    const store = transaction.objectStore('clients');
    
    if (client.id) {
      const getRequest = store.get(client.id);
      getRequest.onsuccess = () => {
        if (!getRequest.result) {
          reject(new Error('Client not found'));
          return;
        }
        const updated = { ...getRequest.result, ...client, updatedAt: now };
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => {
          clearCache('clients');
          resolve(updated);
        };
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    } else {
      const newClient = { ...client, id: generateId(), createdAt: now, updatedAt: now };
      const putRequest = store.put(newClient);
      putRequest.onsuccess = () => {
        clearCache('clients');
        resolve(newClient);
      };
      putRequest.onerror = () => reject(putRequest.error);
    }
    
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function deleteClient(id) {
  clearCache('clients');
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('clients', 'readwrite');
    const store = transaction.objectStore('clients');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ─── QUOTES ────────────────────────────────────────────────────────────────

export async function getAllQuotes() {
  const quotes = await getAll('quotes');
  return quotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getQuotesByClient(clientId) {
  const quotes = await getAll('quotes');
  return quotes.filter(q => q.clientId === clientId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getQuote(id) {
  if (!id) return null;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('quotes', 'readonly');
    const store = transaction.objectStore('quotes');
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveQuote(quote) {
  if (!quote || !quote.clientId) throw new Error('Client ID is required');
  
  const hasItems = quote.items?.some(i => i.name?.trim() && parseFloat(i.qty) > 0);
  if (!hasItems) throw new Error('Quote must have at least one line item');
  
  const now = new Date().toISOString();
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('quotes', 'readwrite');
    const store = transaction.objectStore('quotes');
    
    if (quote.id) {
      const getRequest = store.get(quote.id);
      getRequest.onsuccess = () => {
        if (!getRequest.result) {
          reject(new Error('Quote not found'));
          return;
        }
        const updated = { ...getRequest.result, ...quote, updatedAt: now };
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => {
          clearCache('quotes');
          resolve(updated);
        };
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    } else {
      const allRequest = store.getAll();
      allRequest.onsuccess = () => {
        const all = allRequest.result || [];
        const year = new Date().getFullYear();
        const count = all.filter(q => q.quoteNumber?.startsWith(`QP-${year}`)).length + 1;
        const quoteNumber = `QP-${year}-${String(count).padStart(3, '0')}`;
        
        const subtotal = (quote.items || []).reduce((sum, item) => {
          return sum + ((parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0));
        }, 0);
        const vatAmount = quote.includeVat ? subtotal * 0.14 : 0;
        const grandTotal = subtotal + vatAmount;
        
        const newQuote = { 
          ...quote, 
          id: generateId(), 
          quoteNumber,
          subtotal: subtotal,
          vatAmount: vatAmount,
          grandTotal: grandTotal,
          status: quote.status || 'draft', 
          createdAt: now, 
          updatedAt: now 
        };
        const putRequest = store.put(newQuote);
        putRequest.onsuccess = () => {
          clearCache('quotes');
          resolve(newQuote);
        };
        putRequest.onerror = () => reject(putRequest.error);
      };
      allRequest.onerror = () => reject(allRequest.error);
    }
    
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function deleteQuote(id) {
  clearCache('quotes');
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('quotes', 'readwrite');
    const store = transaction.objectStore('quotes');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function updateQuoteStatus(id, status) {
  if (!id || !status) throw new Error('Quote ID and status are required');
  
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('quotes', 'readwrite');
    const store = transaction.objectStore('quotes');
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      if (!getRequest.result) {
        reject(new Error('Quote not found'));
        return;
      }
      const quote = { ...getRequest.result, status, updatedAt: new Date().toISOString() };
      const putRequest = store.put(quote);
      putRequest.onsuccess = () => {
        clearCache('quotes');
        resolve(quote);
      };
      putRequest.onerror = () => reject(putRequest.error);
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

// ─── INVOICES ──────────────────────────────────────────────────────────────

export async function getAllInvoices() {
  const invoices = await getAll('invoices');
  return invoices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getInvoicesByClient(clientId) {
  const invoices = await getAll('invoices');
  return invoices.filter(i => i.clientId === clientId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getInvoice(id) {
  if (!id) return null;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('invoices', 'readonly');
    const store = transaction.objectStore('invoices');
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function getInvoiceByQuote(quoteId) {
  if (!quoteId) return null;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('invoices', 'readonly');
    const store = transaction.objectStore('invoices');
    const index = store.index('quoteId');
    const request = index.get(quoteId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveInvoice(invoice) {
  if (!invoice || !invoice.quoteId) throw new Error('Quote ID is required');
  if (!invoice.grandTotal && invoice.grandTotal !== 0) throw new Error('Invoice total is required');
  
  const now = new Date().toISOString();
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('invoices', 'readwrite');
    const store = transaction.objectStore('invoices');
    
    if (invoice.id) {
      const getRequest = store.get(invoice.id);
      getRequest.onsuccess = () => {
        if (!getRequest.result) {
          reject(new Error('Invoice not found'));
          return;
        }
        const updated = { ...getRequest.result, ...invoice, updatedAt: now };
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => {
          clearCache('invoices');
          resolve(updated);
        };
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    } else {
      const allRequest = store.getAll();
      allRequest.onsuccess = () => {
        const all = allRequest.result;
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
        const putRequest = store.put(newInvoice);
        putRequest.onsuccess = () => {
          clearCache('invoices');
          resolve(newInvoice);
        };
        putRequest.onerror = () => reject(putRequest.error);
      };
      allRequest.onerror = () => reject(allRequest.error);
    }
    
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function deleteInvoice(id) {
  clearCache('invoices');
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('invoices', 'readwrite');
    const store = transaction.objectStore('invoices');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ─── PAYMENTS (Invoice Payments) ──────────────────────────────────────────

export async function getPaymentsByInvoice(invoiceId) {
  if (!invoiceId) return [];
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('payments', 'readonly');
    const store = transaction.objectStore('payments');
    const index = store.index('invoiceId');
    const request = index.getAll(invoiceId);
    request.onsuccess = () => resolve(request.result.sort((a, b) => new Date(b.date) - new Date(a.date)));
    request.onerror = () => reject(request.error);
  });
}

export async function addPayment(invoiceId, payment) {
  if (!invoiceId) throw new Error('Invoice ID is required');
  if (!payment.amount || payment.amount <= 0) throw new Error('Valid payment amount is required');
  
  const now = new Date().toISOString();
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['payments', 'invoices'], 'readwrite');
    const payStore = transaction.objectStore('payments');
    const invStore = transaction.objectStore('invoices');

    const newPayment = { 
      ...payment, 
      id: generateId(), 
      invoiceId, 
      date: payment.date || now,
      createdAt: now 
    };
    payStore.put(newPayment);

    const getInv = invStore.get(invoiceId);
    getInv.onsuccess = () => {
      if (!getInv.result) {
        reject(new Error('Invoice not found'));
        return;
      }
      
      const inv = getInv.result;
      const payIndex = transaction.objectStore('payments').index('invoiceId');
      const payReq = payIndex.getAll(invoiceId);
      payReq.onsuccess = () => {
        const existingTotal = payReq.result.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
        const amountPaid = existingTotal + (parseFloat(payment.amount) || 0);
        const grandTotal = inv.grandTotal || 0;
        
        let status = 'unpaid';
        if (amountPaid >= grandTotal) status = 'paid';
        else if (amountPaid > 0) status = 'partial';
        
        invStore.put({ ...inv, amountPaid, status, updatedAt: now });
        clearCache('invoices');
        clearCache('payments');
      };
      payReq.onerror = () => reject(payReq.error);
    };
    getInv.onerror = () => reject(getInv.error);

    transaction.oncomplete = () => resolve(newPayment);
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function deletePayment(paymentId, invoiceId) {
  if (!paymentId || !invoiceId) throw new Error('Payment ID and Invoice ID are required');
  
  const now = new Date().toISOString();
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['payments', 'invoices'], 'readwrite');
    transaction.objectStore('payments').delete(paymentId);

    const invStore = transaction.objectStore('invoices');
    const getInv = invStore.get(invoiceId);
    getInv.onsuccess = () => {
      if (!getInv.result) {
        reject(new Error('Invoice not found'));
        return;
      }
      
      const inv = getInv.result;
      const payIndex = transaction.objectStore('payments').index('invoiceId');
      const payReq = payIndex.getAll(invoiceId);
      payReq.onsuccess = () => {
        const amountPaid = payReq.result
          .filter(p => p.id !== paymentId)
          .reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
        const grandTotal = inv.grandTotal || 0;
        
        let status = 'unpaid';
        if (amountPaid >= grandTotal) status = 'paid';
        else if (amountPaid > 0) status = 'partial';
        
        invStore.put({ ...inv, amountPaid, status, updatedAt: now });
        clearCache('invoices');
        clearCache('payments');
      };
      payReq.onerror = () => reject(payReq.error);
    };
    getInv.onerror = () => reject(getInv.error);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// ─── MATERIALS (V3) ─────────────────────────────────────────────────────────

export async function getAllMaterials() {
  return getAll('materials');
}

export async function getMaterialsByCategory(category) {
  if (!category) return [];
  const materials = await getAll('materials');
  return materials.filter(m => m.category === category);
}

export async function getMaterial(id) {
  if (!id) return null;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('materials', 'readonly');
    const store = transaction.objectStore('materials');
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveMaterial(material) {
  if (!material || !material.name) throw new Error('Material name is required');
  if (!material.pricePerUnit || material.pricePerUnit <= 0) throw new Error('Valid price is required');
  
  const now = new Date().toISOString();
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('materials', 'readwrite');
    const store = transaction.objectStore('materials');
    
    if (material.id) {
      const getRequest = store.get(material.id);
      getRequest.onsuccess = () => {
        if (!getRequest.result) {
          reject(new Error('Material not found'));
          return;
        }
        const updated = { ...getRequest.result, ...material, updatedAt: now };
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => {
          clearCache('materials');
          resolve(updated);
        };
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    } else {
      const newMaterial = { 
        ...material, 
        id: generateId(), 
        createdAt: now, 
        updatedAt: now 
      };
      const putRequest = store.put(newMaterial);
      putRequest.onsuccess = () => {
        clearCache('materials');
        resolve(newMaterial);
      };
      putRequest.onerror = () => reject(putRequest.error);
    }
    
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function deleteMaterial(id) {
  clearCache('materials');
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('materials', 'readwrite');
    const store = transaction.objectStore('materials');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function searchMaterials(query) {
  if (!query) return getAllMaterials();
  
  const materials = await getAll('materials');
  const lowerQuery = query.toLowerCase();
  return materials.filter(m => 
    m.name.toLowerCase().includes(lowerQuery) || 
    m.category.toLowerCase().includes(lowerQuery)
  );
}

// ─── PROJECTS (V4) ─────────────────────────────────────────────────────────

export async function getAllProjects() {
  const projects = await getAll('projects');
  return projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getProjectsByClient(clientId) {
  const projects = await getAll('projects');
  return projects.filter(p => p.clientId === clientId);
}

export async function getProjectsByStatus(status) {
  const projects = await getAll('projects');
  return projects.filter(p => p.status === status);
}

export async function getProject(id) {
  if (!id) return null;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('projects', 'readonly');
    const store = transaction.objectStore('projects');
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function getProjectByQuote(quoteId) {
  if (!quoteId) return null;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('projects', 'readonly');
    const store = transaction.objectStore('projects');
    const index = store.index('quoteId');
    const request = index.get(quoteId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveProject(project) {
  if (!project || !project.quoteId) throw new Error('Quote ID is required');
  if (!project.clientId) throw new Error('Client ID is required');
  
  const now = new Date().toISOString();
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('projects', 'readwrite');
    const store = transaction.objectStore('projects');
    
    if (project.id) {
      const getRequest = store.get(project.id);
      getRequest.onsuccess = () => {
        if (!getRequest.result) {
          reject(new Error('Project not found'));
          return;
        }
        const updated = { ...getRequest.result, ...project, updatedAt: now };
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => {
          clearCache('projects');
          resolve(updated);
        };
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    } else {
      const newProject = {
        ...project,
        id: generateId(),
        status: project.status || 'not_started',
        createdAt: now,
        updatedAt: now,
      };
      const putRequest = store.put(newProject);
      putRequest.onsuccess = () => {
        clearCache('projects');
        resolve(newProject);
      };
      putRequest.onerror = () => reject(putRequest.error);
    }
    
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function updateProjectStatus(id, status) {
  if (!id || !status) throw new Error('Project ID and status are required');
  
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('projects', 'readwrite');
    const store = transaction.objectStore('projects');
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      if (!getRequest.result) {
        reject(new Error('Project not found'));
        return;
      }
      const project = { ...getRequest.result, status, updatedAt: new Date().toISOString() };
      const putRequest = store.put(project);
      putRequest.onsuccess = () => {
        clearCache('projects');
        resolve(project);
      };
      putRequest.onerror = () => reject(putRequest.error);
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function deleteProject(id) {
  clearCache('projects');
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('projects', 'readwrite');
    const store = transaction.objectStore('projects');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ─── EXPENSES (V4) ─────────────────────────────────────────────────────────

export async function getExpensesByProject(projectId) {
  if (!projectId) return [];
  const expenses = await getAll('expenses');
  return expenses.filter(e => e.projectId === projectId).sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function getAllExpenses() {
  const expenses = await getAll('expenses');
  return expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function getExpense(id) {
  if (!id) return null;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('expenses', 'readonly');
    const store = transaction.objectStore('expenses');
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveExpense(expense) {
  if (!expense || !expense.projectId) throw new Error('Project ID is required');
  if (!expense.amount || expense.amount <= 0) throw new Error('Valid amount is required');
  
  const now = new Date().toISOString();
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('expenses', 'readwrite');
    const store = transaction.objectStore('expenses');
    
    if (expense.id) {
      const getRequest = store.get(expense.id);
      getRequest.onsuccess = () => {
        if (!getRequest.result) {
          reject(new Error('Expense not found'));
          return;
        }
        const updated = { ...getRequest.result, ...expense, updatedAt: now };
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => {
          clearCache('expenses');
          resolve(updated);
        };
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    } else {
      const newExpense = {
        ...expense,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      const putRequest = store.put(newExpense);
      putRequest.onsuccess = () => {
        clearCache('expenses');
        resolve(newExpense);
      };
      putRequest.onerror = () => reject(putRequest.error);
    }
    
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function deleteExpense(id) {
  clearCache('expenses');
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('expenses', 'readwrite');
    const store = transaction.objectStore('expenses');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getTotalExpensesByProject(projectId) {
  const expenses = await getExpensesByProject(projectId);
  return expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
}

// ─── INVENTORY (V5) ─────────────────────────────────────────────────────────

export async function getAllInventory() {
  const inventory = await getAll('inventory');
  return inventory.sort((a, b) => a.materialName?.localeCompare(b.materialName));
}

export async function getInventoryItem(id) {
  if (!id) return null;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('inventory', 'readonly');
    const store = transaction.objectStore('inventory');
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function getInventoryByMaterial(materialId) {
  const inventory = await getAll('inventory');
  return inventory.find(i => i.materialId === materialId) || null;
}

export async function saveInventoryItem(item) {
  if (!item || !item.materialName) throw new Error('Material name is required');
  if (item.stock === undefined || item.stock < 0) throw new Error('Valid stock amount is required');
  
  const now = new Date().toISOString();
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('inventory', 'readwrite');
    const store = transaction.objectStore('inventory');
    
    if (item.id) {
      const getRequest = store.get(item.id);
      getRequest.onsuccess = () => {
        if (!getRequest.result) {
          reject(new Error('Inventory item not found'));
          return;
        }
        const updated = { ...getRequest.result, ...item, updatedAt: now };
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => {
          clearCache('inventory');
          resolve(updated);
        };
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    } else {
      const newItem = {
        ...item,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      const putRequest = store.put(newItem);
      putRequest.onsuccess = () => {
        clearCache('inventory');
        resolve(newItem);
      };
      putRequest.onerror = () => reject(putRequest.error);
    }
    
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function addInventoryTransaction(transactionData) {
  if (!transactionData || !transactionData.materialId) throw new Error('Material ID is required');
  if (!transactionData.quantity) throw new Error('Quantity is required');
  
  const now = new Date().toISOString();
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['inventoryTransactions', 'inventory'], 'readwrite');
    const transStore = transaction.objectStore('inventoryTransactions');
    const invStore = transaction.objectStore('inventory');
    
    const newTransaction = {
      ...transactionData,
      id: generateId(),
      createdAt: now,
    };
    transStore.put(newTransaction);
    
    const getInv = invStore.get(transactionData.materialId);
    getInv.onsuccess = () => {
      const inventory = getInv.result;
      if (inventory) {
        const newStock = transactionData.type === 'purchase' 
          ? (inventory.stock || 0) + transactionData.quantity
          : (inventory.stock || 0) - transactionData.quantity;
        
        invStore.put({ ...inventory, stock: newStock, updatedAt: now });
        clearCache('inventory');
        clearCache('inventoryTransactions');
      }
    };
    
    transaction.oncomplete = () => resolve(newTransaction);
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getInventoryTransactions(materialId) {
  const transactions = await getAll('inventoryTransactions');
  return transactions.filter(t => t.materialId === materialId).sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function getLowStockItems(threshold = 10) {
  const inventory = await getAll('inventory');
  return inventory.filter(item => (item.stock || 0) <= (item.reorderLevel || threshold));
}

// ─── WORKERS (V5) ─────────────────────────────────────────────────────────

export async function getAllWorkers() {
  const workers = await getAll('workers');
  return workers.sort((a, b) => a.name?.localeCompare(b.name));
}

export async function getActiveWorkers() {
  const workers = await getAll('workers');
  return workers.filter(w => w.isActive !== false).sort((a, b) => a.name?.localeCompare(b.name));
}

export async function getWorker(id) {
  if (!id) return null;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('workers', 'readonly');
    const store = transaction.objectStore('workers');
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveWorker(worker) {
  if (!worker || !worker.name) throw new Error('Worker name is required');
  
  const now = new Date().toISOString();
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('workers', 'readwrite');
    const store = transaction.objectStore('workers');
    
    if (worker.id) {
      const getRequest = store.get(worker.id);
      getRequest.onsuccess = () => {
        if (!getRequest.result) {
          reject(new Error('Worker not found'));
          return;
        }
        const updated = { ...getRequest.result, ...worker, updatedAt: now };
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => {
          clearCache('workers');
          resolve(updated);
        };
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    } else {
      const newWorker = {
        ...worker,
        id: generateId(),
        isActive: worker.isActive !== false,
        createdAt: now,
        updatedAt: now,
      };
      const putRequest = store.put(newWorker);
      putRequest.onsuccess = () => {
        clearCache('workers');
        resolve(newWorker);
      };
      putRequest.onerror = () => reject(putRequest.error);
    }
    
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function deleteWorker(id) {
  clearCache('workers');
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('workers', 'readwrite');
    const store = transaction.objectStore('workers');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ─── ATTENDANCE (V5) ───────────────────────────────────────────────────────

export async function getAttendanceByWorker(workerId, month) {
  const attendance = await getAll('attendance');
  return attendance.filter(a => a.workerId === workerId && (!month || a.month === month));
}

export async function getAttendanceByDate(date) {
  const attendance = await getAll('attendance');
  return attendance.filter(a => a.date === date);
}

export async function getAttendanceByProject(projectId) {
  const attendance = await getAll('attendance');
  return attendance.filter(a => a.projectId === projectId);
}

export async function saveAttendance(attendanceRecord) {
  if (!attendanceRecord || !attendanceRecord.workerId) throw new Error('Worker ID is required');
  if (!attendanceRecord.date) throw new Error('Date is required');
  
  const now = new Date().toISOString();
  const db = await getDB();
  
  // Check if attendance already exists for this worker on this date
  const existing = await getAll('attendance');
  const exists = existing.find(a => a.workerId === attendanceRecord.workerId && a.date === attendanceRecord.date);
  
  if (exists && !attendanceRecord.id) {
    attendanceRecord.id = exists.id;
  }
  
  attendanceRecord.month = attendanceRecord.date.substring(0, 7);
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('attendance', 'readwrite');
    const store = transaction.objectStore('attendance');
    
    if (attendanceRecord.id) {
      const getRequest = store.get(attendanceRecord.id);
      getRequest.onsuccess = () => {
        const updated = { ...getRequest.result, ...attendanceRecord, updatedAt: now };
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => {
          clearCache('attendance');
          resolve(updated);
        };
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    } else {
      attendanceRecord.id = generateId();
      attendanceRecord.createdAt = now;
      const putRequest = store.put(attendanceRecord);
      putRequest.onsuccess = () => {
        clearCache('attendance');
        resolve(attendanceRecord);
      };
      putRequest.onerror = () => reject(putRequest.error);
    }
    
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getMonthlyWages(yearMonth) {
  const attendance = await getAll('attendance');
  const monthAttendance = attendance.filter(a => a.month === yearMonth);
  const workers = await getAllWorkers();
  
  const wages = {};
  for (const worker of workers) {
    const workerAttendance = monthAttendance.filter(a => a.workerId === worker.id);
    const totalHours = workerAttendance.reduce((sum, a) => sum + (a.hoursWorked || 0), 0);
    const totalOvertime = workerAttendance.reduce((sum, a) => sum + (a.overtime || 0), 0);
    const daysPresent = workerAttendance.length;
    
    wages[worker.id] = {
      workerName: worker.name,
      dailyRate: worker.dailyRate || 0,
      daysPresent,
      totalHours,
      totalOvertime,
      totalWage: (daysPresent * (worker.dailyRate || 0)) + (totalOvertime * (worker.overtimeRate || (worker.dailyRate / 8) * 1.5 || 0))
    };
  }
  
  return wages;
}

// ─── SETTINGS ──────────────────────────────────────────────────────────────

export async function getSetting(key) {
  if (!key) return null;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('settings', 'readonly');
    const store = transaction.objectStore('settings');
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function setSetting(key, value) {
  if (!key) throw new Error('Setting key is required');
  
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('settings', 'readwrite');
    const store = transaction.objectStore('settings');
    const request = store.put(value, key);
    request.onsuccess = () => {
      clearCache('settings');
      resolve(value);
    };
    request.onerror = () => reject(request.error);
  });
}

// ─── UTILITY ────────────────────────────────────────────────────────────────

export async function getAllCompanySettings() {
  const settings = await getAll('settings');
  const settingsObj = {};
  settings.forEach(setting => {
    if (setting.key) settingsObj[setting.key] = setting.value;
  });
  return settingsObj;
}

export async function clearAllData() {
  const stores = ['clients', 'quotes', 'invoices', 'payments', 'materials', 'projects', 'expenses', 'inventory', 'inventoryTransactions', 'workers', 'attendance', 'siteReports', 'users', 'subscriptionPayments', 'settings'];
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(stores, 'readwrite');
    let completed = 0;
    let hasError = false;
    
    stores.forEach(storeName => {
      if (db.objectStoreNames.contains(storeName)) {
        const request = transaction.objectStore(storeName).clear();
        request.onsuccess = () => {
          completed++;
          clearCache(storeName);
          if (completed === stores.length && !hasError) resolve();
        };
        request.onerror = () => {
          if (!hasError) {
            hasError = true;
            reject(request.error);
          }
        };
      } else {
        completed++;
        if (completed === stores.length && !hasError) resolve();
      }
    });
    
    transaction.onerror = () => {
      if (!hasError) reject(transaction.error);
    };
  });
}

// ─── SITE REPORTS (V7) ─────────────────────────────────────────────────────

export async function getAllSiteReports() {
  const reports = await getAll('siteReports');
  return reports.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function getSiteReportsByProject(projectId) {
  if (!projectId) return [];
  const reports = await getAll('siteReports');
  return reports.filter(r => r.projectId === projectId).sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function getSiteReport(id) {
  if (!id) return null;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('siteReports', 'readonly');
    const store = transaction.objectStore('siteReports');
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveSiteReport(report) {
  if (!report || !report.projectId) throw new Error('Project ID is required');
  if (!report.date) throw new Error('Date is required');
  
  const now = new Date().toISOString();
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('siteReports', 'readwrite');
    const store = transaction.objectStore('siteReports');
    
    if (report.id) {
      const getRequest = store.get(report.id);
      getRequest.onsuccess = () => {
        if (!getRequest.result) {
          reject(new Error('Report not found'));
          return;
        }
        const updated = { ...getRequest.result, ...report, updatedAt: now };
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => {
          clearCache('siteReports');
          resolve(updated);
        };
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    } else {
      const newReport = {
        ...report,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
        photos: report.photos || []
      };
      const putRequest = store.put(newReport);
      putRequest.onsuccess = () => {
        clearCache('siteReports');
        resolve(newReport);
      };
      putRequest.onerror = () => reject(putRequest.error);
    }
    
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function deleteSiteReport(id) {
  clearCache('siteReports');
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('siteReports', 'readwrite');
    const store = transaction.objectStore('siteReports');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ─── USERS & SUBSCRIPTIONS (V8) ───────────────────────────────────────────

export async function getUserByDeviceId(deviceId) {
  const users = await getAll('users');
  return users.find(u => u.deviceId === deviceId) || null;
}

export async function getUser(id) {
  if (!id) return null;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('users', 'readonly');
    const store = transaction.objectStore('users');
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function getOrCreateUser(deviceId, deviceInfo = {}) {
  let user = await getUserByDeviceId(deviceId);
  
  if (!user) {
    const now = new Date().toISOString();
    const trialEnds = new Date();
    trialEnds.setDate(trialEnds.getDate() + 30); // 30-day trial
    
    user = {
      id: generateId(),
      deviceId: deviceId,
      deviceInfo: deviceInfo,
      firstSeen: now,
      lastSeen: now,
      trialEnds: trialEnds.toISOString(),
      isActive: true,
      hasPaid: false,
      subscriptionStatus: 'trial', // 'trial' | 'active' | 'expired' | 'suspended'
      createdAt: now,
      updatedAt: now
    };
    
    await saveUser(user);
  } else {
    // Update last seen
    user.lastSeen = new Date().toISOString();
    await saveUser(user);
  }
  
  return user;
}

export async function saveUser(user) {
  if (!user || !user.id) throw new Error('User ID is required');
  
  const now = new Date().toISOString();
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('users', 'readwrite');
    const store = transaction.objectStore('users');
    
    user.updatedAt = now;
    const request = store.put(user);
    request.onsuccess = () => {
      clearCache('users');
      resolve(user);
    };
    request.onerror = () => reject(request.error);
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getAllUsers() {
  const users = await getAll('users');
  return users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getActiveUsers() {
  const users = await getAll('users');
  const now = new Date();
  return users.filter(u => {
    const trialEnds = new Date(u.trialEnds);
    return u.isActive && (u.hasPaid || trialEnds > now);
  });
}

export async function checkUserAccess(deviceId) {
  const user = await getUserByDeviceId(deviceId);
  if (!user) return { allowed: false, reason: 'User not found' };
  
  const now = new Date();
  const trialEnds = new Date(user.trialEnds);
  
  // Check if user has paid subscription
  if (user.hasPaid) {
    return { allowed: true, user, status: 'paid' };
  }
  
  // Check if trial is still valid
  if (trialEnds > now && user.isActive) {
    const daysLeft = Math.ceil((trialEnds - now) / (1000 * 60 * 60 * 24));
    return { allowed: true, user, status: 'trial', daysLeft };
  }
  
  // Trial expired or user inactive
  return { allowed: false, user, status: 'expired' };
}

export async function recordSubscriptionPayment(userId, amount, method = 'M-Pesa', reference = '') {
  const now = new Date().toISOString();
  const db = await getDB();
  
  // Get user
  const user = await getUser(userId);
  if (!user) throw new Error('User not found');
  
  // Update user
  user.hasPaid = true;
  user.subscriptionStatus = 'active';
  user.lastPaymentDate = now;
  
  // Record payment
  const payment = {
    id: generateId(),
    userId: userId,
    amount: amount,
    method: method,
    reference: reference,
    date: now,
    status: 'completed',
    createdAt: now
  };
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['users', 'subscriptionPayments'], 'readwrite');
    const userStore = transaction.objectStore('users');
    const payStore = transaction.objectStore('subscriptionPayments');
    
    userStore.put(user);
    payStore.put(payment);
    
    transaction.oncomplete = () => {
      clearCache('users');
      clearCache('subscriptionPayments');
      resolve(payment);
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function extendTrial(userId, days = 30) {
  const user = await getUser(userId);
  if (!user) throw new Error('User not found');
  
  const newTrialEnd = new Date(user.trialEnds);
  newTrialEnd.setDate(newTrialEnd.getDate() + days);
  user.trialEnds = newTrialEnd.toISOString();
  
  await saveUser(user);
  return user;
}

export async function getUserPaymentHistory(userId) {
  const payments = await getAll('subscriptionPayments');
  return payments.filter(p => p.userId === userId).sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function getUserStats() {
  const users = await getAll('users');
  const now = new Date();
  
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isActive).length;
  const paidUsers = users.filter(u => u.hasPaid).length;
  const trialUsers = users.filter(u => {
    if (u.hasPaid) return false;
    const trialEnds = new Date(u.trialEnds);
    return trialEnds > now && u.isActive;
  }).length;
  const expiredUsers = users.filter(u => {
    if (u.hasPaid) return false;
    const trialEnds = new Date(u.trialEnds);
    return trialEnds <= now && u.isActive;
  }).length;
  
  const payments = await getAll('subscriptionPayments');
  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  
  return {
    totalUsers,
    activeUsers,
    paidUsers,
    trialUsers,
    expiredUsers,
    totalRevenue
  };
}

// ─── SUBSCRIPTION PAYMENTS (V8) ───────────────────────────────────────────

export async function getAllSubscriptionPayments() {
  const payments = await getAll('subscriptionPayments');
  return payments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getSubscriptionPayment(id) {
  if (!id) return null;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('subscriptionPayments', 'readonly');
    const store = transaction.objectStore('subscriptionPayments');
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function recordPayment(userId, amount, method, reference) {
  const now = new Date().toISOString();
  const db = await getDB();
  
  const payment = {
    id: generateId(),
    userId: userId,
    amount: amount,
    method: method,
    reference: reference,
    status: 'pending', // pending, completed, rejected
    date: now,
    createdAt: now
  };
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['subscriptionPayments', 'users'], 'readwrite');
    const payStore = transaction.objectStore('subscriptionPayments');
    const userStore = transaction.objectStore('users');
    
    payStore.put(payment);
    
    // Get user and mark as pending
    const getUserReq = userStore.get(userId);
    getUserReq.onsuccess = () => {
      const user = getUserReq.result;
      if (user) {
        user.subscriptionStatus = 'pending';
        userStore.put(user);
      }
    };
    
    transaction.oncomplete = () => {
      clearCache('subscriptionPayments');
      clearCache('users');
      resolve(payment);
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function verifyPayment(paymentId) {
  const db = await getDB();
  const now = new Date().toISOString();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['subscriptionPayments', 'users'], 'readwrite');
    const payStore = transaction.objectStore('subscriptionPayments');
    const userStore = transaction.objectStore('users');
    
    // Get payment
    const getPay = payStore.get(paymentId);
    getPay.onsuccess = () => {
      const payment = getPay.result;
      if (!payment) {
        reject(new Error('Payment not found'));
        return;
      }
      
      // Update payment status
      payment.status = 'completed';
      payment.verifiedAt = now;
      payStore.put(payment);
      
      // Update user
      const getUsers = userStore.getAll();
      getUsers.onsuccess = () => {
        const allUsers = getUsers.result;
        const user = allUsers.find(u => u.id === payment.userId);
        if (user) {
          user.hasPaid = true;
          user.subscriptionStatus = 'active';
          user.lastPaymentDate = now;
          userStore.put(user);
        }
      };
    };
    
    transaction.oncomplete = () => {
      clearCache('subscriptionPayments');
      clearCache('users');
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function rejectPayment(paymentId) {
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['subscriptionPayments', 'users'], 'readwrite');
    const payStore = transaction.objectStore('subscriptionPayments');
    const userStore = transaction.objectStore('users');
    
    const getPay = payStore.get(paymentId);
    getPay.onsuccess = () => {
      const payment = getPay.result;
      if (payment) {
        payment.status = 'rejected';
        payment.rejectedAt = new Date().toISOString();
        payStore.put(payment);
        
        // Update user status back to trial/expired
        const getUserReq = userStore.get(payment.userId);
        getUserReq.onsuccess = () => {
          const user = getUserReq.result;
          if (user) {
            const now = new Date();
            const trialEnds = new Date(user.trialEnds);
            user.subscriptionStatus = trialEnds > now ? 'trial' : 'expired';
            userStore.put(user);
          }
        };
      }
    };
    
    transaction.oncomplete = () => {
      clearCache('subscriptionPayments');
      clearCache('users');
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

// ─── PAYMENT MANAGEMENT (V8) - Admin Functions ──────────────────────────────

export async function deletePaymentRecord(paymentId) {
  clearCache('subscriptionPayments');
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('subscriptionPayments', 'readwrite');
    const store = transaction.objectStore('subscriptionPayments');
    const request = store.delete(paymentId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearAllPaymentRecords() {
  clearCache('subscriptionPayments');
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('subscriptionPayments', 'readwrite');
    const store = transaction.objectStore('subscriptionPayments');
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}