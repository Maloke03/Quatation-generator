import { useEffect, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { getSetting, setSetting, getOrCreateUser, getUserByDeviceId } from '../db';
import { Input, Button, TopBar, Card } from '../components/UI';
import { Check, Package, Users, Database, Calculator, Shield, Lock, Key } from 'lucide-react';

export default function Settings({ navigate }) {
  const { t, lang, setLang } = useLang();
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', regNumber: '' });
  const [saved, setSaved] = useState(false);
  
  // Secret admin access - 3 layer security
  const [clickCount, setClickCount] = useState(0);
  const [clickTimer, setClickTimer] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    getSetting('company').then(data => { if (data) setForm(data); });
    checkIfAdmin();
  }, []);

  // Check if current user is admin (stored in localStorage)
  const checkIfAdmin = async () => {
    const deviceId = localStorage.getItem('app_device_id');
    if (!deviceId) return;
    
    const user = await getUserByDeviceId(deviceId);
    if (user && user.isAdmin) {
      setIsAdminUser(true);
      setShowAdmin(true);
    }
  };

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSave() {
    await setSetting('company', form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // LAYER 1: Secret tap sequence (7 taps on the app version)
  const handleSecretTap = () => {
    if (isLocked) return;
    if (isAdminUser) {
      setShowAdmin(true);
      return;
    }

    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    clearTimeout(clickTimer);
    setClickTimer(setTimeout(() => {
      setClickCount(0);
    }, 2000));

    // After 7 taps, show password dialog
    if (newCount >= 7) {
      setShowPasswordDialog(true);
      setClickCount(0);
      clearTimeout(clickTimer);
    }
  };

  // LAYER 2: Admin Password (7-digit code)
  const handlePasswordSubmit = () => {
    if (isLocked) return;
    
    // The secret 7-digit code (change this to your own code)
    const SECRET_CODE = '2025206'; // Change this to your custom code
    
    if (adminPassword === SECRET_CODE) {
      // Grant admin access
      setIsAdminUser(true);
      setShowAdmin(true);
      setShowPasswordDialog(false);
      setAdminPassword('');
      setAttempts(0);
      
      // Store admin status
      const deviceId = localStorage.getItem('app_device_id');
      if (deviceId) {
        // Update user with admin status
        const updateAdmin = async () => {
          const user = await getUserByDeviceId(deviceId);
          if (user) {
            user.isAdmin = true;
            await setSetting('users', { ...user, isAdmin: true });
          }
        };
        updateAdmin();
      }
      
      alert('🔐 Admin access granted!');
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setAdminPassword('');
      
      if (newAttempts >= 3) {
        // LAYER 3: Lock after 3 failed attempts
        setIsLocked(true);
        setShowPasswordDialog(false);
        alert('🔒 Too many failed attempts. Access locked for 5 minutes.');
        setTimeout(() => {
          setIsLocked(false);
          setAttempts(0);
        }, 300000); // 5 minutes
      } else {
        alert(`❌ Incorrect code. ${3 - newAttempts} attempts remaining.`);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title={t.common.settings} />
      <div className="p-4 flex flex-col gap-5 pb-24">
        
        {/* ⚠️ ADMIN SECTION - HIDDEN BY DEFAULT ⚠️ */}
        {/* Only visible if admin is unlocked */}
        {showAdmin && (
          <div className="bg-gradient-to-r from-amber-900/30 to-yellow-900/30 border border-amber-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={18} className="text-amber-400" />
              <h3 className="text-sm font-semibold text-amber-400">🔐 Admin Dashboard</h3>
            </div>
            <button
              onClick={() => navigate('admin')}
              className="w-full bg-[#0a1810] hover:bg-[#1a2a1a] text-amber-400 hover:text-amber-300 py-2 rounded-lg transition-colors text-sm border border-amber-700/50"
            >
              <Shield size={16} className="inline mr-2" />
              Enter Admin Dashboard
            </button>
            <p className="text-xs text-amber-500/70 mt-2">
              Manage users, subscriptions, and view analytics
            </p>
          </div>
        )}

        {/* Secret Admin Trigger - Hidden in plain sight */}
        <div 
          className="cursor-default select-none"
          onDoubleClick={handleSecretTap}
          title="Tap 7 times quickly to access admin"
        >
          <Card className="hover:border-[#2d5a3d] transition-colors">
            <div className="text-center py-2">
              <div className="text-green-400 font-bold text-lg flex items-center justify-center gap-2">
                <span>{t.appName}</span>
                <span 
                  className="text-xs bg-green-900 px-2 py-0.5 rounded-full cursor-pointer hover:bg-green-800 transition-colors"
                  onClick={handleSecretTap}
                >
                  v8.0
                </span>
              </div>
              <div className="text-gray-500 text-xs mt-1">Offline-first PWA · Data on device</div>
              {!isAdminUser && !showAdmin && (
                <div className="text-[10px] text-gray-600/50 mt-2">
                  {clickCount > 0 ? `${clickCount}/7` : '• • •'}
                </div>
              )}
              {isAdminUser && (
                <div className="text-[10px] text-amber-500/70 mt-2">
                  🔐 Admin mode active
                </div>
              )}
            </div>
          </Card>
        </div>

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

        {/* Tools section */}
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
      </div>

      {/* Password Dialog - Layer 2 */}
      {showPasswordDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a1810] border border-amber-700/50 rounded-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <Lock size={24} className="text-amber-400" />
              <h3 className="font-bold text-amber-400">Admin Access</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Enter the 7-digit admin code to access the dashboard.
            </p>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Enter 7-digit code"
              maxLength="7"
              className="w-full bg-[#1e3a2a] text-white p-3 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-amber-500 text-center text-xl tracking-widest"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handlePasswordSubmit();
                if (e.key === 'Escape') {
                  setShowPasswordDialog(false);
                  setAdminPassword('');
                }
              }}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={handlePasswordSubmit}
                className="flex-1 bg-amber-700 hover:bg-amber-600 text-white py-2 rounded-lg"
              >
                <Key size={16} className="inline mr-2" />
                Unlock
              </button>
              <button
                onClick={() => {
                  setShowPasswordDialog(false);
                  setAdminPassword('');
                  setClickCount(0);
                }}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              {attempts > 0 && `Failed attempts: ${attempts}/3`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}