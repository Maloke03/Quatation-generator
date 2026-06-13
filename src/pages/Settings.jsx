import { useEffect, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { getSetting, setSetting } from '../db';
import { Input, Button, TopBar, Card } from '../components/UI';
import { Check, Package, Users, Database, Calculator } from 'lucide-react';

export default function Settings({ navigate }) {
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

        {/* Tools section - V3 */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Database size={12} /> {t.common?.tools || 'Tools'}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('materials')}
              className="bg-[#1e3a2a] border border-[#2d5a3d] rounded-xl p-3 hover:border-green-700 transition-all cursor-pointer"
            >
              <div className="flex flex-col items-center text-center gap-2">
                <Package size={24} className="text-green-400" />
                <span className="text-sm font-medium text-white">{t.materials?.title || 'Material Price DB'}</span>
                <span className="text-xs text-gray-400">Save & reuse prices</span>
              </div>
            </button>
            <button
              onClick={() => navigate('labour')}
              className="bg-[#1e3a2a] border border-[#2d5a3d] rounded-xl p-3 hover:border-green-700 transition-all cursor-pointer"
            >
              <div className="flex flex-col items-center text-center gap-2">
                <Calculator size={24} className="text-green-400" />
                <span className="text-sm font-medium text-white">{t.labour?.calculator || 'Labour Calculator'}</span>
                <span className="text-xs text-gray-400">Workers × days × rate</span>
              </div>
            </button>
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
            <div className="text-green-400 font-bold text-lg flex items-center justify-center gap-2">
              <span>{t.appName}</span>
              <span className="text-xs bg-green-900 px-2 py-0.5 rounded-full">v3.0</span>
            </div>
            <div className="text-gray-500 text-xs mt-1">Offline-first PWA · Data on device</div>
            <div className="text-gray-600 text-xs mt-2 flex items-center justify-center gap-3">
              <span className="flex items-center gap-1"><Package size={10} /> Price DB</span>
              <span className="flex items-center gap-1"><Calculator size={10} /> Labour Calc</span>
              <span className="flex items-center gap-1"><Users size={10} /> Clients</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}