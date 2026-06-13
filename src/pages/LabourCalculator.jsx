import React, { useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { TopBar, Card, Button } from '../components/UI';
import { ChevronLeft, Plus, Trash2, Calculator, Users } from 'lucide-react';

export default function LabourCalculator({ navigate }) {
  const { t } = useLang();
  const [workers, setWorkers] = useState([{ role: '', dailyRate: 0, days: 0 }]);
  const [total, setTotal] = useState(0);

  const updateWorker = (index, field, value) => {
    const updated = [...workers];
    updated[index][field] = field === 'dailyRate' || field === 'days' ? parseFloat(value) || 0 : value;
    setWorkers(updated);
    calculateTotal(updated);
  };

  const addWorker = () => {
    setWorkers([...workers, { role: '', dailyRate: 0, days: 0 }]);
  };

  const removeWorker = (index) => {
    const updated = workers.filter((_, i) => i !== index);
    setWorkers(updated);
    calculateTotal(updated);
  };

  const calculateTotal = (workersList) => {
    const sum = workersList.reduce((acc, w) => acc + (w.dailyRate * w.days), 0);
    setTotal(sum);
  };

  const addToQuote = () => {
    const labourItems = workers.map(w => ({
      description: `${w.role || (t.labour?.labour || 'Labour')} (${w.days} ${t.labour?.days || 'days'} @ M${w.dailyRate}/day)`,
      quantity: 1,
      unit: 'job',
      unitPrice: w.dailyRate * w.days,
      total: w.dailyRate * w.days
    }));
    
    localStorage.setItem('pendingLabourItems', JSON.stringify(labourItems));
    alert(t.labour?.addedToQuote || 'Labour items added to your quote!');
    navigate('quote-new');
  };

  const commonRoles = [
    t.labour?.roles?.general || 'General Labourer',
    t.labour?.roles?.skilled || 'Skilled Labourer',
    t.labour?.roles?.foreman || 'Foreman',
    t.labour?.roles?.electrician || 'Electrician',
    t.labour?.roles?.plumber || 'Plumber'
  ];

  return (
    <div className="flex flex-col min-h-full pb-24">
      <TopBar
        title={t.labour?.calculator || 'Labour Cost Calculator'}
        left={
          <button onClick={() => navigate('settings')} className="text-gray-400 hover:text-white mr-1">
            <ChevronLeft size={22} />
          </button>
        }
      />

      <div className="p-4 space-y-4">
        {workers.map((worker, idx) => (
          <Card key={idx}>
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Users size={16} className="text-green-400" />
                {t.labour?.worker || 'Worker'} {idx + 1}
              </h3>
              {workers.length > 1 && (
                <button onClick={() => removeWorker(idx)} className="text-red-400 hover:text-red-300">
                  <Trash2 size={18} />
                </button>
              )}
            </div>
            
            <div className="space-y-3">
              <select
                value={worker.role}
                onChange={(e) => updateWorker(idx, 'role', e.target.value)}
                className="w-full bg-[#0a1810] border border-[#1e3a2a] text-white p-2 rounded focus:outline-none focus:border-green-500"
              >
                <option value="">{t.labour?.selectRole || 'Select Role'}</option>
                {commonRoles.map(role => <option key={role} value={role}>{role}</option>)}
              </select>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">{t.labour?.dailyRate || 'Daily Rate (M)'}</label>
                  <input
                    type="number"
                    value={worker.dailyRate || ''}
                    onChange={(e) => updateWorker(idx, 'dailyRate', e.target.value)}
                    className="w-full bg-[#0a1810] border border-[#1e3a2a] text-white p-2 rounded focus:outline-none focus:border-green-500 mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-xs text-gray-500">{t.labour?.numberOfDays || 'Number of Days'}</label>
                  <input
                    type="number"
                    value={worker.days || ''}
                    onChange={(e) => updateWorker(idx, 'days', e.target.value)}
                    className="w-full bg-[#0a1810] border border-[#1e3a2a] text-white p-2 rounded focus:outline-none focus:border-green-500 mt-1"
                  />
                </div>
              </div>
              
              <div className="text-right text-sm text-green-400">
                {t.quote?.subtotal || 'Subtotal'}: M {(worker.dailyRate * worker.days).toFixed(2)}
              </div>
            </div>
          </Card>
        ))}

        <Button onClick={addWorker} variant="secondary" className="w-full">
          <Plus size={16} className="mr-1" /> {t.labour?.addWorker || 'Add Worker'}
        </Button>

        <Card>
          <div className="flex justify-between items-center">
            <span className="font-bold text-lg text-white flex items-center gap-2">
              <Calculator size={20} className="text-green-400" />
              {t.labour?.totalCost || 'Total Labour Cost'}:
            </span>
            <span className="text-2xl font-bold text-green-400">M {total.toFixed(2)}</span>
          </div>
        </Card>

        <Button onClick={addToQuote} className="w-full bg-green-700 hover:bg-green-600">
          {t.labour?.addToQuote || 'Add to Quote'}
        </Button>
      </div>
    </div>
  );
}