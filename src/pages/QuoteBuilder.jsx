import { useEffect, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { getAllClients, saveQuote, getQuote } from '../db';
import { Input, Select, Textarea, Button, TopBar, Card } from '../components/UI';
import { calcLineTotal, calcSubtotal, calcVAT, calcGrandTotal, formatCurrency, futureDate, todayISO } from '../utils/format';
import { Plus, Trash2, ChevronLeft, Eye } from 'lucide-react';

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

  useEffect(() => {
    getAllClients().then(setClients);
    if (isEdit) {
      getQuote(params.quoteId).then(q => {
        if (q) setForm(q);
      });
    }
  }, []);

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
      const saved = await saveQuote({ ...form, id: isEdit ? params.quoteId : undefined });
      navigate('quote-view', { quoteId: saved.id });
    } finally {
      setSaving(false);
    }
  }

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

        {/* Line items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">{t.quote.items}</label>
            {errors.items && <span className="text-xs text-red-400">{errors.items}</span>}
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
    </div>
  );
}
