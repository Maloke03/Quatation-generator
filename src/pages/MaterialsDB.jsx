import React, { useState, useEffect } from 'react';
import { getAllMaterials, saveMaterial, deleteMaterial, searchMaterials } from '../db';
import { useLang } from '../i18n/LangContext';
import { TopBar, Card, Button } from '../components/UI';
import { ChevronLeft, Plus, Trash2, Edit2, Search, Package } from 'lucide-react';

export default function MaterialsDB({ navigate }) {
  const { t } = useLang();
  const [materials, setMaterials] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', category: '', pricePerUnit: '', unit: '' });

  useEffect(() => {
    loadMaterials();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      searchMaterials(searchTerm).then(setMaterials);
    } else {
      loadMaterials();
    }
  }, [searchTerm]);

  const loadMaterials = async () => {
    const data = await getAllMaterials();
    setMaterials(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const material = {
      ...formData,
      pricePerUnit: parseFloat(formData.pricePerUnit)
    };
    if (editing) {
      await saveMaterial({ ...material, id: editing.id });
    } else {
      await saveMaterial(material);
    }
    setFormData({ name: '', category: '', pricePerUnit: '', unit: '' });
    setEditing(null);
    setShowForm(false);
    loadMaterials();
  };

  const handleEdit = (material) => {
    setEditing(material);
    setFormData({
      name: material.name,
      category: material.category,
      pricePerUnit: material.pricePerUnit,
      unit: material.unit
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm(t.materials?.confirmDelete || 'Delete this material?')) {
      await deleteMaterial(id);
      loadMaterials();
    }
  };

  const categories = [
    'Building', 'Aggregates', 'Roofing', 'Timber', 
    'Finishing', 'Fittings', 'Hardware', 'Steel', 'Plumbing', 'Other'
  ];

  return (
    <div className="flex flex-col min-h-full pb-24">
      <TopBar
        title={t.materials?.title || 'Material Price Database'}
        left={
          <button onClick={() => navigate('settings')} className="text-gray-400 hover:text-white mr-1">
            <ChevronLeft size={22} />
          </button>
        }
      />

      <div className="p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder={t.common?.search || 'Search materials...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0a1810] border border-[#1e3a2a] text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-green-500"
          />
        </div>

        {/* Add Button */}
        <Button onClick={() => { setShowForm(!showForm); setEditing(null); setFormData({ name: '', category: '', pricePerUnit: '', unit: '' }); }} className="w-full">
          <Plus size={16} className="mr-1" /> {t.materials?.addMaterial || 'Add Material'}
        </Button>

        {/* Add/Edit Form */}
        {showForm && (
          <Card>
            <h3 className="font-semibold text-white mb-3">
              {editing ? (t.materials?.editMaterial || 'Edit Material') : (t.materials?.addMaterial || 'Add Material')}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder={t.materials?.materialName || 'Material Name'}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#0a1810] border border-[#1e3a2a] text-white p-2 rounded focus:outline-none focus:border-green-500"
                required
              />
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-[#0a1810] border border-[#1e3a2a] text-white p-2 rounded focus:outline-none focus:border-green-500"
                required
              >
                <option value="">{t.materials?.selectCategory || 'Select Category'}</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <input
                type="number"
                step="0.01"
                placeholder={t.materials?.pricePerUnit || 'Price per Unit (M)'}
                value={formData.pricePerUnit}
                onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
                className="w-full bg-[#0a1810] border border-[#1e3a2a] text-white p-2 rounded focus:outline-none focus:border-green-500"
                required
              />
              <input
                type="text"
                placeholder={t.materials?.unit || 'Unit (e.g., bag, meter, sheet)'}
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full bg-[#0a1810] border border-[#1e3a2a] text-white p-2 rounded focus:outline-none focus:border-green-500"
                required
              />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-green-700 hover:bg-green-600 text-white py-2 rounded-lg">
                  {editing ? (t.common?.save || 'Save') : (t.common?.add || 'Add')}
                </button>
                <button 
                  type="button" 
                  onClick={() => { 
                    setShowForm(false);
                    setEditing(null);
                    setFormData({ name: '', category: '', pricePerUnit: '', unit: '' });
                  }} 
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg"
                >
                  {t.common?.cancel || 'Cancel'}
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Materials List */}
        <div className="space-y-2">
          {materials.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <Package size={48} className="mx-auto mb-3 text-gray-600" />
                <p className="text-gray-400">{searchTerm ? 'No materials found' : 'No materials yet. Add your first material!'}</p>
              </div>
            </Card>
          ) : (
            materials.map(material => (
              <Card key={material.id}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{material.name}</h3>
                    <p className="text-sm text-gray-400">{material.category} • {material.unit}</p>
                    <p className="text-green-400 font-bold mt-1">M {material.pricePerUnit.toFixed(2)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(material)} className="text-blue-400 hover:text-blue-300 p-1">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(material.id)} className="text-red-400 hover:text-red-300 p-1">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}