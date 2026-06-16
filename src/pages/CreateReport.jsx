import { useState, useEffect, useCallback } from 'react';
import { useLang } from '../i18n/LangContext';
import { getProject, getClient, getAllWorkers, saveSiteReport, getAllInventory } from '../db';
import { TopBar, Card, Button } from '../components/UI';
// eslint-disable-next-line 
import { ChevronLeft, Camera, Plus, Trash2, Users, Package, AlertCircle } from 'lucide-react';

export default function CreateReport({ navigate, params = {} }) {
    // eslint-disable-next-line 
  const { t } = useLang();
  const projectId = params.projectId;
  
  const [project, setProject] = useState(null);
  const [client, setClient] = useState(null);
  const [workers, setWorkers] = useState([]);
  // eslint-disable-next-line 
  const [inventory, setInventory] = useState([]);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    workCompleted: '',
    weather: '',
    materialsUsed: [],
    workersPresent: [],
    issues: '',
    tomorrowPlan: '',
    notes: '',
    photos: []
  });

  const loadData = useCallback(async () => {
    try {
      const p = await getProject(projectId);
      if (!p) { navigate('projects'); return; }
      setProject(p);
      
      const c = await getClient(p.clientId);
      setClient(c);
      
      const w = await getAllWorkers();
      setWorkers(w.filter(w => w.isActive !== false));
      
      const inv = await getAllInventory();
      setInventory(inv);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, [projectId, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    if (!form.workCompleted.trim()) {
      alert('Please enter work completed details');
      return;
    }
    
    setSaving(true);
    try {
      const report = {
        projectId: project.id,
        projectName: project.projectName,
        date: form.date,
        workCompleted: form.workCompleted,
        weather: form.weather,
        materialsUsed: form.materialsUsed,
        workersPresent: form.workersPresent,
        issues: form.issues,
        tomorrowPlan: form.tomorrowPlan,
        notes: form.notes,
        photos: form.photos
      };
      
      await saveSiteReport(report);
      navigate('project-view', { projectId: project.id });
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Error saving report: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const addMaterialUsed = () => {
    setForm({
      ...form,
      materialsUsed: [...form.materialsUsed, { name: '', quantity: '', unit: '' }]
    });
  };

  const updateMaterial = (index, field, value) => {
    const materials = [...form.materialsUsed];
    materials[index][field] = value;
    setForm({ ...form, materialsUsed: materials });
  };

  const removeMaterial = (index) => {
    const materials = form.materialsUsed.filter((_, i) => i !== index);
    setForm({ ...form, materialsUsed: materials });
  };

  const toggleWorker = (workerId) => {
    const present = form.workersPresent;
    if (present.includes(workerId)) {
      setForm({ ...form, workersPresent: present.filter(id => id !== workerId) });
    } else {
      setForm({ ...form, workersPresent: [...present, workerId] });
    }
  };

  if (!project) {
    return <div className="p-8 text-center text-gray-400">Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-full pb-24">
      <TopBar
        title="Daily Site Report"
        left={
          <button onClick={() => navigate('project-view', { projectId: project.id })} className="text-gray-400 hover:text-white mr-1">
            <ChevronLeft size={22} />
          </button>
        }
      />

      <div className="p-4 space-y-4">
        <Card>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-white">{project.projectName}</h3>
              <p className="text-sm text-gray-400">{client?.name || 'No client'}</p>
            </div>
            <div className="text-sm text-gray-500">
              {new Date(form.date).toLocaleDateString()}
            </div>
          </div>
        </Card>

        {/* Date */}
        <Card>
          <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full bg-[#1e3a2a] text-white p-2 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-green-500"
          />
        </Card>

        {/* Weather */}
        <Card>
          <label className="block text-sm font-medium text-gray-400 mb-1">Weather</label>
          <select
            value={form.weather}
            onChange={(e) => setForm({ ...form, weather: e.target.value })}
            className="w-full bg-[#1e3a2a] text-white p-2 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-green-500"
          >
            <option value="">Select weather...</option>
            <option value="sunny">☀️ Sunny</option>
            <option value="partly-cloudy">⛅ Partly Cloudy</option>
            <option value="cloudy">☁️ Cloudy</option>
            <option value="rainy">🌧️ Rainy</option>
            <option value="stormy">⛈️ Stormy</option>
            <option value="hot">🌡️ Hot</option>
            <option value="cold">❄️ Cold</option>
          </select>
        </Card>

        {/* Work Completed */}
        <Card>
          <label className="block text-sm font-medium text-gray-400 mb-1">Work Completed Today</label>
          <textarea
            value={form.workCompleted}
            onChange={(e) => setForm({ ...form, workCompleted: e.target.value })}
            placeholder="What work was completed today?"
            rows="4"
            className="w-full bg-[#1e3a2a] text-white p-2 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-green-500"
          />
        </Card>

        {/* Workers Present */}
        <Card>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium text-gray-400">Workers Present</label>
          </div>
          {workers.length === 0 ? (
            <p className="text-gray-500 text-sm">No active workers. Add workers in Workers tab.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {workers.map(worker => (
                <button
                  key={worker.id}
                  onClick={() => toggleWorker(worker.id)}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    form.workersPresent.includes(worker.id)
                      ? 'bg-green-700 text-white border border-green-600'
                      : 'bg-[#1e3a2a] text-gray-400 border border-[#2d5a3d] hover:bg-[#2a4a35]'
                  }`}
                >
                  <Users size={14} className="inline mr-1" />
                  {worker.name}
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Materials Used */}
        <Card>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium text-gray-400">Materials Used</label>
            <Button size="sm" onClick={addMaterialUsed}>
              <Plus size={14} className="mr-1" /> Add
            </Button>
          </div>
          
          {form.materialsUsed.length === 0 ? (
            <p className="text-gray-500 text-sm">No materials recorded</p>
          ) : (
            form.materialsUsed.map((item, idx) => (
              <div key={idx} className="flex gap-2 mb-2 items-center">
                <input
                  type="text"
                  placeholder="Material name"
                  value={item.name}
                  onChange={(e) => updateMaterial(idx, 'name', e.target.value)}
                  className="flex-1 bg-[#1e3a2a] text-white p-2 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-green-500 text-sm"
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateMaterial(idx, 'quantity', e.target.value)}
                  className="w-16 bg-[#1e3a2a] text-white p-2 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-green-500 text-sm"
                />
                <input
                  type="text"
                  placeholder="Unit"
                  value={item.unit}
                  onChange={(e) => updateMaterial(idx, 'unit', e.target.value)}
                  className="w-16 bg-[#1e3a2a] text-white p-2 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-green-500 text-sm"
                />
                <button onClick={() => removeMaterial(idx)} className="text-red-400 hover:text-red-300">
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </Card>

        {/* Issues */}
        <Card>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            <AlertCircle size={16} className="inline mr-1 text-red-400" />
            Issues Encountered
          </label>
          <textarea
            value={form.issues}
            onChange={(e) => setForm({ ...form, issues: e.target.value })}
            placeholder="Any issues, delays, or problems?"
            rows="2"
            className="w-full bg-[#1e3a2a] text-white p-2 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-green-500"
          />
        </Card>

        {/* Tomorrow's Plan */}
        <Card>
          <label className="block text-sm font-medium text-gray-400 mb-1">Plan for Tomorrow</label>
          <textarea
            value={form.tomorrowPlan}
            onChange={(e) => setForm({ ...form, tomorrowPlan: e.target.value })}
            placeholder="What is planned for tomorrow?"
            rows="2"
            className="w-full bg-[#1e3a2a] text-white p-2 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-green-500"
          />
        </Card>

        {/* Notes */}
        <Card>
          <label className="block text-sm font-medium text-gray-400 mb-1">Additional Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Any other notes..."
            rows="2"
            className="w-full bg-[#1e3a2a] text-white p-2 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-green-500"
          />
        </Card>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? 'Saving...' : 'Save Report'}
        </Button>
      </div>
    </div>
  );
}