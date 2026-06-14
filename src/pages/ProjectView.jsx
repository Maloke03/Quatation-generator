import { useEffect, useState, useCallback } from 'react';
import { useLang } from '../i18n/LangContext';
import { 
  getProject, getClient, getQuote, 
  getExpensesByProject, saveExpense, deleteExpense,
  getTotalExpensesByProject, updateProjectStatus 
} from '../db';
import { TopBar, Card, Button, Confirm } from '../components/UI';
import { ChevronLeft, Plus, DollarSign } from 'lucide-react'; // Removed Trash2
import { shareProjectUpdate } from '../utils/share';
import ShareButton from '../components/ShareButton';

export default function ProjectView({ navigate, params }) {
  // eslint-disable-next-line 
  const { t } = useLang(); // Keep t - it might be used in translations
  const [project, setProject] = useState(null);
  const [client, setClient] = useState(null);
  const [quote, setQuote] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: 'materials', date: new Date().toISOString().split('T')[0] });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadData = useCallback(async () => {
    const p = await getProject(params.projectId);
    if (!p) { navigate('projects'); return; }
    setProject(p);
    
    const c = await getClient(p.clientId);
    setClient(c);
    
    const q = await getQuote(p.quoteId);
    setQuote(q);
    
    const exp = await getExpensesByProject(p.id);
    setExpenses(exp);
    
    const total = await getTotalExpensesByProject(p.id);
    setTotalExpenses(total);
  }, [params.projectId, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateStatus = async (newStatus) => {
    await updateProjectStatus(project.id, newStatus);
    await loadData();
  };

  const addExpense = async () => {
    if (!newExpense.description || !newExpense.amount) {
      alert('Please fill in description and amount');
      return;
    }
    
    await saveExpense({
      projectId: project.id,
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      category: newExpense.category,
      date: newExpense.date,
    });
    
    setNewExpense({ description: '', amount: '', category: 'materials', date: new Date().toISOString().split('T')[0] });
    setShowAddExpense(false);
    await loadData();
  };

  const deleteExpenseRecord = async (id) => {
    await deleteExpense(id);
    setDeleteConfirm(null);
    await loadData();
  };

  if (!project) {
    return <div className="p-8 text-center text-gray-400">Loading...</div>;
  }

  const quotedAmount = quote?.grandTotal || 0;
  const profit = quotedAmount - totalExpenses;
  const profitMargin = quotedAmount > 0 ? (profit / quotedAmount) * 100 : 0;

  return (
    <div className="flex flex-col min-h-full pb-24">
      <TopBar
        title={project.projectName || 'Project'}
        left={
          <button onClick={() => navigate('projects')} className="text-gray-400 hover:text-white mr-1">
            <ChevronLeft size={22} />
          </button>
        }
      />

      <div className="p-4 space-y-4">
        {/* Status & Actions */}
        <Card>
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <p className="text-white font-semibold mt-1">
                {project.status === 'not_started' && '⚪ Not Started'}
                {project.status === 'in_progress' && '🟡 In Progress'}
                {project.status === 'completed' && '✅ Completed'}
              </p>
            </div>
            <div className="flex gap-2">
              {project.status === 'not_started' && (
                <Button size="sm" onClick={() => updateStatus('in_progress')}>Start Project</Button>
              )}
              {project.status === 'in_progress' && (
                <Button size="sm" onClick={() => updateStatus('completed')}>Mark Complete</Button>
              )}
            </div>
          </div>
        </Card>

        {/* Client Info */}
        <Card>
          <p className="text-xs text-gray-500">Client</p>
          <p className="text-white font-semibold">{client?.name || 'N/A'}</p>
          {client?.phone && <p className="text-sm text-gray-400">📞 {client.phone}</p>}
          <p className="text-xs text-gray-500 mt-2">Quote #</p>
          <p className="text-sm text-gray-300">{project.quoteNumber}</p>
        </Card>

        {/* Financial Summary */}
        <Card>
          <h3 className="font-semibold text-white mb-3">Financial Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Quoted Amount</span>
              <span className="text-green-400 font-medium">M {quotedAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Expenses</span>
              <span className="text-red-400 font-medium">M {totalExpenses.toFixed(2)}</span>
            </div>
            <div className="border-t border-[#2d5a3d] pt-2 flex justify-between">
              <span className="text-white font-semibold">Profit / Loss</span>
              <span className={`font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {profit >= 0 ? '+' : '-'} M {Math.abs(profit).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Profit Margin</span>
              <span className={profitMargin >= 0 ? 'text-green-400' : 'text-red-400'}>
                {profitMargin.toFixed(1)}%
              </span>
            </div>
          </div>
        </Card>

        {/* WhatsApp Share Card */}
        <div className="bg-[#1a3a2a] border border-green-700 rounded-2xl p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <div className="text-sm font-semibold text-green-300">Share Update</div>
              <div className="text-xs text-gray-500 mt-0.5">Send project progress to client</div>
            </div>
            <ShareButton
              onShare={(phone) => shareProjectUpdate(project, client, "Project is progressing well. Current status: " + (project.status === 'in_progress' ? 'In Progress' : 'Not Started'), phone)}
              phoneNumber={client?.phone}
              variant="primary"
              size="sm"
              label="Send Update"
              showPhoneInput={true}
            />
          </div>
          
          {/* Quick message input */}
          <textarea
            placeholder="Type a custom update message..."
            className="w-full bg-[#1e3a2a] text-white p-2 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-green-500 text-sm"
            rows="2"
            id="customUpdateMessage"
          />
          <button
            onClick={() => {
              const message = document.getElementById('customUpdateMessage').value;
              if (message) {
                shareProjectUpdate(project, client, message, client?.phone);
              }
            }}
            className="w-full mt-2 bg-green-700 hover:bg-green-600 text-white py-2 rounded-lg text-sm"
          >
            Send Custom Update
          </button>
        </div>

        {/* Expenses Section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-white">Expenses</h3>
            <Button size="sm" onClick={() => setShowAddExpense(true)}>
              <Plus size={14} /> Add Expense
            </Button>
          </div>
          
          {expenses.length === 0 ? (
            <Card>
              <div className="text-center py-6 text-gray-500">
                <DollarSign size={32} className="mx-auto mb-2 opacity-50" />
                <p>No expenses recorded yet</p>
              </div>
            </Card>
          ) : (
            expenses.map(expense => (
              <Card key={expense.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white font-medium">{expense.description}</p>
                    <div className="flex gap-3 text-xs text-gray-500 mt-1">
                      <span>{expense.category}</span>
                      <span>{new Date(expense.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-red-400 font-semibold">- M {expense.amount.toFixed(2)}</p>
                    <button 
                      onClick={() => setDeleteConfirm(expense.id)}
                      className="text-gray-600 hover:text-red-400 text-xs mt-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-end z-50">
          <div className="bg-[#0a1810] border-t border-[#1e3a2a] w-full rounded-t-xl p-4">
            <h3 className="font-bold text-white mb-4">Add Expense</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Description"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                className="w-full bg-[#1e3a2a] text-white p-3 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-green-500"
              />
              <input
                type="number"
                placeholder="Amount (M)"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                className="w-full bg-[#1e3a2a] text-white p-3 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-green-500"
              />
              <select
                value={newExpense.category}
                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                className="w-full bg-[#1e3a2a] text-white p-3 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-green-500"
              >
                <option value="materials">Materials</option>
                <option value="labour">Labour</option>
                <option value="equipment">Equipment</option>
                <option value="transport">Transport</option>
                <option value="other">Other</option>
              </select>
              <input
                type="date"
                value={newExpense.date}
                onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                className="w-full bg-[#1e3a2a] text-white p-3 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-green-500"
              />
              <div className="flex gap-2">
                <Button onClick={addExpense} className="flex-1">Save Expense</Button>
                <Button onClick={() => setShowAddExpense(false)} variant="secondary" className="flex-1">Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <Confirm
        open={!!deleteConfirm}
        message="Delete this expense?"
        onConfirm={() => deleteExpenseRecord(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}