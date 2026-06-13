import { useEffect, useState, useCallback } from 'react';
import { useLang } from '../i18n/LangContext';
// import { useTranslation } from '../i18n/useTranslation'; // REMOVED
import { getAllClients, saveQuote, getQuote, getAllMaterials } from '../db';
import { Input, Select, Textarea, Button, TopBar, Card } from '../components/UI';
import { calcLineTotal, calcSubtotal, calcVAT, calcGrandTotal, formatCurrency, futureDate, todayISO } from '../utils/format';
import { Plus, Trash2, ChevronLeft, Package, Users } from 'lucide-react'; // Removed Eye

const COMMON_ITEMS = [
  'Cement (50kg bags)', 'Bricks', 'Sand (m³)', 'Stone (m³)',
  'Steel rebar', 'Roofing sheets', 'Timber', 'Doors', 'Windows',
  'Plumbing pipes', 'Electrical wiring', 'Paint', 'Tiles',
  'Labour - Bricklayer', 'Labour - General worker', 'Labour - Plumber',
  'Labour - Electrician', 'Equipment hire', 'Transport',
];

function LineItem({ item, index, onChange, onRemove, t }) {
  const total = calcLineTotal(item.qty, item.unitPrice);
  function set(k, v) { onChange(index, { ...item, [k]: v }); }

  return (
    <div className="bg-[#0a1810] border border-[#1e3a2a] rounded-xl p-3 flex flex-col gap-2">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <input
            value={item.name}
            onChange={e => set('name', e.target.value)}
            placeholder={t.quote.itemNamePlaceholder}
            list={`items-list-${index}`}
            className="w-full bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none border-b border-[#2d5a3d] pb-1 focus:border-green-500"
          />
          <datalist id={`items-list-${index}`}>
            {COMMON_ITEMS.map(i => <option key={i} value={i} />)}
          </datalist>
        </div>
        <button onClick={() => onRemove(index)} className="text-gray-600 hover:text-red-400 p-0.5">
          <Trash2 size={15} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] text-gray-600 uppercase tracking-wide">{t.quote.qty}</label>
          <input
            type="number"
            value={item.qty}
            onChange={e => set('qty', e.target.value)}
            min="0"
            step="any"
            className="w-full bg-transparent text-white text-sm focus:outline-none border-b border-[#2d5a3d] pb-1 focus:border-green-500 mt-0.5"
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-600 uppercase tracking-wide">{t.quote.unit}</label>
          <input
            value={item.unit}
            onChange={e => set('unit', e.target.value)}
            list="units-list"
            className="w-full bg-transparent text-white text-sm focus:outline-none border-b border-[#2d5a3d] pb-1 focus:border-green-500 mt-0.5"
          />
          <datalist id="units-list">
            {t.quote.units.map(u => <option key={u} value={u} />)}
          </datalist>
        </div>
        <div>
          <label className="text-[10px] text-gray-600 uppercase tracking-wide">{t.quote.unitPrice}</label>
          <input
            type="number"
            value={item.unitPrice}
            onChange={e => set('unitPrice', e.target.value)}
            min="0"
            step="any"
            className="w-full bg-transparent text-white text-sm focus:outline-none border-b border-[#2d5a3d] pb-1 focus:border-green-500 mt-0.5"
          />
        </div>
      </div>
      <div className="text-right text-green-400 font-semibold text-sm">
        {formatCurrency(total)}
      </div>
    </div>
  );
}

function newItem() {
  return { id: Date.now(), name: '', qty: '', unit: '', unitPrice: '' };
}

export default function QuoteBuilder({ navigate, params = {} }) {
  const { t } = useLang();
  const isEdit = !!params.quoteId;

  const [clients, setClients] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [showPriceList, setShowPriceList] = useState(false);
  const [showLabourModal, setShowLabourModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    clientId: params.clientId || '',
    projectName: '',
    date: todayISO(),
    validUntil: futureDate(30),
    includeVat: false,
    terms: t.quote.termsDefault,
    notes: '',
    items: [newItem()],
    status: 'draft',
  });

  const loadMaterials = async () => {
    try {
      const mats = await getAllMaterials();
      setMaterials(mats || []);
    } catch (error) {
      console.error('Failed to load materials:', error);
      setMaterials([]);
    }
  };

  const loadData = useCallback(async () => {
    const allClients = await getAllClients();
    setClients(allClients);
    await loadMaterials();
    
    const pendingLabour = localStorage.getItem('pendingLabourItems');
    if (pendingLabour) {
      const labourItems = JSON.parse(pendingLabour);
      if (labourItems.length > 0) {
        const newItems = labourItems.map(item => ({
          id: Date.now() + Math.random(),
          name: item.description,
          qty: item.quantity || 1,
          unit: 'job',
          unitPrice: item.total,
        }));
        setForm(f => ({ ...f, items: [...newItems, ...f.items] }));
        localStorage.removeItem('pendingLabourItems');
      }
    }
    
    if (isEdit && params.quoteId) {
      const q = await getQuote(params.quoteId);
      if (q) setForm(q);
    }
  }, [isEdit, params.quoteId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function addItem() { set('items', [...form.items, newItem()]); }
  function updateItem(i, item) {
    const items = [...form.items];
    items[i] = item;
    set('items', items);
  }
  function removeItem(i) {
    if (form.items.length === 1) return;
    set('items', form.items.filter((_, idx) => idx !== i));
  }

  function addFromPriceList(material) {
    const newItem = {
      id: Date.now(),
      name: `${material.name} (${material.unit})`,
      qty: 1,
      unit: material.unit,
      unitPrice: material.pricePerUnit,
    };
    set('items', [newItem, ...form.items]);
    setShowPriceList(false);
  }

  function addLabourTemplate(role, dailyRate, days) {
    const total = dailyRate * days;
    const newItem = {
      id: Date.now(),
      name: `${role} - ${days} day(s) @ ${formatCurrency(dailyRate)}/day`,
      qty: 1,
      unit: 'job',
      unitPrice: total,
    };
    set('items', [newItem, ...form.items]);
  }

  const subtotal = calcSubtotal(form.items);
  const vat = form.includeVat ? calcVAT(subtotal) : 0;
  const grandTotal = calcGrandTotal(subtotal, form.includeVat);

  function validate() {
    const e = {};
    if (!form.clientId) e.clientId = t.quote.noClient;
    if (!form.projectName.trim()) e.projectName = t.common.required;
    const hasItems = form.items.some(i => i.name.trim() && parseFloat(i.qty) > 0);
    if (!hasItems) e.items = t.quote.noItems;
    return e;
  }

  async function handleSave() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const quoteData = {
        clientId: form.clientId,
        projectName: form.projectName,
        date: form.date,
        validUntil: form.validUntil,
        includeVat: form.includeVat,
        terms: form.terms,
        notes: form.notes,
        items: form.items
          .filter(item => item.name?.trim() && parseFloat(item.qty) > 0)
          .map(item => ({
            name: item.name,
            qty: parseFloat(item.qty) || 0,
            unit: item.unit || 'each',
            unitPrice: parseFloat(item.unitPrice) || 0,
          })),
        status: form.status || 'draft'
      };
      
      const saved = await saveQuote(quoteData);
      navigate('quote-view', { quoteId: saved.id });
    } catch (error) {
      console.error('Save error:', error);
      setErrors({ save: error.message });
      alert('Error saving quote: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  const labourTemplates = [
    { role: t.quote.labour?.bricklayer || 'Bricklayer', dailyRate: 250, days: 1 },
    { role: t.quote.labour?.general || 'General Worker', dailyRate: 150, days: 1 },
    { role: t.quote.labour?.plumber || 'Plumber', dailyRate: 300, days: 1 },
    { role: t.quote.labour?.electrician || 'Electrician', dailyRate: 300, days: 1 },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title={isEdit ? t.quote.editQuote : t.quote.newQuote}
        left={
          <button onClick={() => navigate('quotes')} className="text-gray-400 hover:text-white mr-1">
            <ChevronLeft size={22} />
          </button>
        }
        right={
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? t.common.loading : t.quote.save}
          </Button>
        }
      />

      <div className="p-4 flex flex-col gap-5 pb-32">
        {/* Client */}
        <Select
          label={t.quote.client}
          value={form.clientId}
          onChange={e => set('clientId', e.target.value)}
          error={errors.clientId}
        >
          <option value="">{t.quote.selectClient}</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>

        {/* Project name */}
        <Input
          label={t.quote.projectName}
          value={form.projectName}
          onChange={e => set('projectName', e.target.value)}
          placeholder={t.quote.projectNamePlaceholder}
          error={errors.projectName}
        />

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <Input label={t.print.date} type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          <Input label={t.quote.validUntil} type="date" value={form.validUntil} onChange={e => set('validUntil', e.target.value)} />
        </div>

        {/* Line items with quick-add buttons */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">{t.quote.items}</label>
            {errors.items && <span className="text-xs text-red-400">{errors.items}</span>}
          </div>
          
          {/* Quick-add buttons */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setShowPriceList(true)}
              className="flex-1 bg-[#1e3a2a] border border-green-700 text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-[#2a4a35] transition-colors"
            >
              <Package size={16} /> 📦 {t.quote.pickFromPriceList || 'Price List'}
            </button>
            <button
              onClick={() => setShowLabourModal(true)}
              className="flex-1 bg-[#1e3a2a] border border-green-700 text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-[#2a4a35] transition-colors"
            >
              <Users size={16} /> 👷 {t.quote.addLabour || 'Add Labour'}
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {form.items.map((item, i) => (
              <LineItem key={item.id || i} item={item} index={i} onChange={updateItem} onRemove={removeItem} t={t} />
            ))}
          </div>
          <Button variant="secondary" onClick={addItem} className="mt-3 w-full">
            <Plus size={16} /> {t.quote.addItem}
          </Button>
        </div>

        {/* Totals */}
        <Card>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{t.quote.subtotal}</span>
              <span className="text-white font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.includeVat}
                  onChange={e => set('includeVat', e.target.checked)}
                  className="accent-green-500 w-4 h-4"
                />
                {t.quote.vat}
              </label>
              {form.includeVat && (
                <span className="text-white text-sm font-medium">{formatCurrency(vat)}</span>
              )}
            </div>
            <div className="border-t border-[#2d5a3d] pt-2 flex justify-between items-center">
              <span className="text-green-400 font-bold">{t.quote.grandTotal}</span>
              <span className="text-green-400 font-bold text-xl">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </Card>

        {/* Terms */}
        <Textarea
          label={t.quote.terms}
          value={form.terms}
          onChange={e => set('terms', e.target.value)}
          rows={4}
        />

        {/* Notes */}
        <Textarea
          label={t.quote.notes}
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          placeholder={t.quote.notesPlaceholder}
          rows={3}
        />

        {/* Save button */}
        <Button onClick={handleSave} disabled={saving} size="lg" className="w-full">
          {saving ? t.common.loading : t.quote.save}
        </Button>
      </div>

      {/* Price List Modal */}
      {showPriceList && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-end z-50">
          <div className="bg-[#0a1810] border-t border-[#1e3a2a] w-full max-h-[80vh] rounded-t-xl overflow-y-auto">
            <div className="sticky top-0 bg-[#0a1810] p-4 border-b border-[#1e3a2a] flex justify-between items-center">
              <h3 className="font-bold text-white">{t.quote.materialPriceDB || 'Material Price Database'}</h3>
              <button onClick={() => setShowPriceList(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="divide-y divide-[#1e3a2a]">
              {materials.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Package size={48} className="mx-auto mb-3 opacity-50" />
                  <p>{t.quote.noMaterials || 'No materials saved yet'}</p>
                  <p className="text-sm mt-2">{t.quote.goToSettings || 'Go to Settings → Material Price DB to add some'}</p>
                </div>
              ) : (
                materials.map(mat => (
                  <div key={mat.id} className="p-4 flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-white">{mat.name}</div>
                      <div className="text-sm text-gray-500">{mat.category || 'Material'} • {mat.unit}</div>
                      <div className="text-green-400 font-medium mt-1">{formatCurrency(mat.pricePerUnit)}</div>
                    </div>
                    <button
                      onClick={() => addFromPriceList(mat)}
                      className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      {t.quote.add || 'Add'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Labour Modal */}
      {showLabourModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-end z-50">
          <div className="bg-[#0a1810] border-t border-[#1e3a2a] w-full max-h-[80vh] rounded-t-xl overflow-y-auto">
            <div className="sticky top-0 bg-[#0a1810] p-4 border-b border-[#1e3a2a] flex justify-between items-center">
              <h3 className="font-bold text-white">{t.quote.labourCalculator || 'Add Labour Cost'}</h3>
              <button onClick={() => setShowLabourModal(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-4">
              <p className="text-gray-400 text-sm mb-4 text-center">
                {t.quote.selectLabourTemplate || 'Select a labour template or go to Labour Calculator for custom'}
              </p>
              <div className="space-y-3">
                {labourTemplates.map((labour, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      addLabourTemplate(labour.role, labour.dailyRate, labour.days);
                      setShowLabourModal(false);
                    }}
                    className="w-full bg-[#1e3a2a] border border-green-800 rounded-lg p-4 text-left hover:bg-[#2a4a35] transition-colors"
                  >
                    <div className="font-semibold text-white">{labour.role}</div>
                    <div className="text-sm text-gray-400 mt-1">
                      {formatCurrency(labour.dailyRate)}/day × {labour.days} day(s)
                    </div>
                    <div className="text-green-400 font-medium mt-1">{formatCurrency(labour.dailyRate * labour.days)}</div>
                  </button>
                ))}
                <button
                  onClick={() => {
                    setShowLabourModal(false);
                    navigate('labour');
                  }}
                  className="w-full bg-green-700 hover:bg-green-600 text-white rounded-lg p-3 text-center transition-colors"
                >
                  🔧 {t.quote.openLabourCalculator || 'Open Full Labour Calculator'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}