import { useEffect, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { useTranslation } from '../i18n/useTranslation';
import { getAllClients, saveClient, deleteClient, getAllQuotes } from '../db';
import { Card, Button, Input, Modal, Confirm, EmptyState, TopBar } from '../components/UI';
import { Plus, Search, Pencil, Trash2, ChevronRight } from 'lucide-react';

function ClientForm({ initial, onSave, onClose }) {
  const { t } = useLang();
  const [form, setForm] = useState(initial || { name: '', phone: '', email: '', location: '' });
  const [errors, setErrors] = useState({});

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = t.common.required;
    if (!form.phone.trim()) e.phone = t.common.required;
    return e;
  }

  function submit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave(form);
  }

  return (
    <div className="flex flex-col gap-4">
      <Input label={t.clients.name} value={form.name} onChange={e => set('name', e.target.value)} error={errors.name} placeholder="e.g. Thabo Mokoena" />
      <Input label={t.clients.phone} value={form.phone} onChange={e => set('phone', e.target.value)} error={errors.phone} placeholder="+266 5000 0000" type="tel" />
      <Input label={t.clients.email} value={form.email} onChange={e => set('email', e.target.value)} placeholder="thabo@email.com" type="email" />
      <Input label={t.clients.location} value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Maseru, Ha Thetsane" />
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onClose} className="flex-1">{t.common.cancel}</Button>
        <Button onClick={submit} className="flex-1">{t.clients.save}</Button>
      </div>
    </div>
  );
}

export default function Clients({ navigate }) {
  const { t } = useLang();
  const [clients, setClients] = useState([]);
  const [quoteCounts, setQuoteCounts] = useState({});
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  async function load() {
    const [cls, qs] = await Promise.all([getAllClients(), getAllQuotes()]);
    const counts = {};
    qs.forEach(q => { counts[q.clientId] = (counts[q.clientId] || 0) + 1; });
    setClients(cls.sort((a, b) => a.name.localeCompare(b.name)));
    setQuoteCounts(counts);
  }

  useEffect(() => { load(); }, []);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.location?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSave(data) {
    await saveClient({ ...data, id: editing?.id });
    setModalOpen(false);
    setEditing(null);
    load();
  }

  async function handleDelete() {
    await deleteClient(confirmId);
    setConfirmId(null);
    load();
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title={t.clients.title}
        right={
          <Button size="sm" onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus size={16} /> {t.clients.addClient}
          </Button>
        }
      />
      <div className="p-4 flex flex-col gap-4 pb-24">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.common.search}
            className="w-full bg-[#0f2318] border border-[#2d5a3d] rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 text-sm"
          />
        </div>

        {filtered.length === 0 && !search ? (
          <EmptyState
            icon="👷"
            title={t.clients.noClients}
            action={
              <Button onClick={() => setModalOpen(true)}>
                <Plus size={16} /> {t.clients.addClient}
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState icon="🔍" title={t.common.noResults} />
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(c => (
              <Card key={c.id}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-900/40 border border-green-800/40 flex items-center justify-center text-green-400 font-bold text-sm shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0" onClick={() => navigate('client-quotes', { clientId: c.id })}>
                    <div className="font-semibold text-white text-sm truncate">{c.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {c.phone} {c.location ? `· ${c.location}` : ''}
                    </div>
                    <div className="text-xs text-green-500 mt-0.5">
                      {quoteCounts[c.id] || 0} {t.clients.quotes}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditing(c); setModalOpen(true); }}
                      className="p-2 text-gray-500 hover:text-green-400 transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setConfirmId(c.id)}
                      className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                    <ChevronRight size={15} className="text-gray-600" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? t.clients.editClient : t.clients.addClient}
      >
        <ClientForm
          initial={editing}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditing(null); }}
        />
      </Modal>

      <Confirm
        open={!!confirmId}
        message={t.clients.confirmDelete}
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
