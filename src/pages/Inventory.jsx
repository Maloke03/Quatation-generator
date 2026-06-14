import { useEffect, useState } from 'react';
import { useLang } from '../i18n/LangContext';
// eslint-disable-next-line
import { getAllInventory, saveInventoryItem, addInventoryTransaction, getLowStockItems, getAllMaterials } from '../db';
// eslint-disable-next-line
import { TopBar, Card, Button, Confirm } from '../components/UI';
// eslint-disable-next-line
import { ChevronLeft, Package, AlertTriangle, Plus, Minus, TrendingUp, Edit2 } from 'lucide-react';

export default function Inventory({ navigate }) {
    // eslint-disable-next-line
  const { t } = useLang();
  const [inventory, setInventory] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [transactionType, setTransactionType] = useState('purchase');
  const [formData, setFormData] = useState({ materialName: '', category: '', unit: '', stock: 0, reorderLevel: 10 });
  const [transactionData, setTransactionData] = useState({ quantity: 0, note: '', date: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const items = await getAllInventory();
    setInventory(items);
    const low = await getLowStockItems();
    setLowStockItems(low);
  };

  const handleAddItem = async () => {
    if (!formData.materialName) {
      alert('Please enter material name');
      return;
    }
    await saveInventoryItem({
      materialName: formData.materialName,
      category: formData.category,
      unit: formData.unit,
      stock: parseFloat(formData.stock) || 0,
      reorderLevel: parseFloat(formData.reorderLevel) || 10,
    });
    setFormData({ materialName: '', category: '', unit: '', stock: 0, reorderLevel: 10 });
    setShowAddModal(false);
    await loadData();
  };

  const handleTransaction = async () => {
    if (!transactionData.quantity || transactionData.quantity <= 0) {
      alert('Please enter valid quantity');
      return;
    }
    
    await addInventoryTransaction({
      materialId: selectedItem.id,
      materialName: selectedItem.materialName,
      type: transactionType,
      quantity: parseFloat(transactionData.quantity),
      note: transactionData.note,
      date: transactionData.date,
    });
    
    setTransactionData({ quantity: 0, note: '', date: new Date().toISOString().split('T')[0] });
    setShowTransactionModal(false);
    setSelectedItem(null);
    await loadData();
  };

  return (
    <div className="flex flex-col min-h-full pb-24">
      <TopBar
        title="Material Inventory"
        left={
          <button onClick={() => navigate('dashboard')} className="text-gray-400 hover:text-white mr-1">
            <ChevronLeft size={22} />
          </button>
        }
        right={
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus size={14} /> Add Stock
          </Button>
        }
      />

      <div className="p-4 space-y-4">
        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={18} className="text-red-400" />
              <span className="font-semibold text-red-400">Low Stock Alert</span>
            </div>
            <div className="space-y-1">
              {lowStockItems.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-300">{item.materialName}</span>
                  <span className="text-red-300">Stock: {item.stock} {item.unit}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inventory List */}
        {inventory.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <Package size={48} className="mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400">No inventory items yet</p>
              <p className="text-sm text-gray-500 mt-1">Add materials to track stock levels</p>
            </div>
          </Card>
        ) : (
          inventory.map(item => {
            const isLowStock = (item.stock || 0) <= (item.reorderLevel || 10);
            return (
              <Card key={item.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-white">{item.materialName}</h3>
                    <p className="text-sm text-gray-400">{item.category || 'Uncategorized'} • {item.unit || 'each'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-2xl font-bold ${isLowStock ? 'text-red-400' : 'text-green-400'}`}>
                        {item.stock || 0}
                      </span>
                      <span className="text-sm text-gray-500">{item.unit}</span>
                    </div>
                    {item.reorderLevel && (
                      <p className="text-xs text-gray-500 mt-1">Reorder at: {item.reorderLevel} {item.unit}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setTransactionType('purchase');
                        setShowTransactionModal(true);
                      }}
                      className="bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"
                    >
                      <TrendingUp size={14} /> Add
                    </button>
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setTransactionType('usage');
                        setShowTransactionModal(true);
                      }}
                      className="bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"
                    >
                      <Minus size={14} /> Use
                    </button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Add New Stock Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-end z-50">
          <div className="bg-[#0a1810] border-t border-[#1e3a2a] w-full rounded-t-xl p-4">
            <h3 className="font-bold text-white mb-4">Add New Stock Item</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Material Name"
                value={formData.materialName}
                onChange={(e) => setFormData({ ...formData, materialName: e.target.value })}
                className="w-full bg-[#1e3a2a] text-white p-3 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-green-500"
              />
              <input
                type="text"
                placeholder="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-[#1e3a2a] text-white p-3 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-green-500"
              />
              <input
                type="text"
                placeholder="Unit (e.g., bags, pieces, meters)"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full bg-[#1e3a2a] text-white p-3 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-green-500"
              />
              <input
                type="number"
                placeholder="Initial Stock"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full bg-[#1e3a2a] text-white p-3 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-green-500"
              />
              <input
                type="number"
                placeholder="Reorder Alert Level"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                className="w-full bg-[#1e3a2a] text-white p-3 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-green-500"
              />
              <div className="flex gap-2">
                <Button onClick={handleAddItem} className="flex-1">Add Item</Button>
                <Button onClick={() => setShowAddModal(false)} variant="secondary" className="flex-1">Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransactionModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-end z-50">
          <div className="bg-[#0a1810] border-t border-[#1e3a2a] w-full rounded-t-xl p-4">
            <h3 className="font-bold text-white mb-2">
              {transactionType === 'purchase' ? 'Add Stock' : 'Use Stock'} - {selectedItem.materialName}
            </h3>
            <p className="text-sm text-gray-400 mb-4">Current Stock: {selectedItem.stock || 0} {selectedItem.unit}</p>
            <div className="space-y-3">
              <input
                type="number"
                placeholder="Quantity"
                value={transactionData.quantity}
                onChange={(e) => setTransactionData({ ...transactionData, quantity: e.target.value })}
                className="w-full bg-[#1e3a2a] text-white p-3 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-green-500"
              />
              <input
                type="text"
                placeholder="Note (e.g., Supplier name or Project name)"
                value={transactionData.note}
                onChange={(e) => setTransactionData({ ...transactionData, note: e.target.value })}
                className="w-full bg-[#1e3a2a] text-white p-3 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-green-500"
              />
              <input
                type="date"
                value={transactionData.date}
                onChange={(e) => setTransactionData({ ...transactionData, date: e.target.value })}
                className="w-full bg-[#1e3a2a] text-white p-3 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-green-500"
              />
              <div className="flex gap-2">
                <Button onClick={handleTransaction} className="flex-1">
                  {transactionType === 'purchase' ? 'Add Stock' : 'Use Stock'}
                </Button>
                <Button onClick={() => {
                  setShowTransactionModal(false);
                  setSelectedItem(null);
                  setTransactionData({ quantity: 0, note: '', date: new Date().toISOString().split('T')[0] });
                }} variant="secondary" className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}