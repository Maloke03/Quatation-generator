import { useState, useEffect } from 'react';
import { 
  getAllUsers, getUserStats, extendTrial, getAllSubscriptionPayments, 
  verifyPayment, rejectPayment, saveUser, deletePaymentRecord, clearAllPaymentRecords
} from '../db';
import { TopBar, Card, Button } from '../components/UI';
import { 
  Users, DollarSign, UserCheck, Award, 
  CheckCircle, XCircle, AlertCircle,
  Plus, RefreshCw, Edit2, X, Save, Trash2, Calendar
} from 'lucide-react';

export default function AdminDashboard({ navigate }) {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    deviceId: '',
    hasPaid: false,
    isActive: true,
    isAdmin: false,
    trialEnds: '',
    subscriptionStatus: 'trial'
  });
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeletePayment, setShowDeletePayment] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allUsers, userStats, allPayments] = await Promise.all([
        getAllUsers(),
        getUserStats(),
        getAllSubscriptionPayments()
      ]);
      setUsers(allUsers);
      setStats(userStats);
      setPayments(allPayments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExtendTrial = async (userId, days = 30) => {
    if (window.confirm(`Extend trial by ${days} days for this user?`)) {
      await extendTrial(userId, days);
      await loadData();
      alert(`✅ Trial extended by ${days} days!`);
    }
  };

  const handleVerifyPayment = async (paymentId) => {
    if (window.confirm('Verify this payment and activate the user\'s subscription?')) {
      await verifyPayment(paymentId);
      await loadData();
      alert('✅ Payment verified! User subscription activated.');
    }
  };

  const handleRejectPayment = async (paymentId) => {
    if (window.confirm('Reject this payment? The user will be notified.')) {
      await rejectPayment(paymentId);
      await loadData();
      alert('❌ Payment rejected.');
    }
  };

  const handleResetTrial = async (userId) => {
    if (window.confirm('Reset this user\'s trial to 30 days from today?')) {
      const user = users.find(u => u.id === userId);
      if (user) {
        const newTrialEnd = new Date();
        newTrialEnd.setDate(newTrialEnd.getDate() + 30);
        user.trialEnds = newTrialEnd.toISOString();
        await saveUser(user);
        await loadData();
        alert('✅ Trial reset to 30 days!');
      }
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditForm({
      deviceId: user.deviceId || '',
      hasPaid: user.hasPaid || false,
      isActive: user.isActive !== false,
      isAdmin: user.isAdmin || false,
      trialEnds: user.trialEnds ? new Date(user.trialEnds).toISOString().split('T')[0] : '',
      subscriptionStatus: user.subscriptionStatus || 'trial'
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    
    const user = users.find(u => u.id === editingUser.id);
    if (user) {
      user.hasPaid = editForm.hasPaid;
      user.isActive = editForm.isActive;
      user.isAdmin = editForm.isAdmin;
      user.subscriptionStatus = editForm.subscriptionStatus;
      
      if (editForm.trialEnds) {
        user.trialEnds = new Date(editForm.trialEnds).toISOString();
      }
      
      await saveUser(user);
      await loadData();
      setEditingUser(null);
      alert('✅ User updated successfully!');
    }
  };

  const handleClearAllPayments = async () => {
    if (window.confirm('⚠️ Are you sure you want to delete ALL payment history? This cannot be undone!')) {
      if (window.confirm('⚠️ REALLY? All payment records will be permanently deleted!')) {
        await clearAllPaymentRecords();
        await loadData();
        alert('✅ All payment history cleared!');
        setShowClearConfirm(false);
      }
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (window.confirm('Delete this payment record?')) {
      await deletePaymentRecord(paymentId);
      await loadData();
      alert('✅ Payment deleted!');
      setShowDeletePayment(null);
    }
  };

  const pendingPayments = payments.filter(p => p.status === 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a1810]">
        <div className="text-center text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1810] text-white pb-24">
      <TopBar
        title="Admin Dashboard"
        left={
          <button onClick={() => navigate('settings')} className="text-gray-400 hover:text-white mr-1">
            ← Back
          </button>
        }
      />

      <div className="p-4 space-y-4">
        {/* Pending Payments Alert */}
        {pendingPayments.length > 0 && (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-yellow-400" />
              <span className="text-yellow-300 font-medium">
                {pendingPayments.length} pending payment{pendingPayments.length > 1 ? 's' : ''} need verification
              </span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[#1e3a2a] pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'overview' ? 'bg-green-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'payments' ? 'bg-green-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Payments {pendingPayments.length > 0 && `(${pendingPayments.length})`}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'users' ? 'bg-green-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Users ({users.length})
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
                    <div className="text-xs text-gray-500">Total Users</div>
                  </div>
                  <Users size={20} className="text-blue-400" />
                </div>
              </Card>
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{stats.activeUsers}</div>
                    <div className="text-xs text-gray-500">Active Users</div>
                  </div>
                  <UserCheck size={20} className="text-green-400" />
                </div>
              </Card>
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{stats.paidUsers}</div>
                    <div className="text-xs text-gray-500">Paid Subscribers</div>
                  </div>
                  <Award size={20} className="text-yellow-400" />
                </div>
              </Card>
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">M{stats.totalRevenue?.toFixed(2) || '0.00'}</div>
                    <div className="text-xs text-gray-500">Total Revenue</div>
                  </div>
                  <DollarSign size={20} className="text-green-400" />
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <h3 className="font-semibold text-white mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    if (window.confirm('Extend ALL active trials by 30 days?')) {
                      const trialUsers = users.filter(u => !u.hasPaid && u.isActive);
                      trialUsers.forEach(async (u) => {
                        await extendTrial(u.id, 30);
                      });
                      setTimeout(() => {
                        loadData();
                        alert(`✅ Extended ${trialUsers.length} trials by 30 days!`);
                      }, 1000);
                    }
                  }}
                >
                  <RefreshCw size={14} className="mr-1" /> Extend All Trials
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    if (window.confirm('Refresh all data?')) {
                      loadData();
                      alert('✅ Data refreshed!');
                    }
                  }}
                >
                  <RefreshCw size={14} className="mr-1" /> Refresh Data
                </Button>
              </div>
            </Card>
          </>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <Card>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-white">Payment History</h3>
              <div className="flex gap-2">
                {payments.length > 0 && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowClearConfirm(true)}
                    className="bg-red-900/50 hover:bg-red-800/50 text-red-300"
                  >
                    <Trash2 size={14} className="mr-1" /> Clear All
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={loadData}
                >
                  <RefreshCw size={14} className="mr-1" /> Refresh
                </Button>
              </div>
            </div>
            
            {payments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                <p>No payments yet</p>
                <p className="text-xs mt-1">Payments will appear here when users subscribe</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {payments.map(payment => {
                  const user = users.find(u => u.id === payment.userId);
                  const isPending = payment.status === 'pending';
                  const isCompleted = payment.status === 'completed';
                  
                  return (
                    <div key={payment.id} className={`bg-[#1e3a2a] rounded-lg p-3 ${isPending ? 'border-l-4 border-yellow-500' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              isPending ? 'bg-yellow-900 text-yellow-300' :
                              isCompleted ? 'bg-green-900 text-green-300' :
                              'bg-red-900 text-red-300'
                            }`}>
                              {isPending ? '⏳ Pending' : isCompleted ? '✅ Verified' : '❌ Rejected'}
                            </span>
                            <span className="text-white font-medium">M{payment.amount.toFixed(2)}</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {payment.method} • {new Date(payment.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-400">
                            Ref: {payment.reference || 'N/A'}
                          </div>
                          {user && (
                            <div className="text-xs text-gray-500 mt-1">
                              User: {user.deviceId?.substring(0, 15)}...
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleVerifyPayment(payment.id)}
                                className="text-green-400 hover:text-green-300 p-1"
                                title="Verify payment"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button
                                onClick={() => handleRejectPayment(payment.id)}
                                className="text-red-400 hover:text-red-300 p-1"
                                title="Reject payment"
                              >
                                <XCircle size={18} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setShowDeletePayment(payment.id)}
                            className="text-gray-500 hover:text-red-400 p-1"
                            title="Delete payment"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* Users Tab with Full Controls */}
        {activeTab === 'users' && (
          <Card>
            <h3 className="font-semibold text-white mb-3">All Users - Manage Trials</h3>
            {users.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No users yet</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {users.map(user => {
                  const now = new Date();
                  const trialEnds = new Date(user.trialEnds);
                  const isExpired = trialEnds < now && !user.hasPaid;
                  const daysLeft = Math.ceil((trialEnds - now) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={user.id} className="bg-[#1e3a2a] rounded-lg p-3">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-white text-sm truncate">
                              {user.deviceId?.substring(0, 25)}...
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              First: {new Date(user.firstSeen).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-400">
                              Last: {new Date(user.lastSeen).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                user.hasPaid ? 'bg-green-900 text-green-300' :
                                isExpired ? 'bg-red-900 text-red-300' :
                                'bg-yellow-900 text-yellow-300'
                              }`}>
                                {user.hasPaid ? '✅ Paid' : isExpired ? '⚠️ Expired' : `Trial: ${daysLeft}d`}
                              </span>
                              {user.isAdmin && (
                                <span className="text-xs px-2 py-0.5 rounded bg-amber-900 text-amber-300">
                                  👑 Admin
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-blue-400 hover:text-blue-300 p-1"
                            title="Edit User"
                          >
                            <Edit2 size={18} />
                          </button>
                        </div>

                        {/* Trial Management Controls */}
                        <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-[#2d5a3d]">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleExtendTrial(user.id, 7)}
                            className="text-xs"
                          >
                            <Plus size={12} className="mr-1" /> +7 Days
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleExtendTrial(user.id, 30)}
                            className="text-xs"
                          >
                            <Plus size={12} className="mr-1" /> +30 Days
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleExtendTrial(user.id, 90)}
                            className="text-xs"
                          >
                            <Plus size={12} className="mr-1" /> +90 Days
                          </Button>
                          {!user.hasPaid && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleResetTrial(user.id)}
                              className="text-xs bg-yellow-900/50 hover:bg-yellow-800/50"
                            >
                              <RefreshCw size={12} className="mr-1" /> Reset
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Clear All Payments Confirm */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a1810] border border-red-700/50 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-900/30 p-3 rounded-full">
                <Trash2 size={24} className="text-red-400" />
              </div>
              <h3 className="font-bold text-white text-lg">Clear All Payments?</h3>
            </div>
            <p className="text-gray-400 mb-4">
              This will permanently delete <span className="text-white font-bold">{payments.length}</span> payment records. 
              This action <span className="text-red-400 font-bold">cannot be undone</span>!
            </p>
            <div className="flex gap-2">
              <Button onClick={handleClearAllPayments} className="flex-1 bg-red-700 hover:bg-red-600">
                <Trash2 size={16} className="mr-2" /> Yes, Delete All
              </Button>
              <Button onClick={() => setShowClearConfirm(false)} variant="secondary" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Payment Confirm */}
      {showDeletePayment && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a1810] border border-red-700/50 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-900/30 p-3 rounded-full">
                <Trash2 size={24} className="text-red-400" />
              </div>
              <h3 className="font-bold text-white text-lg">Delete Payment?</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Delete this payment record? This action <span className="text-red-400 font-bold">cannot be undone</span>.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => handleDeletePayment(showDeletePayment)} className="flex-1 bg-red-700 hover:bg-red-600">
                <Trash2 size={16} className="mr-2" /> Delete
              </Button>
              <Button onClick={() => setShowDeletePayment(null)} variant="secondary" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a1810] border border-[#1e3a2a] rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white text-lg">Edit User</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Device ID</label>
                <input
                  type="text"
                  value={editForm.deviceId}
                  disabled
                  className="w-full bg-[#1e3a2a] text-gray-400 p-2 rounded-lg border border-[#2d5a3d] cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">Trial End Date</label>
                <input
                  type="date"
                  value={editForm.trialEnds}
                  onChange={(e) => setEditForm({ ...editForm, trialEnds: e.target.value })}
                  className="w-full bg-[#1e3a2a] text-white p-2 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-green-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-400">Subscription Status:</label>
                <select
                  value={editForm.subscriptionStatus}
                  onChange={(e) => setEditForm({ ...editForm, subscriptionStatus: e.target.value })}
                  className="flex-1 bg-[#1e3a2a] text-white p-2 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-green-500"
                >
                  <option value="trial">Trial</option>
                  <option value="active">Active (Paid)</option>
                  <option value="expired">Expired</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-3 text-sm text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.hasPaid}
                    onChange={(e) => setEditForm({ ...editForm, hasPaid: e.target.checked })}
                    className="w-4 h-4 accent-green-500"
                  />
                  Has Paid (Subscription Active)
                </label>

                <label className="flex items-center gap-3 text-sm text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    className="w-4 h-4 accent-green-500"
                  />
                  Is Active
                </label>

                <label className="flex items-center gap-3 text-sm text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isAdmin}
                    onChange={(e) => setEditForm({ ...editForm, isAdmin: e.target.checked })}
                    className="w-4 h-4 accent-amber-500"
                  />
                  👑 Is Admin
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleSaveEdit} className="flex-1">
                  <Save size={16} className="mr-2" /> Save Changes
                </Button>
                <Button
                  onClick={() => setEditingUser(null)}
                  variant="secondary"
                  className="flex-1"
                >
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