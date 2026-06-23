import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TopBar, Card, Button } from '../components/UI';
import { Lock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

export default function ResetPassword({ navigate }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if we have a valid session (user came from reset link)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // If there's a session, the user can reset their password
      // If not, they need to request a new reset link
      setChecking(false);
      
      if (!session) {
        setError('No valid reset session found. Please request a new password reset link.');
      }
    };
    
    checkSession();
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        navigate('login');
      }, 3000);

    } catch (err) {
      console.error('Reset error:', err);
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0a1810] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a1810] text-white p-4 flex flex-col items-center justify-center">
        <div className="max-w-md w-full">
          <Card className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-900/30 p-4 rounded-full">
                <CheckCircle size={48} className="text-green-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Password Reset Successful! 🎉</h2>
            <p className="text-gray-400 mb-4">
              Your password has been reset successfully.
            </p>
            <p className="text-sm text-gray-500">Redirecting to login...</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1810] text-white p-4 flex flex-col items-center justify-center">
      <TopBar title="Reset Password" />
      
      <div className="max-w-md w-full">
        <Card className="p-6">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-900/30 p-4 rounded-full">
                <Lock size={32} className="text-blue-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white">Create New Password</h2>
            <p className="text-gray-400 text-sm mt-1">
              Enter your new password below.
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">New Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  minLength="6"
                  className="w-full bg-[#1e3a2a] text-white p-2 pl-10 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-1">Confirm Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  minLength="6"
                  className="w-full bg-[#1e3a2a] text-white p-2 pl-10 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Updating...' : 'Reset Password'}
            </Button>

            <button
              type="button"
              onClick={() => navigate('login')}
              className="w-full text-gray-500 hover:text-gray-400 text-sm flex items-center justify-center gap-1"
            >
              <ArrowLeft size={14} /> Back to Sign In
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}