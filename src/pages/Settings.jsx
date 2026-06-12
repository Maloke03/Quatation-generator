import { useEffect, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { getSetting, setSetting } from '../db';
import { Input, Button, TopBar, Card } from '../components/UI';
import { Check } from 'lucide-react';

export default function Settings() {
  const { t, lang, setLang } = useLang();
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', regNumber: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSetting('company').then(data => { if (data) setForm(data); });
  }, []);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSave() {
    await setSetting('company', form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title={t.common.settings} />
      <div className="p-4 flex flex-col gap-5 pb-24">

        {/* Language toggle */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t.common.language}</h2>
          <div className="flex gap-2">
            {[
              { code: 'en', label: 'English' },
              { code: 'st', label: 'Sesotho' },
            ].map(l => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm border transition-all ${
                  lang === l.code
                    ? 'bg-green-600 border-green-500 text-white'
                    : 'bg-[#1e3a2a] border-[#2d5a3d] text-gray-400 hover:border-green-700'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Company details */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t.company.title}</h2>
          <p className="text-gray-500 text-sm mb-4">{t.company.setupPrompt}</p>
          <div className="flex flex-col gap-4">
            <Input
              label={t.company.name}
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder={t.company.namePlaceholder}
            />
            <Input
              label={t.company.phone}
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              placeholder="+266 5000 0000"
              type="tel"
            />
            <Input
              label={t.company.email}
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="info@yourcompany.co.ls"
              type="email"
            />
            <Input
              label={t.company.address}
              value={form.address}
              onChange={e => set('address', e.target.value)}
              placeholder="e.g. Plot 123, Maseru 100"
            />
            <Input
              label={t.company.regNumber}
              value={form.regNumber}
              onChange={e => set('regNumber', e.target.value)}
              placeholder="e.g. L1234/2020"
            />
            <Button onClick={handleSave} size="lg" className="w-full">
              {saved ? <><Check size={16} /> {t.company.saved}</> : t.company.save}
            </Button>
          </div>
        </div>

        {/* App info */}
        <Card>
          <div className="text-center py-2">
            <div className="text-green-400 font-bold text-lg">{t.appName}</div>
            <div className="text-gray-500 text-xs mt-1">v1.0 · Offline-first PWA</div>
            <div className="text-gray-600 text-xs mt-1">Data stored locally on your device</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
