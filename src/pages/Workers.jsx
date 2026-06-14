import { useEffect, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { getAllWorkers, saveWorker, deleteWorker } from '../db';
import { TopBar, Card, Button, Confirm } from '../components/UI';
import { ChevronLeft, Users, Plus, Trash2, Edit2, UserCheck } from 'lucide-react';

export default function Workers({ navigate }) {
    // eslint-disable-next-line
  const { t } = useLang();
  const [workers, setWorkers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    phone: '',
    dailyRate: 0,
    overtimeRate: 0,
    isActive: true,
  });

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    const data = await getAllWorkers();
    setWorkers(data);
  };

  const handleSave = async () => {
    if (!formData.name) {
      alert('Please enter worker name');
      return;
    }
    await saveWorker(formData);
    setFormData({ name: '', role: '', phone: '', dailyRate: 0, overtimeRate: 0, isActive: true });
    setEditing(null);
    setShowModal(false);
    await loadWorkers();
  };

  const handleEdit = (worker) => {
    setEditing(worker);
    setFormData(worker);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    await deleteWorker(id);
    setDeleteConfirm(null);
    await loadWorkers();
  };

  const roles = ['General Labourer', 'Skilled Labourer', 'Foreman', 'Electrician', 'Plumber', 'Carpenter', 'Driver', 'Supervisor'];

  return (
    <div className="flex flex-col min-h-full pb-24">
      <TopBar
        title="Workers"
        left={
          <button onClick={() => navigate('dashboard')} className="text-gray-400 hover:text-white mr-1">
            <ChevronLeft size={22} />
          </button>
        }
        right={
          <Button size="sm" onClick={() => { setEditing(null); setFormData({ name: '', role: '', phone: '', dailyRate: 0, overtimeRate: 0, isActive: true }); setShowModal(true); }}>
            <Plus size={14} /> Add Worker
          </Button>
        }
      />

      <div className="p-4 space-y-3">
        {workers.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <Users size={48} className="mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400">No workers yet</p>
              <p className="text-sm text-gray-500 mt-1">Add workers to track attendance and wages</p>
            </div>
          </Card>
        ) : (
          workers.map(worker => (
            <Card key={worker.id}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <UserCheck size={16} className="text-green-400" />
                    <h3 className="font-semibold text-white">{worker.name}</h3>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{worker.role || 'No role specified'}</p>
                  {worker.phone && <p className="text-xs text-gray-500 mt-1">📞 {worker.phone}</p>}
                  <div className="flex gap-3 mt-2 text-sm">
                    <span className="text-green-400">M {worker.dailyRate || 0}/day</span>
                    {worker.overtimeRate > 0 && (
                      <span className="text-yellow-400">Overtime: M {worker.overtimeRate}/hr</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(worker)} className="text-blue-400 hover:text-blue-300 p-1">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => setDeleteConfirm(worker.id)} className="text-red-400 hover:text-red-300 p-1">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Worker Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-end z-50">
          <div className="bg-[#0a1810] border-t border-[#1e3a2a] w-full rounded-t-xl p-4">
            <h3 className="font-bold text-white mb-4">{editing ? 'Edit Worker' : 'Add New Worker'}</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#1e3a2a] text-white p-3 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-green-500"
              />
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-[#1e3a2a] text-white p-3 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-green-500"
              >
                <option value="">Select Role</option>
                {roles.map(role => <option key={role} value={role}>{role}</option>)}
              </select>
              <input
                type="tel"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-[#1e3a2a] text-white p-3 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-green-500"
              />
              <input
                type="number"
                placeholder="Daily Rate (M)"
                value={formData.dailyRate}
                onChange={(e) => setFormData({ ...formData, dailyRate: parseFloat(e.target.value) })}
                className="w-full bg-[#1e3a2a] text-white p-3 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-green-500"
              />
              <input
                type="number"
                placeholder="Overtime Rate per hour (M) - Optional"
                value={formData.overtimeRate}
                onChange={(e) => setFormData({ ...formData, overtimeRate: parseFloat(e.target.value) })}
                className="w-full bg-[#1e3a2a] text-white p-3 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-green-500"
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 accent-green-500"
                />
                <label className="text-gray-300 text-sm">Active Worker</label>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} className="flex-1">Save Worker</Button>
                <Button onClick={() => { setShowModal(false); setEditing(null); }} variant="secondary" className="flex-1">Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Confirm
        open={!!deleteConfirm}
        message="Delete this worker? All attendance records will remain."
        onConfirm={() => handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}